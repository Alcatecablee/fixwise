/**
 * Performance Optimization System
 * Caching, monitoring, and optimization strategies for layer execution
 */

const crypto = require('crypto');
const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');

/**
 * Performance optimization strategies for layer execution
 * Includes caching, parallel processing, and smart scheduling
 */
class PerformanceOptimizer {
  
  static cache = new Map();
  static CACHE_SIZE_LIMIT = 500;
  static stats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalExecutions: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0
  };
  
  /**
   * Execute layers with performance optimizations
   */
  static async executeOptimized(
    code, 
    layers, 
    options = {}
  ) {
    const startTime = performance.now();
    this.stats.totalExecutions++;
    
    // Check cache first
    const cacheKey = this.generateCacheKey(code, layers, options);
    if (options.useCache && this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      const cached = this.cache.get(cacheKey);
      
      return {
        result: cached.result,
        fromCache: true,
        executionTime: performance.now() - startTime,
        optimizations: ['cache-hit'],
        cacheStats: this.getCacheStats()
      };
    }
    
    this.stats.cacheMisses++;
    
    // Optimize layer order and selection
    const optimizedLayers = this.optimizeLayerSelection(code, layers);
    
    // Execute with performance monitoring
    const result = await this.executeWithMonitoring(code, optimizedLayers, options);
    
    // Cache successful results
    if (options.useCache && result.success) {
      this.cacheResult(cacheKey, {
        result: result.code,
        metadata: result.metadata,
        timestamp: Date.now()
      });
    }
    
    const totalTime = performance.now() - startTime;
    this.stats.totalExecutionTime += totalTime;
    this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.totalExecutions;
    
    return {
      result: result.code,
      fromCache: false,
      executionTime: totalTime,
      optimizations: result.optimizations,
      layerResults: result.layerResults,
      performanceStats: this.getPerformanceStats()
    };
  }
  
  /**
   * Smart layer selection based on code analysis
   */
  static optimizeLayerSelection(code, requestedLayers) {
    const actuallyNeeded = [];
    
    for (const layerId of requestedLayers) {
      if (this.layerWillMakeChanges(code, layerId)) {
        actuallyNeeded.push(layerId);
      }
    }
    
    // Always include dependencies using the LayerDependencyManager
    try {
      const { LayerDependencyManager } = require('./dependencies');
      const withDependencies = LayerDependencyManager.validateAndCorrectLayers(actuallyNeeded);
      return withDependencies.correctedLayers;
    } catch (error) {
      // Fallback to original layers if dependency manager unavailable
      return actuallyNeeded.length > 0 ? actuallyNeeded : requestedLayers;
    }
  }
  
  /**
   * Predict if a layer will make changes (avoid unnecessary execution)
   */
  static layerWillMakeChanges(code, layerId) {
    switch (layerId) {
      case 1: // Config
        return code.includes('tsconfig') || 
               code.includes('next.config') || 
               code.includes('package.json') ||
               code.includes('"target": "es5"') ||
               code.includes('reactStrictMode: false');
      
      case 2: // Patterns  
        return /&quot;|&amp;|&lt;|&gt;|console\.log|var\s+/.test(code);
      
      case 3: // Components
        return code.includes('map(') && code.includes('<') ||
               code.includes('<img') && !code.includes('alt=') ||
               code.includes('useState') && !code.includes('import { useState') ||
               code.includes('<button') && !code.includes('aria-label');
      
      case 4: // Hydration
        return (code.includes('localStorage') || code.includes('window.') || code.includes('document.')) && 
               !code.includes('typeof window');
      
      case 5: // Next.js
        return code.includes('getInitialProps') ||
               code.includes('getServerSideProps') ||
               (code.includes('use client') && code.indexOf('use client') > 0);
        
      case 6: // Testing
        return code.includes('describe(') || 
               code.includes('test(') || 
               code.includes('it(');
      
      default:
        return true; // Conservative default
    }
  }
  
  /**
   * Execute with performance monitoring and micro-optimizations
   */
  static async executeWithMonitoring(code, layers, options) {
    const results = [];
    const optimizations = [];
    let current = code;
    const layerTimes = {};
    
    // Pre-processing optimizations
    if (options.preProcess) {
      const preProcessStart = performance.now();
      current = this.preProcessCode(current);
      const preProcessTime = performance.now() - preProcessStart;
      optimizations.push(`Pre-processing: ${preProcessTime.toFixed(1)}ms`);
    }
    
    for (const layerId of layers) {
      const layerStart = performance.now();
      
      // Skip if layer won't make changes
      if (options.skipUnnecessary && !this.layerWillMakeChanges(current, layerId)) {
        optimizations.push(`Skipped Layer ${layerId} (no changes needed)`);
        continue;
      }
      
      try {
        const previous = current;
        current = await this.executeLayerOptimized(layerId, current, options);
        
        const layerTime = performance.now() - layerStart;
        layerTimes[layerId] = layerTime;
        
        results.push({
          layerId,
          success: true,
          executionTime: layerTime,
          changeCount: this.calculateChanges(previous, current),
          sizeChange: current.length - previous.length
        });
        
        // Performance warnings
        if (layerTime > 2000) {
          optimizations.push(`Layer ${layerId} was slow (${layerTime.toFixed(0)}ms)`);
        }
        
      } catch (error) {
        const layerTime = performance.now() - layerStart;
        layerTimes[layerId] = layerTime;
        
        results.push({
          layerId,
          success: false,
          executionTime: layerTime,
          error: error.message
        });
        
        optimizations.push(`Layer ${layerId} failed after ${layerTime.toFixed(0)}ms`);
      }
    }
    
    // Post-processing optimizations
    if (options.postProcess) {
      const postProcessStart = performance.now();
      current = this.postProcessCode(current);
      const postProcessTime = performance.now() - postProcessStart;
      optimizations.push(`Post-processing: ${postProcessTime.toFixed(1)}ms`);
    }
    
    return {
      code: current,
      success: results.every(r => r.success),
      layerResults: results,
      optimizations,
      layerTimes,
      metadata: {
        totalLayers: layers.length,
        skippedLayers: layers.length - results.length,
        averageLayerTime: Object.values(layerTimes).reduce((a, b) => a + b, 0) / Object.keys(layerTimes).length
      }
    };
  }
  
  /**
   * Layer execution with micro-optimizations
   */
  static async executeLayerOptimized(layerId, code, options) {
    // Load layer module with caching
    const layerModule = this.getLayerModule(layerId);
    
    // Pre-processing optimizations
    if (options.preProcess) {
      code = this.preProcessCode(code);
    }
    
    // Execute actual layer
    let result;
    if (typeof layerModule === 'function') {
      result = await layerModule(code, options);
    } else if (layerModule.execute) {
      const execResult = await layerModule.execute(code, options);
      result = execResult.code || execResult;
    } else {
      throw new Error(`Invalid layer module format for layer ${layerId}`);
    }
    
    // Post-processing optimizations
    if (options.postProcess) {
      result = this.postProcessCode(result);
    }
    
    return result;
  }
  
  /**
   * Get layer module with caching and hot reloading
   */
  static getLayerModule(layerId) {
    const cacheKey = `layer-module-${layerId}`;
    const path = require('path');
    const fs = require('fs');

    const layerNames = {
      1: 'fix-layer-1-config.js',
      2: 'fix-layer-2-patterns.js',
      3: 'fix-layer-3-components.js',
      4: 'fix-layer-4-hydration.js',
      5: 'fix-layer-5-nextjs.js',
      6: 'fix-layer-6-testing.js'
    };

    const layerName = layerNames[layerId];
    if (!layerName) {
      throw new Error(`Invalid layer ID: ${layerId}`);
    }

    const layerPath = path.resolve(process.cwd(), 'scripts', layerName);

    // Check if we have a cached version and if the file has been modified
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);

      try {
        const stats = fs.statSync(layerPath);
        const fileModTime = stats.mtime.getTime();

        // If file hasn't been modified, return cached version
        if (cached.modTime >= fileModTime) {
          return cached.module;
        }
      } catch (error) {
        // File might not exist, continue to load attempt
      }
    }

    try {
      // Clear module from require cache for hot reloading
      delete require.cache[require.resolve(layerPath)];

      const layerModule = require(layerPath);
      const stats = fs.statSync(layerPath);

      this.cache.set(cacheKey, {
        module: layerModule,
        modTime: stats.mtime.getTime(),
        path: layerPath
      });

      return layerModule;
    } catch (error) {
      throw new Error(`Failed to load layer ${layerId}: ${error.message}`);
    }
  }
  
  /**
   * Pre-processing optimizations
   */
  static preProcessCode(code) {
    // Normalize line endings
    code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove excessive whitespace at end of lines
    code = code.replace(/[ \t]+$/gm, '');
    
    // Normalize multiple blank lines
    code = code.replace(/\n{3,}/g, '\n\n');
    
    return code;
  }
  
  /**
   * Post-processing optimizations
   */
  static postProcessCode(code) {
    // Ensure file ends with newline
    if (!code.endsWith('\n')) {
      code += '\n';
    }
    
    // Remove trailing whitespace
    code = code.replace(/[ \t]+$/gm, '');
    
    return code;
  }
  
  /**
   * Calculate changes between code versions
   */
  static calculateChanges(before, after) {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    let changes = Math.abs(beforeLines.length - afterLines.length);
    
    const minLength = Math.min(beforeLines.length, afterLines.length);
    for (let i = 0; i < minLength; i++) {
      if (beforeLines[i] !== afterLines[i]) {
        changes++;
      }
    }
    
    return changes;
  }
  
  /**
   * Advanced cache management with TTL and priority
   */
  static cacheResult(key, result, options = {}) {
    const now = Date.now();
    const ttl = options.ttl || (30 * 60 * 1000); // 30 minutes default
    const priority = options.priority || 'normal'; // low, normal, high

    // Enhanced cache entry with metadata
    const cacheEntry = {
      ...result,
      metadata: {
        ...result.metadata,
        cached: now,
        expires: now + ttl,
        priority,
        accessCount: 0,
        lastAccessed: now,
        size: JSON.stringify(result.result || '').length
      }
    };

    // Check if cache is full and needs cleanup
    if (this.cache.size >= this.CACHE_SIZE_LIMIT) {
      this.intelligentCacheEviction();
    }

    this.cache.set(key, cacheEntry);

    // Update access count for existing entry
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      entry.metadata.accessCount++;
      entry.metadata.lastAccessed = now;
    }
  }

  /**
   * Intelligent cache eviction strategy
   */
  static intelligentCacheEviction() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries first
    let removedExpired = 0;
    for (const [key, value] of entries) {
      if (value.metadata && value.metadata.expires < now) {
        this.cache.delete(key);
        removedExpired++;
      }
    }

    // If still over limit, use LRU with priority consideration
    if (this.cache.size >= this.CACHE_SIZE_LIMIT) {
      const remainingEntries = Array.from(this.cache.entries())
        .map(([key, value]) => {
          const priority = value.metadata?.priority || 'normal';
          const priorityWeight = priority === 'high' ? 3 : priority === 'normal' ? 2 : 1;
          const accessFrequency = (value.metadata?.accessCount || 0) /
            Math.max(1, (now - (value.metadata?.cached || now)) / (24 * 60 * 60 * 1000)); // per day
          const recency = now - (value.metadata?.lastAccessed || 0);

          // Score based on priority, frequency, and recency
          const score = (priorityWeight * 10) + (accessFrequency * 5) - (recency / (60 * 60 * 1000));

          return { key, score };
        })
        .sort((a, b) => a.score - b.score); // Sort by score, lowest first

      // Remove lowest scoring entries
      const toRemove = Math.floor(this.CACHE_SIZE_LIMIT * 0.3); // Remove 30%
      for (let i = 0; i < toRemove && i < remainingEntries.length; i++) {
        this.cache.delete(remainingEntries[i].key);
      }
    }
  }
  
  /**
   * Generate optimized cache key with hierarchical structure
   */
  static generateCacheKey(code, layers, options = {}) {
    // Create hierarchical cache key for better cache organization
    const codeHash = this.simpleHash(code);
    const layerKey = layers.sort().join(',');

    // Include relevant options in cache key
    const relevantOptions = {
      preProcess: options.preProcess || false,
      postProcess: options.postProcess || false,
      skipUnnecessary: options.skipUnnecessary || false,
      dryRun: options.dryRun || false
    };

    const optionsKey = this.simpleHash(JSON.stringify(relevantOptions));

    // Add content type detection for better cache segmentation
    const contentType = this.detectContentType(code);

    return `${contentType}:${layerKey}:${codeHash}:${optionsKey}`;
  }

  /**
   * Detect content type for cache segmentation
   */
  static detectContentType(code) {
    if (code.includes('tsconfig') || code.includes('next.config')) {
      return 'config';
    } else if (code.includes('import React') || code.includes('useState')) {
      return 'react';
    } else if (code.includes('describe(') || code.includes('test(')) {
      return 'test';
    } else if (code.includes('export') || code.includes('import')) {
      return 'module';
    } else {
      return 'code';
    }
  }
  
  /**
   * Optimized hash function with collision resistance
   */
  static simpleHash(str) {
    // Use SHA-256 for better collision resistance, truncated for performance
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 12);
  }
  
  /**
   * Enhanced cache statistics with detailed analytics
   */
  static getCacheStats() {
    const hitRate = this.stats.totalExecutions > 0
      ? (this.stats.cacheHits / this.stats.totalExecutions) * 100
      : 0;

    const now = Date.now();
    let totalSize = 0;
    let expiredEntries = 0;
    const priorityDistribution = { high: 0, normal: 0, low: 0 };

    for (const [key, value] of this.cache.entries()) {
      if (value.metadata) {
        totalSize += value.metadata.size || 0;
        if (value.metadata.expires && value.metadata.expires < now) {
          expiredEntries++;
        }
        const priority = value.metadata.priority || 'normal';
        priorityDistribution[priority]++;
      }
    }

    return {
      size: this.cache.size,
      limit: this.CACHE_SIZE_LIMIT,
      hits: this.stats.cacheHits,
      misses: this.stats.cacheMisses,
      hitRate: hitRate.toFixed(1) + '%',
      totalExecutions: this.stats.totalExecutions,
      utilization: ((this.cache.size / this.CACHE_SIZE_LIMIT) * 100).toFixed(1) + '%',
      totalSizeBytes: totalSize,
      averageEntrySize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0,
      expiredEntries,
      priorityDistribution,
      efficiency: {
        memoryEfficiency: this.cache.size > 0 ? (this.stats.cacheHits / this.cache.size).toFixed(2) : 0,
        timeEfficiency: this.stats.averageExecutionTime || 0
      }
    };
  }
  
  /**
   * Enhanced performance statistics with trends
   */
  static getPerformanceStats() {
    const cacheStats = this.getCacheStats();
    const systemInfo = {
      cpuCount: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    };

    return {
      execution: {
        totalExecutions: this.stats.totalExecutions,
        totalExecutionTime: this.stats.totalExecutionTime,
        averageExecutionTime: this.stats.averageExecutionTime.toFixed(1) + 'ms',
        executionsPerSecond: this.stats.totalExecutionTime > 0
          ? ((this.stats.totalExecutions / (this.stats.totalExecutionTime / 1000)).toFixed(2))
          : 0
      },
      cache: cacheStats,
      system: systemInfo,
      recommendations: this.getPerformanceRecommendations()
    };
  }
  
  /**
   * Advanced cache clearing with predictive cleanup
   */
  static clearCache(strategy = 'all', options = {}) {
    const now = Date.now();
    const preservePriority = options.preservePriority || 'high';

    switch (strategy) {
      case 'all':
        this.cache.clear();
        break;

      case 'lru':
        // Enhanced LRU with access frequency consideration
        const entries = Array.from(this.cache.entries())
          .map(([key, value]) => ({
            key,
            priority: value.metadata?.priority || 'normal',
            lastAccessed: value.metadata?.lastAccessed || 0,
            accessCount: value.metadata?.accessCount || 0,
            score: this.calculateEvictionScore(value, now)
          }))
          .sort((a, b) => a.score - b.score);

        const toRemove = Math.floor(entries.length * (options.ratio || 0.5));
        for (let i = 0; i < toRemove; i++) {
          // Skip high priority items if preserve option is set
          if (preservePriority === 'high' && entries[i].priority === 'high') {
            continue;
          }
          this.cache.delete(entries[i].key);
        }
        break;

      case 'size-based':
        // Remove largest cached items first, considering priority
        const sortedEntries = Array.from(this.cache.entries())
          .map(([key, value]) => ({
            key,
            size: value.metadata?.size || JSON.stringify(value.result || '').length,
            priority: value.metadata?.priority || 'normal'
          }))
          .sort((a, b) => {
            // Sort by priority first (low priority first), then by size (largest first)
            const priorityOrder = { low: 0, normal: 1, high: 2 };
            if (a.priority !== b.priority) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.size - a.size;
          });

        const targetSize = Math.floor(this.CACHE_SIZE_LIMIT * (options.targetRatio || 0.7));
        let removed = 0;
        for (const entry of sortedEntries) {
          if (this.cache.size <= targetSize) break;
          this.cache.delete(entry.key);
          removed++;
        }
        break;

      case 'time-based':
        // Enhanced time-based cleanup with TTL consideration
        const threshold = options.maxAge || (30 * 60 * 1000); // 30 minutes default
        let removedExpired = 0;

        for (const [key, value] of this.cache.entries()) {
          const shouldRemove = (
            (value.metadata?.expires && value.metadata.expires < now) ||
            (value.timestamp && (now - value.timestamp) > threshold) ||
            (value.metadata?.cached && (now - value.metadata.cached) > threshold)
          );

          if (shouldRemove && (preservePriority !== 'high' || value.metadata?.priority !== 'high')) {
            this.cache.delete(key);
            removedExpired++;
          }
        }
        break;

      case 'layer-specific':
        // Remove cache entries for specific layers or types
        const targetLayers = options.layers || [];
        const targetTypes = options.types || ['layer-module'];

        for (const [key, value] of this.cache.entries()) {
          const shouldRemove = targetTypes.some(type => key.includes(type)) ||
            targetLayers.some(layer => key.includes(`layer-${layer}`));

          if (shouldRemove) {
            this.cache.delete(key);
          }
        }
        break;

      case 'smart':
        // AI-driven intelligent clearing based on comprehensive analytics
        const analytics = this.analyzeCachePerformance();
        const systemMemory = this.getSystemMemoryPressure();

        if (analytics.hitRate < 10 || systemMemory > 0.9) {
          // Aggressive cleanup for poor performance or high memory pressure
          this.cache.clear();
        } else if (analytics.hitRate < 30 || systemMemory > 0.8) {
          // Moderate cleanup
          this.clearCache('size-based', { targetRatio: 0.5 });
        } else if (analytics.memoryPressure > 80) {
          // Cache-specific memory pressure
          this.clearCache('lru', { ratio: 0.3, preservePriority: 'high' });
        } else {
          // Light cleanup of expired items
          this.clearCache('time-based', { preservePriority: 'high' });
        }
        break;

      case 'predictive':
        // Predictive cleanup based on usage patterns
        this.predictiveCleanup();
        break;

      default:
        this.cache.clear();
    }

    // Reset stats only for complete clears
    if (strategy === 'all') {
      this.resetStats();
    }
  }

  /**
   * Calculate eviction score for cache entries
   */
  static calculateEvictionScore(cacheEntry, currentTime) {
    const metadata = cacheEntry.metadata || {};
    const age = currentTime - (metadata.cached || currentTime);
    const timeSinceAccess = currentTime - (metadata.lastAccessed || currentTime);
    const accessFrequency = (metadata.accessCount || 0) / Math.max(1, age / (24 * 60 * 60 * 1000));
    const priorityWeight = metadata.priority === 'high' ? 3 : metadata.priority === 'normal' ? 2 : 1;

    // Lower score = higher eviction priority
    return (priorityWeight * 1000) + (accessFrequency * 100) - (timeSinceAccess / 1000);
  }

  /**
   * Get system memory pressure
   */
  static getSystemMemoryPressure() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return (totalMemory - freeMemory) / totalMemory;
  }

  /**
   * Predictive cleanup based on usage patterns
   */
  static predictiveCleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Analyze access patterns to predict future usage
    const predictions = entries.map(([key, value]) => {
      const metadata = value.metadata || {};
      const age = now - (metadata.cached || now);
      const accessCount = metadata.accessCount || 0;
      const timeSinceLastAccess = now - (metadata.lastAccessed || now);

      // Simple prediction: likelihood of future access
      const accessRate = accessCount / Math.max(1, age / (60 * 60 * 1000)); // per hour
      const recencyFactor = Math.exp(-timeSinceLastAccess / (24 * 60 * 60 * 1000)); // decay over days
      const predictionScore = accessRate * recencyFactor;

      return { key, predictionScore, priority: metadata.priority || 'normal' };
    });

    // Remove entries with low prediction scores
    const threshold = 0.1; // Configurable threshold
    predictions
      .filter(p => p.predictionScore < threshold && p.priority !== 'high')
      .forEach(p => this.cache.delete(p.key));
  }

  /**
   * Reset performance statistics
   */
  static resetStats() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Analyze cache performance for smart clearing decisions
   */
  static analyzeCachePerformance() {
    const hitRate = this.stats.totalExecutions > 0
      ? (this.stats.cacheHits / this.stats.totalExecutions) * 100
      : 0;

    const memoryPressure = (this.cache.size / this.CACHE_SIZE_LIMIT) * 100;

    // Calculate average item size
    let totalSize = 0;
    let itemCount = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.result) {
        totalSize += value.result.length;
        itemCount++;
      }
    }
    const averageItemSize = itemCount > 0 ? totalSize / itemCount : 0;

    return {
      hitRate,
      memoryPressure,
      averageItemSize,
      totalCachedItems: this.cache.size,
      recommendation: this.getCacheRecommendation(hitRate, memoryPressure)
    };
  }

  /**
   * Get cache management recommendations
   */
  static getCacheRecommendation(hitRate, memoryPressure) {
    if (hitRate < 20 && memoryPressure > 50) {
      return 'clear-all';
    } else if (memoryPressure > 80) {
      return 'size-based-cleanup';
    } else if (hitRate > 60 && memoryPressure < 70) {
      return 'increase-cache-size';
    } else if (hitRate < 40) {
      return 'lru-cleanup';
    } else {
      return 'maintain-current';
    }
  }

  /**
   * Auto-manage cache based on performance metrics
   */
  static autoManageCache() {
    const analytics = this.analyzeCachePerformance();

    switch (analytics.recommendation) {
      case 'clear-all':
        this.clearCache('all');
        break;
      case 'size-based-cleanup':
        this.clearCache('size-based');
        break;
      case 'lru-cleanup':
        this.clearCache('lru');
        break;
      case 'increase-cache-size':
        const currentMemoryPressure = this.getSystemMemoryPressure();
        if (this.CACHE_SIZE_LIMIT < 2000 && currentMemoryPressure < 0.7) {
          const newSize = Math.min(2000, Math.floor(this.CACHE_SIZE_LIMIT * 1.5));
          this.CACHE_SIZE_LIMIT = newSize;

          // Warm cache proactively when increasing size
          this.warmCache().catch(err => {
            console.warn('Cache warming failed after size increase:', err.message);
          });
        }
        break;
    }

    return analytics;
  }
  
  /**
   * Optimize for specific workload patterns
   */
  static optimizeForWorkload(workloadType) {
    switch (workloadType) {
      case 'batch':
        // Optimize for processing many files
        this.CACHE_SIZE_LIMIT = 1000;
        break;
      case 'interactive':
        // Optimize for single file processing
        this.CACHE_SIZE_LIMIT = 100;
        break;
      case 'memory-constrained':
        // Optimize for low memory usage
        this.CACHE_SIZE_LIMIT = 50;
        this.clearCache();
        break;
      case 'high-throughput':
        // Optimize for maximum throughput
        this.CACHE_SIZE_LIMIT = 2000;
        this.warmCache();
        break;
      case 'low-latency':
        // Optimize for minimal response time
        this.CACHE_SIZE_LIMIT = 200;
        this.warmCache();
        break;
    }
  }
  
  /**
   * Parallel processing for multiple files
   * Distributes workload across worker threads for optimal performance
   */
  static async executeParallel(
    files,
    layers,
    options = {}
  ) {
    const startTime = performance.now();
    const maxWorkers = options.maxWorkers || Math.min(os.cpus().length, files.length, 4);
    const chunkSize = Math.ceil(files.length / maxWorkers);
    const chunks = [];

    // Divide files into chunks for parallel processing
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }

    if (options.verbose) {
      console.log(`Processing ${files.length} files using ${chunks.length} workers`);
    }

    const promises = chunks.map((chunk, index) =>
      this.processChunkInWorker(chunk, layers, {
        ...options,
        workerId: index
      })
    );

    try {
      const results = await Promise.all(promises);
      const mergedResults = this.mergeParallelResults(results);

      const totalTime = performance.now() - startTime;

      return {
        ...mergedResults,
        parallelProcessing: {
          workers: chunks.length,
          totalFiles: files.length,
          totalTime,
          averageTimePerFile: totalTime / files.length,
          parallelSpeedup: this.calculateSpeedup(files.length, chunks.length, totalTime)
        }
      };
    } catch (error) {
      console.error('Parallel processing failed:', error.message);

      // Fallback to sequential processing
      if (options.verbose) {
        console.log('Falling back to sequential processing...');
      }

      return await this.executeSequential(files, layers, options);
    }
  }

  /**
   * Process a chunk of files in a worker thread
   */
  static async processChunkInWorker(chunk, layers, options) {
    return new Promise((resolve, reject) => {
      const workerScript = this.createWorkerScript();
      const worker = new Worker(workerScript, {
        workerData: {
          chunk,
          layers,
          options
        }
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(`Worker ${options.workerId} timed out`));
      }, options.workerTimeout || 30000);

      worker.on('message', (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Create worker script for parallel processing
   */
  static createWorkerScript() {
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const path = require('path');

      async function processFiles() {
        try {
          const { chunk, layers, options } = workerData;
          const results = [];

          // Load the orchestration system
          const fixMasterPath = path.resolve(process.cwd(), '../fix-master.js');
          const { runNeuroLint } = require(fixMasterPath);

          for (const filePath of chunk) {
            const result = await runNeuroLint(filePath, {
              ...options,
              singleFile: true
            });
            results.push({
              file: filePath,
              result
            });
          }

          parentPort.postMessage({
            success: true,
            results,
            workerId: options.workerId
          });
        } catch (error) {
          parentPort.postMessage({
            success: false,
            error: error.message,
            workerId: options.workerId
          });
        }
      }

      processFiles();
    `;

    // Write worker script to temporary file
    const fs = require('fs');
    const tempPath = path.join(os.tmpdir(), `neurolint-worker-${Date.now()}.js`);
    fs.writeFileSync(tempPath, workerCode);

    return tempPath;
  }

  /**
   * Merge results from parallel workers
   */
  static mergeParallelResults(workerResults) {
    const allResults = [];
    const allErrors = [];
    let totalExecutionTime = 0;
    let successfulFiles = 0;

    for (const workerResult of workerResults) {
      if (workerResult.success) {
        allResults.push(...workerResult.results);
        successfulFiles += workerResult.results.filter(r => r.result.success).length;
      } else {
        allErrors.push({
          workerId: workerResult.workerId,
          error: workerResult.error
        });
      }
    }

    return {
      success: allErrors.length === 0,
      results: allResults,
      summary: {
        totalFiles: allResults.length,
        successfulFiles,
        totalExecutionTime,
        workerErrors: allErrors
      }
    };
  }

  /**
   * Calculate parallel processing speedup
   */
  static calculateSpeedup(totalFiles, workerCount, actualTime) {
    // Estimate sequential time based on average file processing time
    const estimatedSequentialTime = actualTime * workerCount;
    const speedup = estimatedSequentialTime / actualTime;

    return {
      theoretical: workerCount,
      actual: speedup.toFixed(2),
      efficiency: ((speedup / workerCount) * 100).toFixed(1) + '%'
    };
  }

  /**
   * Sequential fallback processing
   */
  static async executeSequential(files, layers, options) {
    const results = [];
    const startTime = performance.now();

    for (const filePath of files) {
      try {
        const { runNeuroLint } = require(path.resolve(process.cwd(), 'fix-master.js'));
        const result = await runNeuroLint(filePath, {
          ...options,
          singleFile: true
        });

        results.push({
          file: filePath,
          result
        });
      } catch (error) {
        results.push({
          file: filePath,
          result: {
            success: false,
            error: error.message
          }
        });
      }
    }

    const totalTime = performance.now() - startTime;

    return {
      success: results.every(r => r.result.success),
      results,
      summary: {
        totalFiles: files.length,
        successfulFiles: results.filter(r => r.result.success).length,
        totalExecutionTime: totalTime
      },
      processingMode: 'sequential'
    };
  }

  /**
   * Advanced cache warming strategies
   */
  static async warmCache(patterns = []) {
    const warmingStrategies = {
      'common-patterns': [
        'import React from "react";',
        'const [state, setState] = useState();',
        'useEffect(() => {}, []);',
        'localStorage.getItem("key");',
        '.map(item => <div>{item}</div>)'
      ],
      'config-files': [
        '{ "compilerOptions": { "target": "es5" } }',
        'module.exports = { reactStrictMode: false }'
      ],
      'user-patterns': patterns
    };

    const allPatterns = [
      ...warmingStrategies['common-patterns'],
      ...warmingStrategies['config-files'],
      ...warmingStrategies['user-patterns']
    ];

    const warmingPromises = allPatterns.map(async (pattern, index) => {
      const cacheKey = this.generateCacheKey(pattern, [1, 2, 3, 4, 5, 6]);

      if (!this.cache.has(cacheKey)) {
        try {
          // Pre-process pattern to warm the cache
          const result = await this.executeOptimized(pattern, [1, 2, 3, 4, 5, 6], {
            useCache: true,
            skipUnnecessary: true,
            warmingMode: true
          });

          if (result.result) {
            this.cacheResult(cacheKey, {
              result: result.result,
              metadata: { warmed: true, pattern: index },
              timestamp: Date.now()
            });
          }
        } catch (error) {
          // Silently fail during cache warming
        }
      }
    });

    await Promise.allSettled(warmingPromises);

    return {
      patternsWarmed: allPatterns.length,
      cacheSize: this.cache.size,
      warmingComplete: true
    };
  }

  /**
   * Intelligent cache preloading based on project analysis
   */
  static async intelligentCachePreload(projectPath) {
    const fs = require('fs').promises;
    const patterns = new Set();

    try {
      // Analyze project structure for common patterns
      const analysisResults = await this.analyzeProjectPatterns(projectPath);

      // Extract common code patterns for cache warming
      analysisResults.commonImports.forEach(imp => patterns.add(imp));
      analysisResults.commonComponents.forEach(comp => patterns.add(comp));
      analysisResults.configPatterns.forEach(cfg => patterns.add(cfg));

      // Warm cache with discovered patterns
      return await this.warmCache(Array.from(patterns));
    } catch (error) {
      console.warn('Intelligent cache preloading failed:', error.message);
      return await this.warmCache();
    }
  }

  /**
   * Analyze project for common patterns
   */
  static async analyzeProjectPatterns(projectPath) {
    const fs = require('fs').promises;
    const glob = require('fast-glob');

    const commonImports = new Set();
    const commonComponents = new Set();
    const configPatterns = new Set();

    try {
      const files = await glob(['**/*.{js,jsx,ts,tsx}'], {
        cwd: projectPath,
        ignore: ['node_modules/**', 'build/**', 'dist/**']
      });

      const sampleSize = Math.min(files.length, 20); // Analyze up to 20 files
      const sampleFiles = files.slice(0, sampleSize);

      for (const file of sampleFiles) {
        try {
          const content = await fs.readFile(path.join(projectPath, file), 'utf-8');

          // Extract import patterns
          const importMatches = content.match(/import.*from.*['"].*['"]/g) || [];
          importMatches.slice(0, 3).forEach(imp => commonImports.add(imp));

          // Extract component patterns
          const componentMatches = content.match(/(?:function|const)\s+\w+.*=>.*<\w+/g) || [];
          componentMatches.slice(0, 2).forEach(comp => commonComponents.add(comp.substring(0, 100)));

          // Extract config patterns
          if (file.includes('config') || file.includes('tsconfig')) {
            const configLines = content.split('\n').slice(0, 5);
            configLines.forEach(line => {
              if (line.trim() && line.includes(':')) {
                configPatterns.add(line.trim());
              }
            });
          }
        } catch (error) {
          // Skip problematic files
        }
      }
    } catch (error) {
      console.warn('Project pattern analysis failed:', error.message);
    }

    return {
      commonImports: Array.from(commonImports),
      commonComponents: Array.from(commonComponents),
      configPatterns: Array.from(configPatterns)
    };
  }

  /**
   * Adaptive cache sizing based on system resources
   */
  static adaptiveCacheSizing() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = process.memoryUsage();

    const memoryPressure = (totalMemory - freeMemory) / totalMemory;
    const heapUsage = memoryUsage.heapUsed / memoryUsage.heapTotal;

    let recommendedCacheSize;

    if (memoryPressure > 0.9 || heapUsage > 0.8) {
      // High memory pressure - reduce cache
      recommendedCacheSize = Math.max(50, this.CACHE_SIZE_LIMIT * 0.5);
    } else if (memoryPressure < 0.5 && heapUsage < 0.5) {
      // Low memory pressure - increase cache
      recommendedCacheSize = Math.min(2000, this.CACHE_SIZE_LIMIT * 1.5);
    } else {
      // Normal memory pressure - maintain current
      recommendedCacheSize = this.CACHE_SIZE_LIMIT;
    }

    if (recommendedCacheSize !== this.CACHE_SIZE_LIMIT) {
      this.CACHE_SIZE_LIMIT = recommendedCacheSize;

      // Trim cache if it's now too large
      if (this.cache.size > this.CACHE_SIZE_LIMIT) {
        this.clearCache('lru');
      }
    }

    return {
      previousSize: this.CACHE_SIZE_LIMIT,
      newSize: recommendedCacheSize,
      memoryPressure: (memoryPressure * 100).toFixed(1) + '%',
      heapUsage: (heapUsage * 100).toFixed(1) + '%',
      recommendation: recommendedCacheSize > this.CACHE_SIZE_LIMIT ? 'increase' : 'decrease'
    };
  }

  /**
   * Get performance recommendations
   */
  static getPerformanceRecommendations() {
    const recommendations = [];
    const hitRate = this.stats.totalExecutions > 0 
      ? (this.stats.cacheHits / this.stats.totalExecutions) * 100 
      : 0;
    
    if (hitRate < 20) {
      recommendations.push({
        type: 'caching',
        message: 'Low cache hit rate detected',
        suggestion: 'Enable caching with --use-cache flag for repeated operations'
      });
    }
    
    if (this.stats.averageExecutionTime > 5000) {
      recommendations.push({
        type: 'performance',
        message: 'Slow execution times detected',
        suggestion: 'Use --skip-unnecessary flag to avoid redundant layer executions'
      });
    }
    
    if (this.cache.size === this.CACHE_SIZE_LIMIT) {
      recommendations.push({
        type: 'memory',
        message: 'Cache limit reached',
        suggestion: 'Consider increasing cache size or clearing cache periodically'
      });
    }
    
    return recommendations;
  }

  /**
   * Benchmark different execution strategies
   */
  static async benchmarkStrategies(testCode, layers, iterations = 3) {
    const strategies = {
      sequential: async () => {
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          await this.executeOptimized(testCode, layers, { useCache: false });
        }
        return performance.now() - startTime;
      },

      cached: async () => {
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          await this.executeOptimized(testCode, layers, { useCache: true });
        }
        return performance.now() - startTime;
      },

      optimized: async () => {
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          await this.executeOptimized(testCode, layers, {
            useCache: true,
            skipUnnecessary: true,
            preProcess: true,
            postProcess: true
          });
        }
        return performance.now() - startTime;
      }
    };

    const results = {};

    for (const [strategy, executor] of Object.entries(strategies)) {
      try {
        const time = await executor();
        results[strategy] = {
          totalTime: time,
          averageTime: time / iterations,
          iterationsPerSecond: (iterations / (time / 1000)).toFixed(2)
        };
      } catch (error) {
        results[strategy] = {
          error: error.message
        };
      }
    }

    // Calculate relative performance
    const baseline = results.sequential?.totalTime || 1;
    Object.keys(results).forEach(strategy => {
      if (results[strategy].totalTime) {
        results[strategy].speedup = (baseline / results[strategy].totalTime).toFixed(2) + 'x';
      }
    });

    return results;
  }

  /**
   * Memory-aware execution strategy
   */
  static async executeMemoryAware(files, layers, options = {}) {
    const memoryThreshold = options.memoryThreshold || 0.8; // 80% of available memory
    const batchSize = options.batchSize || 10;

    const checkMemory = () => {
      const memoryUsage = process.memoryUsage();
      return memoryUsage.heapUsed / memoryUsage.heapTotal;
    };

    const results = [];
    const batches = [];

    // Create batches
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      // Check memory before processing batch
      const memoryUsage = checkMemory();

      if (memoryUsage > memoryThreshold) {
        // High memory usage - force garbage collection and clear cache
        if (global.gc) {
          global.gc();
        }
        this.clearCache('lru');

        if (options.verbose) {
          console.log(`Memory pressure detected (${(memoryUsage * 100).toFixed(1)}%), cleared cache`);
        }
      }

      // Process batch
      try {
        const batchResult = await this.executeParallel(batch, layers, {
          ...options,
          maxWorkers: Math.min(2, batch.length) // Limit workers when memory constrained
        });

        results.push(...batchResult.results);

        if (options.verbose) {
          console.log(`Completed batch ${batchIndex + 1}/${batches.length}`);
        }
      } catch (error) {
        console.error(`Batch ${batchIndex + 1} failed:`, error.message);

        // Fallback to sequential processing for this batch
        const fallbackResult = await this.executeSequential(batch, layers, options);
        results.push(...fallbackResult.results);
      }
    }

    return {
      success: results.every(r => r.result.success),
      results,
      summary: {
        totalFiles: files.length,
        batchesProcessed: batches.length,
        successfulFiles: results.filter(r => r.result.success).length
      }
    };
  }
}

module.exports = { PerformanceOptimizer };
