/**
 * Production Logging System
 * Structured logging for production environments with proper formatting and levels
 */

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  source: string;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeContext: boolean;
  structured: boolean;
  maxContextDepth: number;
}

class ProductionLogger {
  private static instance: ProductionLogger;
  private config: LogConfig;
  private readonly logLevels = { debug: 0, info: 1, warn: 2, error: 3 };

  private constructor() {
    this.config = {
      level: (process.env.LOG_LEVEL as LogEntry['level']) || 'info',
      includeTimestamp: true,
      includeContext: true,
      structured: process.env.NODE_ENV === 'production',
      maxContextDepth: 3
    };
  }

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log('debug', message, context, requestId);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log('info', message, context, requestId);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log('warn', message, context, requestId);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log('error', message, context, requestId);
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    userId?: string
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    this.log(level, message, {
      method,
      url,
      statusCode,
      duration,
      userId
    }, requestId);
  }

  /**
   * Log database operation
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    requestId?: string
  ): void {
    const level = success ? 'info' : 'error';
    const message = `Database ${operation} on ${table} - ${success ? 'success' : 'failed'} (${duration}ms)`;
    
    this.log(level, message, {
      operation,
      table,
      duration,
      success
    }, requestId);
  }

  /**
   * Log performance metric
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
    requestId?: string
  ): void {
    const level = duration > 1000 ? 'warn' : 'info';
    const message = `Performance: ${operation} took ${duration}ms`;
    
    this.log(level, message, {
      operation,
      duration,
      ...metadata
    }, requestId);
  }

  /**
   * Log security event
   */
  logSecurity(
    event: string,
    details: Record<string, any>,
    requestId?: string
  ): void {
    this.log('warn', `Security: ${event}`, details, requestId);
  }

  /**
   * Log business event
   */
  logBusiness(
    event: string,
    details: Record<string, any>,
    requestId?: string
  ): void {
    this.log('info', `Business: ${event}`, details, requestId);
  }

  private log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    requestId?: string
  ): void {
    // Check if we should log this level
    if (this.logLevels[level] < this.logLevels[this.config.level]) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'neurolint-api',
      ...(requestId && { requestId }),
      ...(context && this.config.includeContext && { context: this.sanitizeContext(context) })
    };

    if (this.config.structured) {
      // Production structured logging
      this.writeStructuredLog(logEntry);
    } else {
      // Development console logging
      this.writeConsoleLog(logEntry);
    }
  }

  private writeStructuredLog(logEntry: LogEntry): void {
    const output = {
      ...logEntry,
      ...(logEntry.context && { context: this.flattenContext(logEntry.context) })
    };

    // Write to stdout for production logging
    process.stdout.write(JSON.stringify(output) + '\n');
  }

  private writeConsoleLog(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp;
    const level = logEntry.level.toUpperCase().padEnd(5);
    const message = logEntry.message;
    const context = logEntry.context ? ` ${JSON.stringify(logEntry.context)}` : '';
    const requestId = logEntry.requestId ? ` [${logEntry.requestId}]` : '';

    const logLine = `[${timestamp}] ${level}${requestId}: ${message}${context}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(logLine);
        break;
      case 'info':
        console.info(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'error':
        console.error(logLine);
        break;
    }
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private flattenContext(context: Record<string, any>, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenContext(value, fullKey));
      } else {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'authorization',
      'cookie', 'session', 'private', 'credential'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Update logging configuration
   */
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }
}

export const logger = ProductionLogger.getInstance();

// Convenience functions for common logging patterns
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  requestId?: string,
  userId?: string
) => logger.logRequest(method, url, statusCode, duration, requestId, userId);

export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  requestId?: string
) => logger.logDatabase(operation, table, duration, success, requestId);

export const logPerformanceMetric = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>,
  requestId?: string
) => logger.logPerformance(operation, duration, metadata, requestId);

export const logSecurityEvent = (
  event: string,
  details: Record<string, any>,
  requestId?: string
) => logger.logSecurity(event, details, requestId);

export const logBusinessEvent = (
  event: string,
  details: Record<string, any>,
  requestId?: string
) => logger.logBusiness(event, details, requestId); 