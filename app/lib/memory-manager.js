/**
 * Memory Manager for NeuroLint Pro Enhanced AST Engine
 *
 * Provides memory leak prevention, performance monitoring, and resource cleanup
 */

class MemoryManager {
  constructor() {
    this.allocations = new Map();
    this.maxContexts = 50; // Maximum number of semantic contexts to keep
    this.maxCacheSize = 100; // Maximum cache entries
    this.cleanupInterval = null;
    this.startCleanupTimer();
  }

  /**
   * Track memory allocation for AST contexts
   */
  trackAllocation(filename, size, type = "context") {
    this.allocations.set(filename, {
      size,
      type,
      timestamp: Date.now(),
      references: 1,
    });
  }

  /**
   * Release memory allocation
   */
  releaseAllocation(filename) {
    const allocation = this.allocations.get(filename);
    if (allocation) {
      allocation.references--;
      if (allocation.references <= 0) {
        this.allocations.delete(filename);
      }
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    let totalSize = 0;
    const typeStats = {};

    for (const [filename, allocation] of this.allocations) {
      totalSize += allocation.size;
      typeStats[allocation.type] =
        (typeStats[allocation.type] || 0) + allocation.size;
    }

    return {
      totalAllocations: this.allocations.size,
      totalSize,
      typeStats,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Clean up old allocations
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [filename, allocation] of this.allocations) {
      if (now - allocation.timestamp > maxAge) {
        this.allocations.delete(filename);
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    ); // Cleanup every 5 minutes
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Check if memory usage is too high
   */
  isMemoryPressure() {
    const stats = this.getMemoryStats();
    const heapUsed = stats.memoryUsage.heapUsed;
    const heapTotal = stats.memoryUsage.heapTotal;

    return heapUsed / heapTotal > 0.8; // 80% threshold
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.stopCleanupTimer();
    this.allocations.clear();
  }
}

/**
 * Performance Monitor for tracking AST operations
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.operationCounts = new Map();
  }

  /**
   * Start timing an operation
   */
  startTiming(operationId) {
    this.metrics.set(operationId, {
      startTime: process.hrtime.bigint(),
      endTime: null,
      duration: null,
    });
  }

  /**
   * End timing an operation
   */
  endTiming(operationId) {
    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.endTime = process.hrtime.bigint();
      metric.duration = Number(metric.endTime - metric.startTime) / 1000000; // Convert to milliseconds

      // Track operation counts
      const opType = operationId.split(":")[0];
      this.operationCounts.set(
        opType,
        (this.operationCounts.get(opType) || 0) + 1,
      );
    }
  }

  /**
   * Get timing for an operation
   */
  getTiming(operationId) {
    return this.metrics.get(operationId);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const timings = [];
    const operationStats = {};

    for (const [operationId, metric] of this.metrics) {
      if (metric.duration !== null) {
        timings.push({
          operationId,
          duration: metric.duration,
        });

        const opType = operationId.split(":")[0];
        if (!operationStats[opType]) {
          operationStats[opType] = {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
          };
        }

        operationStats[opType].count++;
        operationStats[opType].totalTime += metric.duration;
        operationStats[opType].minTime = Math.min(
          operationStats[opType].minTime,
          metric.duration,
        );
        operationStats[opType].maxTime = Math.max(
          operationStats[opType].maxTime,
          metric.duration,
        );
      }
    }

    // Calculate averages
    for (const opType in operationStats) {
      operationStats[opType].avgTime =
        operationStats[opType].totalTime / operationStats[opType].count;
    }

    return {
      totalOperations: timings.length,
      operationStats,
      slowestOperations: timings
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    };
  }

  /**
   * Clear old metrics
   */
  cleanup() {
    // Keep only last 1000 metrics
    if (this.metrics.size > 1000) {
      const entries = Array.from(this.metrics.entries());
      const toKeep = entries.slice(-500); // Keep last 500
      this.metrics.clear();
      toKeep.forEach(([key, value]) => this.metrics.set(key, value));
    }
  }

  /**
   * Clear all metrics
   */
  reset() {
    this.metrics.clear();
    this.operationCounts.clear();
  }
}

/**
 * Resource Pool for reusing AST-related objects
 */
class ResourcePool {
  constructor() {
    this.pools = new Map();
  }

  /**
   * Get a resource from the pool or create new one
   */
  getResource(type, factory) {
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }

    const pool = this.pools.get(type);
    if (pool.length > 0) {
      return pool.pop();
    }

    return factory();
  }

  /**
   * Return a resource to the pool
   */
  returnResource(type, resource) {
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }

    const pool = this.pools.get(type);
    if (pool.length < 10) {
      // Limit pool size
      // Reset resource if it has a reset method
      if (resource && typeof resource.reset === "function") {
        resource.reset();
      }
      pool.push(resource);
    }
  }

  /**
   * Clear all pools
   */
  clear() {
    this.pools.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const stats = {};
    for (const [type, pool] of this.pools) {
      stats[type] = {
        available: pool.length,
        type: type,
      };
    }
    return stats;
  }
}

// Singleton instances
const memoryManager = new MemoryManager();
const performanceMonitor = new PerformanceMonitor();
const resourcePool = new ResourcePool();

// Graceful shutdown handling
process.on("beforeExit", () => {
  memoryManager.destroy();
  performanceMonitor.reset();
  resourcePool.clear();
});

process.on("SIGINT", () => {
  memoryManager.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  memoryManager.destroy();
  process.exit(0);
});

module.exports = {
  MemoryManager,
  PerformanceMonitor,
  ResourcePool,
  memoryManager,
  performanceMonitor,
  resourcePool,
};
