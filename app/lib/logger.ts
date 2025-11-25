export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
  flushInterval: number;
}

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      maxBufferSize: 100,
      flushInterval: 5000,
      ...config,
    };

    if (this.config.enableRemote) {
      this.startFlushTimer();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelStr = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    const sessionId = entry.sessionId ? `[Session:${entry.sessionId}]` : '';
    
    let message = `${timestamp} ${levelStr}${context}${userId}${sessionId} ${entry.message}`;
    
    if (entry.data) {
      message += ` | Data: ${JSON.stringify(entry.data)}`;
    }
    
    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += ` | Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      requestId: this.getCurrentRequestId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Get from auth context or session
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('neurolint-user-id');
      return userData || undefined;
    }
    return undefined;
  }

  private getCurrentSessionId(): string | undefined {
    // Get from current session or URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('session') || undefined;
    }
    return undefined;
  }

  private getCurrentRequestId(): string | undefined {
    // Generate or get from request context
    return Math.random().toString(36).substr(2, 9);
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const message = this.formatMessage(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    this.buffer.push(entry);

    if (this.buffer.length >= this.config.maxBufferSize) {
      await this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.remoteEndpoint) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.warn('Failed to send logs to remote endpoint:', error);
      entries.forEach(entry => this.logToConsole(entry));
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval);
  }

  debug(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createEntry(LogLevel.DEBUG, message, context, data);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  info(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createEntry(LogLevel.INFO, message, context, data);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  warn(message: string, context?: string, data?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createEntry(LogLevel.WARN, message, context, data, error);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  error(message: string, context?: string, data?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createEntry(LogLevel.ERROR, message, context, data, error);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  fatal(message: string, context?: string, data?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    const entry = this.createEntry(LogLevel.FATAL, message, context, data, error);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  // Context-specific loggers
  auth(message: string, data?: any, error?: Error): void {
    if (error) {
      this.error(message, 'AUTH', data, error);
    } else {
      this.info(message, 'AUTH', data);
    }
  }

  api(message: string, data?: any, error?: Error): void {
    if (error) {
      this.error(message, 'API', data, error);
    } else {
      this.info(message, 'API', data);
    }
  }

  ui(message: string, data?: any, error?: Error): void {
    if (error) {
      this.error(message, 'UI', data, error);
    } else {
      this.debug(message, 'UI', data);
    }
  }

  collaboration(message: string, data?: any, error?: Error): void {
    if (error) {
      this.error(message, 'COLLABORATION', data, error);
    } else {
      this.info(message, 'COLLABORATION', data);
    }
  }

  analysis(message: string, data?: any, error?: Error): void {
    if (error) {
      this.error(message, 'ANALYSIS', data, error);
    } else {
      this.info(message, 'ANALYSIS', data);
    }
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any): void {
    this.info(`Performance: ${operation} took ${duration}ms`, 'PERFORMANCE', data);
  }

  // User action logging
  userAction(action: string, data?: any): void {
    this.info(`User action: ${action}`, 'USER_ACTION', data);
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBuffer();
  }
}

// Create default logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
});

// Export for use in components
export default logger; 