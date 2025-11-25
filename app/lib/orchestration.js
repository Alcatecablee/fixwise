/**
 * Safe Layer Execution Pattern
 * Sequential layer execution with validation and rollback capability
 * Enhanced with parallel processing support
 */

const { TransformationValidator } = require('./validator');
const { PerformanceOptimizer } = require('./performance');
const { performance } = require('perf_hooks');
const path = require('path');
const fs = require('fs').promises;

/**
 * Executes layers with automatic rollback on failure
 * Each layer is validated before acceptance
 *
 * @param {string} code - The source code to transform
 * @param {number[]} enabledLayers - Array of layer IDs to execute (1-6)
 * @param {Object} options - Execution options
 * @param {boolean} [options.dryRun=false] - If true, don't apply changes
 * @param {boolean} [options.verbose=false] - Enable detailed logging
 * @param {string} [options.filePath=''] - Path to the source file for context
 * @param {boolean} [options.useCache=false] - Enable caching for performance
 * @returns {Promise<Object>} Execution result with finalCode, results, states, and timing
 *
 * @example
 * const result = await executeLayers(sourceCode, [1, 2, 3], {
 *   dryRun: true,
 *   verbose: true
 * });
 * console.log(`Processed with ${result.successfulLayers} successful layers`);
 */
async function executeLayers(
  code,
  enabledLayers,
  options = { dryRun: false, verbose: false, filePath: '', useCache: false }
) {
  let current = code;
  const results = [];
  const states = [code]; // Track all intermediate states
  
  if (options.verbose) {
    console.log(`Starting layer execution for ${enabledLayers.length} layers`);
  }
  
  for (const layerId of enabledLayers) {
    const previous = current;
    const startTime = performance.now();
    
    if (options.verbose) {
      console.log(`Executing Layer ${layerId}...`);
    }
    
    try {
      // Load and execute layer
      const layerPath = getLayerPath(layerId);
      const layerModule = require(layerPath);
      
      // Execute layer transformation
      const layerResult = await executeLayer(layerModule, current, options);
      
      // Validate transformation safety
      const validation = TransformationValidator.validateTransformation(previous, layerResult.code);
      
      if (validation.shouldRevert) {
        console.warn(`Reverting Layer ${layerId}: ${validation.reason}`);
        current = previous; // Rollback to safe state
        
        results.push({
          layerId,
          success: false,
          code: previous,
          executionTime: performance.now() - startTime,
          changeCount: 0,
          revertReason: validation.reason
        });
      } else {
        current = layerResult.code; // Accept changes
        states.push(current);
        
        results.push({
          layerId,
          success: true,
          code: current,
          executionTime: performance.now() - startTime,
          changeCount: calculateChanges(previous, current),
          improvements: layerResult.improvements || [],
          metadata: layerResult.metadata || {}
        });
        
        if (options.verbose) {
          console.log(`Layer ${layerId} completed successfully`);
        }
      }
      
    } catch (error) {
      console.error(`Layer ${layerId} failed:`, error.message);
      
      results.push({
        layerId,
        success: false,
        code: previous, // Keep previous safe state
        executionTime: performance.now() - startTime,
        changeCount: 0,
        error: error.message
      });
    }
  }
  
  return {
    finalCode: current,
    results,
    states,
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    successfulLayers: results.filter(r => r.success).length
  };
}

/**
 * Execute individual layer with proper error handling
 */
async function executeLayer(layerModule, code, options) {
  if (typeof layerModule === 'function') {
    // Simple function export
    const result = await layerModule(code, options);
    return {
      code: result,
      improvements: [],
      metadata: {}
    };
  } else if (layerModule.execute) {
    // Enhanced module with execute method
    return await layerModule.execute(code, options);
  } else {
    throw new Error('Invalid layer module format');
  }
}

/**
 * Get layer script path by ID
 */
function getLayerPath(layerId) {
  const path = require('path');
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

  // Resolve absolute path from current working directory
  return path.resolve(process.cwd(), 'scripts', layerName);
}

/**
 * Calculate number of changes between code versions
 */
function calculateChanges(before, after) {
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
 * Execute layers with comprehensive state tracking
 */
async function executeLayersWithPipeline(code, enabledLayers, options = {}) {
  const pipeline = new TransformationPipeline(code);
  return await pipeline.execute(enabledLayers, options);
}

/**
 * Pipeline State Tracking Implementation
 */
class TransformationPipeline {
  constructor(initialCode) {
    this.states = [];
    this.metadata = [];
    this.initialCode = initialCode;
    
    this.recordState({
      step: 0,
      layerId: null,
      code: initialCode,
      timestamp: Date.now(),
      description: 'Initial state'
    });
  }
  
  async execute(layers, options = {}) {
    let current = this.initialCode;
    
    for (let i = 0; i < layers.length; i++) {
      const layerId = layers[i];
      const startTime = performance.now();
      const previous = current;
      
      try {
        const layerPath = getLayerPath(layerId);
        const layerModule = require(layerPath);
        const result = await executeLayer(layerModule, current, options);
        
        current = result.code;
        
        this.recordState({
          step: i + 1,
          layerId,
          code: current,
          timestamp: Date.now(),
          description: `After Layer ${layerId}`,
          success: true,
          executionTime: performance.now() - startTime,
          changeCount: calculateChanges(previous, current),
          improvements: result.improvements || []
        });
        
        if (options.verbose) {
          console.log(`Layer ${layerId} completed successfully`);
        }
        
      } catch (error) {
        this.recordState({
          step: i + 1,
          layerId,
          code: previous,
          timestamp: Date.now(),
          description: `Layer ${layerId} failed`,
          success: false,
          error: error.message,
          executionTime: performance.now() - startTime
        });
        
        console.error(`Layer ${layerId} failed:`, error.message);
        current = previous; // Keep previous safe state
      }
    }
    
    return this.generateResult(current);
  }
  
  recordState(state) {
    this.states.push(state);
    
    if (state.layerId) {
      this.metadata.push({
        layerId: state.layerId,
        success: state.success || false,
        executionTime: state.executionTime || 0,
        changeCount: state.changeCount || 0,
        error: state.error,
        improvements: state.improvements || []
      });
    }
  }
  
  getStateAt(step) {
    return this.states[step] || null;
  }
  
  rollbackTo(step) {
    const state = this.getStateAt(step);
    if (!state) {
      throw new Error(`Invalid step: ${step}`);
    }
    
    console.log(`Rolling back to step ${step}: ${state.description}`);
    return state.code;
  }
  
  generateResult(finalCode) {
    return {
      finalCode,
      states: this.states,
      metadata: this.metadata,
      summary: {
        totalSteps: this.states.length - 1,
        successfulLayers: this.metadata.filter(m => m.success).length,
        failedLayers: this.metadata.filter(m => !m.success).length,
        totalExecutionTime: this.metadata.reduce((sum, m) => sum + m.executionTime, 0),
        totalChanges: this.metadata.reduce((sum, m) => sum + m.changeCount, 0)
      }
    };
  }
}

/**
 * Execute layers on multiple files with parallel processing
 * Automatically chooses between parallel and sequential processing based on workload
 */
async function executeLayersParallel(
  files,
  enabledLayers,
  options = { dryRun: false, verbose: false, useCache: false, maxWorkers: null }
) {
  if (options.verbose) {
    console.log(`Processing ${files.length} files with layers [${enabledLayers.join(', ')}]`);
  }

  // Determine optimal processing strategy
  const useParallel = shouldUseParallelProcessing(files.length, options);

  if (useParallel && files.length > 1) {
    if (options.verbose) {
      console.log('Using parallel processing for multiple files');
    }

    return await PerformanceOptimizer.executeParallel(files, enabledLayers, {
      ...options,
      maxWorkers: options.maxWorkers || Math.min(4, files.length)
    });
  } else {
    if (options.verbose) {
      console.log('Using sequential processing');
    }

    return await executeFilesSequentially(files, enabledLayers, options);
  }
}

/**
 * Determine if parallel processing should be used
 */
function shouldUseParallelProcessing(fileCount, options) {
  // Use parallel processing if:
  // - More than 3 files
  // - Not explicitly disabled
  // - System has multiple cores
  const os = require('os');
  const cpuCount = os.cpus().length;

  return fileCount > 3 &&
         options.parallel !== false &&
         cpuCount > 1 &&
         !options.sequential;
}

/**
 * Execute files sequentially (fallback method)
 */
async function executeFilesSequentially(files, enabledLayers, options) {
  const results = [];
  const startTime = performance.now();

  for (const filePath of files) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      const result = await executeLayers(code, enabledLayers, {
        ...options,
        filePath
      });

      results.push({
        file: filePath,
        result: {
          success: result.successfulLayers === enabledLayers.length,
          finalCode: result.finalCode,
          layerResults: result.results,
          totalExecutionTime: result.totalExecutionTime
        }
      });

      // Write changes if not dry-run and successful
      if (!options.dryRun && result.successfulLayers > 0) {
        await fs.writeFile(filePath, result.finalCode);
      }

    } catch (error) {
      results.push({
        file: filePath,
        result: {
          success: false,
          error: error.message,
          finalCode: null,
          layerResults: [],
          totalExecutionTime: 0
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
      totalExecutionTime: totalTime,
      averageTimePerFile: totalTime / files.length
    },
    processingMode: 'sequential'
  };
}

/**
 * Memory-aware batch processing for large file sets
 */
async function executeLayersBatch(
  files,
  enabledLayers,
  options = { batchSize: 20, memoryThreshold: 0.8 }
) {
  if (options.verbose) {
    console.log(`Processing ${files.length} files in batches of ${options.batchSize}`);
  }

  // Use memory-aware execution for large batches
  return await PerformanceOptimizer.executeMemoryAware(files, enabledLayers, {
    ...options,
    batchSize: options.batchSize || 20,
    memoryThreshold: options.memoryThreshold || 0.8
  });
}

module.exports = {
  executeLayers,
  executeLayersWithPipeline,
  executeLayersParallel,
  executeLayersBatch,
  TransformationPipeline,
  calculateChanges
};
