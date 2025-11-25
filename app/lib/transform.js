/**
 * AST vs Regex Fallback Strategy
 * Smart transformation coordinator with graceful fallback
 */

const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

/**
 * Smart transformation strategy with AST preference
 * Falls back gracefully when AST parsing fails
 */
async function transformWithFallback(code, layer) {
  
  // Layers 1-2: Always use regex (config files, simple patterns)
  if (!layer.supportsAST) {
    if (layer.regexTransform) {
      return await layer.regexTransform(code);
    }
    throw new Error(`No transformation method available for layer ${layer.name}`);
  }
  
  // Layers 3-6: Try AST first, fallback to regex
  try {
    console.log(`Using AST transformation for ${layer.name}`);
    return await transformWithAST(code, layer);
  } catch (astError) {
    console.warn(`AST failed for ${layer.name}, using regex fallback:`, astError.message);
    
    // AST failed, use regex-based transformation
    if (layer.regexTransform) {
      return await layer.regexTransform(code);
    } else {
      throw new Error(`No fallback available for layer ${layer.name}: ${astError.message}`);
    }
  }
}

/**
 * AST transformation wrapper with error handling
 */
async function transformWithAST(code, layer) {
  let ast;
  
  try {
    // Parse code to AST with comprehensive plugin support
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining'
      ],
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      strictMode: false
    });
  } catch (parseError) {
    throw new Error(`Failed to parse code to AST: ${parseError.message}`);
  }
  
  if (!ast) {
    throw new Error('Failed to generate AST from code');
  }
  
  // Apply layer-specific AST transformations
  let transformedAST;
  if (layer.transform) {
    transformedAST = await layer.transform(ast, code);
  } else if (layer.astTransform) {
    transformedAST = await layer.astTransform(ast, code);
  } else {
    throw new Error(`No AST transform method available for layer ${layer.name}`);
  }
  
  // Generate code from modified AST
  try {
    const result = generate(transformedAST || ast, {
      retainLines: true,
      compact: false,
      comments: true
    });
    
    return result.code;
  } catch (generateError) {
    throw new Error(`Failed to generate code from AST: ${generateError.message}`);
  }
}

/**
 * Enhanced transformation coordinator with multiple strategies
 */
class TransformationCoordinator {
  constructor(options = {}) {
    this.options = {
      preferAST: true,
      allowFallback: true,
      preserveComments: true,
      ...options
    };
    this.stats = {
      astSuccesses: 0,
      regexFallbacks: 0,
      totalTransformations: 0
    };
  }
  
  async transform(code, layer) {
    this.stats.totalTransformations++;
    
    try {
      if (this.shouldUseAST(layer)) {
        const result = await this.transformWithAST(code, layer);
        this.stats.astSuccesses++;
        return result;
      } else {
        return await this.transformWithRegex(code, layer);
      }
    } catch (error) {
      if (this.options.allowFallback) {
        console.warn(`Primary transformation failed for ${layer.name}, attempting fallback`);
        return await this.attemptFallback(code, layer, error);
      }
      throw error;
    }
  }
  
  shouldUseAST(layer) {
    return this.options.preferAST && layer.supportsAST;
  }
  
  async transformWithAST(code, layer) {
    return await transformWithAST(code, layer);
  }
  
  async transformWithRegex(code, layer) {
    if (!layer.regexTransform) {
      throw new Error(`No regex transformation available for layer ${layer.name}`);
    }
    return await layer.regexTransform(code);
  }
  
  async attemptFallback(code, layer, originalError) {
    try {
      if (layer.regexTransform) {
        console.log(`Using regex fallback for ${layer.name}`);
        this.stats.regexFallbacks++;
        return await layer.regexTransform(code);
      } else {
        throw new Error(`No fallback transformation available: ${originalError.message}`);
      }
    } catch (fallbackError) {
      throw new Error(`All transformations failed. Original: ${originalError.message}, Fallback: ${fallbackError.message}`);
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalTransformations > 0 
        ? (this.stats.astSuccesses + this.stats.regexFallbacks) / this.stats.totalTransformations 
        : 0,
      astSuccessRate: this.stats.totalTransformations > 0
        ? this.stats.astSuccesses / this.stats.totalTransformations
        : 0
    };
  }
  
  reset() {
    this.stats = {
      astSuccesses: 0,
      regexFallbacks: 0,
      totalTransformations: 0
    };
  }
}

/**
 * Utility functions for common transformation patterns
 */
const TransformationUtils = {
  
  /**
   * Safely parse code with fallback to regex
   */
  async safeParseCode(code) {
    try {
      return parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        allowImportExportEverywhere: true,
        strictMode: false
      });
    } catch (error) {
      return null; // Indicates regex should be used
    }
  },
  
  /**
   * Check if code can be safely processed with AST
   */
  canUseAST(code) {
    try {
      parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        allowImportExportEverywhere: true,
        strictMode: false
      });
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Smart code analysis to determine best transformation strategy
   */
  analyzeCode(code) {
    const analysis = {
      hasJSX: /<[A-Z]/.test(code),
      hasTypeScript: /:\s*(string|number|boolean|any)\b/.test(code),
      hasComplexSyntax: /(?:async|await|yield|\?\.|??)/g.test(code),
      hasImports: /import\s+/.test(code),
      hasExports: /export\s+/.test(code),
      lineCount: code.split('\n').length,
      complexity: 'low'
    };
    
    // Determine complexity
    let complexityScore = 0;
    if (analysis.hasJSX) complexityScore += 2;
    if (analysis.hasTypeScript) complexityScore += 2;
    if (analysis.hasComplexSyntax) complexityScore += 3;
    if (analysis.lineCount > 50) complexityScore += 1;
    if (analysis.lineCount > 200) complexityScore += 2;
    
    if (complexityScore >= 5) {
      analysis.complexity = 'high';
    } else if (complexityScore >= 3) {
      analysis.complexity = 'medium';
    }
    
    // Recommend strategy
    analysis.recommendedStrategy = analysis.complexity === 'high' && analysis.hasJSX ? 'ast' : 'regex';
    
    return analysis;
  },
  
  /**
   * Generate transformation report
   */
  generateTransformationReport(original, transformed, method) {
    const originalLines = original.split('\n').length;
    const transformedLines = transformed.split('\n').length;
    
    return {
      method,
      originalSize: original.length,
      transformedSize: transformed.length,
      originalLines,
      transformedLines,
      linesChanged: Math.abs(originalLines - transformedLines),
      sizeChange: transformed.length - original.length,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = { 
  transformWithFallback, 
  transformWithAST,
  TransformationCoordinator,
  TransformationUtils
};
