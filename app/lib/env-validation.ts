// Environment Variables Validation for Production
// This ensures all required environment variables are properly configured

interface RequiredEnvVars {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Email Service (Optional - falls back to mock)
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;

  // Application Configuration
  NEXT_PUBLIC_BASE_URL: string;
  JWT_SECRET: string;

  // External Monitoring (Optional)
  SENTRY_DSN?: string;
  VERCEL_ANALYTICS_ID?: string;
}

interface OptionalEnvVars {
  // Database Configuration
  DATABASE_URL?: string;
  
  // Authentication
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  // Monitoring & Analytics
  MIXPANEL_TOKEN?: string;
  DATADOG_API_KEY?: string;
  
  // Payment Processing
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validationResults: { isValid: boolean; missing: string[]; warnings: string[] } | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  public validateEnvironment(): { isValid: boolean; missing: string[]; warnings: string[] } {
    if (this.validationResults) {
      return this.validationResults;
    }

    const missing: string[] = [];
    const warnings: string[] = [];

    // Required environment variables
    const required: (keyof RequiredEnvVars)[] = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_BASE_URL',
      'JWT_SECRET'
    ];

    // Check required variables
    for (const envVar of required) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    // Check optional but recommended variables
    if (!process.env.RESEND_API_KEY) {
      warnings.push('RESEND_API_KEY - Email features will use mock mode');
    }

    if (!process.env.FROM_EMAIL) {
      warnings.push('FROM_EMAIL - Using default: noreply@neurolint.dev');
    }

    if (!process.env.SENTRY_DSN) {
      warnings.push('SENTRY_DSN - Error tracking will use console only');
    }

    // Validate URL formats
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !this.isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
      missing.push('NEXT_PUBLIC_SUPABASE_URL (invalid URL format)');
    }

    if (process.env.NEXT_PUBLIC_BASE_URL && !this.isValidUrl(process.env.NEXT_PUBLIC_BASE_URL)) {
      missing.push('NEXT_PUBLIC_BASE_URL (invalid URL format)');
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      missing.push('JWT_SECRET (must be at least 32 characters)');
    }

    this.validationResults = {
      isValid: missing.length === 0,
      missing,
      warnings
    };

    return this.validationResults;
  }

  public getEnvironmentInfo(): {
    nodeEnv: string;
    hasDatabase: boolean;
    hasEmail: boolean;
    hasMonitoring: boolean;
    hasPayments: boolean;
  } {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasDatabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasEmail: !!process.env.RESEND_API_KEY,
      hasMonitoring: !!(process.env.SENTRY_DSN || process.env.VERCEL_ANALYTICS_ID),
      hasPayments: !!(process.env.PAYPAL_CLIENT_ID || process.env.STRIPE_SECRET_KEY)
    };
  }

  public logValidationResults(): void {
    const results = this.validateEnvironment();
    const info = this.getEnvironmentInfo();

    console.log('\n🔧 ENVIRONMENT VALIDATION');
    console.log('=' .repeat(50));
    console.log(`Environment: ${info.nodeEnv}`);
    console.log(`Database: ${info.hasDatabase ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Email: ${info.hasEmail ? '✅ Configured' : '⚠️ Mock Mode'}`);
    console.log(`Monitoring: ${info.hasMonitoring ? '✅ Configured' : '⚠️ Console Only'}`);
    console.log(`Payments: ${info.hasPayments ? '✅ Configured' : '⚠️ Disabled'}`);

    if (results.missing.length > 0) {
      console.log('\n❌ MISSING REQUIRED VARIABLES:');
      results.missing.forEach(env => console.log(`  - ${env}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (results.isValid) {
      console.log('\n✅ Environment validation passed!');
    } else {
      console.log('\n❌ Environment validation failed!');
      console.log('Please set the missing environment variables before starting the application.');
    }
    console.log('=' .repeat(50) + '\n');
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
  const validator = EnvironmentValidator.getInstance();
  validator.logValidationResults();
}

export const envValidator = EnvironmentValidator.getInstance();
