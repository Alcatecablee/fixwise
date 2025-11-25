// Centralized Environment Configuration
// This file provides a single source of truth for all environment variables
// and includes validation and fallback values

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // Application Configuration
  app: {
    url: string;
    baseUrl: string;
    siteUrl: string;
    nodeEnv: string;
    port: number;
  };
  
  // Authentication
  auth: {
    jwtSecret: string;
    nextAuthSecret: string;
    nextAuthUrl: string;
  };
  
  // External Services
  services: {
    resend: {
      apiKey?: string;
      fromEmail?: string;
    };
    paypal: {
      clientId?: string;
      clientSecret?: string;
      environment: string;
    };
    github: {
      clientId?: string;
      clientSecret?: string;
    };
  };
  
  // Monitoring
  monitoring: {
    sentryDsn?: string;
    vercelAnalyticsId?: string;
    logLevel: string;
  };
  
  // Feature Flags
  features: {
    skipEnvValidation: boolean;
    enableDemo: boolean;
    enableCollaboration: boolean;
  };
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

function validateUrl(url: string, name: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(`Invalid URL for ${name}: ${url}`);
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    supabase: {
      url: validateUrl(
        getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        'NEXT_PUBLIC_SUPABASE_URL'
      ),
      anonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
    
    app: {
      url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000') || 'http://localhost:3000',
      baseUrl: getOptionalEnvVar('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000') || 'http://localhost:3000',
      siteUrl: getOptionalEnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000') || 'http://localhost:3000',
      nodeEnv: getOptionalEnvVar('NODE_ENV', 'development') || 'development',
      port: parseInt(getOptionalEnvVar('PORT', '3000') || '3000'),
    },
    
      auth: {
    jwtSecret: getRequiredEnvVar('JWT_SECRET'),
    nextAuthSecret: getRequiredEnvVar('NEXTAUTH_SECRET'),
    nextAuthUrl: getOptionalEnvVar('NEXTAUTH_URL', 'http://localhost:3000') || 'http://localhost:3000',
  },
    
    services: {
      resend: {
        apiKey: getOptionalEnvVar('RESEND_API_KEY'),
        fromEmail: getOptionalEnvVar('FROM_EMAIL'),
      },
      paypal: {
        clientId: getOptionalEnvVar('PAYPAL_CLIENT_ID'),
        clientSecret: getOptionalEnvVar('PAYPAL_CLIENT_SECRET'),
        environment: getOptionalEnvVar('PAYPAL_ENVIRONMENT', 'sandbox') || 'sandbox',
      },
      github: {
        clientId: getOptionalEnvVar('GITHUB_CLIENT_ID'),
        clientSecret: getOptionalEnvVar('GITHUB_CLIENT_SECRET'),
      },
    },
    
    monitoring: {
      sentryDsn: getOptionalEnvVar('SENTRY_DSN'),
      vercelAnalyticsId: getOptionalEnvVar('VERCEL_ANALYTICS_ID'),
      logLevel: getOptionalEnvVar('LOG_LEVEL', isProduction ? 'info' : 'debug') || (isProduction ? 'info' : 'debug'),
    },
    
    features: {
      skipEnvValidation: getOptionalEnvVar('SKIP_ENV_VALIDATION', 'false') === 'true',
      enableDemo: getOptionalEnvVar('ENABLE_DEMO', 'true') === 'true',
      enableCollaboration: getOptionalEnvVar('ENABLE_COLLABORATION', 'true') === 'true',
    },
  };
}

// Validate configuration on import
let config: EnvironmentConfig;

try {
  config = getEnvironmentConfig();
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Environment configuration error:', error);
    console.error('Please check your .env file and ensure all required variables are set.');
  }
  throw error;
}

export { config as env };

// Helper functions for common environment checks
export const isDevelopment = () => config.app.nodeEnv === 'development';
export const isProduction = () => config.app.nodeEnv === 'production';
export const isTest = () => config.app.nodeEnv === 'test';

export const hasDatabase = () => !!(config.supabase.url && config.supabase.serviceRoleKey);
export const hasEmail = () => !!config.services.resend.apiKey;
export const hasPayments = () => !!(config.services.paypal.clientId || config.services.paypal.clientSecret);
export const hasMonitoring = () => !!(config.monitoring.sentryDsn || config.monitoring.vercelAnalyticsId);

// Environment validation function
export function validateEnvironment(): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Test required variables
    getEnvironmentConfig();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown configuration error');
  }
  
  // Check optional but recommended variables
  if (!config.services.resend.apiKey) {
    warnings.push('RESEND_API_KEY not set - email features will be disabled');
  }
  
  if (!config.services.paypal.clientId) {
    warnings.push('PAYPAL_CLIENT_ID not set - payment features will be disabled');
  }
  
  if (isProduction() && !config.monitoring.sentryDsn) {
    warnings.push('SENTRY_DSN not set - error monitoring will be disabled in production');
  }
  
  if (config.auth.jwtSecret === 'demo-secret' && isProduction()) {
    warnings.push('Using demo JWT secret in production - this is not secure');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
} 