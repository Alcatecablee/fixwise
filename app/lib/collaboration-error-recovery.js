/**
 * Error Recovery Utilities for NeuroLint Pro Collaboration
 * Handles graceful error recovery and debugging
 */

class CollaborationErrorRecovery {
  constructor() {
    this.errorHistory = [];
    this.maxErrorHistory = 100;
    this.recoveryStrategies = new Map();
    this.setupDefaultStrategies();
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultStrategies() {
    // WebSocket connection errors
    this.recoveryStrategies.set("websocket_error", {
      maxRetries: 3,
      backoffMs: [1000, 3000, 5000],
      shouldRetry: (error, retryCount) => {
        return (
          retryCount < 3 &&
          !error.message.includes("authentication") &&
          !error.message.includes("forbidden")
        );
      },
      recover: async (context, retryCount) => {
        const delay =
          this.recoveryStrategies.get("websocket_error").backoffMs[
            retryCount
          ] || 5000;
        await this.delay(delay);
        return context.reconnect();
      },
    });

    // Operation sync errors
    this.recoveryStrategies.set("operation_sync_error", {
      maxRetries: 2,
      shouldRetry: (error, retryCount) => retryCount < 2,
      recover: async (context, retryCount) => {
        // Request full document sync
        return context.requestFullSync();
      },
    });

    // NeuroLint analysis errors
    this.recoveryStrategies.set("neurolint_error", {
      maxRetries: 2,
      shouldRetry: (error, retryCount) => {
        return (
          retryCount < 2 &&
          !error.message.includes("timeout") &&
          !error.message.includes("too large")
        );
      },
      recover: async (context, retryCount) => {
        // Try with simpler analysis
        if (retryCount === 0) {
          return context.runSimpleAnalysis();
        }
        return false;
      },
    });

    // Session errors
    this.recoveryStrategies.set("session_error", {
      maxRetries: 1,
      shouldRetry: (error, retryCount) => {
        return retryCount < 1 && error.message.includes("not found");
      },
      recover: async (context, retryCount) => {
        // Try to rejoin session
        return context.rejoinSession();
      },
    });
  }

  /**
   * Log error with context
   */
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      id: this.generateErrorId(),
    };

    this.errorHistory.push(errorEntry);

    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    console.error("[COLLABORATION ERROR]", errorEntry);
    return errorEntry.id;
  }

  /**
   * Attempt to recover from error
   */
  async attemptRecovery(errorType, error, context, retryCount = 0) {
    const strategy = this.recoveryStrategies.get(errorType);

    if (!strategy) {
      console.warn(`No recovery strategy for error type: ${errorType}`);
      return false;
    }

    if (!strategy.shouldRetry(error, retryCount)) {
      console.log(
        `Recovery abandoned for ${errorType} after ${retryCount} attempts`,
      );
      return false;
    }

    try {
      console.log(
        `Attempting recovery for ${errorType} (attempt ${retryCount + 1})`,
      );
      const result = await strategy.recover(context, retryCount);

      if (result) {
        console.log(`Recovery successful for ${errorType}`);
        return true;
      }
    } catch (recoveryError) {
      console.error(`Recovery failed for ${errorType}:`, recoveryError);
      this.logError(recoveryError, {
        originalError: error.message,
        errorType,
        retryCount,
      });
    }

    return false;
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      recentErrors: this.errorHistory.filter(
        (e) => Date.now() - new Date(e.timestamp).getTime() < 3600000, // Last hour
      ).length,
      errorsByType: {},
      errorsByContext: {},
    };

    this.errorHistory.forEach((entry) => {
      const type = entry.context.errorType || "unknown";
      stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;

      const contextKey =
        entry.context.sessionId || entry.context.clientId || "unknown";
      stats.errorsByContext[contextKey] =
        (stats.errorsByContext[contextKey] || 0) + 1;
    });

    return stats;
  }

  /**
   * Create error report for debugging
   */
  createErrorReport() {
    const stats = this.getErrorStats();
    const recentErrors = this.errorHistory.slice(-10);

    return {
      timestamp: new Date().toISOString(),
      stats,
      recentErrors: recentErrors.map((e) => ({
        timestamp: e.timestamp,
        message: e.error.message,
        context: e.context,
      })),
      systemInfo: {
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if system is in error state
   */
  isInErrorState() {
    const recentErrors = this.errorHistory.filter(
      (e) => Date.now() - new Date(e.timestamp).getTime() < 300000, // Last 5 minutes
    );

    return recentErrors.length > 10; // More than 10 errors in 5 minutes
  }

  /**
   * Get recovery suggestions
   */
  getRecoverySuggestions() {
    if (!this.isInErrorState()) {
      return [];
    }

    const suggestions = [];
    const stats = this.getErrorStats();

    if (stats.errorsByType.websocket_error > 5) {
      suggestions.push({
        type: "connection",
        message:
          "Multiple WebSocket errors detected. Check network connection.",
        action: "refresh_page",
      });
    }

    if (stats.errorsByType.operation_sync_error > 3) {
      suggestions.push({
        type: "sync",
        message: "Document sync issues detected. Consider rejoining session.",
        action: "rejoin_session",
      });
    }

    if (stats.errorsByType.neurolint_error > 2) {
      suggestions.push({
        type: "analysis",
        message:
          "NeuroLint analysis failing. Try with fewer layers or smaller code.",
        action: "reduce_complexity",
      });
    }

    return suggestions;
  }
}

module.exports = { CollaborationErrorRecovery };
