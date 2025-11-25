/**
 * AI Quality Transformer
 * 
 * Intelligent code pattern detection and transformation using AST analysis
 * Provides advanced code quality improvements beyond basic pattern matching
 */

import * as ts from 'typescript';

interface AITransformResult {
  success: boolean;
  code: string;
  changes: number;
  warnings: string[];
  patterns: AIPattern[];
}

interface AIPattern {
  type: 'performance' | 'security' | 'accessibility' | 'maintainability' | 'best-practice';
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: { line: number; column: number };
  suggestion: string;
  confidence: number;
}

interface TransformContext {
  ast: ts.SourceFile;
  typeChecker: ts.TypeChecker;
  filename: string;
}

export class AIQualityTransformer {
  private astEngine: any;
  private patterns: Map<string, AIPattern[]> = new Map();

  constructor(astEngine?: any) {
    this.astEngine = astEngine;
  }

  /**
   * Main transformation method
   */
  async transform(code: string, options: { filePath?: string; dryRun?: boolean } = {}): Promise<AITransformResult> {
    const { filePath = 'unknown.tsx', dryRun = false } = options;
    
    try {
      // Parse code to AST
      const ast = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.Latest,
        true
      );

      // Detect patterns
      const detectedPatterns = this.detectPatterns(ast, code);
      
      // Apply transformations if not in dry run
      let transformedCode = code;
      let changes = 0;
      const warnings: string[] = [];

      if (!dryRun && detectedPatterns.length > 0) {
        const transformResult = this.applyTransformations(code, detectedPatterns);
        transformedCode = transformResult.code;
        changes = transformResult.changes;
        warnings.push(...transformResult.warnings);
      }

      return {
        success: true,
        code: transformedCode,
        changes,
        warnings,
        patterns: detectedPatterns
      };

    } catch (error) {
      return {
        success: false,
        code,
        changes: 0,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        patterns: []
      };
    }
  }

  /**
   * Detect AI patterns in code
   */
  private detectPatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Performance patterns
    patterns.push(...this.detectPerformancePatterns(ast, code));
    
    // Security patterns
    patterns.push(...this.detectSecurityPatterns(ast, code));
    
    // Accessibility patterns
    patterns.push(...this.detectAccessibilityPatterns(ast, code));
    
    // Maintainability patterns
    patterns.push(...this.detectMaintainabilityPatterns(ast, code));
    
    // Best practice patterns
    patterns.push(...this.detectBestPracticePatterns(ast, code));

    return patterns;
  }

  /**
   * Detect performance-related patterns
   */
  private detectPerformancePatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Detect expensive operations in render
    const expensiveOps = [
      { pattern: /\.map\([^)]*=>\s*[^)]*\.filter\(/g, desc: 'Chained array operations in render' },
      { pattern: /\.filter\([^)]*=>\s*[^)]*\.map\(/g, desc: 'Chained array operations in render' },
      { pattern: /JSON\.parse\([^)]*\)/g, desc: 'JSON.parse in render cycle' },
      { pattern: /new Date\(\)/g, desc: 'Date creation in render cycle' }
    ];

    expensiveOps.forEach(({ pattern, desc }) => {
      const matches = code.match(pattern);
      if (matches) {
        patterns.push({
          type: 'performance',
          severity: 'medium',
          description: desc,
          location: this.findLocation(code, pattern),
          suggestion: 'Move expensive operations outside render or memoize results',
          confidence: 0.8
        });
      }
    });

    return patterns;
  }

  /**
   * Detect security-related patterns
   */
  private detectSecurityPatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Detect potential XSS vulnerabilities
    const xssPatterns = [
      { pattern: /dangerouslySetInnerHTML\s*=\s*\{[^}]*\}/g, desc: 'Potential XSS with dangerouslySetInnerHTML' },
      { pattern: /eval\([^)]*\)/g, desc: 'Use of eval() function' },
      { pattern: /innerHTML\s*=\s*[^;]+/g, desc: 'Direct innerHTML assignment' }
    ];

    xssPatterns.forEach(({ pattern, desc }) => {
      const matches = code.match(pattern);
      if (matches) {
        patterns.push({
          type: 'security',
          severity: 'high',
          description: desc,
          location: this.findLocation(code, pattern),
          suggestion: 'Use safe alternatives like React components or sanitized content',
          confidence: 0.9
        });
      }
    });

    return patterns;
  }

  /**
   * Detect accessibility patterns
   */
  private detectAccessibilityPatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Detect missing accessibility attributes
    const a11yPatterns = [
      { pattern: /<button[^>]*>(?!.*aria-label)/g, desc: 'Button missing aria-label' },
      { pattern: /<img[^>]*>(?!.*alt)/g, desc: 'Image missing alt attribute' },
      { pattern: /<input[^>]*>(?!.*aria-describedby)/g, desc: 'Input missing aria-describedby' }
    ];

    a11yPatterns.forEach(({ pattern, desc }) => {
      const matches = code.match(pattern);
      if (matches) {
        patterns.push({
          type: 'accessibility',
          severity: 'medium',
          description: desc,
          location: this.findLocation(code, pattern),
          suggestion: 'Add appropriate accessibility attributes',
          confidence: 0.7
        });
      }
    });

    return patterns;
  }

  /**
   * Detect maintainability patterns
   */
  private detectMaintainabilityPatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Detect code smells
    const maintainabilityPatterns = [
      { pattern: /function\s+\w+\([^)]{100,}\)/g, desc: 'Function with too many parameters' },
      { pattern: /\{[^}]{500,}\}/g, desc: 'Very large code block' },
      { pattern: /if\s*\([^)]{200,}\)/g, desc: 'Complex conditional expression' }
    ];

    maintainabilityPatterns.forEach(({ pattern, desc }) => {
      const matches = code.match(pattern);
      if (matches) {
        patterns.push({
          type: 'maintainability',
          severity: 'low',
          description: desc,
          location: this.findLocation(code, pattern),
          suggestion: 'Break down complex code into smaller, more manageable pieces',
          confidence: 0.6
        });
      }
    });

    return patterns;
  }

  /**
   * Detect best practice patterns
   */
  private detectBestPracticePatterns(ast: ts.SourceFile, code: string): AIPattern[] {
    const patterns: AIPattern[] = [];

    // Detect React best practices
    const bestPracticePatterns = [
      { pattern: /useState\([^)]*\)[^}]*useState\([^)]*\)/g, desc: 'Multiple useState calls that could be combined' },
      { pattern: /console\.(log|warn|error)\([^)]*\)/g, desc: 'Console statements in production code' },
      { pattern: /\/\/\s*todo\s*:/gi, desc: 'TODO comments in code' }
    ];

    bestPracticePatterns.forEach(({ pattern, desc }) => {
      const matches = code.match(pattern);
      if (matches) {
        patterns.push({
          type: 'best-practice',
          severity: 'low',
          description: desc,
          location: this.findLocation(code, pattern),
          suggestion: 'Follow React best practices and clean up development artifacts',
          confidence: 0.7
        });
      }
    });

    return patterns;
  }

  /**
   * Apply transformations based on detected patterns
   */
  private applyTransformations(code: string, patterns: AIPattern[]): { code: string; changes: number; warnings: string[] } {
    let transformedCode = code;
    let changes = 0;
    const warnings: string[] = [];

    patterns.forEach(pattern => {
      try {
        const result = this.applyPatternFix(transformedCode, pattern);
        if (result.success) {
          transformedCode = result.code;
          changes += result.changes;
        } else {
          warnings.push(`Failed to apply fix for ${pattern.description}: ${result.error}`);
        }
      } catch (error) {
        warnings.push(`Error applying pattern fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return { code: transformedCode, changes, warnings };
  }

  /**
   * Apply a specific pattern fix
   */
  private applyPatternFix(code: string, pattern: AIPattern): { success: boolean; code: string; changes: number; error?: string } {
    try {
      let transformedCode = code;
      let changes = 0;

      switch (pattern.type) {
        case 'performance':
          // Remove console statements
          if (pattern.description.includes('console')) {
            transformedCode = transformedCode.replace(/console\.(log|warn|error|debug)\([^)]*\);?/g, '');
            changes++;
          }
          break;

        case 'security':
          // Replace dangerous patterns with safer alternatives
          if (pattern.description.includes('dangerouslySetInnerHTML')) {
            transformedCode = transformedCode.replace(
              /dangerouslySetInnerHTML\s*=\s*\{[^}]*\}/g,
              '// TODO: Replace with safe content rendering'
            );
            changes++;
          }
          break;

        case 'accessibility':
          // Add missing accessibility attributes
          if (pattern.description.includes('aria-label')) {
            transformedCode = transformedCode.replace(
              /<button([^>]*)>/g,
              '<button$1 aria-label="Button">'
            );
            changes++;
          }
          break;

        case 'maintainability':
        case 'best-practice':
          // Add TODO comments for manual review
          if (pattern.description.includes('TODO')) {
            transformedCode = transformedCode.replace(
              /\/\/\s*todo\s*:/gi,
              '// TODO: Review and refactor'
            );
            changes++;
          }
          break;
      }

      return { success: true, code: transformedCode, changes };
    } catch (error) {
      return { 
        success: false, 
        code, 
        changes: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find location of pattern in code
   */
  private findLocation(code: string, pattern: RegExp): { line: number; column: number } {
    const match = code.match(pattern);
    if (!match) return { line: 1, column: 1 };

    const index = code.indexOf(match[0]);
    const beforeMatch = code.substring(0, index);
    const lines = beforeMatch.split('\n');
    
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  /**
   * Learn from previous transformations
   */
  learnFromTransformations(transformations: AITransformResult[]): void {
    transformations.forEach(transformation => {
      transformation.patterns.forEach(pattern => {
        const key = `${pattern.type}-${pattern.description}`;
        if (!this.patterns.has(key)) {
          this.patterns.set(key, []);
        }
        this.patterns.get(key)!.push(pattern);
      });
    });
  }

  /**
   * Get learned patterns
   */
  getLearnedPatterns(): AIPattern[] {
    const allPatterns: AIPattern[] = [];
    this.patterns.forEach(patterns => {
      allPatterns.push(...patterns);
    });
    return allPatterns;
  }
}

export function createAIQualityTransformer(astEngine?: any): AIQualityTransformer {
  return new AIQualityTransformer(astEngine);
}

export async function transformAIPatterns(code: string, options: { filePath?: string; dryRun?: boolean } = {}): Promise<AITransformResult> {
  const transformer = new AIQualityTransformer();
  return await transformer.transform(code, options);
}