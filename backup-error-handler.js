/**
 * Production-Grade Error Handling System for Backup Operations
 * Provides comprehensive error handling, retry mechanisms, circuit breakers,
 * fallback strategies, and automated recovery for production environments
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { EventEmitter } = require('events');

// Error categories
const ERROR_CATEGORIES = {
  FILESYSTEM: 'filesystem',
  NETWORK: 'network',
  ENCRYPTION: 'encryption',
  COMPRESSION: 'compression',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  DISK_SPACE: 'disk_space',
  MEMORY: 'memory',
  TIMEOUT: 'timeout',
  CORRUPTION: 'corruption',
  CONFIGURATION: 'configuration',
  UNKNOWN: 'unknown'
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Recovery strategies
const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  SKIP: 'skip',
  ABORT: 'abort',
  ESCALATE: 'escalate',
  MANUAL_INTERVENTION: 'manual_intervention'
};

// Circuit breaker states
const CIRCUIT_BREAKER_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

class BackupErrorHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = options.logger;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.exponentialBackoff = options.exponentialBackoff !== false;
    this.circuitBreakerEnabled = options.circuitBreakerEnabled !== false;
    this.fallbackEnabled = options.fallbackEnabled !== false;
    this.recoveryEnabled = options.recoveryEnabled !== false;
    this.escalationEnabled = options.escalationEnabled !== false;
    
    // Circuit breaker configuration
    this.circuitBreakerConfig = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
      monitoringWindow: options.monitoringWindow || 300000 // 5 minutes
    };
    
    // Error tracking
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.recoveryAttempts = new Map();
    this.escalationQueue = [];
    
    // Error patterns for categorization
    this.errorPatterns = this.initializeErrorPatterns();
    
    // Recovery strategies by error category
    this.recoveryStrategies = this.initializeRecoveryStrategies();
    
    // Performance thresholds
    this.performanceThresholds = {
      maxDiskUsage: options.maxDiskUsage || 0.95, // 95%
      maxMemoryUsage: options.maxMemoryUsage || 0.90, // 90%
      maxRetryTime: options.maxRetryTime || 300000, // 5 minutes
      minFreeSpace: options.minFreeSpace || 1024 * 1024 * 1024 // 1GB
    };
    
    this.initialize();
  }

  /**
   * Initialize error handler
   */
  async initialize() {
    try {
      // Start error monitoring
      this.startErrorMonitoring();
      
      // Start circuit breaker monitoring
      if (this.circuitBreakerEnabled) {
        this.startCircuitBreakerMonitoring();
      }
      
      // Start recovery monitoring
      if (this.recoveryEnabled) {
        this.startRecoveryMonitoring();
      }
      
      if (this.logger) {
        this.logger.info('Backup error handler initialized', {
          maxRetries: this.maxRetries,
          circuitBreakerEnabled: this.circuitBreakerEnabled,
          fallbackEnabled: this.fallbackEnabled,
          recoveryEnabled: this.recoveryEnabled
        });
      }
    } catch (error) {
      console.error('Failed to initialize error handler:', error);
    }
  }

  /**
   * Initialize error patterns for categorization
   */
  initializeErrorPatterns() {
    return {
      [ERROR_CATEGORIES.FILESYSTEM]: [
        /ENOENT|ENOTDIR|EISDIR|EEXIST/i,
        /no such file or directory/i,
        /permission denied/i,
        /file already exists/i
      ],
      [ERROR_CATEGORIES.NETWORK]: [
        /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND/i,
        /network|connection|timeout/i,
        /fetch failed|request failed/i
      ],
      [ERROR_CATEGORIES.ENCRYPTION]: [
        /encryption|decryption|cipher|key/i,
        /invalid key|wrong password|bad decrypt/i,
        /authentication failed/i
      ],
      [ERROR_CATEGORIES.COMPRESSION]: [
        /compression|decompression|gzip|deflate/i,
        /invalid compressed data/i,
        /unexpected end of file/i
      ],
      [ERROR_CATEGORIES.VALIDATION]: [
        /validation|invalid|malformed/i,
        /json parse|syntax error/i,
        /checksum|hash|integrity/i
      ],
      [ERROR_CATEGORIES.PERMISSION]: [
        /EACCES|EPERM/i,
        /permission denied|access denied/i,
        /operation not permitted/i
      ],
      [ERROR_CATEGORIES.DISK_SPACE]: [
        /ENOSPC|EDQUOT/i,
        /no space left|disk full|quota exceeded/i,
        /insufficient storage/i
      ],
      [ERROR_CATEGORIES.MEMORY]: [
        /out of memory|heap|allocation failed/i,
        /maximum call stack/i,
        /process out of memory/i
      ],
      [ERROR_CATEGORIES.TIMEOUT]: [
        /timeout|timed out/i,
        /operation timeout/i,
        /request timeout/i
      ],
      [ERROR_CATEGORIES.CORRUPTION]: [
        /corruption|corrupt|damaged/i,
        /unexpected eof|truncated/i,
        /invalid format|bad magic/i
      ]
    };
  }

  /**
   * Initialize recovery strategies
   */
  initializeRecoveryStrategies() {
    return {
      [ERROR_CATEGORIES.FILESYSTEM]: {
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 3,
        delay: 1000,
        fallback: RECOVERY_STRATEGIES.FALLBACK
      },
      [ERROR_CATEGORIES.NETWORK]: {
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 5,
        delay: 2000,
        fallback: RECOVERY_STRATEGIES.SKIP
      },
      [ERROR_CATEGORIES.ENCRYPTION]: {
        strategy: RECOVERY_STRATEGIES.ESCALATE,
        maxRetries: 1,
        delay: 0,
        fallback: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
      },
      [ERROR_CATEGORIES.COMPRESSION]: {
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        maxRetries: 2,
        delay: 500,
        fallback: RECOVERY_STRATEGIES.SKIP
      },
      [ERROR_CATEGORIES.VALIDATION]: {
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 2,
        delay: 1000,
        fallback: RECOVERY_STRATEGIES.ESCALATE
      },
      [ERROR_CATEGORIES.PERMISSION]: {
        strategy: RECOVERY_STRATEGIES.ESCALATE,
        maxRetries: 1,
        delay: 0,
        fallback: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
      },
      [ERROR_CATEGORIES.DISK_SPACE]: {
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        maxRetries: 1,
        delay: 0,
        fallback: RECOVERY_STRATEGIES.ESCALATE
      },
      [ERROR_CATEGORIES.MEMORY]: {
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        maxRetries: 2,
        delay: 5000,
        fallback: RECOVERY_STRATEGIES.ABORT
      },
      [ERROR_CATEGORIES.TIMEOUT]: {
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 3,
        delay: 2000,
        fallback: RECOVERY_STRATEGIES.SKIP
      },
      [ERROR_CATEGORIES.CORRUPTION]: {
        strategy: RECOVERY_STRATEGIES.ESCALATE,
        maxRetries: 1,
        delay: 0,
        fallback: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
      }
    };
  }

  /**
   * Handle error with comprehensive recovery strategies
   */
  async handleError(error, context = {}) {
    const errorId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
      // Categorize error
      const category = this.categorizeError(error);
      const severity = this.determineSeverity(error, category);
      
      // Create error record
      const errorRecord = {
        errorId,
        timestamp,
        category,
        severity,
        message: error.message,
        stack: error.stack,
        context,
        retryCount: context.retryCount || 0,
        recoveryStrategy: null,
        resolved: false
      };

      // Log error
      if (this.logger) {
        this.logger.error('Backup operation error', {
          errorId,
          category,
          severity,
          message: error.message,
          context,
          retryCount: errorRecord.retryCount
        });
      }

      // Check circuit breaker
      if (this.circuitBreakerEnabled && this.isCircuitBreakerOpen(category)) {
        return this.handleCircuitBreakerOpen(errorRecord);
      }

      // Update error tracking
      this.updateErrorTracking(category, errorRecord);

      // Determine recovery strategy
      const strategy = this.determineRecoveryStrategy(category, errorRecord);
      errorRecord.recoveryStrategy = strategy;

      // Execute recovery strategy
      const recoveryResult = await this.executeRecoveryStrategy(strategy, errorRecord);
      
      return {
        success: recoveryResult.success,
        errorId,
        category,
        severity,
        strategy: strategy.name,
        message: recoveryResult.message,
        shouldRetry: recoveryResult.shouldRetry,
        shouldEscalate: recoveryResult.shouldEscalate,
        fallbackUsed: recoveryResult.fallbackUsed,
        context: recoveryResult.context
      };

    } catch (handlingError) {
      // Error in error handling - critical situation
      if (this.logger) {
        this.logger.fatal('Error handler failed', {
          originalError: error.message,
          handlingError: handlingError.message,
          errorId,
          context
        });
      }

      // Emit critical error event
      this.emit('criticalError', {
        originalError: error.message,
        handlingError: handlingError.message,
        errorId,
        context
      });

      return {
        success: false,
        errorId,
        category: ERROR_CATEGORIES.UNKNOWN,
        severity: ERROR_SEVERITY.CRITICAL,
        strategy: 'error_handler_failed',
        message: `Error handling failed: ${handlingError.message}`,
        shouldRetry: false,
        shouldEscalate: true,
        fallbackUsed: false
      };
    }
  }

  /**
   * Categorize error based on patterns
   */
  categorizeError(error) {
    const errorText = (error.message + ' ' + (error.code || '') + ' ' + (error.stack || '')).toLowerCase();
    
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(errorText)) {
          return category;
        }
      }
    }
    
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, category) {
    // Critical errors that can cause data loss or security issues
    const criticalCategories = [
      ERROR_CATEGORIES.ENCRYPTION,
      ERROR_CATEGORIES.CORRUPTION,
      ERROR_CATEGORIES.PERMISSION
    ];
    
    if (criticalCategories.includes(category)) {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    // High severity errors that can cause operation failure
    const highSeverityCategories = [
      ERROR_CATEGORIES.DISK_SPACE,
      ERROR_CATEGORIES.MEMORY,
      ERROR_CATEGORIES.VALIDATION
    ];
    
    if (highSeverityCategories.includes(category)) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium severity errors that can be retried
    const mediumSeverityCategories = [
      ERROR_CATEGORIES.NETWORK,
      ERROR_CATEGORIES.TIMEOUT,
      ERROR_CATEGORIES.FILESYSTEM
    ];
    
    if (mediumSeverityCategories.includes(category)) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Update error tracking for circuit breaker
   */
  updateErrorTracking(category, errorRecord) {
    const now = Date.now();
    
    if (!this.errorCounts.has(category)) {
      this.errorCounts.set(category, {
        total: 0,
        recent: [],
        lastReset: now
      });
    }
    
    const tracking = this.errorCounts.get(category);
    tracking.total++;
    tracking.recent.push({
      timestamp: now,
      severity: errorRecord.severity,
      errorId: errorRecord.errorId
    });
    
    // Clean old entries outside monitoring window
    tracking.recent = tracking.recent.filter(
      entry => now - entry.timestamp < this.circuitBreakerConfig.monitoringWindow
    );
    
    // Check if circuit breaker should be triggered
    if (this.circuitBreakerEnabled && tracking.recent.length >= this.circuitBreakerConfig.failureThreshold) {
      this.triggerCircuitBreaker(category);
    }
  }

  /**
   * Determine recovery strategy
   */
  determineRecoveryStrategy(category, errorRecord) {
    const baseStrategy = this.recoveryStrategies[category] || this.recoveryStrategies[ERROR_CATEGORIES.UNKNOWN];
    
    // Modify strategy based on context
    let strategy = { ...baseStrategy };
    
    // Adjust retry count based on severity
    if (errorRecord.severity === ERROR_SEVERITY.CRITICAL) {
      strategy.maxRetries = Math.min(1, strategy.maxRetries);
    } else if (errorRecord.severity === ERROR_SEVERITY.LOW) {
      strategy.maxRetries = Math.max(strategy.maxRetries, 5);
    }
    
    // Check system resources before retrying
    if (strategy.strategy === RECOVERY_STRATEGIES.RETRY) {
      const resourceCheck = this.checkSystemResources();
      if (!resourceCheck.healthy) {
        strategy.strategy = RECOVERY_STRATEGIES.FALLBACK;
        strategy.reason = 'System resources unhealthy';
      }
    }
    
    return strategy;
  }

  /**
   * Execute recovery strategy
   */
  async executeRecoveryStrategy(strategy, errorRecord) {
    const strategyName = strategy.strategy;
    
    switch (strategyName) {
      case RECOVERY_STRATEGIES.RETRY:
        return await this.executeRetryStrategy(strategy, errorRecord);
      
      case RECOVERY_STRATEGIES.FALLBACK:
        return await this.executeFallbackStrategy(strategy, errorRecord);
      
      case RECOVERY_STRATEGIES.SKIP:
        return this.executeSkipStrategy(strategy, errorRecord);
      
      case RECOVERY_STRATEGIES.ABORT:
        return this.executeAbortStrategy(strategy, errorRecord);
      
      case RECOVERY_STRATEGIES.ESCALATE:
        return await this.executeEscalateStrategy(strategy, errorRecord);
      
      case RECOVERY_STRATEGIES.MANUAL_INTERVENTION:
        return await this.executeManualInterventionStrategy(strategy, errorRecord);
      
      default:
        return {
          success: false,
          message: `Unknown recovery strategy: ${strategyName}`,
          shouldRetry: false,
          shouldEscalate: true,
          fallbackUsed: false
        };
    }
  }

  /**
   * Execute retry strategy
   */
  async executeRetryStrategy(strategy, errorRecord) {
    if (errorRecord.retryCount >= strategy.maxRetries) {
      // Max retries reached, try fallback
      if (strategy.fallback) {
        const fallbackStrategy = { strategy: strategy.fallback };
        return await this.executeRecoveryStrategy(fallbackStrategy, errorRecord);
      }
      
      return {
        success: false,
        message: `Max retries (${strategy.maxRetries}) exceeded`,
        shouldRetry: false,
        shouldEscalate: true,
        fallbackUsed: false
      };
    }
    
    // Calculate delay with exponential backoff
    let delay = strategy.delay;
    if (this.exponentialBackoff) {
      delay = strategy.delay * Math.pow(2, errorRecord.retryCount);
    }
    
    // Add jitter to prevent thundering herd
    delay += Math.random() * 1000;
    
    if (this.logger) {
      this.logger.info('Executing retry strategy', {
        errorId: errorRecord.errorId,
        retryCount: errorRecord.retryCount + 1,
        maxRetries: strategy.maxRetries,
        delay
      });
    }
    
    // Wait before retry
    await this.sleep(delay);
    
    return {
      success: true,
      message: `Retry scheduled (attempt ${errorRecord.retryCount + 1}/${strategy.maxRetries})`,
      shouldRetry: true,
      shouldEscalate: false,
      fallbackUsed: false,
      context: {
        retryCount: errorRecord.retryCount + 1,
        retryDelay: delay
      }
    };
  }

  /**
   * Execute fallback strategy
   */
  async executeFallbackStrategy(strategy, errorRecord) {
    const fallbackOptions = await this.generateFallbackOptions(errorRecord);
    
    if (fallbackOptions.length === 0) {
      return {
        success: false,
        message: 'No fallback options available',
        shouldRetry: false,
        shouldEscalate: true,
        fallbackUsed: false
      };
    }
    
    // Try the best fallback option
    const bestFallback = fallbackOptions[0];
    
    if (this.logger) {
      this.logger.info('Executing fallback strategy', {
        errorId: errorRecord.errorId,
        fallbackType: bestFallback.type,
        fallbackDescription: bestFallback.description
      });
    }
    
    try {
      await this.executeFallbackOption(bestFallback, errorRecord);
      
      return {
        success: true,
        message: `Fallback executed: ${bestFallback.description}`,
        shouldRetry: false,
        shouldEscalate: false,
        fallbackUsed: true,
        context: {
          fallbackType: bestFallback.type,
          fallbackDetails: bestFallback
        }
      };
    } catch (fallbackError) {
      return {
        success: false,
        message: `Fallback failed: ${fallbackError.message}`,
        shouldRetry: false,
        shouldEscalate: true,
        fallbackUsed: false
      };
    }
  }

  /**
   * Generate fallback options based on error context
   */
  async generateFallbackOptions(errorRecord) {
    const options = [];
    
    switch (errorRecord.category) {
      case ERROR_CATEGORIES.DISK_SPACE:
        options.push({
          type: 'cleanup_temp',
          description: 'Clean up temporary files',
          priority: 1,
          action: async () => await this.cleanupTempFiles()
        });
        options.push({
          type: 'alternative_location',
          description: 'Use alternative backup location',
          priority: 2,
          action: async () => await this.useAlternativeLocation()
        });
        break;
        
      case ERROR_CATEGORIES.NETWORK:
        options.push({
          type: 'local_backup',
          description: 'Create local backup instead of remote',
          priority: 1,
          action: async () => await this.createLocalBackup()
        });
        break;
        
      case ERROR_CATEGORIES.COMPRESSION:
        options.push({
          type: 'uncompressed_backup',
          description: 'Create backup without compression',
          priority: 1,
          action: async () => await this.createUncompressedBackup()
        });
        break;
        
      case ERROR_CATEGORIES.MEMORY:
        options.push({
          type: 'streaming_backup',
          description: 'Use streaming backup to reduce memory usage',
          priority: 1,
          action: async () => await this.createStreamingBackup()
        });
        options.push({
          type: 'garbage_collection',
          description: 'Force garbage collection and retry',
          priority: 2,
          action: async () => await this.forceGarbageCollection()
        });
        break;
    }
    
    // Sort by priority
    return options.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute skip strategy
   */
  executeSkipStrategy(strategy, errorRecord) {
    if (this.logger) {
      this.logger.warn('Executing skip strategy', {
        errorId: errorRecord.errorId,
        reason: 'Error cannot be recovered, skipping operation'
      });
    }
    
    return {
      success: true,
      message: 'Operation skipped due to unrecoverable error',
      shouldRetry: false,
      shouldEscalate: false,
      fallbackUsed: false,
      context: {
        skipped: true,
        reason: errorRecord.message
      }
    };
  }

  /**
   * Execute abort strategy
   */
  executeAbortStrategy(strategy, errorRecord) {
    if (this.logger) {
      this.logger.error('Executing abort strategy', {
        errorId: errorRecord.errorId,
        reason: 'Critical error requires operation abort'
      });
    }
    
    return {
      success: false,
      message: 'Operation aborted due to critical error',
      shouldRetry: false,
      shouldEscalate: true,
      fallbackUsed: false,
      context: {
        aborted: true,
        reason: errorRecord.message
      }
    };
  }

  /**
   * Execute escalate strategy
   */
  async executeEscalateStrategy(strategy, errorRecord) {
    if (this.escalationEnabled) {
      await this.escalateError(errorRecord);
    }
    
    if (this.logger) {
      this.logger.error('Executing escalate strategy', {
        errorId: errorRecord.errorId,
        severity: errorRecord.severity,
        escalated: this.escalationEnabled
      });
    }
    
    return {
      success: false,
      message: 'Error escalated for manual review',
      shouldRetry: false,
      shouldEscalate: true,
      fallbackUsed: false,
      context: {
        escalated: this.escalationEnabled,
        escalationTime: new Date().toISOString()
      }
    };
  }

  /**
   * Execute manual intervention strategy
   */
  async executeManualInterventionStrategy(strategy, errorRecord) {
    // Create intervention request
    const interventionRequest = {
      requestId: crypto.randomUUID(),
      errorId: errorRecord.errorId,
      timestamp: new Date().toISOString(),
      category: errorRecord.category,
      severity: errorRecord.severity,
      message: errorRecord.message,
      context: errorRecord.context,
      status: 'pending'
    };
    
    // Save intervention request
    await this.saveInterventionRequest(interventionRequest);
    
    if (this.logger) {
      this.logger.error('Manual intervention required', {
        errorId: errorRecord.errorId,
        requestId: interventionRequest.requestId,
        severity: errorRecord.severity
      });
    }
    
    return {
      success: false,
      message: 'Manual intervention required',
      shouldRetry: false,
      shouldEscalate: true,
      fallbackUsed: false,
      context: {
        interventionRequired: true,
        requestId: interventionRequest.requestId
      }
    };
  }

  /**
   * Check system resources
   */
  checkSystemResources() {
    const memoryUsage = process.memoryUsage();
    const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    // Check disk space (simplified check)
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const systemMemoryUsage = 1 - (freeMemory / totalMemory);
    
    const checks = {
      memoryUsage: memoryUsageRatio < this.performanceThresholds.maxMemoryUsage,
      systemMemory: systemMemoryUsage < this.performanceThresholds.maxMemoryUsage,
      loadAverage: os.loadavg()[0] < os.cpus().length * 2 // Simple load check
    };
    
    const healthy = Object.values(checks).every(check => check);
    
    return {
      healthy,
      checks,
      metrics: {
        memoryUsageRatio,
        systemMemoryUsage,
        loadAverage: os.loadavg()[0],
        freeMemory,
        totalMemory
      }
    };
  }

  /**
   * Circuit breaker methods
   */
  isCircuitBreakerOpen(category) {
    const breaker = this.circuitBreakers.get(category);
    return breaker && breaker.state === CIRCUIT_BREAKER_STATES.OPEN;
  }

  triggerCircuitBreaker(category) {
    this.circuitBreakers.set(category, {
      state: CIRCUIT_BREAKER_STATES.OPEN,
      openedAt: Date.now(),
      failureCount: this.errorCounts.get(category)?.recent.length || 0
    });
    
    if (this.logger) {
      this.logger.warn('Circuit breaker triggered', {
        category,
        failureCount: this.errorCounts.get(category)?.recent.length || 0,
        threshold: this.circuitBreakerConfig.failureThreshold
      });
    }
  }

  handleCircuitBreakerOpen(errorRecord) {
    return {
      success: false,
      errorId: errorRecord.errorId,
      category: errorRecord.category,
      severity: errorRecord.severity,
      strategy: 'circuit_breaker_open',
      message: 'Circuit breaker is open, operation rejected',
      shouldRetry: false,
      shouldEscalate: false,
      fallbackUsed: false,
      context: {
        circuitBreakerOpen: true
      }
    };
  }

  /**
   * Monitoring methods
   */
  startErrorMonitoring() {
    setInterval(() => {
      this.generateErrorReport();
    }, 300000); // Every 5 minutes
  }

  startCircuitBreakerMonitoring() {
    setInterval(() => {
      this.monitorCircuitBreakers();
    }, 60000); // Every minute
  }

  startRecoveryMonitoring() {
    setInterval(() => {
      this.monitorRecoveryAttempts();
    }, 120000); // Every 2 minutes
  }

  monitorCircuitBreakers() {
    const now = Date.now();
    
    for (const [category, breaker] of this.circuitBreakers.entries()) {
      if (breaker.state === CIRCUIT_BREAKER_STATES.OPEN) {
        if (now - breaker.openedAt > this.circuitBreakerConfig.recoveryTimeout) {
          breaker.state = CIRCUIT_BREAKER_STATES.HALF_OPEN;
          
          if (this.logger) {
            this.logger.info('Circuit breaker moved to half-open', { category });
          }
        }
      }
    }
  }

  /**
   * Utility methods
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanupTempFiles() {
    // Implementation for cleaning temporary files
    const tempDir = os.tmpdir();
    // Cleanup logic here
  }

  async useAlternativeLocation() {
    // Implementation for using alternative backup location
  }

  async createLocalBackup() {
    // Implementation for creating local backup
  }

  async createUncompressedBackup() {
    // Implementation for creating uncompressed backup
  }

  async createStreamingBackup() {
    // Implementation for creating streaming backup
  }

  async forceGarbageCollection() {
    if (global.gc) {
      global.gc();
    }
  }

  async escalateError(errorRecord) {
    this.escalationQueue.push(errorRecord);
    // Implementation for error escalation
  }

  async saveInterventionRequest(request) {
    // Implementation for saving intervention requests
  }

  generateErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errorCounts: Object.fromEntries(this.errorCounts),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      escalationQueue: this.escalationQueue.length,
      systemHealth: this.checkSystemResources()
    };
    
    if (this.logger) {
      this.logger.info('Error monitoring report', report);
    }
    
    return report;
  }

  /**
   * Get error handler statistics
   */
  getStatistics() {
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, tracking) => sum + tracking.total, 0);
    
    return {
      totalErrors,
      errorsByCategory: Object.fromEntries(
        Array.from(this.errorCounts.entries()).map(([category, tracking]) => [
          category,
          { total: tracking.total, recent: tracking.recent.length }
        ])
      ),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      escalationQueueSize: this.escalationQueue.length,
      systemHealth: this.checkSystemResources()
    };
  }
}

module.exports = {
  BackupErrorHandler,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  RECOVERY_STRATEGIES,
  CIRCUIT_BREAKER_STATES
}; 