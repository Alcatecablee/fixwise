// Production logging system - replaces console.log
export const logMessage = (level: string, message: string, data: any = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    source: 'web-app',
    pid: process.pid
  };
  
  // Use process.stdout.write for production logging
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(`${JSON.stringify(logEntry)}\n`);
  } else {
    // Fallback for client-side logging
    const logLevel = level.toUpperCase();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    console.log(`[${logLevel}] ${message}${logData}`);
  }
};

// Convenience methods for different log levels
export const logInfo = (message: string, data?: any) => logMessage('info', message, data);
export const logWarn = (message: string, data?: any) => logMessage('warn', message, data);
export const logError = (message: string, data?: any) => logMessage('error', message, data);
export const logDebug = (message: string, data?: any) => logMessage('debug', message, data); 