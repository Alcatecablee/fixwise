/**
 * Error Recovery and Reporting System
 * Comprehensive error handling with categorized recovery suggestions
 */

/**
 * Advanced error recovery system with categorized error handling
 * Provides actionable feedback and recovery suggestions
 */
class ErrorRecoverySystem {
  
  /**
   * Execute layer with comprehensive error recovery and categorized error handling
   *
   * @param {string} code - Source code to process
   * @param {number} layerId - Layer ID (1-6) to execute
   * @param {Object} [options={}] - Execution options
   * @param {boolean} [options.verbose] - Enable detailed logging
   * @param {string} [options.filePath] - File path for context
   * @returns {Promise<Object>} Execution result with success status, code, and error info
   * @returns {boolean} returns.success - Whether execution succeeded
   * @returns {string} returns.code - Processed code (original if failed)
   * @returns {number} returns.executionTime - Time taken in milliseconds
   * @returns {string[]} [returns.improvements] - Applied improvements (if successful)
   * @returns {string} [returns.error] - Error message (if failed)
   * @returns {string} [returns.errorCategory] - Error category for targeted recovery
   * @returns {string} [returns.suggestion] - Recovery suggestion
   * @returns {string[]} [returns.recoveryOptions] - Array of recovery options
   *
   * @example
   * const result = await ErrorRecoverySystem.executeWithRecovery(code, 3, {
   *   verbose: true,
   *   filePath: 'Component.tsx'
   * });
   * if (!result.success) {
   *   console.log(`Error: ${result.suggestion}`);
   *   console.log('Options:', result.recoveryOptions);
   * }
   */
  static async executeWithRecovery(
    code,
    layerId,
    options = {}
  ) {
    const startTime = performance.now();
    
    try {
      // Attempt normal execution
      const result = await this.executeLayer(layerId, code, options);
      
      return {
        success: true,
        code: result,
        executionTime: performance.now() - startTime,
        improvements: this.detectImprovements(code, result),
        layerId
      };
      
    } catch (error) {
      // Categorize and handle errors appropriately
      const errorInfo = this.categorizeError(error, layerId, code);
      
      console.error(`Layer ${layerId} error:`, errorInfo.message);
      
      return {
        success: false,
        code, // Return original code unchanged
        executionTime: performance.now() - startTime,
        error: errorInfo.message,
        errorCategory: errorInfo.category,
        suggestion: errorInfo.suggestion,
        recoveryOptions: errorInfo.recoveryOptions,
        severity: errorInfo.severity,
        layerId
      };
    }
  }
  
  /**
   * Categorize errors for appropriate handling and user feedback
   */
  static categorizeError(error, layerId, code) {
    const errorMessage = error.message || error.toString();
    const errorStack = error.stack || '';
    
    // Syntax errors
    if (error.name === 'SyntaxError' || errorMessage.includes('Unexpected token')) {
      return {
        category: 'syntax',
        message: 'Code syntax prevented transformation',
        suggestion: 'Fix syntax errors before running NeuroLint',
        recoveryOptions: [
          'Run syntax validation first',
          'Use a code formatter like Prettier',
          'Check for missing brackets or semicolons',
          'Validate quotes and string literals'
        ],
        severity: 'high',
        quickFix: this.generateSyntaxQuickFix(code, errorMessage)
      };
    }
    
    // AST parsing errors
    if (errorMessage.includes('AST') || errorMessage.includes('parse')) {
      return {
        category: 'parsing',
        message: 'Complex code structure not supported by AST parser',
        suggestion: 'Try running with regex fallback or simplify code structure',
        recoveryOptions: [
          'Use --regex-only flag to disable AST transformations',
          'Run individual layers to isolate the issue',
          'Simplify complex expressions or nested structures',
          'Break large files into smaller components'
        ],
        severity: 'medium',
        fallbackAvailable: true
      };
    }
    
    // File system errors
    if (errorMessage.includes('ENOENT') || errorMessage.includes('permission')) {
      return {
        category: 'filesystem',
        message: 'File system access error',
        suggestion: 'Check file permissions and paths',
        recoveryOptions: [
          'Verify file exists and is readable',
          'Check write permissions for target directory',
          'Run with elevated privileges if needed',
          'Ensure file is not locked by another process'
        ],
        severity: 'high'
      };
    }
    
    // Memory errors
    if (errorMessage.includes('out of memory') || errorMessage.includes('Maximum call stack')) {
      return {
        category: 'memory',
        message: 'Memory or stack overflow error',
        suggestion: 'Reduce batch size or simplify processing',
        recoveryOptions: [
          'Process files in smaller batches',
          'Increase Node.js memory limit with --max-old-space-size',
          'Simplify complex code structures',
          'Use streaming processing for large files'
        ],
        severity: 'high'
      };
    }
    
    // Layer-specific errors
    const layerSpecificError = this.getLayerSpecificError(layerId, errorMessage, errorStack);
    if (layerSpecificError) {
      return layerSpecificError;
    }
    
    // Network/API errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return {
        category: 'network',
        message: 'Network connectivity issue',
        suggestion: 'Check internet connection and try again',
        recoveryOptions: [
          'Retry the operation',
          'Check network connectivity',
          'Use offline mode if available',
          'Increase timeout settings'
        ],
        severity: 'medium',
        retryable: true
      };
    }
    
    // Generic errors
    return {
      category: 'unknown',
      message: `Unexpected error in Layer ${layerId}`,
      suggestion: 'Please report this issue with your code sample',
      recoveryOptions: [
        'Try running other layers individually',
        'Check console for additional details',
        'Report issue with minimal reproduction case',
        'Use --verbose flag for more diagnostic information'
      ],
      severity: 'medium',
      needsReporting: true
    };
  }
  
  /**
   * Handle layer-specific error patterns with enhanced recovery
   */
  static getLayerSpecificError(layerId, errorMessage, errorStack) {
    switch (layerId) {
      case 1: // Configuration layer - Enhanced recovery
        if (errorMessage.includes('JSON')) {
          return {
            category: 'config',
            message: 'Invalid JSON in configuration file',
            suggestion: 'Validate JSON syntax in config files',
            recoveryOptions: [
              'Use JSON validator to check syntax',
              'Check for trailing commas in JSON',
              'Verify quote marks are properly escaped',
              'Ensure all brackets and braces are balanced',
              'Try fixing with JSON.stringify(JSON.parse(content), null, 2)'
            ],
            severity: 'high',
            quickFix: 'Run JSON through a validator or formatter',
            autoFix: (code) => {
              try {
                const parsed = JSON.parse(code);
                return JSON.stringify(parsed, null, 2);
              } catch (e) {
                return code;
              }
            }
          };
        }

        if (errorMessage.includes('tsconfig') || errorMessage.includes('TypeScript')) {
          return {
            category: 'config',
            message: 'TypeScript configuration error',
            suggestion: 'Check TypeScript configuration validity',
            recoveryOptions: [
              'Validate tsconfig.json syntax',
              'Check compiler options compatibility',
              'Verify file paths in include/exclude',
              'Update TypeScript version if needed',
              'Reset to default tsconfig.json template'
            ],
            severity: 'high',
            autoFix: (code) => {
              // Provide safe fallback tsconfig
              return JSON.stringify({
                compilerOptions: {
                  target: "ES2020",
                  lib: ["dom", "dom.iterable", "ES2020"],
                  allowJs: true,
                  skipLibCheck: true,
                  strict: true,
                  noEmit: true,
                  esModuleInterop: true,
                  module: "esnext",
                  moduleResolution: "bundler",
                  resolveJsonModule: true,
                  isolatedModules: true,
                  jsx: "preserve",
                  incremental: true
                },
                include: ["**/*.ts", "**/*.tsx"],
                exclude: ["node_modules"]
              }, null, 2);
            }
          };
        }

        if (errorMessage.includes('next.config') || errorMessage.includes('Next.js')) {
          return {
            category: 'config',
            message: 'Next.js configuration error',
            suggestion: 'Fix Next.js configuration file',
            recoveryOptions: [
              'Check next.config.js syntax',
              'Remove deprecated options',
              'Update to latest Next.js patterns',
              'Reset to minimal config'
            ],
            severity: 'medium',
            autoFix: (code) => {
              return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;`;
            }
          };
        }
        break;
        
      case 2: // Pattern layer - Enhanced recovery
        if (errorMessage.includes('replace')) {
          return {
            category: 'pattern',
            message: 'Pattern replacement failed',
            suggestion: 'Some patterns may conflict with your code structure',
            recoveryOptions: [
              'Skip problematic pattern replacements',
              'Review regex patterns for edge cases',
              'Use more specific pattern matching',
              'Process file manually for complex patterns',
              'Apply patterns one at a time to isolate issues'
            ],
            severity: 'low',
            autoFix: (code) => {
              // Safe fallback: only apply basic HTML entity fixes
              return code
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            }
          };
        }

        if (errorMessage.includes('encoding') || errorMessage.includes('UTF')) {
          return {
            category: 'encoding',
            message: 'Text encoding issue detected',
            suggestion: 'File encoding may not be UTF-8',
            recoveryOptions: [
              'Convert file to UTF-8 encoding',
              'Check for special characters or emojis',
              'Use --encoding flag to specify encoding',
              'Save file with UTF-8 encoding in your editor',
              'Remove problematic characters as last resort'
            ],
            severity: 'medium',
            autoFix: (code) => {
              // Remove common problematic characters
              return code.replace(/[\u0000-\u0008\u0011\u0012\u0014-\u001f\u007f]/g, '');
            }
          };
        }

        if (errorMessage.includes('import') || errorMessage.includes('unused')) {
          return {
            category: 'imports',
            message: 'Import processing error',
            suggestion: 'Complex import structure may need manual review',
            recoveryOptions: [
              'Skip unused import removal for this file',
              'Manually review import statements',
              'Use TypeScript compiler to check imports',
              'Simplify import structure'
            ],
            severity: 'low'
          };
        }
        break;
        
      case 3: // Component layer - Enhanced recovery
        if (errorMessage.includes('JSX')) {
          return {
            category: 'component',
            message: 'JSX transformation error',
            suggestion: 'Complex JSX structures may need manual fixing',
            recoveryOptions: [
              'Simplify nested JSX structures',
              'Use manual key addition for complex maps',
              'Break large components into smaller ones',
              'Check for malformed JSX syntax',
              'Use regex fallback instead of AST parsing'
            ],
            severity: 'medium',
            autoFix: (code) => {
              // Safe fallback: only add basic key props
              return code.replace(
                /\.map\(\s*\([^)]*\)\s*=>\s*<([^>]+)(?!\s+key=)/g,
                '.map((item, index) => <$1 key={index}'
              );
            }
          };
        }

        if (errorMessage.includes('React') || errorMessage.includes('hook')) {
          return {
            category: 'component',
            message: 'React hooks or component error',
            suggestion: 'React-specific transformation failed',
            recoveryOptions: [
              'Check React import statements',
              'Verify hook usage patterns',
              'Update React version if needed',
              'Review component structure',
              'Add missing React imports automatically'
            ],
            severity: 'medium',
            autoFix: (code) => {
              // Add missing React import if hooks are used
              if ((code.includes('useState') || code.includes('useEffect')) &&
                  !code.includes('import React') && !code.includes('import { useState')) {
                return `import { useState, useEffect } from 'react';\n\n${code}`;
              }
              return code;
            }
          };
        }

        if (errorMessage.includes('key') || errorMessage.includes('map')) {
          return {
            category: 'component',
            message: 'Key prop transformation error',
            suggestion: 'Complex map operations need manual key handling',
            recoveryOptions: [
              'Add keys manually to map operations',
              'Use unique IDs instead of array indices',
              'Simplify nested map structures',
              'Check for malformed JSX in maps'
            ],
            severity: 'medium'
          };
        }
        break;
        
      case 4: // Hydration layer - Enhanced recovery
        if (errorMessage.includes('localStorage') || errorMessage.includes('window')) {
          return {
            category: 'hydration',
            message: 'Browser API protection failed',
            suggestion: 'Manual SSR guards may be needed for complex cases',
            recoveryOptions: [
              'Add manual typeof window checks',
              'Use useEffect hooks for client-side code',
              'Implement custom SSR-safe wrappers',
              'Move browser API calls to client components',
              'Use dynamic imports for browser-only code'
            ],
            severity: 'medium',
            autoFix: (code) => {
              // Wrap localStorage/window calls with guards
              return code
                .replace(/localStorage\./g, 'typeof window !== "undefined" && localStorage.')
                .replace(/window\./g, 'typeof window !== "undefined" && window.')
                .replace(/document\./g, 'typeof document !== "undefined" && document.');
            }
          };
        }

        if (errorMessage.includes('theme') || errorMessage.includes('provider')) {
          return {
            category: 'hydration',
            message: 'Theme provider hydration issue',
            suggestion: 'Theme providers need special hydration handling',
            recoveryOptions: [
              'Add mounted state to theme providers',
              'Use suppressHydrationWarning for theme elements',
              'Implement custom hydration guards',
              'Move theme logic to client-side',
              'Add NoSSR wrapper component'
            ],
            severity: 'high',
            autoFix: (code) => {
              // Add basic mounted state pattern
              if (code.includes('ThemeProvider') && !code.includes('mounted')) {
                return `'use client';\n\nimport { useState, useEffect } from 'react';\n\n${code}`;
              }
              return code;
            }
          };
        }
        break;

      case 5: // Next.js layer - Enhanced recovery
        if (errorMessage.includes('use client') || errorMessage.includes('directive')) {
          return {
            category: 'nextjs',
            message: 'Next.js directive placement error',
            suggestion: 'Client directives must be at file top',
            recoveryOptions: [
              'Move "use client" to top of file',
              'Remove conflicting directives',
              'Check for import statements before directive',
              'Verify file structure for App Router',
              'Use automatic directive placement'
            ],
            severity: 'high',
            autoFix: (code) => {
              // Move 'use client' to top
              const lines = code.split('\n');
              const useClientIndex = lines.findIndex(line => line.trim() === "'use client';");
              if (useClientIndex > 0) {
                lines.splice(useClientIndex, 1);
                return ["'use client';", '', ...lines].join('\n');
              }
              return code;
            }
          };
        }

        if (errorMessage.includes('router') || errorMessage.includes('pages')) {
          return {
            category: 'nextjs',
            message: 'Next.js routing migration error',
            suggestion: 'App Router migration requires manual review',
            recoveryOptions: [
              'Review App Router migration guide',
              'Update import paths for new structure',
              'Convert pages to app directory structure',
              'Update API route patterns',
              'Use Next.js codemods for migration'
            ],
            severity: 'medium'
          };
        }
        break;

      case 6: // Testing layer - Enhanced recovery
        if (errorMessage.includes('test') || errorMessage.includes('jest')) {
          return {
            category: 'testing',
            message: 'Test framework error',
            suggestion: 'Testing setup may need configuration',
            recoveryOptions: [
              'Check test framework configuration',
              'Verify test file patterns',
              'Update testing library versions',
              'Review test environment setup',
              'Create basic test template'
            ],
            severity: 'low',
            autoFix: (code) => {
              // Add basic test structure if missing
              if (code.includes('describe(') && !code.includes('expect(')) {
                return code.replace(/it\(['"`]([^'"`]+)['"`], \(\) => \{/,
                  'it(\'$1\', () => {\n    expect(true).toBe(true);');
              }
              return code;
            }
          };
        }

        if (errorMessage.includes('boundary') || errorMessage.includes('error')) {
          return {
            category: 'testing',
            message: 'Error boundary implementation issue',
            suggestion: 'Error boundary code needs refinement',
            recoveryOptions: [
              'Use class-based error boundary pattern',
              'Add proper error logging',
              'Implement fallback UI',
              'Add error boundary tests'
            ],
            severity: 'medium'
          };
        }
        break;
        
      case 5: // Next.js layer
        if (errorMessage.includes('use client') || errorMessage.includes('directive')) {
          return {
            category: 'nextjs',
            message: 'Next.js directive placement error',
            suggestion: 'Client directives must be at file top',
            recoveryOptions: [
              'Move "use client" to top of file',
              'Remove conflicting directives',
              'Check for import statements before directive',
              'Verify file structure for App Router'
            ],
            severity: 'high'
          };
        }
        
        if (errorMessage.includes('router') || errorMessage.includes('pages')) {
          return {
            category: 'nextjs',
            message: 'Next.js routing migration error',
            suggestion: 'App Router migration requires manual review',
            recoveryOptions: [
              'Review App Router migration guide',
              'Update import paths for new structure',
              'Convert pages to app directory structure',
              'Update API route patterns'
            ],
            severity: 'medium'
          };
        }
        break;
        
      case 6: // Testing layer
        if (errorMessage.includes('test') || errorMessage.includes('jest')) {
          return {
            category: 'testing',
            message: 'Test framework error',
            suggestion: 'Testing setup may need configuration',
            recoveryOptions: [
              'Check test framework configuration',
              'Verify test file patterns',
              'Update testing library versions',
              'Review test environment setup'
            ],
            severity: 'low'
          };
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Generate quick fix suggestions for syntax errors
   */
  static generateSyntaxQuickFix(code, errorMessage) {
    const fixes = [];
    
    if (errorMessage.includes('Unexpected token')) {
      fixes.push('Check for missing or extra brackets, parentheses, or semicolons');
    }
    
    if (errorMessage.includes('Unterminated string')) {
      fixes.push('Check for unclosed quotes or template literals');
    }
    
    if (errorMessage.includes('Unexpected end of input')) {
      fixes.push('Check for unclosed blocks or missing closing brackets');
    }
    
    return fixes.length > 0 ? fixes : ['Run code through a syntax checker or formatter'];
  }
  
  /**
   * Detect improvements made by successful transformations
   */
  static detectImprovements(originalCode, transformedCode) {
    const improvements = [];
    
    // Check for specific improvements
    if (originalCode.includes('&quot;') && !transformedCode.includes('&quot;')) {
      improvements.push('Fixed HTML entity corruption');
    }
    
    if (originalCode.includes('console.log') && !transformedCode.includes('console.log')) {
      improvements.push('Removed console.log statements');
    }
    
    if (originalCode.includes('var ') && !transformedCode.includes('var ')) {
      improvements.push('Converted var to const/let');
    }
    
    if (originalCode.includes('.map(') && transformedCode.includes('key=')) {
      improvements.push('Added missing key props to mapped elements');
    }
    
    if (originalCode.includes('localStorage') && transformedCode.includes('typeof window')) {
      improvements.push('Added SSR guards for browser APIs');
    }
    
    return improvements;
  }
  
  /**
   * Execute specific layer (placeholder for actual layer execution)
   */
  static async executeLayer(layerId, code, options) {
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

    try {
      // Resolve absolute path from current working directory
      const layerPath = path.resolve(process.cwd(), 'scripts', layerName);
      const layerModule = require(layerPath);

      if (typeof layerModule === 'function') {
        return await layerModule(code, options);
      } else if (layerModule.execute) {
        const result = await layerModule.execute(code, options);
        return result.code || result;
      }

      throw new Error(`Layer ${layerId} does not export a valid function`);
    } catch (error) {
      throw new Error(`Failed to execute layer ${layerId}: ${error.message}`);
    }
  }
  
  /**
   * Generate recovery suggestions based on error patterns
   */
  static generateRecoverySuggestions(errors) {
    const suggestions = [];
    
    const failedLayers = errors.filter(e => !e.success);
    const syntaxErrors = failedLayers.filter(e => e.errorCategory === 'syntax');
    const parsingErrors = failedLayers.filter(e => e.errorCategory === 'parsing');
    const configErrors = failedLayers.filter(e => e.errorCategory === 'config');
    
    if (syntaxErrors.length > 0) {
      suggestions.push({
        type: 'syntax',
        title: 'Fix Syntax Errors First',
        description: 'Multiple syntax errors detected. Consider fixing these manually before running NeuroLint.',
        actions: [
          'Run code through a formatter (Prettier)',
          'Use ESLint to identify syntax issues',
          'Check for missing brackets, quotes, or semicolons',
          'Validate file encoding (should be UTF-8)'
        ],
        priority: 'high'
      });
    }
    
    if (parsingErrors.length > 0) {
      suggestions.push({
        type: 'parsing',
        title: 'Simplify Complex Code',
        description: 'AST parser struggled with code complexity. Consider simplification.',
        actions: [
          'Break down complex expressions',
          'Separate complex JSX into smaller components',
          'Use --regex-only mode for this code',
          'Process files individually rather than in batch'
        ],
        priority: 'medium'
      });
    }
    
    if (configErrors.length > 0) {
      suggestions.push({
        type: 'config',
        title: 'Fix Configuration Issues',
        description: 'Configuration files have errors that prevent processing.',
        actions: [
          'Validate JSON syntax in config files',
          'Check TypeScript configuration compatibility',
          'Verify file paths in include/exclude patterns',
          'Update configuration to latest format'
        ],
        priority: 'high'
      });
    }
    
    // Memory issues
    const memoryErrors = failedLayers.filter(e => e.errorCategory === 'memory');
    if (memoryErrors.length > 0) {
      suggestions.push({
        type: 'memory',
        title: 'Optimize Memory Usage',
        description: 'Memory constraints detected during processing.',
        actions: [
          'Process files in smaller batches',
          'Increase Node.js memory: node --max-old-space-size=4096',
          'Simplify large or complex files',
          'Use streaming processing for large codebases'
        ],
        priority: 'medium'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Create error report for debugging
   */
  static createErrorReport(errors, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      context,
      summary: {
        totalErrors: errors.length,
        byCategory: this.groupErrorsByCategory(errors),
        bySeverity: this.groupErrorsBySeverity(errors),
        retryableErrors: errors.filter(e => e.retryable).length
      },
      errors: errors.map(error => ({
        layerId: error.layerId,
        category: error.errorCategory,
        severity: error.severity,
        message: error.error,
        suggestion: error.suggestion,
        recoveryOptions: error.recoveryOptions
      })),
      recommendations: this.generateRecoverySuggestions(errors)
    };
  }
  
  /**
   * Group errors by category
   */
  static groupErrorsByCategory(errors) {
    return errors.reduce((acc, error) => {
      const category = error.errorCategory || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }
  
  /**
   * Group errors by severity
   */
  static groupErrorsBySeverity(errors) {
    return errors.reduce((acc, error) => {
      const severity = error.severity || 'medium';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = { ErrorRecoverySystem };
