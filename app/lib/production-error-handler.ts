/**
 * Production Error Handling System
 * Centralized error handling with proper logging, monitoring, and user feedback
 */

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  environment: string;
  fileSize?: number;
  maxFileSize?: number;
  filename?: string;
  processingTimeMs?: number;
  action?: string;
  errorId?: string;
}

export interface ErrorReport {
  id: string;
  type: 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'system' | 'external_api' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: ErrorContext;
  stack?: string;
  metadata?: Record<string, any>;
}

class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private readonly maxQueueSize = 100;

  private constructor() {}

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  /**
   * Log error with proper production formatting
   */
  logError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: this.categorizeError(error),
      severity,
      message: typeof error === 'string' ? error : error.message,
      context: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...context
      },
      stack: error instanceof Error ? error.stack : undefined,
      metadata: this.extractMetadata(error)
    };

    // Add to queue for batch processing
    this.errorQueue.push(errorReport);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Log to console in development, structured logging in production
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${errorReport.severity.toUpperCase()}] ${errorReport.message}`, {
        context: errorReport.context,
        stack: errorReport.stack
      });
    } else {
      // Production structured logging
      process.stdout.write(JSON.stringify({
        level: 'error',
        timestamp: errorReport.context.timestamp,
        severity: errorReport.severity,
        message: errorReport.message,
        errorId: errorReport.id,
        context: errorReport.context,
        ...(errorReport.stack && { stack: errorReport.stack })
      }) + '\n');
    }

    // Send critical errors to monitoring service
    if (severity === 'critical') {
      this.sendToMonitoring(errorReport);
    }
  }

  /**
   * Create user-friendly error response
   */
  createErrorResponse(
    error: Error | string,
    statusCode: number = 500,
    context?: Partial<ErrorContext>
  ): { error: string; message?: string; errorId?: string; statusCode: number } {
    const errorId = this.generateErrorId();
    const message = typeof error === 'string' ? error : error.message;
    
    this.logError(error, context, this.getSeverityFromStatusCode(statusCode));

    return {
      error: this.getUserFriendlyMessage(message, statusCode),
      message: process.env.NODE_ENV === 'development' ? message : undefined,
      errorId: process.env.NODE_ENV === 'development' ? errorId : undefined,
      statusCode
    };
  }

  /**
   * Validate input with proper error handling
   */
  validateInput<T>(
    data: T,
    schema: Record<string, any>,
    context?: Partial<ErrorContext>
  ): { isValid: boolean; errors: string[]; sanitizedData?: T } {
    const errors: string[] = [];
    const sanitizedData = { ...data } as T;

    try {
      for (const [key, rules] of Object.entries(schema)) {
        const value = (data as any)[key];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${key} is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${key} must be of type ${rules.type}`);
          }

          if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
            errors.push(`${key} must be at least ${rules.minLength} characters`);
          }

          if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            errors.push(`${key} must be no more than ${rules.maxLength} characters`);
          }

          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            errors.push(`${key} format is invalid`);
          }

          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
          }
        }
      }
    } catch (validationError) {
      this.logError(validationError as Error, context, 'high');
      errors.push('Input validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Rate limiting with proper error handling
   */
  checkRateLimit(
    userId: string,
    action: string,
    limits: { requestsPerHour: number; requestsPerDay: number },
    context?: Partial<ErrorContext>
  ): { allowed: boolean; remaining: number; resetTime: number; errorId?: string } {
    try {
      // In-memory rate limiting (should be Redis in production)
      const now = Date.now();
      const hourKey = `${userId}:${action}:hour:${Math.floor(now / 3600000)}`;
      const dayKey = `${userId}:${action}:day:${Math.floor(now / 86400000)}`;

      // This is a simplified implementation
      // In production, use Redis or similar for distributed rate limiting
      const hourCount = 0; // Would be retrieved from Redis
      const dayCount = 0; // Would be retrieved from Redis

      const hourlyAllowed = hourCount < limits.requestsPerHour;
      const dailyAllowed = dayCount < limits.requestsPerDay;

      if (!hourlyAllowed || !dailyAllowed) {
        const errorId = this.generateErrorId();
        this.logError(
          `Rate limit exceeded for user ${userId} on action ${action}`,
          { ...context, userId, action },
          'medium'
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime: Math.floor(now / 3600000 + 1) * 3600000,
          errorId
        };
      }

      return {
        allowed: true,
        remaining: Math.min(limits.requestsPerHour - hourCount, limits.requestsPerDay - dayCount),
        resetTime: Math.floor(now / 3600000 + 1) * 3600000
      };
    } catch (rateLimitError) {
      this.logError(rateLimitError as Error, context, 'high');
      // Fail open in case of rate limiting errors
      return { allowed: true, remaining: 100, resetTime: Date.now() + 3600000 };
    }
  }

  /**
   * Database operation wrapper with error handling
   */
  async withDatabaseErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<{ success: boolean; data?: T; error?: string; errorId?: string }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const errorId = this.generateErrorId();
      this.logError(error as Error, { ...context, errorId }, 'high');
      
      return {
        success: false,
        error: 'Database operation failed',
        errorId: process.env.NODE_ENV === 'development' ? errorId : undefined
      };
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private categorizeError(error: Error | string): ErrorReport['type'] {
    const message = typeof error === 'string' ? error : error.message;
    
    if (message.includes('authentication') || message.includes('auth')) return 'authentication';
    if (message.includes('authorization') || message.includes('permission')) return 'authorization';
    if (message.includes('rate limit') || message.includes('throttle')) return 'rate_limit';
    if (message.includes('database') || message.includes('db')) return 'database';
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    if (message.includes('external') || message.includes('api')) return 'external_api';
    
    return 'system';
  }

  private getSeverityFromStatusCode(statusCode: number): ErrorReport['severity'] {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'high';
    if (statusCode >= 300) return 'medium';
    return 'low';
  }

  private getUserFriendlyMessage(message: string, statusCode: number): string {
    if (statusCode === 401) return 'Authentication required';
    if (statusCode === 403) return 'Access denied';
    if (statusCode === 404) return 'Resource not found';
    if (statusCode === 429) return 'Too many requests. Please try again later';
    if (statusCode === 500) return 'Internal server error';
    if (statusCode === 503) return 'Service temporarily unavailable';
    
    return 'An error occurred';
  }

  private extractMetadata(error: Error | string): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        constructor: error.constructor.name
      };
    }
    return {};
  }

  private sendToMonitoring(errorReport: ErrorReport): void {
    // In production, send to monitoring service (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Implementation would depend on monitoring service
      console.warn('Critical error should be sent to monitoring service:', errorReport.id);
    }
  }
}

export const errorHandler = ProductionErrorHandler.getInstance(); 