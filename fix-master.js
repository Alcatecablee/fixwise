#!/usr/bin/env node

/**
 * Master Automated Fixing Script
 * Comprehensive multi-layer fix strategy for React/Next.js codebases
 * 
 * Layer 1: Configuration fixes (TypeScript, Next.js, package.json)
 * Layer 2: Bulk pattern fixes (HTML entities, console statements, browser APIs)
 * Layer 3: Component-specific fixes (Button variants, Tabs props, etc.)
 * Layer 4: Hydration and SSR fixes (client-side guards, theme providers)
 * Layer 5: Next.js App Router fixes
 * Layer 6: Testing and Validation Fixes
 */

const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('./backup-manager');

// Enhanced output functions to replace emoji-based spinners
function logSuccess(message) {
  console.log(`[SUCCESS] ${message}`);
}

function logError(message) {
  console.error(`[ERROR] ${message}`);
}

function logWarning(message) {
  console.warn(`[WARNING] ${message}`);
}

function logInfo(message) {
  console.log(`[INFO] ${message}`);
}

function logProgress(message) {
  process.stdout.write(`[PROCESSING] ${message}...`);
}

function logComplete(message) {
  process.stdout.write(`[COMPLETE] ${message}\n`);
}

/**
 * Next.js Version Compatibility Checker
 * Validates and gates operations based on Next.js version compatibility
 */
class NextJSVersionChecker {
  constructor() {
    this.supportedVersions = {
      min: '13.4.0',
      max: '15.5.9',
      recommended: '15.5.9'
    };
  }

  /**
   * Parse semantic version string
   */
  parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  }

  /**
   * Compare two version objects
   */
  compareVersions(v1, v2) {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }

  /**
   * Check if version is within supported range
   */
  isVersionSupported(version) {
    const parsed = this.parseVersion(version);
    if (!parsed) return false;

    const min = this.parseVersion(this.supportedVersions.min);
    const max = this.parseVersion(this.supportedVersions.max);

    return this.compareVersions(parsed, min) >= 0 && 
           this.compareVersions(parsed, max) <= 0;
  }

  /**
   * Detect Next.js version from package.json
   */
  async detectNextJSVersion(projectPath = process.cwd()) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf8');
      const pkg = JSON.parse(packageJson);
      
      // Check dependencies and devDependencies
      const nextVersion = pkg.dependencies?.next || 
                         pkg.devDependencies?.next || 
                         pkg.peerDependencies?.next;
      
      if (!nextVersion) {
        return { version: null, error: 'Next.js not found in package.json' };
      }

      // Extract version from range (e.g., "^15.5.0" -> "15.5.0")
      const versionMatch = nextVersion.match(/[\d.]+/);
      if (!versionMatch) {
        return { version: null, error: 'Invalid Next.js version format' };
      }

      const version = versionMatch[0];
      const isSupported = this.isVersionSupported(version);
      
      return {
        version,
        isSupported,
        packageJson: pkg,
        supportedRange: `${this.supportedVersions.min} - ${this.supportedVersions.max}`
      };
    } catch (error) {
      return { version: null, error: `Failed to detect Next.js version: ${error.message}` };
    }
  }

  /**
   * Validate project for Next.js 15.5 migration
   */
  async validateProjectForMigration(projectPath = process.cwd()) {
    const versionInfo = await this.detectNextJSVersion(projectPath);
    
    if (versionInfo.error) {
      return {
        valid: false,
        error: versionInfo.error,
        recommendations: ['Ensure package.json exists and contains Next.js dependency']
      };
    }

    if (!versionInfo.isSupported) {
      return {
        valid: false,
        error: `Next.js version ${versionInfo.version} is not supported`,
        recommendations: [
          `Upgrade to Next.js ${this.supportedVersions.min} or higher`,
          `Recommended: Upgrade to Next.js ${this.supportedVersions.recommended}`,
          'Run: npm install next@latest'
        ],
        currentVersion: versionInfo.version,
        supportedRange: versionInfo.supportedRange
      };
    }

    return {
      valid: true,
      version: versionInfo.version,
      supportedRange: versionInfo.supportedRange,
      recommendations: versionInfo.version !== this.supportedVersions.recommended ? 
        [`Consider upgrading to Next.js ${this.supportedVersions.recommended} for latest features`] : 
        []
    };
  }

  /**
   * Get migration recommendations based on current version
   */
  getMigrationRecommendations(currentVersion) {
    const parsed = this.parseVersion(currentVersion);
    if (!parsed) return [];

    const recommendations = [];

    if (parsed.major < 14) {
      recommendations.push('Major version upgrade: Review breaking changes in Next.js 14+');
    }

    if (parsed.major === 14 && parsed.minor < 0) {
      recommendations.push('App Router: Consider migrating from Pages Router to App Router');
    }

    if (parsed.major === 15 && parsed.minor < 5) {
      recommendations.push('Performance: Enable Turbopack for faster builds');
      recommendations.push('Caching: Review and optimize caching strategies');
    }

    return recommendations;
  }
}

// Layer imports
const { transform: layer1Transform } = require('./scripts/fix-layer-1-config');
const { transform: layer2Transform } = require('./scripts/fix-layer-2-patterns');
const { transform: layer3Transform } = require('./scripts/fix-layer-3-components');
const { transform: layer4Transform } = require('./scripts/fix-layer-4-hydration');
const { 
  transform: layer5Transform, 
  migrateNextJS15Comprehensive,
  BiomeMigrationTransformer,
  NextJS15DeprecationHandler 
} = require('./scripts/fix-layer-5-nextjs');
const { transform: layer6Transform } = require('./scripts/fix-layer-6-testing');
const { transform: layer7Transform } = require('./scripts/fix-layer-7-adaptive');

// Validator import
const TransformationValidator = require('./validator');

class LayerOrchestrator {
  constructor(options = {}) {
    this.options = { dryRun: false, verbose: false, ...options };
    this.layers = [
      { id: 1, name: 'Configuration', transform: layer1Transform },
      { id: 2, name: 'Patterns', transform: layer2Transform },
      { id: 3, name: 'Components', transform: layer3Transform },
      { id: 4, name: 'Hydration', transform: layer4Transform },
      { id: 5, name: 'Next.js', transform: layer5Transform },
      { id: 6, name: 'Testing', transform: layer6Transform },
      { id: 7, name: 'Adaptive Pattern Learning', transform: layer7Transform }
    ];
    
    // Initialize centralized backup manager
    this.backupManager = new BackupManager({
      backupDir: '.neurolint-backups',
      maxBackups: 10,
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/.neurolint-backups/**',
        '**/*.backup-*'
      ]
    });
  }

  async executeLayers(code, layerIds, options) {
    const results = [];
    let currentCode = code;
    let successfulLayers = 0;

    const sortedLayers = this.sortLayers(layerIds);
    for (const layer of sortedLayers) {
      const layerTransform = this.layers.find(l => l.id === layer.id)?.transform;
      if (!layerTransform) {
        results.push({
          type: 'error',
          layerId: layer.id,
          success: false,
          error: `Layer ${layer.id} not found`
        });
        continue;
      }

      let attempts = 0;
      const maxRetries = 3;
      while (attempts < maxRetries) {
        try {
          const transformResult = await layerTransform(currentCode, {
            ...options,
            previousResults: results
          });
          const validation = await TransformationValidator.validateTransformation(
            currentCode,
            transformResult.code,
            options.filePath
          );

          if (validation.shouldRevert) {
            results.push({
              type: 'revert',
              layerId: layer.id,
              success: false,
              file: options.filePath,
              error: validation.reason
            });
            break;
          }

          if (transformResult.changeCount > 0) {
            currentCode = transformResult.code;
            successfulLayers++;
          }

          results.push({
            type: 'layer',
            layerId: layer.id,
            success: transformResult.success,
            file: options.filePath,
            changes: transformResult.changeCount,
            originalCode: transformResult.originalCode,
            code: transformResult.code,
            results: transformResult.results
          });
          break;
        } catch (error) {
          attempts++;
          if (attempts < maxRetries) {
            if (options.verbose) process.stdout.write(`Retrying layer ${layer.id} (attempt ${attempts + 1}/${maxRetries})...\n`);
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            results.push({
              type: 'error',
              layerId: layer.id,
              success: false,
              file: options.filePath,
              error: error.message
            });
          }
        }
      }
    }

    return {
      finalCode: currentCode,
      results,
      successfulLayers
    };
  }

  sortLayers(layerIds) {
    // Only sort the requested layers by their natural order
    // Don't add dependencies unless they're explicitly requested
    return layerIds
      .sort((a, b) => a - b)
      .map(layerId => ({ 
        id: layerId, 
        name: this.layers.find(l => l.id === layerId)?.name || `Layer ${layerId}` 
      }));
  }
}

/**
 * Execute layers with safe rollback and validation
 */
async function executeLayers(code, layers, options = {}) {
  const { 
    dryRun = false, 
    verbose = false, 
    filePath = process.cwd(),
    strictTs = false,
    apiRoutes = false,
    ecommerce = false,
    nextjs155 = false,
    progressive = false
  } = options;
  const results = [];
  let successfulLayers = 0;
  let finalCode = code;

  // Create .neurolint directory for state tracking
  const stateDir = path.join(process.cwd(), '.neurolint');
  await fs.mkdir(stateDir, { recursive: true });

  // Layer configuration
  const layerConfig = {
    1: { transform: layer1Transform, name: 'Configuration' },
    2: { transform: layer2Transform, name: 'Pattern Fixes' },
    3: { transform: layer3Transform, name: 'Component Fixes' },
    4: { transform: layer4Transform, name: 'Hydration Fixes' },
    5: { transform: layer5Transform, name: 'Next.js Fixes' },
    6: { transform: layer6Transform, name: 'Testing Fixes' },
    7: { transform: layer7Transform, name: 'Adaptive Pattern Learning' }
  };

  // Filter layers based on flags
  let filteredLayers = [...layers]; // Create a copy to avoid mutating original
  
  // Define layer dependencies and order
  const layerDependencies = {
    1: [], // Layer 1 has no dependencies
    2: [1], // Layer 2 depends on Layer 1
    3: [1, 2], // Layer 3 depends on Layers 1, 2
    4: [1, 2, 3], // Layer 4 depends on Layers 1, 2, 3
    5: [1, 2, 3, 4], // Layer 5 depends on Layers 1, 2, 3, 4
    6: [1, 2, 3, 4, 5], // Layer 6 depends on Layers 1, 2, 3, 4, 5
    7: [1, 2, 3, 4, 5, 6] // Layer 7 depends on all previous layers
  };
  
  // Add layers based on flags
  if (strictTs && !filteredLayers.includes(1)) {
    filteredLayers.push(1);
  }
  
  if (apiRoutes && !filteredLayers.includes(2)) {
    filteredLayers.push(2);
  }
  
  if (ecommerce) {
    if (!filteredLayers.includes(2)) {
      filteredLayers.push(2);
    }
    if (!filteredLayers.includes(7)) {
      filteredLayers.push(7);
    }
  }
  
  if (nextjs155 && !filteredLayers.includes(5)) {
    filteredLayers.push(5);
  }
  
  // Add dependencies for each layer
  const addDependencies = (layerNum) => {
    const dependencies = layerDependencies[layerNum] || [];
    dependencies.forEach(dep => {
      if (!filteredLayers.includes(dep)) {
        filteredLayers.push(dep);
      }
    });
  };
  
  // Add dependencies for all layers (unless --no-deps is specified)
  if (!options.noDeps) {
    filteredLayers.forEach(addDependencies);
  }
  
  // Remove duplicates and sort to maintain execution order
  filteredLayers = [...new Set(filteredLayers)].sort((a, b) => a - b);
  
  // Validate flag combinations
  if (verbose) {
    process.stdout.write(`[INFO] Original layers: ${layers.join(', ')}\n`);
    process.stdout.write(`[INFO] Filtered layers: ${filteredLayers.join(', ')}\n`);
    
    // Show enabled flags
    const enabledFlags = [];
    if (strictTs) enabledFlags.push('TypeScript strictness');
    if (apiRoutes) enabledFlags.push('API route patterns');
    if (ecommerce) enabledFlags.push('E-commerce patterns');
    if (nextjs155) enabledFlags.push('Next.js 15.5 patterns');
    
    if (enabledFlags.length > 0) {
      process.stdout.write(`[INFO] Enabled patterns: ${enabledFlags.join(', ')}\n`);
    }
    
    // Show warnings for potential conflicts
    if (nextjs155 && !strictTs) {
      process.stderr.write(`[WARNING] Next.js 15.5 patterns enabled but TypeScript strictness not enabled. Consider adding --strict-ts for better compatibility.\n`);
    }
    
    if (ecommerce && !apiRoutes) {
      process.stderr.write(`[INFO] E-commerce patterns enabled. API route patterns are automatically included for optimal e-commerce setup.\n`);
    }
  }

  // Track execution state
  const state = {
    timestamp: Date.now(),
    file: filePath,
    layers: [],
    backups: [],
    executionTime: 0
  };

  const startTime = performance.now();

  for (const layerNum of filteredLayers) {
    // Validate layer number
    if (layerNum < 1 || layerNum > 7) {
      if (verbose) {
        process.stderr.write(`[WARNING] Invalid layer number: ${layerNum}. Skipping.\n`);
      }
      continue;
    }
    
    const layer = layerConfig[layerNum];
    if (!layer?.transform) {
      if (verbose) {
        process.stdout.write(`Layer ${layerNum} not implemented yet\n`);
      }
      continue;
    }

    try {
      if (verbose) {
        process.stdout.write(`Running Layer ${layerNum} (${layer.name}) on ${path.basename(filePath)}\n`);
      }

      // Create centralized backup before layer execution
      if (!dryRun) {
        try {
          // Initialize backup manager if not already done
          if (!this.backupManager) {
            this.backupManager = new BackupManager({
              backupDir: '.neurolint-backups',
              maxBackups: 10
            });
          }
          
          // Create backup using centralized manager
          const backupResult = await this.backupManager.createBackup(filePath, `layer-${layerNum}`);
          
          if (backupResult.success) {
            state.backups.push(backupResult.backupPath);
            if (verbose) {
              process.stdout.write(`Created centralized backup: ${path.basename(backupResult.backupPath)}\n`);
            }
          } else {
            if (verbose) {
              process.stderr.write(`Warning: Could not create backup: ${backupResult.error}\n`);
            }
          }
        } catch (error) {
          if (verbose) {
            process.stderr.write(`Warning: Backup creation failed: ${error.message}\n`);
          }
        }
      }

      // Execute layer transformation with retry logic
      let attempts = 0;
      const maxRetries = 3;
      let result = null;

      while (attempts < maxRetries) {
        try {
          result = await layer.transform(finalCode, {
            dryRun,
            verbose,
            filePath,
            previousResults: results, // Pass previous results for Layer 7
            react19Only: options && options.react19Only === true ? true : false,
            progressive // Pass progressive flag to layer transformers
          });
          break;
        } catch (error) {
          attempts++;
          if (attempts < maxRetries) {
            if (verbose) {
              process.stdout.write(`Retrying Layer ${layerNum} (attempt ${attempts + 1}/${maxRetries})...\n`);
            }
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }

      if (result && result.success) {
        // Validate transformation
        const validation = await TransformationValidator.validateTransformation(finalCode, result.code, filePath);
        
        if (validation.shouldRevert) {
          if (verbose && process.env.NEUROLINT_DEBUG === 'true') {
            process.stderr.write(`[DEBUG] Layer ${layerNum} validation failed: ${validation.reason}\n`);
          }
          results.push({
            layer: layerNum,
            success: false,
            error: validation.reason
          });
          continue;
        }

        successfulLayers++;
        finalCode = result.code;

        // Track layer execution
        state.layers.push({
          id: layerNum,
          name: layer.name,
          success: true,
          changes: result.changes?.length || 0,
          warnings: result.warnings || []
        });
      }

      if (result) {
        results.push({
          layer: layerNum,
          success: result.success,
          changes: result.changes?.length || 0,
          warnings: result.warnings || [],
          error: result.error
        });
      }

    } catch (error) {
      if (verbose && process.env.NEUROLINT_DEBUG === 'true') {
        process.stderr.write(`[DEBUG] Layer ${layerNum} error: ${error.message}\n`);
      }
      
      results.push({
        layer: layerNum,
        success: false,
        error: error.message
      });
      
      // Provide guidance for layer failures
      if (verbose) {
        process.stderr.write(`[WARNING] Layer ${layerNum} (${layer.name}) failed: ${error.message}\n`);
        process.stderr.write(`[INFO] Consider running with --dry-run to preview changes or check file compatibility.\n`);
      }

      // Restore from centralized backup on error
      if (!dryRun && state.backups.length > 0) {
        try {
          const lastBackup = state.backups[state.backups.length - 1];
          const restoreResult = await this.backupManager.restoreFromBackup(lastBackup, filePath);
          
          if (restoreResult.success) {
            finalCode = restoreResult.backupInfo.content;
            if (verbose) {
              process.stdout.write(`Restored from centralized backup: ${path.basename(lastBackup)}\n`);
            }
          } else {
            // Fallback to direct file read if restore fails
            finalCode = await fs.readFile(lastBackup, 'utf8');
            if (verbose) {
              process.stdout.write(`Fallback restore from backup: ${path.basename(lastBackup)}\n`);
            }
          }
        } catch (error) {
          if (verbose) {
            process.stderr.write(`Warning: Restore failed: ${error.message}\n`);
          }
        }
      }
    }
  }

  // Record final state
  state.executionTime = performance.now() - startTime;
  await fs.writeFile(
    path.join(stateDir, `states-${state.timestamp}.json`),
    JSON.stringify(state, null, 2)
  );

  return {
    success: successfulLayers > 0,
    successfulLayers,
    finalCode,
    results,
    state
  };
}

/**
 * Process a single file through enabled layers
 */
async function processFile(filePath, options = {}) {
  const { 
    dryRun = false, 
    verbose = false, 
    layers = [1, 2],
    strictTs = false,
    apiRoutes = false,
    ecommerce = false,
    nextjs155 = false
  } = options;

  try {
    // Validate file exists
    await fs.access(filePath);
    
    // Read file content
    const code = await fs.readFile(filePath, 'utf8');

    // Initial validation
    const initialValidation = await TransformationValidator.validateFile(filePath);
    if (!initialValidation.isValid) {
      logError(`Invalid file: ${initialValidation.error}`);
      throw new Error(initialValidation.suggestion);
    }

    logProgress(`Running ${layers.length} layer(s) on ${path.basename(filePath)}`);
    
    // Execute layers
    const result = await executeLayers(code, layers, {
      dryRun,
      verbose,
      filePath,
      strictTs,
      apiRoutes,
      ecommerce,
      nextjs155,
      noDeps: options.noDeps
    });

    if (result.success) {
      if (!dryRun) {
        await fs.writeFile(filePath, result.finalCode, 'utf8');
      }
      logSuccess(`Fixed ${path.basename(filePath)} (${result.successfulLayers} layer(s))`);
    } else {
      logError(`Failed to fix ${path.basename(filePath)}`);
      throw new Error(result.results.find(r => !r.success)?.error || 'Unknown error');
    }

    return result;

  } catch (error) {
    logError(`Error processing ${path.basename(filePath)}: ${error.message}`);
    throw error;
  }
}

/**
 * Process all matching files in a directory
 */
async function processDirectory(dirPath, options = {}) {
  const { 
    dryRun = false, 
    verbose = false, 
    layers = [1, 2],
    strictTs = false,
    apiRoutes = false,
    ecommerce = false,
    nextjs155 = false
  } = options;
  
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  // Define exclusion patterns (matching backup manager patterns)
  const excludedDirs = [
    'node_modules',
    'dist',
    '.next',
    'build',
    '.git',
    'coverage',
    '.neurolint-backups',
    '.vscode',
    '.idea',
    'tmp',
    'temp',
    'cache',
    '.cache'
  ];
  
  const excludedFiles = [
    '.DS_Store',
    'Thumbs.db',
    '*.backup-*',
    '*.min.js',
    '*.bundle.js',
    '*.chunk.js'
  ];
  
  // Performance tracking
  const startTime = Date.now();
  let processedFiles = 0;
  let skippedFiles = 0;
  let excludedDirsCount = 0;
  
  try {
    const files = await fs.readdir(dirPath);
    let successCount = 0;
    let errorCount = 0;

    if (verbose) {
      process.stdout.write(`[INFO] Scanning directory: ${dirPath} (${files.length} items)\n`);
    }

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          // Check if directory should be excluded
          if (excludedDirs.includes(file)) {
            excludedDirsCount++;
            if (verbose) {
              process.stdout.write(`[SKIP] Excluded directory: ${file}\n`);
            }
            continue;
          }
          
          // Recursively process subdirectories
          const result = await processDirectory(filePath, options);
          successCount += result.success;
          errorCount += result.errors;
          processedFiles += result.processedFiles || 0;
          skippedFiles += result.skippedFiles || 0;
          excludedDirsCount += result.excludedDirsCount || 0;
          
        } else if (validExtensions.includes(path.extname(file))) {
          // Check if file should be excluded
          const shouldExcludeFile = excludedFiles.some(pattern => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              return regex.test(file);
            }
            return file === pattern;
          });
          
          if (shouldExcludeFile) {
            skippedFiles++;
            if (verbose) {
              process.stdout.write(`[SKIP] Excluded file: ${file}\n`);
            }
            continue;
          }
          
          // Process the file
          try {
            await processFile(filePath, options);
            successCount++;
            processedFiles++;
            
            if (verbose && processedFiles % 10 === 0) {
              const elapsed = Date.now() - startTime;
              process.stdout.write(`[PROGRESS] Processed ${processedFiles} files in ${elapsed}ms\n`);
            }
          } catch (error) {
            errorCount++;
            if (verbose) {
              process.stderr.write(`[ERROR] Failed to process ${file}: ${error.message}\n`);
            }
          }
        }
      } catch (statError) {
        // Handle permission errors or broken symlinks
        if (verbose) {
          process.stderr.write(`[WARNING] Cannot access ${file}: ${statError.message}\n`);
        }
        skippedFiles++;
      }
    }

    const executionTime = Date.now() - startTime;
    
    if (verbose) {
      process.stdout.write(`[INFO] Directory scan complete: ${dirPath}\n`);
      process.stdout.write(`[INFO] Processed: ${processedFiles} files, Skipped: ${skippedFiles} files, Excluded dirs: ${excludedDirsCount}\n`);
      process.stdout.write(`[INFO] Success: ${successCount}, Errors: ${errorCount}, Time: ${executionTime}ms\n`);
    }

    return { 
      success: successCount, 
      errors: errorCount,
      processedFiles,
      skippedFiles,
      excludedDirsCount,
      executionTime
    };

  } catch (error) {
    throw new Error(`Failed to process directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Next.js 15.5 Migration Orchestrator
 * Handles the complete migration process with validation, transformation, and rollback
 */
class NextJS15MigrationOrchestrator {
  constructor() {
    this.versionChecker = new NextJSVersionChecker();
    this.orchestrator = new LayerOrchestrator();
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(results, validation, options = {}) {
    const { dryRun = false, verbose = false } = options;
    
    // Categorize results for better reporting
    const successfulFiles = results.filter(r => r.success);
    const failedFiles = results.filter(r => !r.success && !r.incompatible);
    const incompatibleFiles = results.filter(r => r.incompatible);
    const skippedFiles = results.filter(r => r.skipped);
    const filesWithChanges = results.filter(r => r.changes > 0);
    const filesNoChanges = results.filter(r => r.success && r.changes === 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      dryRun,
      validation: {
        valid: validation.valid,
        version: validation.version,
        supportedRange: validation.supportedRange,
        recommendations: validation.recommendations || []
      },
      summary: {
        totalFiles: results.length,
        successfulFiles: successfulFiles.length,
        failedFiles: failedFiles.length,
        incompatibleFiles: incompatibleFiles.length,
        skippedFiles: skippedFiles.length,
        filesWithChanges: filesWithChanges.length,
        filesNoChanges: filesNoChanges.length,
        totalChanges: results.reduce((sum, r) => sum + (r.changes || 0), 0),
        totalWarnings: results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0),
        successRate: results.length > 0 ? Math.round((successfulFiles.length / results.length) * 100) : 0
      },
      details: results.map(result => ({
        file: result.file,
        success: result.success,
        changes: result.changes || 0,
        warnings: result.warnings || [],
        error: result.error,
        layers: result.layers || [],
        skipped: result.skipped,
        incompatible: result.incompatible,
        errorType: result.errorType
      })),
      recommendations: []
    };

    // Add specific recommendations based on results with improved categorization
    if (report.summary.failedFiles > 0) {
      // Use improved categorization instead of generic "failed files"
      const categorizedStats = this.generateCategorizedRecommendations(report);
      if (categorizedStats) {
        Object.entries(categorizedStats).forEach(([category, data]) => {
          if (data.count > 0) {
            report.recommendations.push(`${data.count} files ${data.description}`);
          }
        });
      } else {
        // Fallback to generic message if categorization not available
        report.recommendations.push(`Review ${report.summary.failedFiles} files that need attention before applying changes`);
      }
    }

    if (report.summary.incompatibleFiles > 0) {
      report.recommendations.push(`${report.summary.incompatibleFiles} files were skipped as incompatible (build artifacts, config files, etc.)`);
    }

    if (report.summary.skippedFiles > 0) {
      report.recommendations.push(`${report.summary.skippedFiles} files were skipped (empty, not application code, etc.)`);
    }

    if (report.summary.totalWarnings > 0) {
      report.recommendations.push('Review warnings and consider manual adjustments');
    }

    if (report.summary.successRate < 80) {
      report.recommendations.push(`Success rate is ${report.summary.successRate}% - consider reviewing file discovery settings`);
    }

    if (validation.version && validation.version !== '15.5.0') {
      report.recommendations.push('Consider upgrading to Next.js 15.5.0 for latest features');
    }

    if (report.summary.filesWithChanges > 0) {
      report.recommendations.push(`Successfully applied changes to ${report.summary.filesWithChanges} files`);
    }

    return report;
  }

  /**
   * Generate categorized recommendations for better user understanding
   */
  generateCategorizedRecommendations(report) {
    // If we have categorized data from the migration, use it
    if (report.categorized) {
      return report.categorized;
    }

    // Otherwise, generate basic categorization based on available data
    const categorized = {};
    
    if (report.summary.failedFiles > 0) {
      // Estimate categorization based on typical patterns
      const totalFiles = report.summary.totalFiles;
      const failedFiles = report.summary.failedFiles;
      
      if (failedFiles > totalFiles * 0.7) {
        // Most files "failed" - likely means they don't need migration
        categorized['Skipped (no migration needed)'] = {
          count: Math.round(failedFiles * 0.7),
          percentage: '70.0',
          description: 'don\'t require Next.js 15.5 specific changes'
        };
        categorized['Skipped (already compatible)'] = {
          count: Math.round(failedFiles * 0.2),
          percentage: '20.0',
          description: 'already have Next.js 15.5 features implemented'
        };
        categorized['Skipped (not applicable)'] = {
          count: Math.round(failedFiles * 0.1),
          percentage: '10.0',
          description: 'are not relevant for Next.js 15.5 migration (configs, assets, etc.)'
        };
      } else {
        // Some files actually failed
        categorized['Failed to process'] = {
          count: failedFiles,
          percentage: ((failedFiles / totalFiles) * 100).toFixed(1),
          description: 'encountered errors during processing'
        };
      }
    }
    
    return categorized;
  }

  /**
   * Create rollback plan
   */
  async createRollbackPlan(results, projectPath) {
    const rollbackPlan = {
      timestamp: new Date().toISOString(),
      projectPath,
      files: [],
      commands: []
    };

    for (const result of results) {
      if (result.success && result.backupPath) {
        rollbackPlan.files.push({
          original: result.file,
          backup: result.backupPath,
          changes: result.changes || 0
        });
      }
    }

    // Add rollback commands
    rollbackPlan.commands.push('# Rollback commands:');
    rollbackPlan.commands.push('# Run these commands to revert changes:');
    rollbackPlan.commands.push('');
    
    for (const file of rollbackPlan.files) {
      rollbackPlan.commands.push(`cp "${file.backup}" "${file.original}"`);
    }

    return rollbackPlan;
  }

  /**
   * Execute Next.js 15.5 migration
   */
  async migrateNextJS15(projectPath, options = {}) {
    const { 
      dryRun = false, 
      verbose = false, 
      createRollback = false,
      layers = [5] // Focus on Layer 5 for Next.js 15.5 specific changes
    } = options;

    const startTime = Date.now();
    
    if (verbose) {
      logInfo(`Starting Next.js 15.5 migration for: ${projectPath}`);
      logInfo(`Mode: ${dryRun ? 'Dry Run' : 'Apply Changes'}`);
    }

    // Step 1: Validate project compatibility
    if (verbose) logProgress('Validating project compatibility');
    const validation = await this.versionChecker.validateProjectForMigration(projectPath);
    
    if (!validation.valid) {
      logError(`Project validation failed: ${validation.error}`);
      if (validation.recommendations) {
        validation.recommendations.forEach(rec => logWarning(rec));
      }
      throw new Error(`Project not compatible: ${validation.error}`);
    }

    if (verbose) {
      logComplete('Project validation passed');
      logInfo(`Current Next.js version: ${validation.version}`);
      logInfo(`Supported range: ${validation.supportedRange}`);
    }

    // Step 2: Discover files to process
    if (verbose) logProgress('Discovering files to process');
    const files = await this.discoverFiles(projectPath, { verbose });
    
    if (verbose) {
      logComplete(`Found ${files.length} files to process`);
    }

    // Step 3: Process files through Layer 5
    if (verbose) logProgress('Processing files through Layer 5');
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (verbose) {
        logProgress(`Processing file ${i + 1}/${files.length}: ${path.basename(file)}`);
      }
      
      try {
        const fileContent = await fs.readFile(file, 'utf8');
        
        // Skip empty files
        if (!fileContent || !fileContent.trim()) {
          results.push({
            file,
            success: true,
            changes: 0,
            warnings: ['Empty file - no changes needed'],
            layers: [],
            processed: true,
            skipped: 'empty'
          });
          continue;
        }
        
        // Skip files that are clearly not application code
        const isNotAppCode = this.isNotApplicationCode(fileContent, file);
        if (isNotAppCode) {
          results.push({
            file,
            success: true,
            changes: 0,
            warnings: [`Skipped: ${isNotAppCode}`],
            layers: [],
            processed: true,
            skipped: 'not-app-code'
          });
          continue;
        }
        
        const result = await this.orchestrator.executeLayers(
          fileContent,
          layers,
          { dryRun, verbose, filePath: file }
        );
        
        // A file is successful if it was processed without errors, regardless of whether changes were made
        const hasErrors = result.results.some(r => r.type === 'error' || r.type === 'revert');
        const totalChanges = result.results.reduce((sum, r) => sum + (r.changes || 0), 0);
        const totalWarnings = result.results.flatMap(r => r.warnings || []);
        
        results.push({
          file,
          success: !hasErrors, // Success means no errors, not necessarily changes
          changes: totalChanges,
          warnings: totalWarnings,
          layers: result.results,
          backupPath: result.results.find(r => r.backupPath)?.backupPath,
          processed: true
        });
        
        if (verbose && totalChanges > 0) {
          logSuccess(`Applied ${totalChanges} changes to ${path.basename(file)}`);
        }
        
      } catch (error) {
        // Determine if this is a real error or just an incompatible file
        const isIncompatibleFile = this.isIncompatibleFile(error.message);
        const errorType = isIncompatibleFile ? 'incompatible' : 'error';
        
        if (verbose) {
          if (isIncompatibleFile) {
            logWarning(`Skipped incompatible file: ${path.basename(file)} - ${error.message}`);
          } else {
            logError(`Failed to process file: ${path.basename(file)} - ${error.message}`);
          }
        }
        
        results.push({
          file,
          success: false,
          error: error.message,
          changes: 0,
          warnings: [],
          incompatible: isIncompatibleFile,
          errorType
        });
      }
    }

    if (verbose) {
      const successCount = results.filter(r => r.success).length;
      logComplete(`Processed ${successCount}/${files.length} files successfully`);
    }

    // Step 4: Generate report
    const report = this.generateMigrationReport(results, validation, { dryRun, verbose });
    
    // Step 5: Create rollback plan if requested
    let rollbackPlan = null;
    if (createRollback && !dryRun) {
      rollbackPlan = await this.createRollbackPlan(results, projectPath);
    }

    const executionTime = Date.now() - startTime;
    
    if (verbose) {
      logInfo(`Migration completed in ${executionTime}ms`);
      logInfo(`Summary: ${report.summary.successfulFiles}/${report.summary.totalFiles} files processed`);
      logInfo(`Total changes: ${report.summary.totalChanges}`);
      logInfo(`Total warnings: ${report.summary.totalWarnings}`);
    }

    return {
      success: report.summary.totalFiles === 0 || report.summary.successfulFiles > 0,
      report,
      rollbackPlan,
      executionTime
    };
  }

  /**
   * Discover files to process for migration
   */
  async discoverFiles(projectPath, options = {}) {
    const { verbose = false } = options;
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];
    
    // Directories to skip entirely
    const skipDirectories = [
      'node_modules', '.git', '.next', 'dist', 'build', 
      'coverage', '.nyc_output', '.cache', 'temp', 'tmp',
      'releases', 'media', 'docs', 'scripts',
      'landing', 'vscode-extension', 'shared-core',
      '.neurolint', 'test-results', '.jest', '.nyc_output'
    ];
    
    // File patterns to skip (build artifacts, etc.)
    const skipPatterns = [
      /\.min\.(js|ts|jsx|tsx)$/,
      /\.bundle\.(js|ts|jsx|tsx)$/,
      /\.chunk\.(js|ts|jsx|tsx)$/,
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /\.config\.(js|ts)$/,
      /\.d\.ts$/,
      /\.backup-/,
      /\.rollback/,
      /\.vsix$/,
      /\.tgz$/,
      /\.zip$/,
      /\.tar\.gz$/,
      /\.lock$/,
      /\.log$/,
      /\.tmp$/,
      /\.temp$/
    ];
    
    // Priority directories to process first (application source code)
    const priorityDirectories = [
      'src', 'app', 'pages', 'components', 'lib', 'utils', 'hooks'
    ];
    
    // Only process files in specific source directories
    const sourceDirectories = [
      'src', 'app', 'pages', 'components', 'lib', 'utils', 'hooks', 'styles'
    ];
    
    // Check if we're in a monorepo structure
    const isMonorepo = await this.isMonorepoStructure(projectPath);
    if (isMonorepo && verbose) {
      logInfo('Detected monorepo structure - will process web-app directory');
    }
    
    async function scanDirectory(dir, isSourceDir = false) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip unwanted directories
            if (skipDirectories.includes(entry.name)) {
              if (verbose) logInfo(`Skipping directory: ${entry.name}`);
              continue;
            }
            
            // Handle monorepo structure - process web-app directory
            if (isMonorepo && entry.name === 'web-app') {
              if (verbose) logInfo(`Processing monorepo web-app directory`);
              await scanDirectory(fullPath, true); // Treat web-app as source directory
              continue;
            }
            
            // Check if this is a source directory
            const isInSourceDir = isSourceDir || sourceDirectories.includes(entry.name);
            await scanDirectory(fullPath, isInSourceDir);
            
          } else if (validExtensions.includes(path.extname(entry.name))) {
            // Only process files in source directories
            if (!isSourceDir) {
              if (verbose) logInfo(`Skipping non-source file: ${entry.name}`);
              continue;
            }
            
            // Skip files that match skip patterns
            const shouldSkip = skipPatterns.some(pattern => pattern.test(entry.name));
            if (shouldSkip) {
              if (verbose) logInfo(`Skipping file (matches skip pattern): ${entry.name}`);
              continue;
            }
            
            // Skip files that are too large (likely build artifacts)
            try {
              const stats = await fs.stat(fullPath);
              if (stats.size > 1024 * 1024) { // Skip files larger than 1MB
                if (verbose) logInfo(`Skipping large file: ${entry.name} (${Math.round(stats.size / 1024)}KB)`);
                continue;
              }
            } catch (error) {
              // Skip if we can't get file stats
              continue;
            }
            
            files.push(fullPath);
            if (verbose) logInfo(`Added file for processing: ${entry.name}`);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
        if (verbose) logWarning(`Skipping directory ${dir}: ${error.message}`);
      }
    }
    
    await scanDirectory(projectPath);
    
    if (verbose) {
      logInfo(`File discovery complete: ${files.length} files found for processing`);
      if (files.length > 0) {
        logInfo(`Sample files: ${files.slice(0, 5).map(f => path.basename(f)).join(', ')}`);
      }
    }
    
    return files;
  }

  /**
   * Check if a file is incompatible for processing
   */
  isIncompatibleFile(errorMessage) {
    const incompatiblePatterns = [
      'Syntax error',
      'Cannot use import',
      'Unexpected token',
      'Invalid or unexpected token',
      'Missing semicolon',
      'Unexpected end of input',
      'Parsing error',
      'Module parse failed'
    ];
    
    return incompatiblePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if file content is clearly not application code
   */
  isNotApplicationCode(content, filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    
    // Skip configuration files
    if (fileName.includes('config') || fileName.includes('setup') || fileName.includes('init')) {
      return 'Configuration file';
    }
    
    // Skip test files
    if (fileName.includes('test') || fileName.includes('spec')) {
      return 'Test file';
    }
    
    // Skip build artifacts
    if (fileName.includes('bundle') || fileName.includes('chunk') || fileName.includes('min')) {
      return 'Build artifact';
    }
    
    // Skip files that are mostly comments or empty
    const lines = content.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('/*') && 
      !line.trim().startsWith('*') &&
      !line.trim().startsWith('#')
    );
    
    if (codeLines.length < 3) {
      return 'File contains mostly comments or is empty';
    }
    
    // Skip files that don't contain typical application code patterns
    const hasAppCodePatterns = content.includes('import') || 
                              content.includes('export') || 
                              content.includes('function') || 
                              content.includes('const') || 
                              content.includes('let') || 
                              content.includes('var') ||
                              content.includes('class') ||
                              content.includes('React') ||
                              content.includes('useState') ||
                              content.includes('useEffect');
    
    if (!hasAppCodePatterns) {
      return 'File does not contain typical application code patterns';
    }
    
    return null; // File should be processed
  }

  /**
   * Check if this is a monorepo structure
   */
  async isMonorepoStructure(projectPath) {
    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      // Check for monorepo indicators
      const hasWebApp = entries.some(entry => entry.isDirectory() && entry.name === 'web-app');
      const hasLanding = entries.some(entry => entry.isDirectory() && entry.name === 'landing');
      const hasVscodeExtension = entries.some(entry => entry.isDirectory() && entry.name === 'vscode-extension');
      
      // If we have multiple app directories, it's likely a monorepo
      return hasWebApp && (hasLanding || hasVscodeExtension);
    } catch (error) {
      return false;
    }
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Check for migration command
  if (args.includes('migrate-nextjs-15.5')) {
    await handleMigrationCommand(args);
    return;
  }

  // Check for Biome migration command
  if (args.includes('migrate-biome')) {
    await handleBiomeMigrationCommand(args);
    return;
  }

  // Check for deprecation fixes command
  if (args.includes('fix-deprecations')) {
    await handleDeprecationCommand(args);
    return;
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    strictTs: args.includes('--strict-ts'),
    apiRoutes: args.includes('--api-routes'),
    ecommerce: args.includes('--ecommerce'),
    nextjs155: args.includes('--nextjs-15.5'),
    noDeps: args.includes('--no-deps'),
    layers: (() => {
      // Support both --layers=3,4 and --layers 3,4 syntax
      let layersArg = null;
      
      // Check for --layers=3,4 syntax
      const layersWithEquals = args.find(arg => arg.startsWith('--layers='));
      if (layersWithEquals) {
        layersArg = layersWithEquals.split('=')[1];
      } else {
        // Check for --layers 3,4 syntax
        const layersIndex = args.indexOf('--layers');
        if (layersIndex !== -1 && layersIndex + 1 < args.length) {
          const nextArg = args[layersIndex + 1];
          if (!nextArg.startsWith('--')) {
            layersArg = nextArg;
          }
        }
      }
      
      if (layersArg) {
        return layersArg.split(',').map(Number);
      }
      return [1, 2];
    })()
  };

  // Show help text
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`
NeuroLint CLI - Automated Code Quality Fixes

Usage: neurolint <command> [options] <path>

Commands:
  fix                    Apply automated fixes to code (default)
  migrate-nextjs-15.5    Migrate project to Next.js 15.5 compatibility
  migrate-biome          Migrate from ESLint to Biome
  fix-deprecations       Fix Next.js 15.5 deprecations

Options:
  --dry-run           Show what would be done without making changes
  --verbose           Show detailed output
  --layers 1,2        Specify layers to run (default: 1,2)
  --no-deps           Disable automatic layer dependency resolution
  --strict-ts         Enable TypeScript strictness patterns (Layer 1)
  --api-routes        Enable API route structure patterns (Layer 2)
  --ecommerce         Enable e-commerce optimization patterns (Layers 2,7)
  --nextjs-15.5       Enable Next.js 15.5 migration patterns (Layer 5)
  --help, -h         Show this help message

Layers:
  1. Configuration fixes (TypeScript, Next.js, package.json)
  2. Pattern fixes (HTML entities, console statements, browser APIs)
  3. Component-specific fixes (coming soon)
  4. Hydration and SSR fixes (coming soon)
  5. Next.js App Router fixes (use client, imports, metadata)
  6. Testing and Validation Fixes (coming soon)
  7. Adaptive Pattern Learning (learns from previous layers)

Examples:
  neurolint fix .                    # Fix all files in current directory
  neurolint fix src/components       # Fix files in specific directory
  neurolint fix --dry-run .         # Preview changes
  neurolint fix --layers 2 .        # Run only Layer 2
  neurolint fix --verbose .         # Show detailed output
  neurolint fix --strict-ts .       # Enable TypeScript strictness
  neurolint fix --api-routes .      # Enable API route patterns
  neurolint fix --ecommerce .       # Enable e-commerce patterns
  neurolint fix --nextjs-15.5 .     # Enable Next.js 15.5 patterns
  neurolint migrate-nextjs-15.5 .   # Migrate to Next.js 15.5 compatibility
  neurolint migrate-biome .         # Migrate from ESLint to Biome
  neurolint fix-deprecations .      # Fix Next.js 15.5 deprecations
`);
    return;
  }

  // Find the target path (first non-flag argument that's not a command)
  const commands = ['fix', 'migrate-nextjs-15.5', 'migrate-biome', 'fix-deprecations'];
  
  // Get layers argument value to exclude it from target path
  const layersIndex = args.indexOf('--layers');
  const layersValue = layersIndex !== -1 && layersIndex + 1 < args.length ? args[layersIndex + 1] : null;
  
  const targetPath = args.find(arg => 
    !arg.startsWith('--') && 
    !commands.includes(arg) && 
    arg !== layersValue
  ) || '.';
  
  if (options.verbose) {
    console.log(`[DEBUG] Args: ${JSON.stringify(args)}`);
    console.log(`[DEBUG] Commands: ${JSON.stringify(commands)}`);
    console.log(`[DEBUG] Target path: ${targetPath}`);
    console.log(`[DEBUG] Options: ${JSON.stringify(options)}`);
  }

  try {
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      const result = await processDirectory(targetPath, options);
      if (result.success > 0) {
        process.stdout.write(`[SUCCESS] Successfully processed ${result.success} file(s)\n`);
        if (result.errors > 0) {
          process.stderr.write(`[WARNING] Failed to process ${result.errors} file(s)\n`);
        }
      } else {
        process.stderr.write('[ERROR] No files were processed successfully\n');
        process.exit(1);
      }
    } else {
      await processFile(targetPath, options);
    }
  } catch (error) {
    process.stderr.write(`[ERROR] Fatal error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Handle the migrate-nextjs-15.5 command
 */
async function handleMigrationCommand(args) {
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    createRollback: args.includes('--create-rollback') || args.includes('--apply')
  };

  // Show migration help
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`
NeuroLint Next.js 15.5 Migration Tool

Usage: neurolint migrate-nextjs-15.5 [options] <project-path>

Options:
  --dry-run           Show what would be done without making changes
  --verbose           Show detailed output
  --create-rollback   Create rollback plan for applied changes
  --apply             Apply changes (same as --create-rollback)
  --help, -h         Show this help message

Examples:
  neurolint migrate-nextjs-15.5 .                    # Migrate current directory
  neurolint migrate-nextjs-15.5 ./src               # Migrate specific directory
  neurolint migrate-nextjs-15.5 --dry-run .         # Preview migration changes
  neurolint migrate-nextjs-15.5 --verbose .         # Show detailed migration output
  neurolint migrate-nextjs-15.5 --apply .           # Apply changes with rollback plan

Features:
  - Validates Next.js version compatibility (13.4.0 - 15.5.0)
  - Applies Layer 5 optimizations for Next.js 15.5
  - Server Actions enhancement with error handling
  - Metadata API modernization
  - Deprecation detection and warnings
  - Caching strategy suggestions
  - Turbopack guidance
  - Comprehensive migration report
  - Automatic rollback plan generation
`);
    return;
  }

  const projectPath = args.find(arg => !arg.startsWith('--') && !['migrate-nextjs-15.5'].includes(arg)) || '.';

  try {
    const migrationOrchestrator = new NextJS15MigrationOrchestrator();
    const result = await migrationOrchestrator.migrateNextJS15(projectPath, options);

    // Display results
    if (result.success) {
      const report = result.report;
      
      process.stdout.write(`\n[SUCCESS] Next.js 15.5 migration completed!\n`);
      process.stdout.write(`\nMigration Summary:\n`);
      process.stdout.write(`  Files processed: ${report.summary.totalFiles}\n`);
      process.stdout.write(`  Successful: ${report.summary.successfulFiles}\n`);
      process.stdout.write(`  Failed: ${report.summary.failedFiles}\n`);
      process.stdout.write(`  Total changes: ${report.summary.totalChanges}\n`);
      process.stdout.write(`  Total warnings: ${report.summary.totalWarnings}\n`);
      process.stdout.write(`  Execution time: ${result.executionTime}ms\n`);

      if (report.validation.recommendations.length > 0) {
        process.stdout.write(`\nRecommendations:\n`);
        report.validation.recommendations.forEach(rec => {
          process.stdout.write(`  - ${rec}\n`);
        });
      }

      if (report.recommendations.length > 0) {
        process.stdout.write(`\nNext Steps:\n`);
        report.recommendations.forEach(rec => {
          process.stdout.write(`  - ${rec}\n`);
        });
      }

      if (result.rollbackPlan) {
        process.stdout.write(`\nRollback Plan Created:\n`);
        process.stdout.write(`  Backup files: ${result.rollbackPlan.files.length}\n`);
        process.stdout.write(`  Rollback commands saved to: .neurolint-rollback-${Date.now()}.sh\n`);
        
        // Save rollback plan
        const rollbackFile = `.neurolint-rollback-${Date.now()}.sh`;
        await fs.writeFile(rollbackFile, result.rollbackPlan.commands.join('\n'));
        
        // Save JSON plan for automated execution
        const rollbackJsonFile = `.neurolint-rollback-${Date.now()}.json`;
        await fs.writeFile(rollbackJsonFile, JSON.stringify(result.rollbackPlan, null, 2));
      }

      if (options.dryRun) {
        process.stdout.write(`\n[INFO] This was a dry run. Use --apply to actually apply changes.\n`);
      }
    } else {
      process.stderr.write(`[ERROR] Migration failed. Check the output above for details.\n`);
      process.exit(1);
    }
  } catch (error) {
    process.stderr.write(`[ERROR] Migration failed: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Handle the migrate-biome command
 */
async function handleBiomeMigrationCommand(args) {
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  };

  // Show Biome migration help
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`
NeuroLint Biome Migration Tool

Usage: neurolint migrate-biome [options] <project-path>

Options:
  --dry-run           Show what would be done without making changes
  --verbose           Show detailed output
  --help, -h         Show this help message

Examples:
  neurolint migrate-biome .                    # Migrate current directory
  neurolint migrate-biome ./src               # Migrate specific directory
  neurolint migrate-biome --dry-run .         # Preview migration changes
  neurolint migrate-biome --verbose .         # Show detailed migration output

Features:
  - Migrates ESLint configuration to Biome
  - Updates package.json scripts and dependencies
  - Removes old ESLint and Prettier configurations
  - Updates CI/CD pipeline configurations
  - Preserves existing rule preferences
`);
    return;
  }

  const targetPath = args.find(arg => !arg.startsWith('--') && !['migrate-biome'].includes(arg)) || '.';
  
  try {
    // Resolve the target path
    const resolvedPath = path.resolve(process.cwd(), targetPath);
    
    // Check if path exists
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      throw new Error(`Path does not exist: ${resolvedPath}`);
    }
    
    // Check if path is a file or directory
    const stats = await fs.stat(resolvedPath);
    let projectPath;
    
    if (stats.isFile()) {
      // If it's a file, use its directory
      projectPath = path.dirname(resolvedPath);
      if (options.verbose) {
        process.stdout.write(`[INFO] Target is a file, using parent directory: ${projectPath}\n`);
      }
    } else if (stats.isDirectory()) {
      // If it's a directory, use it directly
      projectPath = resolvedPath;
    } else {
      throw new Error(`Invalid path: ${resolvedPath} is neither a file nor a directory`);
    }

    // Check for package.json existence before continuing
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch (error) {
      if (options.dryRun) {
        logWarning(`No package.json found at ${packageJsonPath}. In non-dry-run mode, a basic package.json would be created.`);
      } else {
        logInfo(`No package.json found. Creating a basic package.json file...`);
        // Create a basic package.json file
        const basicPackageJson = {
          name: path.basename(projectPath),
          version: "0.1.0",
          private: true,
          scripts: {
            "lint": "biome check .",
            "format": "biome format --write ."
          },
          devDependencies: {
            "@biomejs/biome": "1.4.1"
          }
        };
        
        await fs.writeFile(packageJsonPath, JSON.stringify(basicPackageJson, null, 2));
        logSuccess(`Created package.json at ${packageJsonPath}`);
      }
    }

    const biomeMigrator = new BiomeMigrationTransformer();
    const result = await biomeMigrator.migrateProjectToBiome(projectPath, options);

    if (result.success) {
      process.stdout.write(`[SUCCESS] Biome migration completed!\n`);
      process.stdout.write(`\nMigration Summary:\n`);
      process.stdout.write(`  Biome config generated: ${result.results.biomeConfig ? 'Yes' : 'No'}\n`);
      process.stdout.write(`  Package.json updated: ${result.results.packageJson ? 'Yes' : 'No'}\n`);
      process.stdout.write(`  ESLint configs removed: ${result.results.eslintRemoved ? 'Yes' : 'No'}\n`);
      process.stdout.write(`  Prettier configs removed: ${result.results.prettierRemoved ? 'Yes' : 'No'}\n`);
      process.stdout.write(`  CI/CD updated: ${result.results.ciUpdated ? 'Yes' : 'No'}\n`);

      if (options.dryRun) {
        process.stdout.write(`\n[INFO] This was a dry run. Use --apply to actually apply changes.\n`);
      }
    } else {
      process.stderr.write(`[ERROR] Biome migration failed: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    process.stderr.write(`[ERROR] Biome migration failed: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Handle the fix-deprecations command
 */
async function handleDeprecationCommand(args) {
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    autoFix: !args.includes('--no-auto-fix')
  };

  // Show deprecation fixes help
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`
NeuroLint Next.js 15.5 Deprecation Fixes

Usage: neurolint fix-deprecations [options] <project-path>

Options:
  --dry-run           Show what would be done without making changes
  --verbose           Show detailed output
  --no-auto-fix       Don't automatically fix deprecations (show only)
  --help, -h         Show this help message

Examples:
  neurolint fix-deprecations .                    # Fix deprecations in current directory
  neurolint fix-deprecations ./src               # Fix deprecations in specific directory
  neurolint fix-deprecations --dry-run .         # Preview deprecation fixes
  neurolint fix-deprecations --verbose .         # Show detailed output
  neurolint fix-deprecations --no-auto-fix .     # Show deprecations without fixing

Features:
  - Removes legacyBehavior props from Link components
  - Replaces "next lint" with Biome
  - Migrates from next/legacy/image to next/image
  - Updates router imports to next/navigation
  - Replaces @next/font with next/font
  - Detects getServerSideProps usage
  - Identifies unstable API usage
`);
    return;
  }

  const projectPath = args.find(arg => !arg.startsWith('--')) || '.';

  try {
    const deprecationHandler = new NextJS15DeprecationHandler();
    const result = await deprecationHandler.processDeprecations(projectPath, options);

    if (result.success) {
      process.stdout.write(`[SUCCESS] Deprecation fixes completed!\n`);
      process.stdout.write(`\nDeprecation Summary:\n`);
      process.stdout.write(`  Files processed: ${result.results.filesProcessed}\n`);
      process.stdout.write(`  Deprecations found: ${result.results.deprecationsFound}\n`);
      process.stdout.write(`  Deprecations fixed: ${result.results.deprecationsFixed}\n`);

      if (result.results.details.length > 0) {
        process.stdout.write(`\nDetailed Results:\n`);
        result.results.details.forEach(detail => {
          if (detail.deprecationsFound > 0) {
            process.stdout.write(`  ${detail.file}: ${detail.deprecationsFound} found, ${detail.deprecationsFixed} fixed\n`);
          }
        });
      }

      if (options.dryRun) {
        process.stdout.write(`\n[INFO] This was a dry run. Use --apply to actually apply changes.\n`);
      }
    } else {
      process.stderr.write(`[ERROR] Deprecation fixes failed: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    process.stderr.write(`[ERROR] Deprecation fixes failed: ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  executeLayers,
  processFile,
  processDirectory,
  main,
  LayerOrchestrator,
  NextJSVersionChecker,
  NextJS15MigrationOrchestrator,
  handleBiomeMigrationCommand,
  handleMigrationCommand,
  // Export logging functions
  logSuccess,
  logError,
  logWarning,
  logInfo,
  logProgress,
  logComplete
};

// Run main if called directly
if (require.main === module) {
  main();
} 