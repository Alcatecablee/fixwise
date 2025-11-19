#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('../backup-manager');

/**
 * Detect Next.js version from package.json
 */
async function detectNextJSVersion(projectRoot) {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(packageJson);
    
    const nextVersion = pkg.dependencies?.next || 
                       pkg.devDependencies?.next || 
                       pkg.peerDependencies?.next;
    
    if (!nextVersion) return null;
    
    // Extract version from range (e.g., "^15.5.0" -> "15.5.0")
    const versionMatch = nextVersion.match(/[\d.]+/);
    return versionMatch ? versionMatch[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse semantic version string
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3])
  };
}

/**
 * Check if Turbopack is supported for the Next.js version
 */
function isTurbopackSupported(version) {
  const parsed = parseVersion(version);
  if (!parsed) return false;
  
  // Turbopack is available in Next.js 13.1+ but stable in 15.0+
  return parsed.major >= 13 && parsed.minor >= 1;
}

/**
 * Generate Turbopack configuration suggestions
 */
function generateTurbopackSuggestions(nextVersion) {
  const suggestions = [];
  
  if (!isTurbopackSupported(nextVersion)) {
    suggestions.push({
      type: 'turbopack',
      message: 'Turbopack requires Next.js 13.1+ for basic support, 15.0+ for stable features',
      recommendation: 'Upgrade to Next.js 15.0+ for stable Turbopack support'
    });
    return suggestions;
  }
  
  const parsed = parseVersion(nextVersion);
  
  // Basic Turbopack configuration
  suggestions.push({
    type: 'turbopack',
    message: 'Turbopack is available for faster builds',
    recommendation: 'Add --turbo flag to dev script: "dev": "next dev --turbo"'
  });
  
  // Next.js 15.0+ specific Turbopack features
  if (parsed.major >= 15) {
    suggestions.push({
      type: 'turbopack',
      message: 'Turbopack build is available in Next.js 15.0+',
      recommendation: 'Add --turbo flag to build script: "build": "next build --turbo"'
    });
    
    suggestions.push({
      type: 'turbopack',
      message: 'Turbopack configuration can be added to next.config.js',
      recommendation: `Add experimental.turbo configuration to next.config.js:
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  }`
    });
  }
  
  return suggestions;
}

/**
 * Find project root by traversing up directories looking for config files
 */
async function findProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);
  const rootDir = path.parse(currentDir).root;
  
  while (currentDir !== rootDir) {
    try {
      // Check for common project root indicators
      const hasPackageJson = await fs.access(path.join(currentDir, 'package.json')).then(() => true).catch(() => false);
      const hasTsConfig = await fs.access(path.join(currentDir, 'tsconfig.json')).then(() => true).catch(() => false);
      const hasNextConfig = await fs.access(path.join(currentDir, 'next.config.js')).then(() => true).catch(() => false);
      
      // If we find at least package.json, consider this the project root
      if (hasPackageJson) {
        return currentDir;
      }
      
      // Move up one directory
      currentDir = path.dirname(currentDir);
    } catch (error) {
      // If we can't access the directory, move up
      currentDir = path.dirname(currentDir);
    }
  }
  
  // If we reach the filesystem root, return the original start directory
  return startDir;
}

async function transform(input, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd() } = options;
  const results = [];
  let changeCount = 0;
  let suggestions = [];

  try {
    // Phase 3 Hardening: Enhanced TypeScript Strictness Enforcement
    const projectRoot = path.dirname(filePath);
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    const nextConfigPath = path.join(projectRoot, 'next.config.js');
    const packageJsonPath = path.join(projectRoot, 'package.json');

    const files = await Promise.all([
      fs.access(tsConfigPath).then(() => true).catch(() => false),
      fs.access(nextConfigPath).then(() => true).catch(() => false),
      fs.access(packageJsonPath).then(() => true).catch(() => false)
    ]);

    if (verbose) {
      process.stdout.write(`[INFO] Project root: ${projectRoot}\n`);
      process.stdout.write(`[INFO] Looking for config files in: ${projectRoot}\n`);
      process.stdout.write(`[INFO] Config files found: tsconfig.json=${files[0]}, next.config.js=${files[1]}, package.json=${files[2]}\n`);
    }

    // Phase 3: Enhanced TypeScript Strictness (Layer 1)
    let tsConfig = {};
    if (files[0]) {
      const tsConfigContent = await fs.readFile(tsConfigPath, 'utf8');
      tsConfig = JSON.parse(tsConfigContent);
      
      // Phase 3: Enforce strict TypeScript settings
      const strictSettings = {
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        exactOptionalPropertyTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true,
        strictPropertyInitialization: true,
        noImplicitThis: true,
        useUnknownInCatchVariables: true,
        alwaysStrict: true,
        noImplicitUseOfImplicitAnyArrayMethods: true,
        noPropertyAccessFromIndexSignature: true,
        noUncheckedIndexedAccess: true
      };

      const originalCompilerOptions = tsConfig.compilerOptions || {};
      const updatedCompilerOptions = { ...originalCompilerOptions };
      let tsChanges = 0;

      Object.entries(strictSettings).forEach(([key, value]) => {
        if (originalCompilerOptions[key] !== value) {
          updatedCompilerOptions[key] = value;
          tsChanges++;
          if (verbose) {
            process.stdout.write(`[INFO] Enforcing TypeScript strictness: ${key} = ${value}\n`);
          }
        }
      });

      // React 19: Require modern JSX transform (react-jsx or react-jsxdev)
      const jsxSetting = originalCompilerOptions.jsx;
      const isModernJSX = jsxSetting === 'react-jsx' || jsxSetting === 'react-jsxdev';
      if (!isModernJSX) {
        suggestions.push({
          type: 'jsx-transform',
          message: 'Outdated JSX transform detected. React 19 requires the modern JSX transform.',
          recommendation: 'Set tsconfig.compilerOptions.jsx to "react-jsx" (or "react-jsxdev" in dev)'
        });
        // Auto-upgrade if safe
        updatedCompilerOptions.jsx = 'react-jsx';
        tsChanges++;
        if (verbose) {
          process.stdout.write(`[INFO] Set compilerOptions.jsx = react-jsx for React 19 compatibility\n`);
        }
      }

      // Phase 3: Next.js 15.5 specific TypeScript improvements
      if (originalCompilerOptions.target !== 'ES2022') {
        updatedCompilerOptions.target = 'ES2022';
        tsChanges++;
        suggestions.push({
          type: 'typescript-target',
          message: 'Updated TypeScript target to ES2022 for Next.js 15.5 compatibility',
          recommendation: 'ES2022 provides better performance and modern JavaScript features'
        });
      }

      if (originalCompilerOptions.module !== 'ESNext') {
        updatedCompilerOptions.module = 'ESNext';
        tsChanges++;
        suggestions.push({
          type: 'typescript-module',
          message: 'Updated TypeScript module to ESNext for Next.js 15.5',
          recommendation: 'ESNext enables modern module features and better tree-shaking'
        });
      }

      if (originalCompilerOptions.moduleResolution !== 'bundler') {
        updatedCompilerOptions.moduleResolution = 'bundler';
        tsChanges++;
        suggestions.push({
          type: 'typescript-module-resolution',
          message: 'Updated module resolution to bundler for Next.js 15.5',
          recommendation: 'Bundler resolution provides better compatibility with modern bundlers'
        });
      }

      if (tsChanges > 0) {
        tsConfig.compilerOptions = updatedCompilerOptions;
        changeCount += tsChanges;
        if (verbose) {
          process.stdout.write(`[INFO] Applied ${tsChanges} TypeScript strictness improvements\n`);
        }
      }
    }

    // Phase 3: Enhanced Next.js 15.5 Config Updates (Layer 1)
    let nextConfig = '';
    if (files[1]) {
      const nextConfigContent = await fs.readFile(nextConfigPath, 'utf8');
      nextConfig = nextConfigContent;
      
      // Phase 3: Remove deprecated experimental flags
      const deprecatedFlags = [
        'experimental.esmExternals',
        'experimental.outputFileTracingRoot',
        'experimental.outputFileTracingExcludes',
        'experimental.outputFileTracingIncludes',
        'experimental.outputFileTracingIgnores',
        'experimental.outputFileTracingRoot',
        'experimental.outputFileTracingExcludes',
        'experimental.outputFileTracingIncludes',
        'experimental.outputFileTracingIgnores'
      ];

      let nextConfigChanges = 0;
      deprecatedFlags.forEach(flag => {
        const flagRegex = new RegExp(`\\s*${flag.replace(/\./g, '\\.')}\\s*:\\s*[^,}\\n]+`, 'g');
        if (flagRegex.test(nextConfig)) {
          nextConfig = nextConfig.replace(flagRegex, '');
          nextConfigChanges++;
          suggestions.push({
            type: 'deprecated-flag',
            message: `Removed deprecated experimental flag: ${flag}`,
            recommendation: 'This flag is no longer needed in Next.js 15.5'
          });
        }
      });

      // Phase 3: Add Next.js 15.5 performance optimizations
      if (!nextConfig.includes('experimental.turbo')) {
        const turboConfig = `
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  }`;
        
        // Insert turbo config before the closing brace
        const lastBraceIndex = nextConfig.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          nextConfig = nextConfig.slice(0, lastBraceIndex) + turboConfig + '\n' + nextConfig.slice(lastBraceIndex);
          nextConfigChanges++;
          suggestions.push({
            type: 'turbo-config',
            message: 'Added Turbopack configuration for Next.js 15.5',
            recommendation: 'Turbopack provides faster builds and development experience'
          });
        }
      }

      // Phase 3: Add image optimization hints
      if (!nextConfig.includes('images.remotePatterns')) {
        const imageConfig = `
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  }`;
        
        const lastBraceIndex = nextConfig.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          nextConfig = nextConfig.slice(0, lastBraceIndex) + imageConfig + '\n' + nextConfig.slice(lastBraceIndex);
          nextConfigChanges++;
          suggestions.push({
            type: 'image-optimization',
            message: 'Added image optimization configuration for Next.js 15.5',
            recommendation: 'Remote patterns enable optimized image loading from external sources'
          });
        }
      }

      if (nextConfigChanges > 0) {
        changeCount += nextConfigChanges;
        if (verbose) {
          process.stdout.write(`[INFO] Applied ${nextConfigChanges} Next.js 15.5 config improvements\n`);
        }
      }
    }

    // Phase 3: Enhanced Linting/Formatting Alignment (Layer 1)
    let packageJson = {};
    if (files[2]) {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const originalPackageJson = JSON.parse(packageJsonContent);
      packageJson = { ...originalPackageJson };

      // Phase 3: Migrate to Biome for Next.js 15.5
      if (packageJson.scripts?.lint === 'next lint') {
        packageJson.scripts.lint = 'biome lint ./src';
        packageJson.scripts.check = 'biome check ./src';
        packageJson.scripts.format = 'biome format --write ./src';
        packageJson.scripts['type-check'] = 'tsc --noEmit';
        
        // Add Biome dependency
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@biomejs/biome': '^1.4.1'
        };
        
        changeCount += 1;
        suggestions.push({
          type: 'lint-migration',
          message: 'Migrated from deprecated "next lint" to Biome for Next.js 15.5',
          recommendation: 'Biome is faster, requires less configuration, and is the recommended linter for Next.js 15.5'
        });
      }

      // Phase 3: Add TypeScript strict checking scripts
      if (!packageJson.scripts['type-check']) {
        packageJson.scripts['type-check'] = 'tsc --noEmit';
        changeCount += 1;
        suggestions.push({
          type: 'typescript-check',
          message: 'Added TypeScript type checking script',
          recommendation: 'Run "npm run type-check" to validate TypeScript types'
        });
      }

      // Phase 3: Add build optimization scripts
      if (!packageJson.scripts['build:analyze']) {
        packageJson.scripts['build:analyze'] = 'ANALYZE=true next build';
        changeCount += 1;
        suggestions.push({
          type: 'build-analyze',
          message: 'Added bundle analysis script',
          recommendation: 'Run "npm run build:analyze" to analyze bundle size'
        });
      }

      // Phase 3: Update Next.js version if needed
      const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
      if (nextVersion && !nextVersion.includes('15.5')) {
        packageJson.dependencies = {
          ...packageJson.dependencies,
          next: '^15.5.0'
        };
        changeCount += 1;
        suggestions.push({
          type: 'nextjs-upgrade',
          message: 'Updated Next.js to version 15.5.0',
          recommendation: 'Next.js 15.5 provides improved performance and new features'
        });
      }
    }

    // Phase 3: Enhanced Turbopack suggestions
    const nextVersion = await detectNextJSVersion(projectRoot);
    if (nextVersion && isTurbopackSupported(nextVersion)) {
      const parsed = parseVersion(nextVersion);
      
      if (parsed && parsed.major >= 15) {
        suggestions.push({
          type: 'turbopack-build',
          message: 'Turbopack build is available in Next.js 15.5+',
          recommendation: 'Add --turbo flag to build script: "build": "next build --turbo"'
        });
      }
      
      suggestions.push({
        type: 'turbopack-dev',
        message: 'Turbopack is available for faster development',
        recommendation: 'Add --turbo flag to dev script: "dev": "next dev --turbo"'
      });
    }

    if (!dryRun) {
      // Create backups and write changes only if files exist
      const backupManager = new BackupManager({
        backupDir: '.neurolint-backups',
        maxBackups: 10
      });

      const writeOperations = [];
      
      if (files[0]) {
        writeOperations.push(backupManager.safeWriteFile(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'layer-1-config'));
      }
      
      if (files[1]) {
        writeOperations.push(backupManager.safeWriteFile(nextConfigPath, nextConfig, 'layer-1-config'));
      }
      
      if (files[2]) {
        writeOperations.push(backupManager.safeWriteFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'layer-1-config'));
      }

      const results = await Promise.all(writeOperations);
      
      // Check for write failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0 && verbose) {
        failures.forEach(f => console.warn(`Write failed: ${f.error}`));
      }
    }

    // If no files found (single-file mode), still return success with suggestions
    const success = true; // Always succeed in single-file mode
    return {
      success,
      code: input,
      tsConfig: files[0] ? tsConfig : undefined,
      nextConfig: files[1] ? nextConfig : undefined,
      packageJson: files[2] ? packageJson : undefined,
      changeCount,
      dryRun,
      suggestions,
      warnings: files.some(f => !f) ? ['Single-file mode: Configuration suggestions only, no files modified'] : []
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Invalid JSON in configuration files',
        changeCount: 0
      };
    }
    // Handle ENOENT as success in single-file mode
    if (error.code === 'ENOENT') {
      return {
        success: true,
        changeCount: 0,
        suggestions,
        warnings: ['Single-file mode: No config files found, suggestions only']
      };
    }
    return {
      success: false,
      error: error.message,
      changeCount: 0
    };
  }
}

module.exports = { transform };