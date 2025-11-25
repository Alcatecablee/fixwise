/**
 * Client-Safe Logger for Browser Environment
 * 
 * A simplified version of the logger that works in the browser
 * without Node.js dependencies
 */

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: Error;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  remoteApiKey?: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
};

/**
 * Client-safe logger class
 */
class ClientLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLogger();
  }

  /**
   * Initialize logger with configuration
   */
  private initializeLogger() {
    // Handle uncaught errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error', { 
          error: event.error,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', { 
          reason: event.reason 
        });
      });
    }
  }

  /**
   * Main logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: Record<string, any>) {
    if (level > this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logToRemote([logEntry]).catch(() => {
        // Silently fail for remote logging
      });
    }
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry) {
    const { level, message, data, context, timestamp } = entry;
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const levelName = levelNames[level];
    
    const logData = {
      timestamp,
      level: levelName,
      message,
      ...(data && { data }),
      ...(context && { context })
    };

    switch (level) {
      case LogLevel.ERROR:
        console.error(`[${levelName}] ${message}`, logData);
        break;
      case LogLevel.WARN:
        console.warn(`[${levelName}] ${message}`, logData);
        break;
      case LogLevel.INFO:
        console.info(`[${levelName}] ${message}`, logData);
        break;
      case LogLevel.DEBUG:
        console.debug(`[${levelName}] ${message}`, logData);
        break;
      case LogLevel.TRACE:
        console.trace(`[${levelName}] ${message}`, logData);
        break;
    }
  }

  /**
   * Log to remote service
   */
  private async logToRemote(logs: LogEntry[]) {
    if (!this.config.remoteEndpoint || !this.config.remoteApiKey) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.remoteApiKey}`
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.statusText}`);
      }
    } catch (error) {
      // Silently fail for remote logging in client
    }
  }

  /**
   * Get user ID from localStorage or session
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      return sessionStorage.getItem('session_id') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get request ID
   */
  private getRequestId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      return sessionStorage.getItem('request_id') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Public logging methods
   */
  error(message: string, data?: any, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, data, context);
  }

  warn(message: string, data?: any, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data, context);
  }

  info(message: string, data?: any, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data, context);
  }

  debug(message: string, data?: any, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  trace(message: string, data?: any, context?: Record<string, any>) {
    this.log(LogLevel.TRACE, message, data, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): ClientLogger {
    const childLogger = new ClientLogger(this.config);
    // Override the log method to include parent context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, data?: any, childContext?: Record<string, any>) => {
      originalLog(level, message, data, { ...context, ...childContext });
    };
    return childLogger;
  }

  /**
   * Create an auth-specific logger
   */
  get auth() {
    const authLogger = this.child({ component: 'auth' });
    return (message: string, data?: any, context?: Record<string, any>) => {
      authLogger.info(message, data, context);
    };
  }

  /**
   * Create a UI-specific logger
   */
  get ui() {
    const uiLogger = this.child({ component: 'ui' });
    return (message: string, data?: any, context?: Record<string, any>) => {
      uiLogger.info(message, data, context);
    };
  }

  /**
   * Create an API-specific logger
   */
  get api() {
    const apiLogger = this.child({ component: 'api' });
    return (message: string, data?: any, context?: Record<string, any>) => {
      apiLogger.info(message, data, context);
    };
  }

  /**
   * Create a database-specific logger
   */
  get db() {
    const dbLogger = this.child({ component: 'database' });
    return (message: string, data?: any, context?: Record<string, any>) => {
      dbLogger.info(message, data, context);
    };
  }

  /**
   * Flush logs to remote service
   */
  async flush() {
    if (this.logBuffer.length > 0 && this.config.enableRemote) {
      await this.logToRemote([...this.logBuffer]);
      this.logBuffer = [];
    }
  }
}

// Create default logger instance
const clientLogger = new ClientLogger();

// Export the logger instance and class
export default clientLogger;
export { ClientLogger }; 