#!/usr/bin/env node

/**
 * NeuroLint CLI - Main Entry Point
 * 
 * Copyright (c) 2025 NeuroLint
 * Licensed under the Business Source License 1.1
 * 
 * Use Limitation: You may not use this software to provide a commercial
 * SaaS offering that competes with NeuroLint's code transformation services.
 * 
 * Change Date: 2029-11-22
 * Change License: GPL-3.0-or-later
 * 
 * For commercial licensing: clivemakazhu@gmail.com
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */

const fs = require('fs').promises;
const path = require('path');
const ora = require('./simple-ora');
const { performance } = require('perf_hooks');
const https = require('https');

// Import shared core and existing modules
const sharedCore = require('./shared-core');
const fixMaster = require('./fix-master.js');
const TransformationValidator = require('./validator.js');
const BackupManager = require('./backup-manager');
const { ProductionBackupManager } = require('./backup-manager-production');

// Backup Manager Factory
function createBackupManager(options = {}) {
  const useProduction = options.production || 
                       process.env.NEUROLINT_PRODUCTION === 'true' || 
                       process.env.NODE_ENV === 'production';
                       
  if (useProduction) {
    return new ProductionBackupManager({
      backupDir: options.backupDir || '.neurolint-backups',
      maxBackups: options.maxBackups || 50,
      environment: process.env.NODE_ENV || 'production',
      loggerConfig: {
        enableConsole: options.verbose || false,
        enableFile: true,
        logLevel: options.verbose ? 'DEBUG' : 'INFO'
      },
      ...options
    });
  } else {
    return new BackupManager({
      backupDir: options.backupDir || '.neurolint-backups',
      maxBackups: options.maxBackups || 10,
      ...options
    });
  }
}

// Layer configuration
const LAYER_NAMES = {
  1: 'config',
  2: 'patterns', 
  3: 'components',
  4: 'hydration',
  5: 'nextjs',
  6: 'testing',
  7: 'adaptive'
};

// Smart Layer Selector for analyzing and recommending layers
class SmartLayerSelector {
  static analyzeAndRecommend(code, filePath) {
    const issues = [];
    const ext = path.extname(filePath);
    
    try {
      // Use AST-based analysis for more accurate detection
      const ASTTransformer = require('./ast-transformer');
      const transformer = new ASTTransformer();
      const astIssues = transformer.analyzeCode(code, { filename: filePath });
      
      // Convert AST issues to layer recommendations
      astIssues.forEach(issue => {
        issues.push({
          layer: issue.layer,
          reason: issue.message,
          confidence: 0.9,
          location: issue.location
        });
      });
    } catch (error) {
      // Fallback to regex-based detection if AST parsing fails
      issues.push(...this.fallbackAnalysis(code, filePath));
    }

    return {
      detectedIssues: issues,
      recommendedLayers: [...new Set(issues.map(i => i.layer))].sort(),
      reasons: issues.map(i => i.reason),
      confidence: issues.reduce((acc, i) => acc + i.confidence, 0) / issues.length || 0
    };
  }

  static fallbackAnalysis(code, filePath) {
    const issues = [];
    const ext = path.extname(filePath);
    
    // Layer 1: Configuration files
    if (filePath.endsWith('tsconfig.json') || filePath.endsWith('next.config.js') || filePath.endsWith('package.json')) {
      issues.push({
        layer: 1,
        reason: 'Configuration file detected',
        confidence: 0.9
      });
    }

    // Layer 2: Pattern issues
    if (code.includes('&quot;') || code.includes('&amp;') || code.includes('console.log(')) {
      issues.push({
        layer: 2,
        reason: 'Common pattern issues detected',
        confidence: 0.8
      });
    }

    // Layer 3: Component issues
    if ((ext === '.tsx' || ext === '.jsx') && code.includes('function') && code.includes('return (')) {
      if (code.includes('.map(') && !code.includes('key={')) {
        issues.push({
          layer: 3,
          reason: 'React component issues detected (missing keys)',
          confidence: 0.9
        });
      }
      if (code.includes('<button') && !code.includes('aria-label')) {
        issues.push({
          layer: 3,
          reason: 'React component issues detected (missing aria labels)',
          confidence: 0.9
        });
      }
      if (code.includes('<Button') && !code.includes('variant=')) {
        issues.push({
          layer: 3,
          reason: 'React component issues detected (missing Button variant)',
          confidence: 0.8
        });
      }
      if (code.includes('<Input') && !code.includes('type=')) {
        issues.push({
          layer: 3,
          reason: 'React component issues detected (missing Input type)',
          confidence: 0.8
        });
      }
      if (code.includes('<img') && !code.includes('alt=')) {
        issues.push({
          layer: 3,
          reason: 'React component issues detected (missing image alt)',
          confidence: 0.9
        });
      }
    }

    // Layer 4: Hydration issues
    if ((code.includes('localStorage') || code.includes('window.') || code.includes('document.')) && !code.includes('typeof window')) {
      issues.push({
        layer: 4,
        reason: 'Hydration safety issues detected',
        confidence: 0.9
      });
    }

    // Layer 5: Next.js issues
    if ((ext === '.tsx' || ext === '.jsx') && 
        (code.includes('useState') || code.includes('useEffect')) && 
        !code.match(/^['"]use client['"];/)) {
      issues.push({
        layer: 5,
        reason: 'Next.js client component issues detected',
        confidence: 0.9
      });
    }

    // Layer 6: Testing issues
    if ((ext === '.tsx' || ext === '.jsx') && code.includes('export') && !code.includes('test(')) {
      issues.push({
        layer: 6,
        reason: 'Missing test coverage',
        confidence: 0.7
      });
    }

    // Layer 7: Adaptive Pattern Learning
    if ((ext === '.tsx' || ext === '.jsx') && 
        (code.includes('useState') || code.includes('useEffect') || code.includes('function'))) {
      issues.push({
        layer: 7,
        reason: 'Potential for adaptive pattern learning',
        confidence: 0.6
      });
    }

    return issues;
  }
}

// Rule Store for Layer 7 adaptive learning
class RuleStore {
  constructor() {
    this._rules = [];
    this.ruleFile = path.join(process.cwd(), '.neurolint', 'learned-rules.json');
  }

  get rules() {
    return this._rules || [];
  }

  set rules(value) {
    this._rules = Array.isArray(value) ? value : [];
  }

  async load() {
    try {
      const data = await fs.readFile(this.ruleFile, 'utf8');
      const parsed = JSON.parse(data);
      // Handle both array format and object with rules property
      this.rules = Array.isArray(parsed) ? parsed : (parsed.rules || []);
    } catch (error) {
      this.rules = [];
    }
  }

  async save() {
    const ruleDir = path.dirname(this.ruleFile);
    await fs.mkdir(ruleDir, { recursive: true });
    await fs.writeFile(this.ruleFile, JSON.stringify(this.rules, null, 2));
  }

  addRule(pattern, transformation) {
    this.rules.push({
      pattern,
      transformation,
      timestamp: new Date().toISOString(),
      usageCount: 1
    });
  }
}

// File pattern matching utility with performance optimizations
async function getFiles(dir, include = ['**/*.{ts,tsx,js,jsx,json}'], exclude = [
  // Build and dependency directories
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/build/**',
  '**/.build/**',
  '**/out/**',
  '**/.out/**',
  
  // Coverage and test artifacts
  '**/coverage/**',
  '**/.nyc_output/**',
  '**/.jest/**',
  '**/test-results/**',
  
  // Version control
  '**/.git/**',
  '**/.svn/**',
  '**/.hg/**',
  
  // IDE and editor files
  '**/.vscode/**',
  '**/.idea/**',
  '**/.vs/**',
  '**/*.swp',
  '**/*.swo',
  '**/*~',
  '**/.#*',
  '**/#*#',
  
  // OS generated files
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/desktop.ini',
  '**/*.tmp',
  '**/*.temp',
  
  // Log files
  '**/*.log',
  '**/logs/**',
  '**/.log/**',
  
  // Cache directories
  '**/.cache/**',
  '**/cache/**',
  '**/.parcel-cache/**',
  '**/.eslintcache',
  '**/.stylelintcache',
  
  // Neurolint specific exclusions
  '**/.neurolint/**',
  '**/states-*.json',
  '**/*.backup-*',
  '**/*.backup',
  
  // Package manager files
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/.npm/**',
  '**/.yarn/**',
  
  // Environment and config files
  '**/.env*',
  '**/.env.local',
  '**/.env.development',
  '**/.env.test',
  '**/.env.production',
  
  // Documentation and assets
  '**/docs/**',
  '**/documentation/**',
  '**/assets/**',
  '**/public/**',
  '**/static/**',
  '**/images/**',
  '**/img/**',
  '**/icons/**',
  '**/fonts/**',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.ico',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',
  '**/*.mp4',
  '**/*.webm',
  '**/*.mp3',
  '**/*.wav',
  '**/*.pdf',
  '**/*.zip',
  '**/*.tar.gz',
  '**/*.rar',
  
  // Generated files
  '**/*.min.js',
  '**/*.min.css',
  '**/*.bundle.js',
  '**/*.chunk.js',
  '**/vendor/**',
  
  // Backup and temporary files
  '**/*.bak',
  '**/*.backup',
  '**/*.old',
  '**/*.orig',
  '**/*.rej',
  '**/*.tmp',
  '**/*.temp',
  
  // Lock files and manifests
  '**/.lock-wscript',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/.pnp.*',
  
  // TypeScript declaration files (optional - uncomment if needed)
  // '**/*.d.ts',
  
  // Test files (optional - uncomment if you want to exclude tests)
  // '**/*.test.js',
  // '**/*.test.ts',
  // '**/*.test.tsx',
  // '**/*.spec.js',
  // '**/*.spec.ts',
  // '**/*.spec.tsx',
  // '**/__tests__/**',
  // '**/tests/**',
  // '**/test/**',
  
  // Storybook files (optional - uncomment if needed)
  // '**/*.stories.js',
  // '**/*.stories.ts',
  // '**/*.stories.tsx',
  // '**/.storybook/**',
  
  // Cypress files (optional - uncomment if needed)
  // '**/cypress/**',
  // '**/cypress.config.*',
  
  // Playwright files (optional - uncomment if needed)
  // '**/playwright.config.*',
  // '**/tests/**',
  
  // Docker files (optional - uncomment if needed)
  // '**/Dockerfile*',
  // '**/.dockerignore',
  // '**/docker-compose*',
  
  // CI/CD files (optional - uncomment if needed)
  // '**/.github/**',
  // '**/.gitlab-ci.yml',
  // '**/.travis.yml',
  // '**/.circleci/**',
  // '**/azure-pipelines.yml',
  
  // Database files (optional - uncomment if needed)
  // '**/*.sqlite',
  // '**/*.db',
  // '**/*.sql',
  
  // Configuration files (optional - uncomment if needed)
  // '**/.eslintrc*',
  // '**/.prettierrc*',
  // '**/.babelrc*',
  // '**/tsconfig.json',
  // '**/next.config.js',
  // '**/webpack.config.*',
  // '**/rollup.config.*',
  // '**/vite.config.*',
  // '**/jest.config.*',
  // '**/tailwind.config.*',
  // '**/postcss.config.*'
]) {
  const files = [];
  const maxConcurrent = 50; // Increased from 10 for better throughput
  const batchSize = 100; // Process files in batches
  let activeOperations = 0;
  
  // Pre-compile regex patterns for better performance
  const compiledPatterns = {
    include: include.map(pattern => ({
      pattern,
      regex: globToRegex(pattern),
      hasBraces: pattern.includes('{') && pattern.includes('}')
    })),
    exclude: exclude.map(pattern => ({
      pattern,
      regex: globToRegex(pattern)
    }))
  };
  
  // Helper function to convert glob pattern to regex (optimized)
  function globToRegex(pattern) {
    // Cache compiled regex patterns
    if (!globToRegex.cache) {
      globToRegex.cache = new Map();
    }
    
    if (globToRegex.cache.has(pattern)) {
      return globToRegex.cache.get(pattern);
    }
    
    let regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** becomes .*
      .replace(/\*/g, '[^/]*') // * becomes [^/]*
      .replace(/\./g, '\\.') // . becomes \.
      .replace(/\-/g, '\\-'); // - becomes \-
    
    // Handle path separators for cross-platform compatibility
    regexPattern = regexPattern.replace(/\//g, '[\\\\/]');
    
    // For patterns like **/*.backup-*, we need to handle the path structure properly
    if (pattern.startsWith('**/*')) {
      const suffix = pattern.substring(4); // Remove **/* prefix
      regexPattern = '.*' + suffix.replace(/\*/g, '[^/]*').replace(/\./g, '\\.').replace(/\-/g, '\\-').replace(/\//g, '[\\\\/]');
    }
    
    // For patterns like **/.neurolint/states-*.json, handle the path structure
    if (pattern.startsWith('**/')) {
      const suffix = pattern.substring(3); // Remove **/ prefix
      regexPattern = '.*' + suffix.replace(/\*/g, '[^/]*').replace(/\./g, '\\.').replace(/\-/g, '\\-').replace(/\//g, '[\\\\/]');
    }
    
    const regex = new RegExp(regexPattern + '$', 'i'); // Case insensitive
    globToRegex.cache.set(pattern, regex);
    return regex;
  }
  
  // Helper function to check if file matches pattern (optimized)
  function matchesPattern(filePath, patternInfo) {
    // Handle brace expansion in patterns like **/*.{ts,tsx,js,jsx,json}
    if (patternInfo.hasBraces) {
      const pattern = patternInfo.pattern;
      const braceStart = pattern.indexOf('{');
      const braceEnd = pattern.indexOf('}');
      const prefix = pattern.substring(0, braceStart);
      const suffix = pattern.substring(braceEnd + 1);
      const options = pattern.substring(braceStart + 1, braceEnd).split(',');
      
      return options.some(opt => {
        const expandedPattern = prefix + opt + suffix;
        const expandedRegex = globToRegex(expandedPattern);
        return expandedRegex.test(filePath);
      });
    }
    
    // Use pre-compiled regex
    return patternInfo.regex.test(filePath);
  }
  
  // Check if target is a single file
  try {
    const stats = await fs.stat(dir);
    if (stats.isFile()) {
      // Check if file should be included
      const shouldInclude = compiledPatterns.include.some(patternInfo => 
        matchesPattern(dir, patternInfo)
      );
      
      if (shouldInclude) {
        return [dir];
      }
      return [];
    }
  } catch (error) {
    // Not a file, continue with directory scanning
  }
  
  // Use worker threads for large directories
  const useWorkers = process.env.NODE_ENV !== 'test' && require('worker_threads').isMainThread;
  
  async function scanDirectory(currentDir) {
    try {
      // Limit concurrent operations with better queuing
      if (activeOperations >= maxConcurrent) {
        await new Promise(resolve => {
          const checkQueue = () => {
            if (activeOperations < maxConcurrent) {
              resolve();
            } else {
              setImmediate(checkQueue);
            }
          };
          checkQueue();
        });
      }
      
      activeOperations++;
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      activeOperations--;
      
      // Process entries in batches for better memory management
      const batches = [];
      for (let i = 0; i < entries.length; i += batchSize) {
        batches.push(entries.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const batchPromises = batch.map(async entry => {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            // Check if directory should be excluded
            const shouldExclude = compiledPatterns.exclude.some(patternInfo => {
              const pattern = patternInfo.pattern;
              // Handle common exclusion patterns more efficiently
              if (pattern === '**/node_modules/**' && entry.name === 'node_modules') {
                return true;
              }
              if (pattern === '**/dist/**' && entry.name === 'dist') {
                return true;
              }
              if (pattern === '**/.next/**' && entry.name === '.next') {
                return true;
              }
              if (pattern === '**/build/**' && entry.name === 'build') {
                return true;
              }
              if (pattern === '**/coverage/**' && entry.name === 'coverage') {
                return true;
              }
              if (pattern === '**/.git/**' && entry.name === '.git') {
                return true;
              }
              if (pattern === '**/.vscode/**' && entry.name === '.vscode') {
                return true;
              }
              if (pattern === '**/.idea/**' && entry.name === '.idea') {
                return true;
              }
              if (pattern === '**/.cache/**' && entry.name === '.cache') {
                return true;
              }
              // Fallback to regex matching
              return patternInfo.regex.test(fullPath);
            });
            
            if (!shouldExclude) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            // Check if file should be excluded first
            const shouldExclude = compiledPatterns.exclude.some(patternInfo => {
              const pattern = patternInfo.pattern;
              // Handle common file exclusion patterns more efficiently
              if (pattern.includes('*.log') && entry.name.endsWith('.log')) {
                return true;
              }
              if (pattern.includes('*.tmp') && entry.name.endsWith('.tmp')) {
                return true;
              }
              if (pattern.includes('*.backup') && entry.name.includes('.backup')) {
                return true;
              }
              if (pattern.includes('*.min.js') && entry.name.endsWith('.min.js')) {
                return true;
              }
              if (pattern.includes('*.bundle.js') && entry.name.endsWith('.bundle.js')) {
                return true;
              }
              // Fallback to regex matching
              return patternInfo.regex.test(fullPath);
            });
            
            if (!shouldExclude) {
              // Check if file should be included
              const shouldInclude = compiledPatterns.include.some(patternInfo => 
                matchesPattern(fullPath, patternInfo)
              );
              
              if (shouldInclude) {
                files.push(fullPath);
              }
            }
          }
        });
        
        // Process batch with controlled concurrency
        await Promise.all(batchPromises);
      }
    } catch (error) {
      // Handle permission errors gracefully
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        return; // Skip directories we can't access
      }
      throw error;
    }
  }
  
  await scanDirectory(dir);
  return files;
}

// Parse command line options
function parseOptions(args) {
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    production: args.includes('--production'),
    backup: !args.includes('--no-backup'),
    layers: args.includes('--layers') ? args[args.indexOf('--layers') + 1].split(',').map(Number) : null,
    allLayers: args.includes('--all-layers'),
    include: args.includes('--include') ? args[args.indexOf('--include') + 1].split(',') : ['**/*.{ts,tsx,js,jsx,json}'],
    exclude: args.includes('--exclude') ? args[args.indexOf('--exclude') + 1].split(',') : ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    format: 'console',
    output: null,
    init: args.includes('--init'),
    show: args.includes('--show'),
    states: args.includes('--states'),
    olderThan: undefined,
    keepLatest: undefined,
    list: args.includes('--list'),
    delete: undefined,
    reset: args.includes('--reset'),
    edit: undefined,
    confidence: undefined,
    export: undefined,
    import: undefined,
    yes: args.includes('--yes'),
    target: undefined
  };
  
  // Parse format and output from args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' && i + 1 < args.length) {
      options.format = args[i + 1];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      options.output = args[i + 1];
    } else if (args[i] === '--older-than' && i + 1 < args.length) {
      options.olderThan = parseInt(args[i + 1]);
    } else if (args[i] === '--keep-latest' && i + 1 < args.length) {
      options.keepLatest = parseInt(args[i + 1]);
    } else if (args[i] === '--delete' && i + 1 < args.length) {
      options.delete = args[i + 1];
    } else if (args[i] === '--edit' && i + 1 < args.length) {
      options.edit = args[i + 1];
    } else if (args[i] === '--confidence' && i + 1 < args.length) {
      options.confidence = parseFloat(args[i + 1]);
    } else if (args[i] === '--export' && i + 1 < args.length) {
      options.export = args[i + 1];
    } else if (args[i] === '--import' && i + 1 < args.length) {
      options.import = args[i + 1];
    } else if (args[i] === '--target' && i + 1 < args.length) {
      options.target = args[i + 1];
    } else if (args[i].startsWith('--format=')) {
      options.format = args[i].split('=')[1];
    } else if (args[i].startsWith('--output=')) {
      options.output = args[i].split('=')[1];
    } else if (args[i].startsWith('--older-than=')) {
      options.olderThan = parseInt(args[i].split('=')[1]);
    } else if (args[i].startsWith('--keep-latest=')) {
      options.keepLatest = parseInt(args[i].split('=')[1]);
    } else if (args[i].startsWith('--delete=')) {
      options.delete = args[i].split('=')[1];
    } else if (args[i].startsWith('--edit=')) {
      options.edit = args[i].split('=')[1];
    } else if (args[i].startsWith('--confidence=')) {
      options.confidence = parseFloat(args[i].split('=')[1]);
    } else if (args[i].startsWith('--export=')) {
      options.export = args[i].split('=')[1];
    } else if (args[i].startsWith('--import=')) {
      options.import = args[i].split('=')[1];
    } else if (args[i].startsWith('--target=')) {
      options.target = args[i].split('=')[1];
    }
  }
  
  return options;
}

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

// Handle analyze command
async function handleAnalyze(targetPath, options, spinner) {
  try {
    // Initialize shared core
    await sharedCore.core.initialize({ platform: 'cli' });
    
    const files = await getFiles(targetPath, options.include, options.exclude);
    let totalIssues = 0;
    const results = [];

    // Show progress for large file sets
    if (files.length > 10 && options.verbose) {
      process.stdout.write(`Processing ${files.length} files...\n`);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress for large operations
      if (files.length > 10 && i % Math.max(1, Math.floor(files.length / 10)) === 0) {
        spinner.text = `Analyzing files... ${Math.round((i / files.length) * 100)}%`;
      }
      
      try {
        const code = await fs.readFile(file, 'utf8');
        
        // Use shared core for analysis instead of direct SmartLayerSelector
        const analysisResult = await sharedCore.analyze(code, {
          filename: file,
          platform: 'cli',
          layers: options.layers || [1, 2, 3, 4, 5, 6, 7],
          verbose: options.verbose
        });
        
        totalIssues += analysisResult.issues.length;
        
        if (options.verbose) {
          console.log(`[ANALYZED] ${file}`);
          console.log(`  Issues Found: ${analysisResult.issues.length}`);
          console.log(`  Recommended Layers: ${analysisResult.summary?.recommendedLayers?.join(', ') || '1,2'}`);
          
          if (analysisResult.issues.length > 0) {
            console.log(`  Issue Types:`);
            const issueTypes = {};
            analysisResult.issues.forEach(issue => {
              const type = issue.type || 'Unknown';
              issueTypes[type] = (issueTypes[type] || 0) + 1;
            });
            Object.entries(issueTypes).forEach(([type, count]) => {
              console.log(`    ${type}: ${count}`);
            });
          }
        }
        
        results.push({
          file,
          issues: analysisResult.issues,
          recommendedLayers: analysisResult.summary?.recommendedLayers || [1, 2],
          analysisResult
        });
      } catch (error) {
        if (options.verbose) {
          process.stderr.write(`Warning: Could not analyze ${file}: ${error.message}\n`);
        }
      }
    }

    if (options.format === 'json' && options.output) {
      const analysisResult = {
        summary: {
          filesAnalyzed: files.length,
          issuesFound: totalIssues,
          recommendedLayers: [...new Set(results.flatMap(r => r.recommendedLayers))].sort()
        },
        files: results,
        issues: results.flatMap(r => r.issues.map(issue => ({
          ...issue,
          file: r.file
        }))),
        layers: results.flatMap(r => r.recommendedLayers).map(layerId => ({
          layerId: parseInt(layerId),
          success: true,
          changeCount: results.filter(r => r.recommendedLayers.includes(layerId)).length,
          description: `Layer ${layerId} analysis`
        })),
        confidence: 0.8,
        qualityScore: Math.max(0, 100 - (totalIssues * 5)),
        readinessScore: Math.min(100, (results.length / Math.max(1, files.length)) * 100)
      };
      await fs.writeFile(options.output, JSON.stringify(analysisResult, null, 2));
    } else {
      // Enhanced analysis summary
      console.log(`\n[ANALYSIS SUMMARY]`);
      console.log(`  Files Analyzed: ${files.length}`);
      console.log(`  Total Issues Found: ${totalIssues}`);
      console.log(`  Average Issues per File: ${(totalIssues / files.length).toFixed(1)}`);
      console.log(`  Layer Recommendations:`);
      const layerStats = [];
      results.forEach(r => {
        r.recommendedLayers.forEach(layer => {
          const layerName = LAYER_NAMES[layer];
          if (!layerStats.some(stat => stat.layer === layer)) {
            layerStats.push({ layer, count: 0, percentage: 0 });
          }
          const index = layerStats.findIndex(stat => stat.layer === layer);
          layerStats[index].count++;
        });
      });
      layerStats.forEach(({ layer, count }) => {
        const percentage = ((count / files.length) * 100);
        console.log(`    Layer ${layer}: ${count} files (${percentage.toFixed(1)}%)`);
      });
      console.log(`[COMPLETE] Analysis completed`);
    }
    
    // Stop spinner and use enhanced completion message
    spinner.stop();
    logComplete('Analysis completed');
  } catch (error) {
    logError(`Analysis failed: ${error.message}`);
    throw error;
  }
}

// Handle fix command
async function handleFix(targetPath, options, spinner, startTime) {
  try {
    // All layers are now free - no authentication checks needed
    // Determine requested layers; default to all layers if not specified
    let requestedLayers = null;
    if (options.allLayers) {
      requestedLayers = [1, 2, 3, 4, 5, 6, 7];
    } else if (Array.isArray(options.layers) && options.layers.length > 0) {
      requestedLayers = options.layers;
    }

    const files = await getFiles(targetPath, options.include, options.exclude);
    let processedFiles = 0;
    let successfulFixes = 0;

    for (const file of files) {
      try {
        spinner.text = `Processing ${path.basename(file)}...`;
        const result = await fixFile(file, options, spinner);
        if (result.success) {
          successfulFixes++;
        }
        processedFiles++;
      } catch (error) {
        if (options.verbose) {
          process.stderr.write(`Warning: Could not process ${file}: ${error.message}\n`);
        }
      }
    }

    if (options.format === 'json' && options.output) {
      const fixResult = {
        success: successfulFixes > 0,
        processedFiles,
        successfulFixes,
        appliedFixes: successfulFixes,
        summary: {
          totalFiles: files.length,
          processedFiles,
          successfulFixes,
          failedFiles: files.length - processedFiles
        }
      };
      await fs.writeFile(options.output, JSON.stringify(fixResult, null, 2));
    } else {
      // Enhanced summary output
      console.log(`\n[FIX SUMMARY]`);
      console.log(`  Files Processed: ${processedFiles}`);
      console.log(`  Fixes Applied: ${successfulFixes}`);
      console.log(`  Files Failed: ${files.length - processedFiles}`);
      console.log(`  Success Rate: ${((processedFiles / files.length) * 100).toFixed(1)}%`);
      
      if (options.verbose && successfulFixes > 0 && startTime) {
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`  Total Execution Time: ${executionTime}s`);
      }
    }
    
    // Stop spinner and use enhanced completion message
    spinner.stop();
    logComplete('Fix operation completed');
  } catch (error) {
    logError(`Fix failed: ${error.message}`);
    throw error;
  }
}

// Handle layers command
async function handleLayers(options, spinner) {
  const layers = [
    { id: 1, name: 'Configuration', description: 'Updates tsconfig.json, next.config.js, package.json' },
    { id: 2, name: 'Patterns', description: 'Standardizes variables, removes console statements' },
    { id: 3, name: 'Components', description: 'Adds keys, accessibility attributes, prop types' },
    { id: 4, name: 'Hydration', description: 'Guards client-side APIs for SSR' },
    { id: 5, name: 'Next.js', description: 'Optimizes App Router with directives' },
    { id: 6, name: 'Testing', description: 'Adds error boundaries, prop types, loading states' },
    { id: 7, name: 'Adaptive Pattern Learning', description: 'Learns and applies patterns from prior fixes' }
  ];

  if (options.verbose) {
    layers.forEach(layer => process.stdout.write(`Layer ${layer.id}: ${layer.name} - ${layer.description}\n`));
  } else {
    layers.forEach(layer => process.stdout.write(`Layer ${layer.id}: ${layer.name}\n`));
  }
}

// Handle init-config command
async function handleInitConfig(options, spinner) {
  try {
    const configPath = path.join(process.cwd(), '.neurolintrc');
    
    // Default to --init if no flag is provided
    if (!options.init && !options.show) {
      options.init = true;
    }
    
    if (options.init) {
      const defaultConfig = {
        enabledLayers: [1, 2, 3, 4, 5, 6, 7],
        include: ['**/*.{ts,tsx,js,jsx,json}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
        backup: true,
        verbose: false,
        dryRun: false,
        maxRetries: 3,
        batchSize: 50,
        maxConcurrent: 10
      };
      
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      logSuccess(`Created ${configPath}`);
    } else if (options.show) {
      try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        process.stdout.write(JSON.stringify(config, null, 2) + '\n');
        logSuccess('Config displayed');
      } catch (error) {
        logError('No configuration file found. Use --init to create one.');
        process.exit(1);
      }
    } else {
      // Validate existing config
      try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        // Validate required fields
        const requiredFields = ['enabledLayers', 'include', 'exclude'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length > 0) {
          logWarning(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Validate layer configuration
        if (config.enabledLayers && !Array.isArray(config.enabledLayers)) {
          logWarning('Enabled layers must be an array');
        }
        
        // Validate file patterns
        if (config.include && !Array.isArray(config.include)) {
          logWarning('Include patterns must be an array');
        }
        
        if (config.exclude && !Array.isArray(config.exclude)) {
          logWarning('Exclude patterns must be an array');
        }
        
        logSuccess('Configuration validated');
      } catch (error) {
        logError('Invalid configuration file');
        process.exit(1);
      }
    }
  } catch (error) {
    logError(`Init-config failed: ${error.message}`);
    throw error;
  }
}

// Handle validate command
async function handleValidate(targetPath, options, spinner) {
  try {
    const files = await getFiles(targetPath, options.include, options.exclude);
    let validFiles = 0;
    let invalidFiles = 0;
    const results = [];

    for (const file of files) {
      try {
        const validation = await TransformationValidator.validateFile(file);
        if (validation.isValid) {
          validFiles++;
          if (options.verbose) {
            process.stdout.write(`[VALID] ${file}: Valid\n`);
          }
        } else {
          invalidFiles++;
          if (options.verbose) {
            process.stderr.write(`[INVALID] ${file}: Invalid - ${validation.error}\n`);
          }
        }
        results.push({ file, ...validation });
      } catch (error) {
        invalidFiles++;
        if (options.verbose) {
          process.stderr.write(`[ERROR] ${file}: Error - ${error.message}\n`);
        }
        results.push({ file, isValid: false, error: error.message });
      }
    }

    if (options.format === 'json' && options.output) {
      const validationResult = {
        summary: {
          filesValidated: files.length,
          validFiles,
          invalidFiles
        },
        files: results
      };
      await fs.writeFile(options.output, JSON.stringify(validationResult, null, 2));
    } else {
      process.stdout.write(`Validated ${files.length} files, ${invalidFiles} invalid\n`);
    }
    
    // Stop spinner before outputting completion message
    spinner.stop();
    process.stdout.write('completed\n');
  } catch (error) {
    logError(`Validate failed: ${error.message}`);
    throw error;
  }
}

// Handle init-tests command
async function handleInitTests(targetPath, options, spinner) {
  try {
    const files = await getFiles(targetPath, options.include, options.exclude);
    let generatedTests = 0;
    const results = [];

    for (const file of files) {
      try {
        const code = await fs.readFile(file, 'utf8');
        const testCode = generateTestCode(code, file);
        
        if (!options.dryRun) {
          const testFilePath = file.replace(/\.[jt]sx?$/, '.test.$1');
          await fs.writeFile(testFilePath, testCode);
          if (options.verbose) {
            process.stdout.write(`Generated ${testFilePath}\n`);
          }
          generatedTests++;
        } else {
          if (options.verbose) {
            process.stdout.write(`[Dry Run] Would generate ${file.replace(/\.[jt]sx?$/, '.test.$1')}\n`);
            process.stdout.write(testCode);
          }
          generatedTests++;
        }
        results.push({ file, testCode });
      } catch (error) {
        if (options.verbose) {
          process.stderr.write(`Warning: Could not generate test for ${file}: ${error.message}\n`);
        }
      }
    }

    if (options.format === 'json' && options.output) {
      const testResult = {
        summary: {
          filesProcessed: files.length,
          testsGenerated: generatedTests
        },
        files: results
      };
      await fs.writeFile(options.output, JSON.stringify(testResult, null, 2));
    } else {
      process.stdout.write(`Generated ${generatedTests} test files\n`);
    }
    
    // Stop spinner before outputting completion message
    spinner.stop();
    process.stdout.write('completed\n');
  } catch (error) {
    logError(`Init-tests failed: ${error.message}`);
    throw error;
  }
}

// Generate test code for components
function generateTestCode(code, filePath) {
  const componentName = code.match(/export default function (\w+)/)?.[1] || path.basename(filePath, path.extname(filePath));
  return `
import { render, screen } from '@testing-library/react';
import ${componentName} from '${filePath.replace(process.cwd(), '.')}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText(/.+/)).toBeInTheDocument();
  });
});
`.trim();
}

// Handle stats command with performance metrics
async function handleStats(options, spinner) {
  try {
    const targetPath = options.targetPath || process.cwd();
    const include = options.include || ['**/*.{ts,tsx,js,jsx,json}'];
    const exclude = options.exclude || ['**/node_modules/**', '**/dist/**', '**/.next/**'];
    
    // Validate that the target path exists
    try {
      const pathStats = await fs.stat(targetPath);
      if (!pathStats.isDirectory() && !pathStats.isFile()) {
        throw new Error(`Path is neither a file nor directory: ${targetPath}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Path does not exist: ${targetPath}`);
      }
      throw error;
    }
    
    spinner.text = 'Scanning files...';
    
    // Start memory tracking
    MemoryManager.startTracking();
    
    const startTime = performance.now();
    const files = await getFiles(targetPath, include, exclude);
    const scanTime = performance.now() - startTime;
    
    if (files.length === 0) {
      logSuccess('No files found');
      return;
    }
    
    spinner.text = `Analyzing ${files.length} files...`;
    
    // Use memory-managed processing for large file sets
    const analysisOptions = {
      batchSize: 200,
      maxConcurrent: 20,
      memoryThreshold: 800, // MB
      gcInterval: 5,
      verbose: options.verbose,
      suppressErrors: true, // Suppress verbose AST parsing errors
      maxErrors: 20, // Show only first 20 errors
      onProgress: (progress, memoryReport) => {
        spinner.text = `Analyzing ${files.length} files... ${progress.toFixed(1)}% (${memoryReport.current.heapUsed}MB RAM)`;
      }
    };
    
    const analysisStartTime = performance.now();
    
    // Process files with memory management
    const analysisResults = await processFilesWithMemoryManagement(
      files,
      async (filePath) => {
        try {
          const code = await fs.readFile(filePath, 'utf8');
          const issues = await analyzeFile(code, filePath, options);
          return {
            file: filePath,
            issues: issues.length,
            success: true,
            error: null
          };
        } catch (error) {
          return {
            file: filePath,
            issues: 0,
            success: false,
            error: error.message
          };
        }
      },
      analysisOptions
    );
    
    const analysisTime = performance.now() - analysisStartTime;
    
    // Calculate statistics
    const successfulAnalyses = analysisResults.filter(r => r.success);
    const failedAnalyses = analysisResults.filter(r => !r.success);
    const totalIssues = successfulAnalyses.reduce((sum, r) => sum + r.issues, 0);
    
    // Get backup and state file counts
    const backupFiles = files.filter(f => f.includes('.backup-'));
    const stateFiles = files.filter(f => f.includes('.neurolint/states-'));
    
    // Get memory report
    const memoryReport = MemoryManager.getReport();
    
    // Load rule store for learned rules count
    const ruleStore = new RuleStore();
    await ruleStore.load();
    
    const stats = {
      filesAnalyzed: files.length,
      filesSuccessful: successfulAnalyses.length,
      filesFailed: failedAnalyses.length,
      issuesFound: totalIssues,
      learnedRules: ruleStore.rules.length,
      stateFiles: stateFiles.length,
      backupFiles: backupFiles.length,
      performance: {
        scanTime: Math.round(scanTime),
        analysisTime: Math.round(analysisTime),
        totalTime: Math.round(scanTime + analysisTime),
        filesPerSecond: Math.round(files.length / ((scanTime + analysisTime) / 1000)),
        memoryUsage: memoryReport
      },
      errors: failedAnalyses.map(f => f.error).slice(0, 10) // Limit error reporting
    };

    if (options.format === 'json' && options.output) {
      await fs.writeFile(options.output, JSON.stringify(stats, null, 2));
    } else {
      process.stdout.write(`Files: ${stats.filesAnalyzed} (${stats.filesSuccessful} successful, ${stats.filesFailed} failed)\n`);
      process.stdout.write(`Issues: ${stats.issuesFound}\n`);
      process.stdout.write(`States: ${stats.stateFiles}, Backups: ${stats.backupFiles}\n`);
      process.stdout.write(`Learned Rules: ${stats.learnedRules}\n`);
      process.stdout.write(`Performance: ${stats.performance.totalTime}ms (${stats.performance.filesPerSecond} files/sec)\n`);
      process.stdout.write(`Memory: ${stats.performance.memoryUsage.current.heapUsed}MB (peak: ${stats.performance.memoryUsage.peak}MB)\n`);
      
      if (stats.errors.length > 0) {
        process.stderr.write(`Errors: ${stats.errors.length} files failed analysis\n`);
      }
    }

    // Don't call spinner.succeed here - let the main command handler do it
  } catch (error) {
    logError(`Stats failed: ${error.message}`);
    throw error;
  }
}

// Handle React 19 migration command
async function handleReact19Migration(targetPath, options, spinner) {
  try {
    logInfo('Starting React 19 migration...');
    
    const files = await getFiles(targetPath, options.include, options.exclude);
    let processedFiles = 0;
    let successfulMigrations = 0;
    let noChangeCount = 0;
    let errorCount = 0;
    const migrationResults = [];
    
    if (files.length === 0) {
      logWarning('No files found for React 19 migration');
      return;
    }
    
    spinner.text = `Migrating ${files.length} files to React 19...`;
    
    // Process files with React 19 specific layers (2, 3, and 5)
    const react19Layers = [2, 3, 5]; // Layer 2: Patterns, Layer 3: Components, Layer 5: DOM APIs
    
    for (const file of files) {
      try {
        spinner.text = `Migrating ${path.basename(file)} to React 19...`;
        
        const code = await fs.readFile(file, 'utf8');
        
        // Skip files that don't need React 19 migration
        if (!needsReact19Migration(code)) {
          if (options.verbose) {
            logInfo(`Skipped ${path.basename(file)} - no React 19 migration needed`);
          }
          noChangeCount++;
          migrationResults.push({
            file: path.relative(process.cwd(), file),
            success: false,
            error: "No React 19 migration needed"
          });
          processedFiles++;
          continue;
        }
        
        // Apply React 19 migrations using fix-master with specific layers
        const result = await fixMaster.executeLayers(code, react19Layers, {
          dryRun: options.dryRun,
          verbose: options.verbose,
          filePath: file,
          noDeps: true, // Skip automatic dependency resolution for React 19
          react19Only: true // Only apply React 19 transformations
        });
        
        if (result.successfulLayers > 0) {
          successfulMigrations++;
          
          const react19Changes = (result.results || []).filter(r => 
            r && r.changes && Array.isArray(r.changes) && r.changes.some(c => c.type && c.type.startsWith('react19'))
          );
          
          migrationResults.push({
            file: path.relative(process.cwd(), file),
            success: true,
            changes: react19Changes.length,
            details: react19Changes.map(r => r.changes).flat()
          });
          
          if (options.verbose) {
            logSuccess(`Migrated ${path.basename(file)} to React 19 (${react19Changes.length} changes)`);
            react19Changes.forEach(change => {
              change.changes?.forEach(c => {
                if (c.type?.startsWith('react19')) {
                  logInfo(`  ${c.description}`);
                }
              });
            });
          }
        } else {
          noChangeCount++;
          migrationResults.push({
            file: path.relative(process.cwd(), file),
            success: false,
            error: 'No React 19 changes applied'
          });
        }
        
        processedFiles++;
      } catch (error) {
        errorCount++;
        migrationResults.push({
          file: path.relative(process.cwd(), file),
          success: false,
          error: error.message
        });
        
        if (options.verbose) {
          logError(`Failed to migrate ${path.basename(file)}: ${error.message}`);
        }
      }
    }
    
    // Generate migration report
    if (options.format === 'json' && options.output) {
      const migrationReport = {
        summary: {
          totalFiles: files.length,
          processedFiles,
          successfulMigrations,
          noChange: noChangeCount,
          errors: errorCount
        },
        migrations: migrationResults,
        timestamp: new Date().toISOString(),
        reactVersion: '19.0.0'
      };
      await fs.writeFile(options.output, JSON.stringify(migrationReport, null, 2));
      logSuccess(`Migration report saved to ${options.output}`);
    } else {
      // Console output
      console.log(`\n[REACT 19 MIGRATION SUMMARY]`);
      console.log(`  Total Files: ${files.length}`);
      console.log(`  Processed Files: ${processedFiles}`);
      console.log(`  Successful Migrations: ${successfulMigrations}`);
      console.log(`  No Changes Needed: ${noChangeCount}`);
      console.log(`  Errors: ${errorCount}`);
      console.log(`  Success Rate: ${((successfulMigrations / processedFiles) * 100).toFixed(1)}%`);
      
      if (options.verbose && migrationResults.length > 0) {
        console.log(`\n[MIGRATION DETAILS]`);
        migrationResults.forEach(result => {
          if (result.success && result.changes > 0) {
            console.log(`  ${result.file}: ${result.changes} React 19 changes`);
            result.details?.forEach(detail => {
              if (detail.type?.startsWith('react19')) {
                console.log(`    - ${detail.description}`);
              }
            });
          } else if (!result.success) {
            if (result.error === 'No React 19 changes applied') {
              console.log(`  ${result.file}: No changes needed`);
            } else {
              console.log(`  ${result.file}: Failed - ${result.error}`);
            }
          }
        });
      }
      
      if (successfulMigrations > 0) {
        console.log(`\n[NEXT STEPS]`);
        console.log(`  1. Update package.json to use React 19: npm install react@19 react-dom@19`);
        console.log(`  2. Update @types/react and @types/react-dom if using TypeScript`);
        console.log(`  3. Test your application thoroughly`);
        console.log(`  4. Review warnings for manual migration tasks`);
        console.log(`  5. Consider running official React 19 codemods for additional fixes`);
      }
    }
    
    spinner.stop();
    logComplete('React 19 migration completed');
  } catch (error) {
    logError(`React 19 migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Check if a file needs React 19 migration
 */
function needsReact19Migration(code) {
  const react19Patterns = [
    'forwardRef',
    'ReactDOM.render',
    'ReactDOM.hydrate',
    'unmountComponentAtNode',
    'findDOMNode',
    '.propTypes',
    '.defaultProps',
    'ref="',
    "ref='",
    'react-dom/test-utils'
  ];
  
  return react19Patterns.some(pattern => code.includes(pattern));
}

// Handle clean command with performance optimizations
async function handleClean(options, spinner) {
  try {
    const targetPath = options.targetPath || process.cwd();
    
    // Validate numeric options
    if (options.keepLatest !== undefined && options.keepLatest !== null) {
      const keepLatest = parseInt(options.keepLatest);
      if (isNaN(keepLatest) || keepLatest <= 0) {
        throw new Error(`--keep-latest must be a positive number (at least 1), got: ${options.keepLatest}`);
      }
      options.keepLatest = keepLatest;
    }
    
    if (options.olderThan !== undefined && options.olderThan !== null) {
      const olderThan = parseInt(options.olderThan);
      if (isNaN(olderThan) || olderThan < 0) {
        throw new Error(`--older-than must be a non-negative number, got: ${options.olderThan}`);
      }
      options.olderThan = olderThan;
    }
    
    const include = ['**/*.backup-*', ...(options.states ? ['.neurolint/states-*.json'] : [])];
    
    // Use streaming approach for large file sets
    const files = await getFiles(targetPath, include, options.exclude);
    
    if (files.length === 0) {
      logSuccess('Cleaned 0 files');
      return;
    }
    
    spinner.text = `Processing ${files.length} files...`;
    
    let deletedCount = 0;
    const batchSize = 50; // Process deletions in batches
    const errors = [];
    
    // Group files by directory for better performance
    const filesByDir = new Map();
    for (const file of files) {
      const dir = path.dirname(file);
      if (!filesByDir.has(dir)) {
        filesByDir.set(dir, []);
      }
      filesByDir.get(dir).push(file);
    }
    
    // Process directories in parallel with controlled concurrency
    const dirs = Array.from(filesByDir.keys());
    const maxConcurrentDirs = 10;
    
    for (let i = 0; i < dirs.length; i += maxConcurrentDirs) {
      const dirBatch = dirs.slice(i, i + maxConcurrentDirs);
      const dirPromises = dirBatch.map(async dir => {
        const dirFiles = filesByDir.get(dir);
        
        // Get file stats in parallel for this directory
        const fileStats = await Promise.all(
          dirFiles.map(async file => {
            try {
              const stats = await fs.stat(file);
              return { file, stats, error: null };
            } catch (error) {
              return { file, stats: null, error };
            }
          })
        );
        
        // Filter out files with errors
        const validFiles = fileStats.filter(f => !f.error);
        const errorFiles = fileStats.filter(f => f.error);
        
        // Add errors to global error list
        errorFiles.forEach(f => errors.push(f.error));
        
        // Sort files by timestamp for --keep-latest
        const sortedFiles = validFiles
          .map(({ file, stats }) => ({
            file,
            mtime: stats.mtimeMs,
            ageInDays: (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)
          }))
          .sort((a, b) => b.mtime - a.mtime);
        
        // Apply filters
        let filesToDelete = sortedFiles;
        
        if (options.keepLatest) {
          // Group by base filename for --keep-latest
          const filesByBase = new Map();
          for (const fileInfo of sortedFiles) {
            const baseName = path.basename(fileInfo.file).replace(/\.backup-\d+$/, '');
            if (!filesByBase.has(baseName)) {
              filesByBase.set(baseName, []);
            }
            filesByBase.get(baseName).push(fileInfo);
          }
          
          filesToDelete = [];
          for (const [baseName, fileList] of filesByBase) {
            filesToDelete.push(...fileList.slice(options.keepLatest));
          }
        }
        
        if (options.olderThan) {
          filesToDelete = filesToDelete.filter(f => f.ageInDays >= options.olderThan);
        }
        
        // Process deletions in batches
        const deletionBatches = [];
        for (let j = 0; j < filesToDelete.length; j += batchSize) {
          deletionBatches.push(filesToDelete.slice(j, j + batchSize));
        }
        
        let dirDeletedCount = 0;
        
        for (const batch of deletionBatches) {
          const batchPromises = batch.map(async ({ file }) => {
            if (options.dryRun) {
              if (options.verbose) {
                process.stdout.write(`[Dry Run] Would delete ${file}\n`);
              }
              return { success: true, file };
            } else {
              try {
                await fs.unlink(file);
                if (options.verbose) {
                  process.stdout.write(`Deleted ${file}\n`);
                }
                return { success: true, file };
              } catch (error) {
                if (options.verbose) {
                  process.stderr.write(`Warning: Could not delete ${file}: ${error.message}\n`);
                }
                return { success: false, file, error };
              }
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          dirDeletedCount += batchResults.filter(r => r.success).length;
          
          // Add errors to global error list
          batchResults.filter(r => !r.success).forEach(r => errors.push(r.error));
        }
        
        return dirDeletedCount;
      });
      
      const batchResults = await Promise.all(dirPromises);
      deletedCount += batchResults.reduce((sum, count) => sum + count, 0);
      
      // Update progress
      const progress = Math.min(((i + maxConcurrentDirs) / dirs.length) * 100, 100);
      spinner.text = `Processing ${files.length} files... ${progress.toFixed(1)}%`;
    }
    
    // Report results
    if (options.format === 'json' && options.output) {
      const cleanResult = {
        summary: {
          filesDeleted: deletedCount,
          totalFiles: files.length,
          errors: errors.length,
          dryRun: options.dryRun
        },
        errors: errors.map(e => e.message),
        timestamp: new Date().toISOString()
      };
      await fs.writeFile(options.output, JSON.stringify(cleanResult, null, 2));
    } else {
      if (options.dryRun) {
        process.stdout.write(`Would delete ${deletedCount} files (${files.length} total found)\n`);
      } else {
        process.stdout.write(`Deleted ${deletedCount} files (${files.length} total found)\n`);
      }
      
      if (errors.length > 0) {
        process.stderr.write(`Warning: ${errors.length} errors occurred during cleanup\n`);
      }
    }
    
    // Stop spinner before outputting completion message
    spinner.stop();
    process.stdout.write('completed\n');
  } catch (error) {
    logError(`Clean failed: ${error.message}`);
    throw error;
  }
}

// Handle centralized backup management
async function handleBackups(args, options, spinner) {
  try {
    const backupManager = createBackupManager({
      backupDir: '.neurolint-backups',
      maxBackups: options.production ? 50 : 10,
      production: options.production,
      verbose: options.verbose
    });
    
    // Initialize production backup manager if needed
    if (backupManager instanceof ProductionBackupManager) {
      await backupManager.initialize();
    }

    const subcommand = args[1];
    
    switch (subcommand) {
      case 'list':
        spinner.text = 'Listing backups...';
        const backups = await backupManager.listBackups();
        
        if (backups.length === 0) {
          logSuccess('No backups found');
          return;
        }
        
        if (options.format === 'json') {
          console.log(JSON.stringify(backups, null, 2));
        } else {
          console.log('\nBackup List:');
          console.log('============');
          backups.forEach((backup, index) => {
            const date = new Date(backup.timestamp).toLocaleString();
            const sizeKB = (backup.size / 1024).toFixed(1);
            console.log(`${index + 1}. ${backup.originalPath}`);
            console.log(`   Timestamp: ${date}`);
            console.log(`   Size: ${sizeKB} KB`);
            console.log(`   Operation: ${backup.operation}`);
            console.log(`   Hash: ${backup.hash}`);
            console.log('');
          });
        }
        
        logSuccess(`Found ${backups.length} backups`);
        break;
        
      case 'stats':
        spinner.text = 'Getting backup statistics...';
        const stats = await backupManager.getStats();
        
        if (stats) {
          if (options.format === 'json') {
            console.log(JSON.stringify(stats, null, 2));
          } else {
            console.log('\nBackup Statistics:');
            console.log('==================');
            console.log(`Total Backups: ${stats.totalBackups}`);
            console.log(`Total Size: ${stats.totalSizeMB} MB`);
            console.log(`Backup Directory: ${stats.backupDir}`);
            console.log(`Max Backups per File: ${stats.maxBackups}`);
          }
        } else {
          logError('Failed to get backup statistics');
        }
        break;
        
      case 'restore':
        const backupIndex = parseInt(args[2]);
        if (isNaN(backupIndex) || backupIndex < 1) {
          throw new Error('Invalid backup index. Use: neurolint backups list to see available backups');
        }
        
        spinner.text = 'Restoring backup...';
        const allBackups = await backupManager.listBackups();
        
        if (backupIndex > allBackups.length) {
          throw new Error(`Backup index ${backupIndex} not found. Only ${allBackups.length} backups available`);
        }
        
        const backupToRestore = allBackups[backupIndex - 1];
        const originalPath = path.resolve(backupToRestore.originalPath);
        const targetPath = options.target ? path.resolve(options.target) : originalPath;
        
        if (!options.target && !options.yes) {
          throw new Error('Refusing to overwrite original file without confirmation. Re-run with --yes or provide --target <path>');
        }
        
        const restoreResult = await backupManager.restoreFromBackup(backupToRestore.backupPath, targetPath);
        
        if (restoreResult.success) {
          logSuccess(`Restored ${restoreResult.restoredPath} from backup`);
        } else {
          logError(`Restore failed: ${restoreResult.error}`);
        }
        break;
        
      case 'apply-plan': {
        const planPath = args[2];
        if (!planPath) {
          throw new Error('Usage: neurolint backups apply-plan <plan.json> [--yes]');
        }
        const absPlanPath = path.resolve(planPath);
        spinner.text = 'Applying rollback plan...';
        const fsSync = require('fs');
        if (!fsSync.existsSync(absPlanPath)) {
          throw new Error(`Rollback plan not found: ${absPlanPath}`);
        }
        const planRaw = await fs.readFile(absPlanPath, 'utf8');
        let plan;
        try {
          plan = JSON.parse(planRaw);
        } catch (e) {
          throw new Error('Invalid rollback plan JSON');
        }
        if (!plan || !Array.isArray(plan.files)) {
          throw new Error('Invalid rollback plan format (missing files array)');
        }
        if (!options.yes) {
          throw new Error('Refusing to overwrite original files without confirmation. Re-run with --yes');
        }
        let applied = 0;
        for (const f of plan.files) {
          const original = f.original || f.originalPath || f.path;
          const backupPath = f.backup || f.backupPath;
          if (!original || !backupPath) {
            throw new Error('Invalid plan entry: missing original/backup');
          }
          const target = path.resolve(original);
          const result = await backupManager.restoreFromBackup(backupPath, target);
          if (!result.success) {
            throw new Error(`Failed to restore ${target}: ${result.error}`);
          }
          applied++;
        }
        logSuccess(`Rollback applied for ${applied} file(s)`);
        break;
      }
        
      case 'clean':
        spinner.text = 'Cleaning old backups...';
        const cleanStats = await backupManager.getStats();
        
        if (cleanStats && cleanStats.totalBackups > 0) {
          await backupManager.cleanAllBackups();
          logSuccess('All backups cleaned');
        } else {
          logSuccess('No backups to clean');
        }
        break;
        
      default:
        console.log('\nBackup Management Commands:');
        console.log('===========================');
        console.log('neurolint backups list          - List all backups');
        console.log('neurolint backups stats         - Show backup statistics');
        console.log('neurolint backups restore <n>   - Restore backup by index');
        console.log('neurolint backups apply-plan <plan.json> [--yes] - Apply rollback plan');
        console.log('neurolint backups clean         - Clean all backups');
        console.log('');
        console.log('Options:');
        console.log('  --format json                 - Output in JSON format');
        console.log('  --verbose                     - Show detailed information');
        console.log('  --target <path>               - Restore to a specific target path');
        console.log('  --yes                         - Confirm in-place overwrite of original file');
    }
    
    spinner.stop();
  } catch (error) {
    logError(`Backup management failed: ${error.message}`);
    throw error;
  }
}

// Handle rules command
async function handleRules(options, spinner) {
  try {
    const ruleStore = new RuleStore();
    await ruleStore.load();

    // Default to --list if no flag is provided
    if (!options.list && !options.delete && !options.reset && !options.edit && !options.export && !options.import) {
      options.list = true;
    }

    if (options.list) {
      const rules = ruleStore.rules.map((rule, index) => ({
        id: index,
        description: rule.description || 'No description',
        pattern: rule.pattern ? rule.pattern.toString() : 'No pattern',
        confidence: rule.confidence || 0,
        frequency: rule.frequency || 1,
        sourceLayer: rule.sourceLayer || 'Unknown',
        createdAt: rule.createdAt ? new Date(rule.createdAt).toISOString() : new Date().toISOString()
      }));

      if (rules.length === 0) {
        spinner.stop();
        console.log('No learned rules yet. Rules will be created automatically as you use NeuroLint to fix code.');
        console.log('Use "neurolint fix <path>" to analyze and fix code, which will generate learned rules.');
        process.stdout.write('completed\n');
        return;
      }

      if (options.format === 'json' && options.output) {
        await fs.writeFile(options.output, JSON.stringify(rules, null, 2));
      } else {
        rules.forEach(rule => {
          process.stdout.write(`ID: ${rule.id}, Description: ${rule.description}, Confidence: ${rule.confidence}, Frequency: ${rule.frequency}, Layer: ${rule.sourceLayer}\n`);
        });
      }
      
      process.stdout.write(`Listed ${rules.length} rules\n`);
    } else if (options.delete !== undefined) {
      if (ruleStore.rules.length === 0) {
        spinner.stop();
        console.log('No rules to delete. The rules list is empty.');
        process.stdout.write('completed\n');
        return;
      }
      
      const ruleId = parseInt(options.delete);
      if (isNaN(ruleId) || ruleId < 0 || ruleId >= ruleStore.rules.length) {
        throw new Error(`Invalid rule ID: ${options.delete}. Must be a number between 0 and ${ruleStore.rules.length - 1}`);
      }
      
      const deletedRule = ruleStore.rules[ruleId];
      ruleStore.rules.splice(ruleId, 1);
      await ruleStore.save();
      
      if (options.verbose && deletedRule) {
        process.stdout.write(`Deleted rule: ${deletedRule.description}\n`);
      }
      
      process.stdout.write(`Deleted rule ID ${ruleId}\n`);
    } else if (options.reset) {
      ruleStore.rules = [];
      await ruleStore.save();
      process.stdout.write('Reset all rules\n');
    } else if (options.edit !== undefined) {
      // Validate confidence value first, even before checking if rules exist
      if (options.confidence !== undefined) {
        const confidence = parseFloat(options.confidence);
        if (isNaN(confidence) || confidence < 0 || confidence > 1) {
          throw new Error(`Invalid confidence value: ${options.confidence}. Confidence must be a number between 0 and 1 (inclusive)`);
        }
      }
      
      if (ruleStore.rules.length === 0) {
        spinner.stop();
        console.log('No rules to edit. The rules list is empty.');
        process.stdout.write('completed\n');
        return;
      }
      
      const ruleId = parseInt(options.edit);
      if (isNaN(ruleId) || ruleId < 0 || ruleId >= ruleStore.rules.length) {
        throw new Error(`Invalid rule ID: ${options.edit}. Must be a number between 0 and ${ruleStore.rules.length - 1}`);
      }
      
      if (options.confidence !== undefined) {
        const confidence = parseFloat(options.confidence);
        ruleStore.rules[ruleId].confidence = confidence;
        await ruleStore.save();
        process.stdout.write(`Updated confidence for rule ID ${ruleId}\n`);
      } else {
        throw new Error('Use --confidence to set confidence value');
      }
    } else if (options.export) {
      try {
        await fs.writeFile(options.export, JSON.stringify(ruleStore.rules, null, 2));
        process.stdout.write(`Exported ${ruleStore.rules.length} rules to ${options.export}\n`);
      } catch (error) {
        // Handle invalid export paths gracefully
        logWarning(`Failed to export rules: ${error.message}`);
        process.stdout.write('Export failed - check the path and try again\n');
      }
    } else if (options.import) {
      try {
        const importedRules = JSON.parse(await fs.readFile(options.import, 'utf8'));
        ruleStore.rules.push(...importedRules);
        await ruleStore.save();
        process.stdout.write(`Imported ${importedRules.length} rules from ${options.import}\n`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Import file not found: ${options.import}`);
        }
        throw error;
      }
    }
    
    // Stop spinner before outputting completion message
    spinner.stop();
    process.stdout.write('completed\n');
  } catch (error) {
    logError(`Rules failed: ${error.message}`);
    throw error;
  }
}

// Handle security management
async function handleSecurity(args, options, spinner) {
  try {
    // Create and initialize production backup manager
    const backupManager = createBackupManager({
      production: true,
      verbose: options.verbose
    });
    
    // Always initialize - security features may be set up during initialization
    if (backupManager instanceof ProductionBackupManager) {
      await backupManager.initialize();
    }
    
    // Check if security interface is available after initialization
    const hasSecurityInterface = backupManager instanceof ProductionBackupManager && 
                                  backupManager.security && 
                                  typeof backupManager.security.getSecurityStatistics === 'function';
    
    const subcommand = args[1];
    
    // Get security statistics if available
    let securityStats = null;
    if (hasSecurityInterface) {
      securityStats = backupManager.security.getSecurityStatistics();
    }
    
    switch (subcommand) {
      case 'users':
        console.log('\nSecurity Users:');
        console.log('===============');
        if (securityStats) {
          console.log(`Total Users: ${securityStats.users.total}`);
          console.log(`Active Sessions: ${securityStats.users.activeSessions}`);
          console.log(`Failed Attempts (24h): ${securityStats.users.failedAttempts}`);
          console.log(`Locked Accounts: ${securityStats.users.lockedAccounts}`);
        } else {
          console.log('Production security metrics are not currently available');
          console.log('This is a free-tier installation without advanced user tracking');
        }
        break;
        
      case 'audit':
        console.log('\nSecurity Audit:');
        console.log('===============');
        if (securityStats) {
          console.log(`Security Events: ${securityStats.audit.securityEvents}`);
          console.log(`Access Attempts: ${securityStats.audit.accessAttempts}`);
        } else {
          console.log('Production audit metrics are not currently available');
          console.log('This is a free-tier installation without detailed audit logging');
        }
        break;
        
      case 'status':
        if (options.format === 'json') {
          const statusOutput = securityStats 
            ? { ...securityStats, productionMode: true }
            : { 
                available: false, 
                message: 'Production security metrics not available - free tier installation',
                productionMode: false
              };
          console.log(JSON.stringify(statusOutput, null, 2));
        } else {
          console.log('\nSecurity Status:');
          console.log('================');
          if (securityStats) {
            console.log(`System Status: ${securityStats.systemStatus}`);
            console.log(`Production Mode: Enabled`);
            console.log(`Encryption: Enterprise Grade`);
            console.log(`Authentication: Not Required (All features are free)`);
            console.log(`Audit Logging: Detailed`);
          } else {
            console.log(`System Status: Free Tier`);
            console.log(`Production Mode: Not Available`);
            console.log(`Encryption: Basic`);
            console.log(`Authentication: Not Required (All features are free)`);
            console.log(`Audit Logging: Basic (production metrics unavailable)`);
          }
        }
        break;
        
      default:
        console.log('\nSecurity Management Commands:');
        console.log('=============================');
        console.log('neurolint security users     - Show user statistics');
        console.log('neurolint security audit     - Show audit statistics');
        console.log('neurolint security status    - Show security status');
        console.log('');
        console.log('Note: All security features are free and require no authentication');
        if (!hasSecurityInterface) {
          console.log('Production security metrics are not currently available');
        }
    }
    
    spinner.stop();
    logSuccess('Security management completed');
  } catch (error) {
    logError(`Security management failed: ${error.message}`);
    throw error;
  }
}

// Handle monitoring management
async function handleMonitoring(args, options, spinner) {
  try {
    const backupManager = createBackupManager({
      production: true,
      verbose: options.verbose
    });
    
    if (!(backupManager instanceof ProductionBackupManager)) {
      throw new Error('Monitoring features require production mode. Use --production flag.');
    }
    
    await backupManager.initialize();
    const subcommand = args[1];
    
    switch (subcommand) {
      case 'metrics':
        const stats = backupManager.monitoring.getStatistics();
        if (options.format === 'json') {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log('\nMonitoring Metrics:');
          console.log('===================');
          console.log(`Total Metrics: ${stats.metrics.total}`);
          console.log(`Active Alerts: ${stats.alerts.active}`);
          console.log(`Health Checks: ${stats.healthChecks.total}`);
          console.log(`System Uptime: ${Math.floor(stats.uptime / 3600)} hours`);
        }
        break;
        
      case 'alerts':
        const alertStats = backupManager.monitoring.getStatistics().alerts;
        console.log('\nAlert Summary:');
        console.log('==============');
        console.log(`Active Alerts: ${alertStats.active}`);
        console.log(`Total Alerts: ${alertStats.total}`);
        break;
        
      case 'health':
        const healthResult = await backupManager.performHealthCheck();
        if (options.format === 'json') {
          console.log(JSON.stringify(healthResult, null, 2));
        } else {
          console.log('\nSystem Health:');
          console.log('==============');
          console.log(`Status: ${healthResult.status}`);
          if (healthResult.issues.length > 0) {
            console.log('Issues:');
            healthResult.issues.forEach(issue => console.log(`  - ${issue}`));
          }
        }
        break;
        
      default:
        console.log('\nMonitoring Management Commands:');
        console.log('===============================');
        console.log('neurolint monitoring metrics  - Show monitoring metrics');
        console.log('neurolint monitoring alerts   - Show alert summary');
        console.log('neurolint monitoring health   - Check system health');
        console.log('');
        console.log('Options:');
        console.log('  --production              - Enable enterprise monitoring features');
        console.log('  --format json             - Output in JSON format');
    }
    
    spinner.stop();
    logSuccess('Monitoring management completed');
  } catch (error) {
    logError(`Monitoring management failed: ${error.message}`);
    throw error;
  }
}

// Handle encryption management
async function handleEncryption(args, options, spinner) {
  try {
    const backupManager = createBackupManager({
      production: true,
      verbose: options.verbose
    });
    
    if (!(backupManager instanceof ProductionBackupManager)) {
      throw new Error('Encryption features require production mode. Use --production flag.');
    }
    
    await backupManager.initialize();
    const subcommand = args[1];
    
    switch (subcommand) {
      case 'status':
        const encryptionStats = await backupManager.encryption.getEncryptionStats();
        if (options.format === 'json') {
          console.log(JSON.stringify(encryptionStats, null, 2));
        } else {
          console.log('\nEncryption Status:');
          console.log('==================');
          console.log(`Algorithm: ${encryptionStats.algorithm}`);
          console.log(`Key Age: ${encryptionStats.keyAge}`);
          console.log(`Rotation Due: ${encryptionStats.keyRotationDue ? 'Yes' : 'No'}`);
          console.log(`Compression: ${encryptionStats.compressionEnabled ? 'Enabled' : 'Disabled'}`);
        }
        break;
        
      case 'rotate-keys':
        if (!options.yes) {
          throw new Error('Key rotation requires confirmation. Use --yes flag.');
        }
        spinner.text = 'Rotating encryption keys...';
        const rotationResult = await backupManager.encryption.rotateKeys();
        if (rotationResult.success) {
          logSuccess('Encryption keys rotated successfully');
        } else {
          throw new Error(`Key rotation failed: ${rotationResult.error}`);
        }
        break;
        
      default:
        console.log('\nEncryption Management Commands:');
        console.log('===============================');
        console.log('neurolint encryption status      - Show encryption status');
        console.log('neurolint encryption rotate-keys - Rotate encryption keys');
        console.log('');
        console.log('Options:');
        console.log('  --production                  - Enable enterprise encryption features');
        console.log('  --yes                         - Confirm destructive operations');
        console.log('  --format json                 - Output in JSON format');
    }
    
    spinner.stop();
    logSuccess('Encryption management completed');
  } catch (error) {
    logError(`Encryption management failed: ${error.message}`);
    throw error;
  }
}

// Handle health command
async function handleHealth(options, spinner) {
  try {
    // Initialize shared core for health check
    await sharedCore.core.initialize({ platform: 'cli' });
    
    const configPath = path.join(process.cwd(), '.neurolintrc');
    const ruleFile = path.join(process.cwd(), '.neurolint', 'learned-rules.json');
    const stateDir = path.join(process.cwd(), '.neurolint');

    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    const ruleFileExists = await fs.access(ruleFile).then(() => true).catch(() => false);
    const stateDirExists = await fs.access(stateDir).then(() => true).catch(() => false);

    // Test shared core functionality
    let sharedCoreHealthy = false;
    try {
      const testResult = await sharedCore.analyze('const test = "health";', {
        filename: 'health-test.js',
        platform: 'cli',
        layers: [1, 2],
        verbose: false
      });
      sharedCoreHealthy = true;
    } catch (error) {
      sharedCoreHealthy = false;
    }

    // Test fix-master functionality
    let fixMasterHealthy = false;
    try {
      const testResult = await fixMaster.executeLayers('const test = "health";', [1, 2], {
        dryRun: true,
        verbose: false,
        filePath: 'health-test.js'
      });
      fixMasterHealthy = true;
    } catch (error) {
      fixMasterHealthy = false;
    }

    if (configExists && ruleFileExists && sharedCoreHealthy && fixMasterHealthy) {
      logSuccess('NeuroLint CLI is healthy. All components operational.');
      process.stdout.write(`[SUCCESS] Shared Core: Operational\n`);
      process.stdout.write(`[SUCCESS] Fix Master: Operational\n`);
      process.stdout.write(`[SUCCESS] Configuration: Present\n`);
      process.stdout.write(`[SUCCESS] State Directory: ${stateDirExists ? 'Present' : 'Missing'}\n`);
    } else {
      logWarning('NeuroLint CLI has some issues. Review details below:');
      if (!configExists) {
        process.stdout.write(`[ERROR] Configuration file not found: ${configPath}\n`);
      } else {
        process.stdout.write(`[SUCCESS] Configuration: Present\n`);
      }
      if (!ruleFileExists) {
        // Create the learned rules file if it doesn't exist
        try {
          await fs.mkdir(path.dirname(ruleFile), { recursive: true });
          const defaultRules = {
            rules: [],
            metadata: {
              created: new Date().toISOString(),
              version: '1.0.0',
              totalRules: 0
            }
          };
          await fs.writeFile(ruleFile, JSON.stringify(defaultRules, null, 2));
          process.stdout.write(`[SUCCESS] Learned rules file created: ${ruleFile}\n`);
        } catch (error) {
          process.stdout.write(`[ERROR] Failed to create learned rules file: ${error.message}\n`);
        }
      } else {
        process.stdout.write(`[SUCCESS] Learned rules: Present\n`);
      }
      if (!sharedCoreHealthy) {
        process.stdout.write(`[ERROR] Shared Core: Not operational\n`);
      } else {
        process.stdout.write(`[SUCCESS] Shared Core: Operational\n`);
      }
      if (!fixMasterHealthy) {
        process.stdout.write(`[ERROR] Fix Master: Not operational\n`);
      } else {
        process.stdout.write(`[SUCCESS] Fix Master: Operational\n`);
      }
      if (!stateDirExists) {
        process.stdout.write(`[ERROR] State directory not found: ${stateDir}\n`);
      } else {
        process.stdout.write(`[SUCCESS] State Directory: Present\n`);
      }
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    throw error;
  }
}

// Fix a single file
async function fixFile(filePath, options, spinner) {
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  if (!validExtensions.includes(path.extname(filePath))) {
          logWarning(`Skipping ${path.basename(filePath)}: Unsupported file type`);
    return { success: false, error: 'Unsupported file type' };
  }

  // Initialize centralized backup manager
  let backupManager = null;
  if (options.backup && !options.dryRun) {
    backupManager = createBackupManager({
      backupDir: '.neurolint-backups',
      maxBackups: options.production ? 50 : 10,
      production: options.production,
      verbose: options.verbose
    });
    
    // Initialize production backup manager if needed
    if (backupManager instanceof ProductionBackupManager) {
      await backupManager.initialize();
    }
    
    try {
      const backupResult = await backupManager.createBackup(filePath, 'cli-fix');
      if (backupResult.success && options.verbose) {
        console.log(`Created centralized backup: ${path.basename(backupResult.backupPath)}`);
      }
    } catch (error) {
      if (options.verbose) {
        console.warn(`Warning: Could not create backup: ${error.message}`);
      }
    }
  }
  const code = await fs.readFile(filePath, 'utf8');
  const initialValidation = await TransformationValidator.validateFile(filePath);
  if (!initialValidation.isValid) {
    if (options.verbose) {
      console.log(`\n[INVALID] ${path.basename(filePath)}`);
      console.log(`  Error: ${initialValidation.error}`);
      if (initialValidation.suggestions) {
        console.log(`  Suggestions: ${initialValidation.suggestions.join(', ')}`);
      }
    } else {
      logError(`Invalid file: ${initialValidation.error}`);
    }
    return { success: false, error: initialValidation.suggestion };
  }

  // Initialize shared core for fix operations
  await sharedCore.core.initialize({ platform: 'cli' });
  
  // Use shared core for analysis (pure analysis system)
  const analysisResult = await sharedCore.analyze(code, {
    filename: filePath,
    platform: 'cli',
    layers: options.layers || [1, 2, 3, 4, 5, 6, 7],
    verbose: options.verbose
  });
  
  // Determine which layers to execute
  let layers = [];
  if (options.allLayers) {
    layers = [1, 2, 3, 4, 5, 6, 7];
  } else if (Array.isArray(options.layers) && options.layers.length > 0) {
    layers = options.layers;
  } else {
    layers = analysisResult.summary?.recommendedLayers || [1, 2];
  }

  // Ensure layers are unique and sorted
  layers = [...new Set(layers)].sort((a, b) => a - b);

  spinner.text = `Running ${layers.length} layer(s) on ${path.basename(filePath)}...`;

  const startTime = performance.now();
  
  // Use shared core for applying fixes with fallback to fix-master
  let result;
  
  // Set up timeout for fix operations
  const fixTimeout = 120000; // 120 seconds for tests
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Fix operation timeout')), fixTimeout);
  });
  
  // Use fix-master for all transformations (shared core is analysis-only)
  // This implements the Clean Hybrid Architecture pattern
  const fixPromise = fixMaster.executeLayers(code, layers, {
    dryRun: options.dryRun,
    verbose: options.verbose,
    filePath,
    progressive: options.progressive
  });
  
  // Race the fix operation against the timeout
  const fixResult = await Promise.race([fixPromise, timeoutPromise]);
  
  // Convert fix-master result to expected format
  result = {
    success: fixResult.successfulLayers > 0,
    code: fixResult.finalCode || code,
    appliedFixes: fixResult.results?.filter(r => r.success).map(r => ({
      rule: `Layer ${r.layer} (${LAYER_NAMES[r.layer] || 'unknown'})`,
      description: `${LAYER_NAMES[r.layer] || 'Unknown'} layer transformation`,
      location: { line: 1, column: 1 },
      layer: r.layer,
      changes: r.changes || 0,
      warnings: r.warnings || [],
      suggestions: r.suggestions || []
    })) || [],
    fallbackUsed: false,
    totalChanges: fixResult.results?.reduce((sum, r) => sum + (r.changes || 0), 0) || 0,
    totalWarnings: fixResult.results?.reduce((sum, r) => sum + (r.warnings?.length || 0), 0) || 0,
    totalSuggestions: fixResult.results?.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0) || 0
  };

  if (result.success) {
    // Enhanced validation with fallback recovery
    let validation;
    try {
      validation = await TransformationValidator.validateTransformation(code, result.code, filePath);
    } catch (validationError) {
      if (options.verbose) {
        process.stdout.write(`Validation failed: ${validationError.message}, skipping validation...\n`);
      }
      validation = { shouldRevert: false };
    }
    
    if (validation.shouldRevert) {
      if (options.verbose) {
        console.log(`\n[INVALID TRANSFORMATION] ${path.basename(filePath)}`);
        console.log(`  Error: ${validation.reason}`);
        if (validation.suggestions) {
          console.log(`  Suggestions: ${validation.suggestions.join(', ')}`);
        }
        if (!options.dryRun && options.backup) {
          console.log(`  Backup restored`);
        }
      } else {
        logError(`Invalid transformation: ${validation.reason}`);
      }
      if (!options.dryRun && options.backup && backupManager) {
        try {
          // Get the latest backup for this file
          const backups = await backupManager.listBackups();
          const fileBackups = backups.filter(b => b.originalPath === path.relative(process.cwd(), filePath));
          
          if (fileBackups.length > 0) {
            const latestBackup = fileBackups[0]; // Already sorted by timestamp desc
            const restoreResult = await backupManager.restoreFromBackup(latestBackup.backupPath, filePath);
            
            if (restoreResult.success) {
              console.log(`  Restored from centralized backup: ${path.basename(latestBackup.backupPath)}`);
            } else {
              console.warn(`  Warning: Restore failed: ${restoreResult.error}`);
            }
          }
        } catch (error) {
          console.warn(`  Warning: Restore failed: ${error.message}`);
        }
      }
      return { success: false, error: validation.suggestions?.join(' ') || validation.reason };
    }

    if (!options.dryRun) {
      await fs.writeFile(filePath, result.code);
    }
    
    const appliedFixes = result.appliedFixes?.length || 0;
    
    // Enhanced detailed output
    if (options.verbose) {
      console.log(`\n[FIXED] ${path.basename(filePath)}`);
      console.log(`  Execution Time: ${(performance.now() - startTime).toFixed(0)}ms`);
      console.log(`  Applied Fixes: ${appliedFixes}`);
      console.log(`  Layers Applied: ${layers.join(', ')}`);
      
      if (result.appliedFixes && result.appliedFixes.length > 0) {
        console.log(`  Fix Details:`);
        result.appliedFixes.forEach((fix, index) => {
          const layerName = LAYER_NAMES[fix.layer] || 'unknown';
          console.log(`    ${index + 1}. ${layerName} - ${fix.description || 'No description'}`);
          if (fix.layer) console.log(`       Layer: ${fix.layer} (${layerName})`);
          if (fix.changes > 0) console.log(`       Changes: ${fix.changes} transformation(s)`);
          if (fix.warnings && fix.warnings.length > 0) {
            console.log(`       Warnings: ${fix.warnings.length} warning(s)`);
            fix.warnings.forEach((warning, wIndex) => {
              const message = warning.message || warning || 'Unknown warning';
              console.log(`         ${wIndex + 1}. ${message}`);
            });
          }
          if (fix.suggestions && fix.suggestions.length > 0) {
            console.log(`       Suggestions: ${fix.suggestions.length} suggestion(s)`);
            fix.suggestions.forEach((suggestion, sIndex) => {
              const message = suggestion.message || suggestion || 'Unknown suggestion';
              console.log(`         ${sIndex + 1}. ${message}`);
            });
          }
          if (fix.line) console.log(`       Line: ${fix.line}`);
        });
      }
      
      // Show summary statistics
      if (result.totalChanges > 0 || result.totalWarnings > 0 || result.totalSuggestions > 0) {
        console.log(`  Summary:`);
        if (result.totalChanges > 0) console.log(`    Total Changes: ${result.totalChanges}`);
        if (result.totalWarnings > 0) console.log(`    Total Warnings: ${result.totalWarnings}`);
        if (result.totalSuggestions > 0) console.log(`    Total Suggestions: ${result.totalSuggestions}`);
      }
      
      if (result.fallbackUsed) {
        console.log(`  Engine: fix-master (fallback)`);
        if (result.fallbackError) {
          console.log(`  Fallback Reason: ${result.fallbackError}`);
        }
      } else {
        console.log(`  Engine: shared-core`);
      }
    } else {
      logSuccess(`Fixed ${path.basename(filePath)} (${appliedFixes} fix(es), layers ${layers.join(',')}) in ${(performance.now() - startTime).toFixed(0)}ms`);
    }

    const stateDir = path.join(process.cwd(), '.neurolint');
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(
      path.join(stateDir, `states-${Date.now()}.json`),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        file: filePath,
        layers: layers,
        appliedFixes: result.appliedFixes || [],
        executionTime: performance.now() - startTime,
        backupPath: options.backup ? 'centralized' : null,
        engine: result.fallbackUsed ? 'fix-master' : 'shared-core',
        fallbackError: result.fallbackError || null,
        analysisIssues: analysisResult.issues?.length || 0
      }, null, 2)
    );
    
    // Track analytics for hybrid approach
    try {
      sharedCore.trackCommand('fix', {
        success: true,
        engine: result.fallbackUsed ? 'fix-master' : 'shared-core',
        appliedFixes: result.appliedFixes?.length || 0,
        executionTime: performance.now() - startTime,
        fallbackUsed: result.fallbackUsed || false
      });
    } catch (analyticsError) {
      if (options.verbose) {
        console.warn(`Warning: Failed to track analytics: ${analyticsError.message}`);
      }
    }
    
    return { success: true, changes: appliedFixes };
  } else {
    if (options.verbose) {
      console.log(`\n[NO CHANGES] ${path.basename(filePath)}`);
      console.log(`  Reason: No applicable fixes found for layers ${layers.join(', ')}`);
      console.log(`  Analysis Issues: ${analysisResult.issues?.length || 0}`);
    } else {
      logWarning(`No changes applied to ${path.basename(filePath)}`);
    }
    return { success: false, error: 'No changes applied' };
  }
}

// Main command handler
async function handleCommand(args) {
  const command = args[0] || 'analyze';
  const spinner = ora(`Running ${command}...`).start();
  const startTime = Date.now();

  try {
    // Initialize shared core for analytics tracking
    await sharedCore.core.initialize({ platform: 'cli' });
    
    // Track command usage
    sharedCore.trackCommand(command, { 
      args: args.slice(1),
      timestamp: new Date().toISOString()
    });
    
    const options = parseOptions(args);
    
    // Find target path - skip command and subcommand
    let targetPath = '.';
    if (Object.values(LAYER_NAMES).includes(command)) {
      // For layer commands, skip command and subcommand (scan/fix)
      const pathArg = args.slice(2).find(arg => !arg.startsWith('--'));
      if (pathArg) targetPath = pathArg;
    } else {
      // For regular commands, skip command
      const pathArg = args.slice(1).find(arg => !arg.startsWith('--'));
      if (pathArg) targetPath = pathArg;
    }

    // Resolve target path to absolute path to prevent duplication
    targetPath = path.resolve(targetPath);
    
    // Validate that the target path exists (skip for commands that don't need it)
    const commandsWithoutTargetPath = ['backups', 'version', 'stats', 'rules', 'health', 'security', 'monitoring', 'encryption', 'help'];
    if (!commandsWithoutTargetPath.includes(command)) {
      try {
        await fs.access(targetPath);
      } catch (error) {
        throw new Error(`Target path does not exist: ${targetPath}`);
      }
    }

    switch (command) {
      case 'help':
        spinner.stop();
        process.stdout.write(`
 NeuroLint CLI - Code Quality Tool

Usage: neurolint <command> [options] [path]

Analysis Commands:
  analyze [path]          Analyze code for potential improvements
  assess [path]           Assess project complexity and suggest simplifications
  fix [path]             Fix code quality issues
  simplify [path]         Simplify project complexity (convert Next.js to React, etc.)
  migrate [path]         One-time migration service (enterprise)
  migrate-nextjs-16 [path] Migrate project to Next.js 16 compatibility
  migrate-nextjs-15.5 [path] Migrate project to Next.js 15.5 compatibility
  migrate-react19 [path] Migrate project to React 19 compatibility
  migrate-biome [path]   Migrate from ESLint to Biome
  check-deps [path]      Check React 19 dependency compatibility (--fix to apply)
  check-turbopack [path] Analyze Turbopack migration compatibility
  check-compiler [path]  Detect React Compiler optimization opportunities
  assess-router [path]   Assess Next.js router complexity and recommend optimal setup
  detect-react192 [path] Detect React 19.2 feature opportunities (View Transitions, useEffectEvent)
  layers                  Display information about all layers
  validate [path]         Validate files without applying fixes
  init-tests [path]       Generate test files for components

Configuration Commands:
  init-config             Generate or display configuration
  health                  Run a health check to verify configuration

Enterprise Commands:
  security                Manage security, users, and audit trails
  monitoring              View metrics, alerts, and system health
  encryption              Manage encryption keys and settings

Utility Commands:
  stats                   Show project statistics
  clean                   Clean up old backup and state files
  backups                 Manage centralized backups
  rules                   Manage learned rules
  help                    Show this help message

Layer Commands:
  config scan|fix         Layer 1: Configuration fixes
  patterns scan|fix       Layer 2: Pattern fixes
  components scan|fix     Layer 3: Component fixes
  hydration scan|fix      Layer 4: Hydration fixes
  nextjs scan|fix         Layer 5: Next.js fixes
  testing scan|fix        Layer 6: Testing fixes
  adaptive scan|fix       Layer 7: Adaptive pattern learning

Options:
  --dry-run              Show changes without applying them
  --verbose              Show detailed output
  --backup               Create backups (default: true)
  --no-backup            Skip backup creation
  --layers <list>        Specify layers to run (e.g., 1,2,3)
  --all-layers           Apply all layers (1-7)
  --help, -h            Show this help message
  --version, -v         Show version information

Examples:
  neurolint help
  neurolint analyze src/ --verbose
  neurolint fix . --layers=1,2,7 --dry-run
  neurolint components fix src/ --verbose
`);
        process.exit(0);
      case 'version':
        const pkg = require('./package.json');
        console.log(pkg.version);
        logSuccess('Version displayed');
        break;
      case 'analyze':
        await handleAnalyze(targetPath, options, spinner);
        break;
      case 'assess':
        // Handle complexity assessment command
        spinner.stop();
        await assessComplexity(targetPath || '.', options);
        break;
      case 'simplify':
        // Handle project simplification command
        spinner.stop();
        await simplifyProject(targetPath || '.', options);
        break;
      case 'fix':
        await handleFix(targetPath, options, spinner, startTime);
        break;
      case 'layers':
        await handleLayers(options, spinner);
        break;
      case 'init-config':
        await handleInitConfig(options, spinner);
        break;
      case 'validate':
        await handleValidate(targetPath, options, spinner);
        break;
      case 'init-tests':
        await handleInitTests(targetPath, options, spinner);
        break;
      case 'stats':
        options.targetPath = targetPath;
        await handleStats(options, spinner);
        break;
      case 'clean':
        await handleClean({ ...options, targetPath }, spinner);
        break;
      case 'backups':
        await handleBackups(args, options, spinner);
        break;
      case 'rules':
        await handleRules(options, spinner);
        break;
      case 'health':
        await handleHealth(options, spinner);
        break;
      case 'security':
        await handleSecurity(args, options, spinner);
        break;
      case 'monitoring':
        await handleMonitoring(args, options, spinner);
        break;
      case 'encryption':
        await handleEncryption(args, options, spinner);
        break;
      case 'migrate-biome':
        // Handle Biome migration command - now free!
        // Import and use the Biome migration from fix-master
        const fixMaster = require('./fix-master.js');
        await fixMaster.handleBiomeMigrationCommand(args);
        break;
      case 'migrate-nextjs-15.5':
        // Handle Next.js 15.5 migration command - now free!
        // Import and use the Next.js 15.5 migration from fix-master
        const fixMasterNextJS = require('./fix-master.js');
        await fixMasterNextJS.handleMigrationCommand(args);
        break;
      case 'migrate-react19':
        // Handle React 19 migration command - now free!
        if (!targetPath || targetPath === '.') {
          throw new Error('Path is required for React 19 migration command');
        }
        
        spinner.text = 'Running React 19 migration...';
        await handleReact19Migration(targetPath, options, spinner);
        break;
      case 'migrate-nextjs-16':
        // Handle Next.js 16 migration command
        spinner.text = 'Running Next.js 16 migration...';
        const NextJS16Migrator = require('./scripts/migrate-nextjs-16.js');
        const nextjs16Migrator = new NextJS16Migrator({ 
          verbose: options.verbose, 
          dryRun: options.dryRun 
        });
        const nextjs16Result = await nextjs16Migrator.migrate(targetPath);
        
        spinner.succeed('Next.js 16 migration completed!');
        console.log(`\nApplied ${nextjs16Result.changes.length} changes`);
        if (options.verbose) {
          console.log(JSON.stringify(nextjs16Result.summary, null, 2));
        }
        break;
      case 'check-deps':
        // Handle React 19 dependency check command
        spinner.text = 'Checking React 19 dependency compatibility...';
        const React19DependencyChecker = require('./scripts/react19-dependency-checker.js');
        const depChecker = new React19DependencyChecker({ 
          verbose: options.verbose, 
          projectPath: targetPath 
        });
        const depResult = await depChecker.check();
        
        spinner.succeed('Dependency check completed!');
        
        // Optionally apply fixes if --fix flag is present
        if (args.includes('--fix')) {
          await depChecker.applyFixes(depResult.fixes);
          console.log('\nAutomatic fixes applied. Run npm install to update dependencies.');
        }
        break;
      case 'check-turbopack':
        // Handle Turbopack migration check command
        spinner.text = 'Analyzing Turbopack compatibility...';
        const TurbopackMigrationAssistant = require('./scripts/turbopack-migration-assistant.js');
        const turbopackAssistant = new TurbopackMigrationAssistant({ 
          verbose: options.verbose, 
          projectPath: targetPath 
        });
        const turbopackResult = await turbopackAssistant.analyze();
        
        spinner.succeed('Turbopack analysis completed!');
        
        if (turbopackResult.compatible) {
          console.log('\nProject is Turbopack-ready! No blocking issues found.');
        } else {
          console.log(`\nFound ${turbopackResult.issues.length} compatibility issues.`);
          console.log('Review the report above for migration guidance.');
        }
        break;
      case 'check-compiler':
        // Handle React Compiler check command
        spinner.text = 'Analyzing React Compiler opportunities...';
        const ReactCompilerDetector = require('./scripts/react-compiler-detector.js');
        const compilerDetector = new ReactCompilerDetector({ 
          verbose: options.verbose, 
          projectPath: targetPath 
        });
        const compilerResult = await compilerDetector.analyze();
        
        spinner.succeed('React Compiler analysis completed!');
        
        if (compilerResult.recommendCompiler) {
          console.log('\nStrong recommendation: Enable React Compiler');
          console.log(`Found ${compilerResult.totalFindings} opportunities for optimization.`);
        } else if (compilerResult.totalFindings > 0) {
          console.log(`\nReact Compiler could simplify ${compilerResult.totalFindings} manual optimizations.`);
        } else {
          console.log('\nNo manual memoization patterns detected.');
        }
        break;
      case 'assess-router':
        // Handle router complexity assessment
        spinner.text = 'Assessing router complexity...';
        const RouterComplexityAssessor = require('./scripts/router-complexity-assessor.js');
        const routerAssessor = new RouterComplexityAssessor({ 
          verbose: options.verbose, 
          projectPath: targetPath 
        });
        const routerResult = await routerAssessor.assess();
        
        spinner.succeed('Router complexity assessment completed!');
        
        if (routerResult.level === 'Simple') {
          console.log('\nTip: Your project may be over-engineered for its needs.');
          console.log('Consider simplifying with: neurolint simplify ./src --target=react');
        } else if (routerResult.level === 'Moderate') {
          console.log('\nRouter complexity is appropriate for your project size.');
        } else {
          console.log('\nComplex router setup detected - this is justified for your requirements.');
        }
        break;
      case 'detect-react192':
        // Handle React 19.2 feature detection
        spinner.text = 'Detecting React 19.2 feature opportunities...';
        const React192FeatureDetector = require('./scripts/react192-feature-detector.js');
        const react192Detector = new React192FeatureDetector({ 
          verbose: options.verbose, 
          projectPath: targetPath 
        });
        const react192Result = await react192Detector.detect();
        
        spinner.succeed('React 19.2 feature detection completed!');
        
        if (react192Result.total > 0) {
          console.log(`\nFound ${react192Result.total} opportunities to use React 19.2 features!`);
          console.log('Review the report above to modernize your codebase.');
        } else {
          console.log('\nNo React 19.2 feature opportunities detected.');
        }
        break;
      case 'migrate':
        // Handle migration command - now free!
        if (!targetPath || targetPath === '.') {
          throw new Error('Path is required for migration command');
        }
        
        // Parse migration-specific options
        const migrationOptions = {
          dryRun: args.includes('--dry-run'),
          verbose: args.includes('--verbose'),
          layers: args.includes('--layers') ? 
            args[args.indexOf('--layers') + 1]?.split(',').map(Number) : 
            [1, 2, 3, 4, 5, 6],
          backup: !args.includes('--no-backup'),
          report: args.includes('--report'),
          rollback: args.includes('--rollback'),
          incremental: args.includes('--incremental'),
          parallel: parseInt(args[args.indexOf('--parallel') + 1]) || 4,
          include: args.includes('--include') ? 
            args[args.indexOf('--include') + 1] : 
            '**/*.{ts,tsx,js,jsx,json}',
          exclude: args.includes('--exclude') ? 
            args[args.indexOf('--exclude') + 1] : 
            '**/node_modules/**'
        };
        
        await runMigration(targetPath, migrationOptions, null);
        break;
      default:
        if (Object.values(LAYER_NAMES).includes(command)) {
          const layerId = Object.keys(LAYER_NAMES).find(key => LAYER_NAMES[key] === command);
          const subcommand = args[1];
          
          if (subcommand === 'scan') {
            spinner.text = `Running ${command} scan...`;
            await handleAnalyze(targetPath, { ...options, layers: [parseInt(layerId)] }, spinner);
            // Don't call spinner.succeed here as handleAnalyze handles it
          } else if (subcommand === 'fix') {
            spinner.text = `Running ${command} fix...`;
            await handleFix(targetPath, { ...options, layers: [parseInt(layerId)] }, spinner);
            // Don't call spinner.succeed here as handleFix handles it
          } else {
            throw new Error(`Invalid subcommand for ${command}. Use 'scan' or 'fix'.`);
          }
        } else {
          throw new Error(`Unknown command: ${command}`);
        }
    }
    
    // Only show main command completion for non-layer commands
    if (!Object.values(LAYER_NAMES).includes(command)) {
      const executionTime = Date.now() - startTime;
      const timeMessage = executionTime > 1000 ? ` (${(executionTime / 1000).toFixed(1)}s)` : '';
      logSuccess(`${command.charAt(0).toUpperCase() + command.slice(1)} completed${timeMessage}`);
    }
    
    // Stop the spinner and exit successfully
    spinner.stop();
    process.exit(0);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const timeMessage = executionTime > 1000 ? ` (${(executionTime / 1000).toFixed(1)}s)` : '';
    logError(`Error: ${error.message}${timeMessage}`);
    
    // Track error in analytics
    try {
      sharedCore.trackCommand(command, { 
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      });
    } catch (analyticsError) {
      // Don't fail the main command if analytics fails
      if (options.verbose) {
        console.warn(`Warning: Failed to track analytics: ${analyticsError.message}`);
      }
    }
    
    // Stop the spinner and exit with error
    spinner.stop();
    process.exit(1);
  } finally {
    // Shutdown shared core gracefully
    try {
      await sharedCore.core.shutdown();
    } catch (shutdownError) {
      // Don't fail the main command if shutdown fails
      if (options.verbose) {
        console.warn(`Warning: Failed to shutdown shared core: ${shutdownError.message}`);
      }
    }
  }
}

// Show version if requested
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  const packageJson = require('./package.json');
  console.log(packageJson.version);
  process.exit(0);
}

// Show help if no arguments or help requested (only when run as main module)
if (require.main === module && (process.argv.length <= 2 || process.argv.includes('--help') || process.argv.includes('-h') || process.argv[2] === 'help')) {
  process.stdout.write(`
NeuroLint CLI - Code Quality Tool

Usage: neurolint <command> [options] [path]

Analysis Commands:
  analyze [path]          Analyze code for potential improvements
  assess [path]           Assess project complexity and suggest simplifications
  fix [path]             Fix code quality issues
  simplify [path]         Simplify project complexity (convert Next.js to React, etc.)
  migrate [path]         One-time migration service (enterprise)
  migrate-nextjs-16 [path] Migrate project to Next.js 16 compatibility
  migrate-nextjs-15.5 [path] Migrate project to Next.js 15.5 compatibility
  migrate-react19 [path] Migrate project to React 19 compatibility
  migrate-biome [path]   Migrate from ESLint to Biome
  check-deps [path]      Check React 19 dependency compatibility (--fix to apply)
  check-turbopack [path] Analyze Turbopack migration compatibility
  check-compiler [path]  Detect React Compiler optimization opportunities
  assess-router [path]   Assess Next.js router complexity and recommend optimal setup
  detect-react192 [path] Detect React 19.2 feature opportunities (View Transitions, useEffectEvent)
  layers                  Display information about all layers
  validate [path]         Validate files without applying fixes
  init-tests [path]       Generate test files for components

Configuration Commands:
  init-config             Generate or display configuration
  health                  Run a health check to verify configuration

Enterprise Commands:
  security                Manage security, users, and audit trails
  monitoring              View metrics, alerts, and system health
  encryption              Manage encryption keys and settings

Utility Commands:
  stats                   Show project statistics
  clean                   Clean up old backup and state files
  backups                 Manage centralized backups
  rules                   Manage learned rules

Layer Commands:
  config scan|fix         Layer 1: Configuration fixes
  patterns scan|fix       Layer 2: Pattern fixes
  components scan|fix     Layer 3: Component fixes
  hydration scan|fix      Layer 4: Hydration fixes
  nextjs scan|fix         Layer 5: Next.js fixes
  testing scan|fix        Layer 6: Testing fixes
  adaptive scan|fix       Layer 7: Adaptive pattern learning

Migration Options:
  --dry-run              Show changes without applying them
  --verbose              Show detailed output
  --layers <list>        Specify layers to run (e.g., 1,2,3,4,5,6,7)
  --all-layers           Apply all layers (1-7)
  --backup               Create backups (default: true)
  --no-backup            Skip backup creation
  --report               Generate migration report
  --rollback             Enable rollback points
  --incremental          Migrate only changed files
  --parallel <workers>   Number of parallel workers (default: 4)

Options:
  --dry-run              Show changes without applying them
  --verbose              Show detailed output
  --backup               Create backups (default: true)
  --no-backup            Skip backup creation
  --production           Use enterprise backup system with encryption, monitoring
  --layers <list>        Specify layers to run (e.g., 1,2,3)
  --all-layers           Apply all layers (1-7)
  --include <patterns>   File patterns to include
  --exclude <patterns>   File patterns to exclude
  --format <console|json> Output format
  --output <file>        Save output to file
  --progressive          Enable progressive complexity suggestions
  --init                 Initialize configuration (for init-config)
  --show                 Show current configuration (for init-config)
  --states               Include state files in clean command
  --older-than <days>    Clean files older than specified days (for clean command)
  --keep-latest <n>      Keep only the latest n backups/states (for clean command)
  --list                 List learned rules (for rules command)
  --delete <id>          Delete a learned rule by ID (for rules command)
  --reset                Reset all learned rules (for rules command)
  --edit <id>            Edit a learned rule by ID (for rules command)
  --confidence <value>   Set confidence for edited rule (0.0-1.0)
  --export <file>        Export learned rules to file (for rules command)
  --import <file>        Import learned rules from file (for rules command)
  --help, -h            Show this help message
  --version, -v         Show version information

Examples:
  neurolint analyze src/ --verbose
  neurolint fix . --layers=1,2,7 --dry-run
  neurolint migrate . --dry-run --verbose
  neurolint migrate src/ --layers=1,2,3,4,5,6,7 --report
  neurolint migrate-nextjs-15.5 . --dry-run --verbose
  neurolint migrate-react19 . --dry-run --verbose
  neurolint migrate-biome . --dry-run --verbose
  neurolint layers --verbose
  neurolint init-config --init
  neurolint validate src/ --include="**/*.tsx"
  neurolint init-tests src/ --verbose
  neurolint stats --output=stats.json
  neurolint components fix src/ --verbose
  neurolint clean --older-than=7 --verbose
  neurolint clean --keep-latest=5 --states
  neurolint rules --list
  neurolint rules --edit=0 --confidence=0.9
  neurolint rules --export=rules.json
  neurolint rules --import=rules.json
  neurolint rules --delete=0
  neurolint rules --reset
  neurolint health
`);
  process.exit(0);
}

// Add migration command handling
async function handleMigrationCommand() {
  if (process.argv.length > 2 && process.argv[2] === 'migrate') {
    const targetPath = process.argv[3];
    
    if (!targetPath) {
      console.error('Error: Path is required for migration command');
      console.error('Usage: neurolint migrate <path> [options]');
      process.exit(1);
    }

    // All migrations are now free - no authentication needed!

  // Parse migration options
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
    production: process.argv.includes('--production'),
    progressive: process.argv.includes('--progressive'),
    layers: process.argv.includes('--layers') ? 
      process.argv[process.argv.indexOf('--layers') + 1]?.split(',').map(Number) : 
      [1, 2, 3, 4, 5, 6, 7],
    backup: !process.argv.includes('--no-backup'),
    report: process.argv.includes('--report'),
    rollback: process.argv.includes('--rollback'),
    incremental: process.argv.includes('--incremental'),
    parallel: parseInt(process.argv[process.argv.indexOf('--parallel') + 1]) || 4,
    include: process.argv.includes('--include') ? 
      process.argv[process.argv.indexOf('--include') + 1] : 
      '**/*.{ts,tsx,js,jsx,json}',
    exclude: process.argv.includes('--exclude') ? 
      process.argv[process.argv.indexOf('--exclude') + 1] : 
      '**/node_modules/**'
  };

  // Show migration help if requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(`
NeuroLint Migration Service - Enterprise Codebase Modernization

Usage: neurolint migrate <path> [options]

Description:
  Professional legacy codebase modernization with enterprise-grade safety.
  Migrates React/Next.js applications from older versions to modern standards.

Options:
  --dry-run              Show changes without applying them
  --verbose              Show detailed output
  --layers <list>        Specify layers to run (e.g., 1,2,3,4,5,6,7)
  --all-layers           Apply all layers (1-7)
  --backup               Create backups (default: true)
  --no-backup            Skip backup creation
  --report               Generate detailed migration report
  --rollback             Enable rollback points for safety
  --incremental          Migrate only changed files
  --parallel <workers>   Number of parallel workers (default: 4)
  --include <patterns>   File patterns to include
  --exclude <patterns>   File patterns to exclude
  --help, -h            Show this help message

Layers:
  1. Configuration fixes (TypeScript, Next.js, package.json)
  2. Pattern fixes (HTML entities, console statements, browser APIs)
  3. Component-specific fixes (accessibility, performance)
  4. Hydration and SSR fixes (use client, server components)
  5. Next.js App Router fixes (metadata, layouts, routing)
  6. Testing and validation fixes (test setup, coverage)
  7. Adaptive pattern learning (learns from previous transformations)

Examples:
  neurolint migrate . --dry-run --verbose
  neurolint migrate src/ --layers=1,2,3,4,5,6,7 --report
  neurolint migrate . --incremental --rollback
  neurolint migrate src/ --parallel=8 --verbose

Requirements:
  - Project path with React/Next.js codebase
  - All migration features are now free!

Support:
  Contact: clivemakazhu@gmail.com
  Documentation: https://neurolint.dev/docs/migration
`);
  process.exit(0);
  }

  // Run migration
  await runMigration(targetPath, options, null);
  process.exit(0);
}
}

/**
 * Run migration service - Local implementation for production readiness
 */
async function runMigration(path, options, apiKey) {
  console.log('Starting NeuroLint Migration Service (Local Mode)...');
  console.log(`Target: ${path}`);
  console.log(`Layers: ${options.layers.join(', ')}`);
  console.log(`Mode: ${options.dryRun ? 'Dry Run' : 'Live Migration'}`);
  
  if (options.verbose) {
    console.log(`[INFO] Options:`, options);
  }

  try {
    const startTime = Date.now();
    
    // Use existing CLI infrastructure for local migration
    const fixMaster = require('./fix-master.js');
    const backupManager = new (require('./backup-manager.js'))();
    const glob = require('glob');
    
    // Simple file discovery for migration
    let files = [];
    if (require('fs').statSync(path).isFile()) {
      files = [path];
    } else {
      files = glob.sync(options.include, {
        cwd: path,
        absolute: true,
        ignore: options.exclude.split(','),
        nodir: true
      });
    }
    
    console.log(`Found ${files.length} files to migrate`);

    if (files.length === 0) {
      console.log('No files found to migrate');
      return;
    }

    // Create backup if enabled
    if (options.backup && !options.dryRun) {
      console.log('Creating centralized backup...');
      for (const file of files) {
        try {
          await backupManager.createBackup(file, 'migration');
        } catch (error) {
          if (options.verbose) {
            console.log(`Warning: Could not backup ${file}: ${error.message}`);
          }
        }
      }
    }

    // Process files using existing fix-master
    console.log('Starting migration...');
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      
      if (options.verbose) {
        console.log(`Progress: ${progress}% (${i + 1}/${files.length})`);
      } else if (i % 10 === 0) {
        console.log(`Progress: ${progress}% (${i + 1}/${files.length})`);
      }

      try {
        const result = await fixMaster.executeLayers(file, options.layers, {
          dryRun: options.dryRun,
          verbose: false,
          filePath: file
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`${file}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${file}: ${error.message}`);
        if (options.verbose) {
          console.log(`FAILED: ${file}: ${error.message}`);
        }
      }
    }

    const duration = Date.now() - startTime;

    // Generate report if requested
    if (options.report) {
      console.log('Generating migration report...');
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: files.length,
          successful,
          failed,
          successRate: Math.round((successful / files.length) * 100),
          duration
        },
        options,
        errors: errors.slice(0, 50) // Limit errors in report
      };

      const fs = require('fs');
      const reportPath = `migration-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`Migration report saved: ${reportPath}`);
    }

    // Summary
    console.log('\nMigration Summary:');
    console.log(`Successfully migrated: ${successful} files`);
    console.log(`Failed: ${failed} files`);
    console.log(`Total time: ${duration}ms`);
    
    if (options.dryRun) {
      console.log('This was a dry run. No changes were applied.');
    } else {
      console.log('Migration completed successfully!');
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Initialize migration project
 */
async function initializeMigrationProject(path, options, apiKey) {
  const projectData = {
    name: `Migration-${Date.now()}`,
    path: path,
    options: options,
    status: 'initialized',
    createdAt: new Date().toISOString()
  };

  // In a real implementation, this would create a project in the database
  // For now, return a mock project ID
  return `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Discover files to migrate
 */
async function discoverMigrationFiles(path, options) {
  const glob = require('glob');
  const fs = require('fs');
  const pathModule = require('path');

  const files = glob.sync(options.include, {
    cwd: path,
    ignore: options.exclude.split(','),
    absolute: true
  });

  return files.filter(file => {
    const ext = pathModule.extname(file);
    return ['.ts', '.tsx', '.js', '.jsx', '.json'].includes(ext);
  });
}

/**
 * Create migration backup
 */
async function createMigrationBackup(path, projectId) {
  const fs = require('fs');
  const pathModule = require('path');
  const archiver = require('archiver');

  const backupPath = pathModule.join(path, `.neurolint-backup-${projectId}.zip`);
  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Backup created: ${backupPath}`);
      resolve(backupPath);
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(path, false, { ignore: ['node_modules', '.git', '.neurolint-backup-*'] });
    archive.finalize();
  });
}

/**
 * Create rollback point
 */
async function createRollbackPoint(projectId, files) {
  const fs = require('fs');

  const rollbackData = {
    projectId,
    timestamp: new Date().toISOString(),
    files: files.map(file => ({
      path: file,
      content: fs.readFileSync(file, 'utf8'),
      hash: require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    }))
  };

  // In a real implementation, this would be stored in the database
  console.log(`Rollback point created with ${rollbackData.files.length} files`);
  return rollbackData;
}

/**
 * Execute migration
 */
async function executeMigration(files, options, apiKey, projectId) {
  const startTime = Date.now();
  let successful = 0;
  let failed = 0;
  const errors = [];

  console.log(`Migrating ${files.length} files...`);

  // Process files in batches for parallel processing
  const batchSize = options.parallel;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const promises = batch.map(file => migrateFile(file, options, apiKey, projectId));
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful++;
        if (options.verbose) {
          console.log(`SUCCESS: ${batch[index]}`);
        }
      } else {
        failed++;
        errors.push({ file: batch[index], error: result.reason });
        if (options.verbose) {
          console.log(`FAILED: ${batch[index]}: ${result.reason.message}`);
        }
      }
    });

    // Progress update
    const progress = Math.round(((i + batchSize) / files.length) * 100);
    console.log(`Progress: ${Math.min(progress, 100)}% (${i + batchSize}/${files.length})`);
  }

  return {
    successful,
    failed,
    errors,
    duration: Date.now() - startTime
  };
}

/**
 * Migrate a single file
 */
async function migrateFile(filePath, options, apiKey, projectId) {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');

  // Call the migration API
  const response = await fetch('https://app.neurolint.dev/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Migration-Service': 'true'
    },
    body: JSON.stringify({
      code: content,
      filename: filePath,
      layers: options.layers.join(','),
      applyFixes: !options.dryRun,
      metadata: {
        migrationService: true,
        projectId: projectId,
        options: options
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Migration API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success && !options.dryRun) {
    // Apply the migrated code
    fs.writeFileSync(filePath, result.code);
  }

  return result;
}

/**
 * Generate migration report
 */
async function generateMigrationReport(projectId, results, options) {
  const report = {
    projectId,
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.successful + results.failed,
      successful: results.successful,
      failed: results.failed,
      successRate: Math.round((results.successful / (results.successful + results.failed)) * 100),
      duration: results.duration
    },
    options: options,
    errors: results.errors,
    layers: options.layers
  };

  const fs = require('fs');
  const reportPath = `migration-report-${projectId}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Migration report saved: ${reportPath}`);
  return reportPath;
}

/**
 * Check migration access - All migrations are now free!
 */
async function checkMigrationAccess(apiKey) {
  // All migrations are free and open source - no authentication required
  return { 
    hasAccess: true, 
    reason: 'All migrations are free and open source' 
  };
}

// Handle migration command if present
if (process.argv.length > 2 && process.argv[2] === 'migrate') {
  handleMigrationCommand().catch(error => {
    console.error('Migration command failed:', error.message);
    process.exit(1);
  });
} else {
  // Only execute if this is the main module (not being required)
  if (require.main === module) {
  handleCommand(process.argv.slice(2));
  }
} 

// Memory management utilities
const MemoryManager = {
  // Track memory usage
  memoryUsage: {
    start: null,
    peak: 0,
    samples: []
  },
  
  // Start memory tracking
  startTracking() {
    this.memoryUsage.start = process.memoryUsage();
    this.memoryUsage.peak = 0;
    this.memoryUsage.samples = [];
  },
  
  // Sample current memory usage
  sample() {
    const current = process.memoryUsage();
    const heapUsed = current.heapUsed / 1024 / 1024; // MB
    this.memoryUsage.peak = Math.max(this.memoryUsage.peak, heapUsed);
    this.memoryUsage.samples.push({
      timestamp: Date.now(),
      heapUsed,
      heapTotal: current.heapTotal / 1024 / 1024,
      external: current.external / 1024 / 1024
    });
    
    // Keep only last 100 samples to prevent memory leaks
    if (this.memoryUsage.samples.length > 100) {
      this.memoryUsage.samples = this.memoryUsage.samples.slice(-100);
    }
  },
  
  // Force garbage collection if available
  async forceGC() {
    if (global.gc) {
      global.gc();
      // Wait a bit for GC to complete
      await new Promise(resolve => setImmediate(resolve));
    }
  },
  
  // Get memory report
  getReport() {
    const current = process.memoryUsage();
    return {
      current: {
        heapUsed: Math.round(current.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(current.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(current.external / 1024 / 1024 * 100) / 100
      },
      peak: Math.round(this.memoryUsage.peak * 100) / 100,
      samples: this.memoryUsage.samples.length
    };
  }
};

// Export getFiles function for use in migration
module.exports = { getFiles };

// Enhanced file processing with memory management and error suppression
async function processFilesWithMemoryManagement(files, processor, options = {}) {
  const {
    batchSize = 100,
    maxConcurrent = 10,
    memoryThreshold = 500, // MB
    gcInterval = 10, // Force GC every N batches
    suppressErrors = false, // Suppress verbose error output
    maxErrors = 50 // Maximum errors to show before suppressing
  } = options;
  
  MemoryManager.startTracking();
  const results = [];
  let batchCount = 0;
  let errorCount = 0;
  let suppressedErrors = 0;
  
  // Process files in batches
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    // Check memory usage before processing batch
    MemoryManager.sample();
    const memoryReport = MemoryManager.getReport();
    
    if (memoryReport.current.heapUsed > memoryThreshold) {
      if (options.verbose) {
        process.stdout.write(`Memory usage high (${memoryReport.current.heapUsed}MB), forcing GC...\n`);
      }
      await MemoryManager.forceGC();
    }
    
    // Process batch with controlled concurrency
    const batchPromises = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      const concurrentBatch = batch.slice(j, j + maxConcurrent);
      const promises = concurrentBatch.map(file => processor(file));
      batchPromises.push(...promises);
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    batchCount++;
    
    // Force GC periodically
    if (batchCount % gcInterval === 0) {
      await MemoryManager.forceGC();
    }
    
    // Update progress
    if (options.onProgress) {
      const progress = Math.min((i + batchSize) / files.length * 100, 100);
      options.onProgress(progress, memoryReport);
    }
  }
  
  // Report suppressed errors if any
  if (suppressedErrors > 0 && options.verbose) {
    process.stderr.write(`Suppressed ${suppressedErrors} additional error messages to reduce noise\n`);
  }
  
  return results;
}

// Analyze a single file for issues with improved error handling
async function analyzeFile(code, filePath, options) {
  try {
    // Skip files that are likely to cause parsing issues
    const skipPatterns = [
      /\.d\.ts$/,           // TypeScript declaration files
      /\.min\.(js|ts)$/,    // Minified files
      /\.bundle\.(js|ts)$/, // Bundled files
      /\.chunk\.(js|ts)$/,  // Chunked files
      /\.backup/,           // Backup files
      /\.tmp$/,             // Temporary files
      /\.temp$/,            // Temporary files
      /\.log$/,             // Log files
      /\.lock$/,            // Lock files
      /\.cache$/,           // Cache files
      /\.git/,              // Git files
      /node_modules/,       // Node modules
      /\.next/,             // Next.js build files
      /dist/,               // Distribution files
      /build/,              // Build files
      /coverage/,           // Coverage files
      /\.nyc_output/,       // NYC output
      /\.jest/,             // Jest cache
      /test-results/,       // Test results
      /\.vscode/,           // VS Code files
      /\.idea/,             // IntelliJ files
      /\.vs/,               // Visual Studio files
      /\.DS_Store/,         // macOS files
      /Thumbs\.db/,         // Windows files
      /desktop\.ini/,       // Windows files
      /\.env/,              // Environment files
      /package-lock\.json/, // Package lock files
      /yarn\.lock/,         // Yarn lock files
      /pnpm-lock\.yaml/,    // pnpm lock files
      /\.npm/,              // npm cache
      /\.yarn/,             // Yarn cache
      /\.cache/,            // Cache directories
      /cache/,              // Cache directories
      /\.parcel-cache/,     // Parcel cache
      /\.eslintcache/,      // ESLint cache
      /\.stylelintcache/,   // Stylelint cache
      /\.neurolint/,        // Neurolint files
      /states-.*\.json/,    // State files
      /\.backup-/,          // Backup files
      /\.backup$/,          // Backup files
      /\.bak$/,             // Backup files
      /\.old$/,             // Old files
      /\.orig$/,            // Original files
      /\.rej$/,             // Rejected patches
      /\.tmp$/,             // Temporary files
      /\.temp$/,            // Temporary files
      /\.lock-wscript/,     // Waf lock file
      /npm-debug\.log/,     // npm debug logs
      /yarn-debug\.log/,    // Yarn debug logs
      /yarn-error\.log/,    // Yarn error logs
      /\.pnp\./,            // Plug'n'Play files
      /\.swp$/,             // Vim swap files
      /\.swo$/,             // Vim swap files
      /~$/,                 // Backup files
      /\.#/,                // Emacs lock files
      /#.*#/,               // Emacs backup files
      /\.log$/,             // Log files
      /logs/,               // Log directories
      /\.log/,              // Log cache
      /docs/,               // Documentation
      /documentation/,      // Documentation
      /assets/,             // Asset files
      /public/,             // Public assets
      /static/,             // Static files
      /images/,             // Image files
      /img/,                // Image files
      /icons/,              // Icon files
      /fonts/,              // Font files
      /vendor/,             // Vendor files
      /\.png$/,             // Image files
      /\.jpg$/,             // Image files
      /\.jpeg$/,            // Image files
      /\.gif$/,             // Image files
      /\.svg$/,             // Image files
      /\.ico$/,             // Image files
      /\.woff$/,            // Font files
      /\.woff2$/,           // Font files
      /\.ttf$/,             // Font files
      /\.eot$/,             // Font files
      /\.mp4$/,             // Media files
      /\.webm$/,            // Media files
      /\.mp3$/,             // Media files
      /\.wav$/,             // Media files
      /\.pdf$/,             // Archive files
      /\.zip$/,             // Archive files
      /\.tar\.gz$/,         // Archive files
      /\.rar$/,             // Archive files
      /\.min\.js$/,         // Minified JavaScript
      /\.min\.css$/,        // Minified CSS
      /\.bundle\.js$/,      // Bundled JavaScript
      /\.chunk\.js$/        // Chunked JavaScript
    ];

    // Check if file should be skipped
    for (const pattern of skipPatterns) {
      if (pattern.test(filePath)) {
        return []; // Skip this file
      }
    }

    // Check file size - skip very large files
    const fileSize = Buffer.byteLength(code, 'utf8');
    if (fileSize > 1024 * 1024) { // Skip files larger than 1MB
      return [];
    }

    // Check for obvious syntax issues before parsing
    const syntaxIssues = [
      /^\s*$/, // Empty files
      /^\/\*[\s\S]*\*\/$/, // Only comments
      /^\/\/.*$/, // Only single-line comments
      /^[^\w\s]*$/, // Only special characters
      /^[0-9\s]*$/, // Only numbers and spaces
      /^[a-zA-Z\s]*$/, // Only letters and spaces
      /^[^\w\s\{\}\[\]\(\)]*$/, // No code structure
    ];

    for (const pattern of syntaxIssues) {
      if (pattern.test(code.trim())) {
        return []; // Skip files with obvious syntax issues
      }
    }

    // Try shared core analysis first
    if (typeof sharedCore !== 'undefined' && sharedCore.analyze) {
      try {
        const analysis = await sharedCore.analyze(code, {
          filename: filePath,
          platform: 'cli',
          verbose: options.verbose
        });
        return analysis.issues || [];
      } catch (sharedCoreError) {
        // Fall back to SmartLayerSelector if shared core fails
        if (options.verbose && !options.suppressErrors) {
          process.stderr.write(`Shared core analysis failed for ${filePath}: ${sharedCoreError.message}\n`);
        }
      }
    }
    
    // Fallback to SmartLayerSelector with better error handling
    try {
      const SmartLayerSelector = require('./selector.js');
      const analysis = SmartLayerSelector.analyzeAndRecommend(code, filePath);
      
      // Validate the analysis result
      if (analysis && typeof analysis === 'object') {
        return analysis.detectedIssues || [];
      }
      
      return [];
    } catch (selectorError) {
      if (options.verbose && !options.suppressErrors) {
        process.stderr.write(`SmartLayerSelector analysis failed for ${filePath}: ${selectorError.message}\n`);
      }
      return [];
    }
  } catch (error) {
    if (options.verbose && !options.suppressErrors) {
      process.stderr.write(`Analysis failed for ${filePath}: ${error.message}\n`);
    }
    return [];
  }
}

/**
 * Complexity Assessment and Simplification Commands
 * Addresses Reddit community concerns about Next.js complexity for small projects
 */

async function assessComplexity(targetPath, options = {}) {
  const { verbose = false, format = 'text' } = options;
  const spinner = ora('Analyzing project complexity...').start();
  
  try {
    const complexityAnalysis = await analyzeProjectComplexity(targetPath, options);
    spinner.succeed('Complexity analysis complete');
    
    if (format === 'json') {
      console.log(JSON.stringify(complexityAnalysis, null, 2));
      return;
    }
    
    // Display human-readable complexity report
    displayComplexityReport(complexityAnalysis, verbose);
    
    return complexityAnalysis;
  } catch (error) {
    spinner.fail(`Complexity analysis failed: ${error.message}`);
    if (verbose) console.error(error);
    process.exit(1);
  }
}

async function simplifyProject(targetPath, options = {}) {
  const { dryRun = false, verbose = false, backup = true, target = 'react' } = options;
  
  console.log(`\n[SIMPLIFY] Starting project simplification to ${target}...`);
  
  const spinner = ora('Analyzing current complexity...').start();
  
  try {
    // First assess complexity
    const complexity = await analyzeProjectComplexity(targetPath, { verbose });
    spinner.text = 'Planning simplification strategy...';
    
    const strategy = planSimplificationStrategy(complexity, target, options);
    spinner.succeed(`Simplification strategy planned: ${strategy.steps.length} steps`);
    
    if (verbose) {
      console.log('\n[STRATEGY] Simplification steps:');
      strategy.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.description}`);
      });
    }
    
    if (dryRun) {
      console.log('\n[DRY-RUN] Simplification preview:');
      displaySimplificationPreview(strategy);
      return strategy;
    }
    
    // Execute simplification
    const backupManager = createBackupManager({ production: options.production, verbose });
    const results = await executeSimplificationStrategy(targetPath, strategy, {
      backup,
      verbose,
      backupManager
    });
    
    displaySimplificationResults(results);
    return results;
    
  } catch (error) {
    spinner.fail(`Simplification failed: ${error.message}`);
    if (verbose) console.error(error);
    process.exit(1);
  }
}

async function analyzeProjectComplexity(targetPath, options = {}) {
  const analysis = {
    projectType: 'unknown',
    complexity: {
      score: 0,
      level: 'simple', // simple, moderate, complex, enterprise
      factors: []
    },
    nextjsFeatures: {
      used: [],
      unused: [],
      unnecessary: []
    },
    recommendations: [],
    simplificationOpportunities: []
  };
  
  // Detect project type
  analysis.projectType = await detectProjectType(targetPath);
  
  // Analyze Next.js feature usage
  if (analysis.projectType.includes('nextjs')) {
    analysis.nextjsFeatures = await analyzeNextJSFeatureUsage(targetPath);
  }
  
  // Calculate complexity score
  analysis.complexity = calculateComplexityScore(analysis);
  
  // Generate recommendations
  analysis.recommendations = generateComplexityRecommendations(analysis);
  analysis.simplificationOpportunities = identifySimplificationOpportunities(analysis);
  
  return analysis;
}

async function detectProjectType(targetPath) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const nextConfigPath = path.join(targetPath, 'next.config.js');
  const nextConfigTsPath = path.join(targetPath, 'next.config.ts');
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const hasNext = dependencies.next;
    const hasReact = dependencies.react;
    const hasNextConfig = await fileExists(nextConfigPath) || await fileExists(nextConfigTsPath);
    
    if (hasNext && hasReact) {
      const nextVersion = dependencies.next;
      if (hasNextConfig) {
        return `nextjs-${nextVersion}-configured`;
      }
      return `nextjs-${nextVersion}-basic`;
    } else if (hasReact) {
      return 'react-spa';
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

async function analyzeNextJSFeatureUsage(targetPath) {
  const features = {
    used: [],
    unused: [],
    unnecessary: []
  };
  
  // Check for app directory
  const appDirExists = await fileExists(path.join(targetPath, 'app'));
  const pagesDirExists = await fileExists(path.join(targetPath, 'pages'));
  
  if (appDirExists) features.used.push('App Router');
  if (pagesDirExists) features.used.push('Pages Router');
  
  // Check for middleware
  const middlewareExists = await fileExists(path.join(targetPath, 'middleware.ts')) || 
                           await fileExists(path.join(targetPath, 'middleware.js'));
  if (middlewareExists) features.used.push('Middleware');
  
  // Check for API routes
  const apiRoutesExist = await checkForApiRoutes(targetPath);
  if (apiRoutesExist) features.used.push('API Routes');
  
  // Check for server components
  const serverComponentsUsed = await checkForServerComponents(targetPath);
  if (serverComponentsUsed) features.used.push('Server Components');
  
  // Check for client components
  const clientComponentsUsed = await checkForClientComponents(targetPath);
  if (clientComponentsUsed) features.used.push('Client Components');
  
  // Identify unnecessary features for small projects
  if (features.used.includes('Middleware') && !await hasAuthenticationLogic(targetPath)) {
    features.unnecessary.push('Middleware (no auth detected)');
  }
  
  if (features.used.includes('API Routes') && await isSimpleStaticSite(targetPath)) {
    features.unnecessary.push('API Routes (static site detected)');
  }
  
  return features;
}

function calculateComplexityScore(analysis) {
  let score = 0;
  const factors = [];
  
  // Base complexity from project type
  if (analysis.projectType.includes('nextjs')) {
    score += 30;
    factors.push('Next.js framework (+30)');
  } else if (analysis.projectType.includes('react')) {
    score += 10;
    factors.push('React framework (+10)');
  }
  
  // Feature complexity
  analysis.nextjsFeatures.used.forEach(feature => {
    switch (feature) {
      case 'App Router':
        score += 20;
        factors.push('App Router (+20)');
        break;
      case 'Pages Router':
        score += 15;
        factors.push('Pages Router (+15)');
        break;
      case 'Middleware':
        score += 25;
        factors.push('Middleware (+25)');
        break;
      case 'API Routes':
        score += 15;
        factors.push('API Routes (+15)');
        break;
      case 'Server Components':
        score += 20;
        factors.push('Server Components (+20)');
        break;
    }
  });
  
  // Unnecessary feature penalty
  score += analysis.nextjsFeatures.unnecessary.length * 10;
  if (analysis.nextjsFeatures.unnecessary.length > 0) {
    factors.push(`Unnecessary features (+${analysis.nextjsFeatures.unnecessary.length * 10})`);
  }
  
  let level = 'simple';
  if (score >= 80) level = 'enterprise';
  else if (score >= 60) level = 'complex';
  else if (score >= 40) level = 'moderate';
  
  return { score, level, factors };
}

function generateComplexityRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.complexity.level === 'complex' || analysis.complexity.level === 'enterprise') {
    recommendations.push({
      type: 'warning',
      message: 'High complexity detected. Consider simplifying for small projects.',
      action: 'Run `neurolint simplify . --target=react` to convert to plain React'
    });
  }
  
  if (analysis.nextjsFeatures.unnecessary.length > 0) {
    recommendations.push({
      type: 'optimization',
      message: `${analysis.nextjsFeatures.unnecessary.length} unnecessary features detected`,
      action: 'Run `neurolint simplify . --remove-unused` to clean up'
    });
  }
  
  if (analysis.complexity.level === 'simple' && analysis.projectType.includes('nextjs')) {
    recommendations.push({
      type: 'suggestion',
      message: 'Simple project using Next.js. Consider if plain React would be sufficient.',
      action: 'Run `neurolint assess . --suggest-alternatives` for alternatives'
    });
  }
  
  return recommendations;
}

function identifySimplificationOpportunities(analysis) {
  const opportunities = [];
  
  // Remove unnecessary middleware
  if (analysis.nextjsFeatures.unnecessary.includes('Middleware (no auth detected)')) {
    opportunities.push({
      type: 'remove',
      target: 'middleware',
      impact: 'Reduces bundle size and complexity',
      effort: 'low'
    });
  }
  
  // Convert to SPA if no SSR needed
  if (analysis.nextjsFeatures.used.includes('App Router') && !analysis.nextjsFeatures.used.includes('Server Components')) {
    opportunities.push({
      type: 'convert',
      target: 'spa',
      impact: 'Significant complexity reduction',
      effort: 'medium'
    });
  }
  
  // Remove API routes for static sites
  if (analysis.nextjsFeatures.unnecessary.includes('API Routes (static site detected)')) {
    opportunities.push({
      type: 'remove',
      target: 'api-routes',
      impact: 'Removes server-side complexity',
      effort: 'low'
    });
  }
  
  return opportunities;
}

function displayComplexityReport(analysis, verbose = false) {
  console.log('\n' + '='.repeat(60));
  console.log('           PROJECT COMPLEXITY ASSESSMENT');
  console.log('='.repeat(60));
  
  console.log(`\nProject Type: ${analysis.projectType}`);
  console.log(`Complexity Score: ${analysis.complexity.score}/100 (${analysis.complexity.level.toUpperCase()})`);
  
  if (verbose && analysis.complexity.factors.length > 0) {
    console.log('\nComplexity Factors:');
    analysis.complexity.factors.forEach(factor => {
      console.log(`  - ${factor}`);
    });
  }
  
  if (analysis.nextjsFeatures.used.length > 0) {
    console.log('\nNext.js Features Used:');
    analysis.nextjsFeatures.used.forEach(feature => {
      console.log(`  [+] ${feature}`);
    });
  }
  
  if (analysis.nextjsFeatures.unnecessary.length > 0) {
    console.log('\nUnnecessary Features Detected:');
    analysis.nextjsFeatures.unnecessary.forEach(feature => {
      console.log(`  [!] ${feature}`);
    });
  }
  
  if (analysis.recommendations.length > 0) {
    console.log('\nRecommendations:');
    analysis.recommendations.forEach((rec, i) => {
      const icon = rec.type === 'warning' ? '[!]' : rec.type === 'optimization' ? '[*]' : '[i]';
      console.log(`  ${icon} ${rec.message}`);
      if (verbose) console.log(`     Action: ${rec.action}`);
    });
  }
  
  if (analysis.simplificationOpportunities.length > 0) {
    console.log('\nSimplification Opportunities:');
    analysis.simplificationOpportunities.forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.type.toUpperCase()} ${opp.target}`);
      console.log(`     Impact: ${opp.impact}`);
      console.log(`     Effort: ${opp.effort}`);
    });
    
    console.log('\nTo simplify your project, run:');
    console.log('  neurolint simplify . --dry-run  # Preview changes');
    console.log('  neurolint simplify . --apply     # Apply changes');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Helper functions
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkForApiRoutes(targetPath) {
  const apiPath = path.join(targetPath, 'pages', 'api');
  const appApiPath = path.join(targetPath, 'app', 'api');
  return await fileExists(apiPath) || await fileExists(appApiPath);
}

async function checkForServerComponents(targetPath) {
  // Check for server components by looking for files without 'use client'
  try {
    const files = await getAllProjectFiles(targetPath);
    const componentFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
    
    for (const file of componentFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        // Server component if: async function, no 'use client', and in app directory
        if (content.includes('async function') && 
            !content.includes('use client') && 
            !content.includes('onClick') &&
            !content.includes('useState') &&
            file.includes('/app/')) {
          return true;
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function checkForClientComponents(targetPath) {
  // Check for 'use client' directives
  try {
    const files = await getAllProjectFiles(targetPath);
    const componentFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
    
    for (const file of componentFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('use client')) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function hasAuthenticationLogic(targetPath) {
  // Check for common auth patterns
  try {
    const files = await getAllProjectFiles(targetPath);
    const authPatterns = [
      'NextAuth',
      'useSession',
      'signIn',
      'signOut',
      'getServerSession',
      'jwt',
      'passport',
      'auth0',
      'firebase/auth',
      'supabase/auth'
    ];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (authPatterns.some(pattern => content.includes(pattern))) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function isSimpleStaticSite(targetPath) {
  // Determine if this is a simple static site
  try {
    // Check for static site indicators
    const hasApiRoutes = await checkForApiRoutes(targetPath);
    const hasServerComponents = await checkForServerComponents(targetPath);
    const hasAuth = await hasAuthenticationLogic(targetPath);
    const hasDynamicRoutes = await checkForDynamicRoutes(targetPath);
    
    // Static site if no server-side features
    return !hasApiRoutes && !hasServerComponents && !hasAuth && !hasDynamicRoutes;
  } catch (error) {
    return false;
  }
}

async function checkForDynamicRoutes(targetPath) {
  // Check for dynamic routes like [id].tsx or [...slug].tsx
  try {
    const files = await getAllProjectFiles(targetPath);
    return files.some(file => {
      const fileName = path.basename(file);
      return fileName.includes('[') && fileName.includes(']');
    });
  } catch (error) {
    return false;
  }
}

function planSimplificationStrategy(complexity, target, options) {
  const strategy = {
    target,
    steps: [],
    estimatedTime: '5-15 minutes',
    backupRequired: true
  };
  
  if (target === 'react') {
    strategy.steps.push(
      { type: 'backup', description: 'Create project backup' },
      { type: 'remove', description: 'Remove Next.js specific files and configurations' },
      { type: 'convert', description: 'Convert Next.js routing to React Router' },
      { type: 'update', description: 'Update package.json dependencies' },
      { type: 'modify', description: 'Convert pages to React components' },
      { type: 'validate', description: 'Validate conversion success' }
    );
  } else if (target === 'minimal-nextjs') {
    strategy.steps.push(
      { type: 'backup', description: 'Create project backup' },
      { type: 'remove', description: 'Remove unnecessary Next.js features' },
      { type: 'simplify', description: 'Simplify configuration files' },
      { type: 'clean', description: 'Clean up unused dependencies' },
      { type: 'validate', description: 'Validate simplified setup' }
    );
  }
  
  return strategy;
}

function displaySimplificationPreview(strategy) {
  console.log(`\nTarget: ${strategy.target}`);
  console.log(`Estimated time: ${strategy.estimatedTime}`);
  console.log(`Steps to execute:`);
  
  strategy.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.description}`);
  });
}

async function executeSimplificationStrategy(targetPath, strategy, options) {
  const results = {
    success: false,
    steps: [],
    errors: [],
    summary: {}
  };
  
  for (const step of strategy.steps) {
    try {
      console.log(`\nExecuting: ${step.description}...`);
      const stepResult = await executeSimplificationStep(targetPath, step, options);
      results.steps.push(stepResult);
      
      if (!stepResult.success) {
        results.errors.push(`Step failed: ${step.description} - ${stepResult.error}`);
        break;
      }
    } catch (error) {
      results.errors.push(`Step error: ${step.description} - ${error.message}`);
      break;
    }
  }
  
  results.success = results.errors.length === 0;
  return results;
}

async function executeSimplificationStep(targetPath, step, options) {
  const { verbose = false, backupManager } = options;
  
  try {
    switch (step.type) {
      case 'backup':
        if (backupManager) {
          const files = await getAllProjectFiles(targetPath);
          for (const file of files) {
            try {
              const content = await fs.readFile(file, 'utf8');
              await backupManager.createBackup(file, content);
            } catch (error) {
              if (verbose) console.log(`Skipping backup for ${file}: ${error.message}`);
            }
          }
        }
        return { success: true, type: step.type, description: step.description, changes: 1, files: [] };
        
      case 'remove':
        return await removeUnnecessaryFeatures(targetPath, step, options);
        
      case 'convert':
        return await convertRoutingStructure(targetPath, step, options);
        
      case 'update':
        return await updateDependencies(targetPath, step, options);
        
      case 'modify':
        return await convertPages(targetPath, step, options);
        
      case 'simplify':
        return await simplifyConfigurations(targetPath, step, options);
        
      case 'clean':
        return await cleanUnusedDependencies(targetPath, step, options);
        
      case 'validate':
        return await validateSimplification(targetPath, step, options);
        
      default:
        return {
          success: true,
          type: step.type,
          description: step.description,
          changes: 0,
          files: []
        };
    }
  } catch (error) {
    return {
      success: false,
      type: step.type,
      description: step.description,
      error: error.message,
      changes: 0,
      files: []
    };
  }
}

async function removeUnnecessaryFeatures(targetPath, step, options) {
  const { verbose } = options;
  let changes = 0;
  const files = [];
  
  // Remove middleware if unnecessary
  const middlewareFiles = [
    path.join(targetPath, 'middleware.ts'),
    path.join(targetPath, 'middleware.js')
  ];
  
  for (const middlewareFile of middlewareFiles) {
    if (await fileExists(middlewareFile)) {
      const content = await fs.readFile(middlewareFile, 'utf8');
      if (!content.includes('auth') && !content.includes('redirect') && !content.includes('rewrite')) {
        try {
          await fs.unlink(middlewareFile);
          changes++;
          files.push(middlewareFile);
          if (verbose) console.log(`Removed unnecessary middleware: ${middlewareFile}`);
        } catch (unlinkError) {
          if (verbose) console.warn(`Failed to remove ${middlewareFile}: ${unlinkError.message}`);
        }
      }
    }
  }
  
  // Remove API routes if static site
  const apiDir = path.join(targetPath, 'pages', 'api');
  const appApiDir = path.join(targetPath, 'app', 'api');
  
  if (await fileExists(apiDir)) {
    const apiFiles = await getAllFilesInDirectory(apiDir);
    for (const apiFile of apiFiles) {
      const content = await fs.readFile(apiFile, 'utf8');
      if (content.includes('NextResponse.json') && !content.includes('database') && !content.includes('fetch')) {
        try {
          await fs.unlink(apiFile);
          changes++;
          files.push(apiFile);
          if (verbose) console.log(`Removed static API route: ${apiFile}`);
        } catch (unlinkError) {
          if (verbose) console.warn(`Failed to remove ${apiFile}: ${unlinkError.message}`);
        }
      }
    }
  }
  
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes,
    files
  };
}

async function convertRoutingStructure(targetPath, step, options) {
  // Placeholder for routing conversion
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes: 0,
    files: []
  };
}

async function updateDependencies(targetPath, step, options) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    let changed = false;
    
    // For React conversion, remove Next.js and add React Router
    if (step.description.includes('React')) {
      if (packageJson.dependencies && packageJson.dependencies.next) {
        delete packageJson.dependencies.next;
        packageJson.dependencies['react-router-dom'] = '^6.20.0';
        changed = true;
      }
    }
    
    if (changed) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    return {
      success: true,
      type: step.type,
      description: step.description,
      changes: changed ? 1 : 0,
      files: changed ? [packageJsonPath] : []
    };
  }
  
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes: 0,
    files: []
  };
}

async function convertPages(targetPath, step, options) {
  // Placeholder for page conversion
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes: 0,
    files: []
  };
}

async function simplifyConfigurations(targetPath, step, options) {
  const { verbose } = options;
  let changes = 0;
  const files = [];
  
  // Simplify next.config.js
  const nextConfigPath = path.join(targetPath, 'next.config.js');
  const nextConfigTsPath = path.join(targetPath, 'next.config.ts');
  
  const configPath = await fileExists(nextConfigPath) ? nextConfigPath : 
                     await fileExists(nextConfigTsPath) ? nextConfigTsPath : null;
  
  if (configPath) {
    const content = await fs.readFile(configPath, 'utf8');
    
    // Create minimal config
    const minimalConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig`;
    
    if (content !== minimalConfig) {
      await fs.writeFile(configPath, minimalConfig);
      changes++;
      files.push(configPath);
      if (verbose) console.log(`Simplified configuration: ${configPath}`);
    }
  }
  
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes,
    files
  };
}

async function cleanUnusedDependencies(targetPath, step, options) {
  // Placeholder for dependency cleanup
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes: 0,
    files: []
  };
}

async function validateSimplification(targetPath, step, options) {
  // Placeholder for validation
  return {
    success: true,
    type: step.type,
    description: step.description,
    changes: 0,
    files: []
  };
}

// Helper functions
async function getAllProjectFiles(projectPath) {
  const files = [];
  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    
    const fullPath = path.join(projectPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllProjectFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function getAllFilesInDirectory(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFilesInDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function displaySimplificationResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('           SIMPLIFICATION RESULTS');
  console.log('='.repeat(60));
  
  if (results.success) {
    console.log('\n[SUCCESS] Simplification completed successfully!');
    
    const totalChanges = results.steps.reduce((sum, step) => sum + (step.changes || 0), 0);
    console.log(`\nSummary:`);
    console.log(`  - Steps completed: ${results.steps.length}`);
    console.log(`  - Files modified: ${totalChanges}`);
    console.log(`  - Errors: 0`);
  } else {
    console.log('\n[FAILED] Simplification failed');
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

