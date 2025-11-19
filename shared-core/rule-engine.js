const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * Shared Rule Engine for NeuroLint
 * 
 * This module provides the core analysis and transformation logic
 * that will be shared across CLI, VS Code, and Web App platforms.
 * 
 * Production-ready with comprehensive error handling, fallback mechanisms,
 * and input validation to avoid problematic AI behaviors.
 */

class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.analyzers = new Map();
    this.transformers = new Map();
    this.fallbackAnalyzer = null;
    
    this.initializeRules();
    this.initializeFallbackAnalyzer();
  }

  // Helper methods - defined early so they're available for rule binding
  hasKeyProp(jsxElement) {
    return jsxElement.openingElement.attributes.some(
      attr => attr.name && attr.name.name === 'key'
    );
  }

  hasSSRGuard(node) {
    // Check if node is wrapped in typeof window !== 'undefined'
    let current = node;
    while (current && current.parent) {
      if (current.parent.type === 'LogicalExpression' &&
          current.parent.operator === '&&' &&
          current.parent.left.type === 'BinaryExpression' &&
          current.parent.left.operator === '!==') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  hasAltProp(jsxElement) {
    return jsxElement.openingElement.attributes.some(
      attr => attr.name && attr.name.name === 'alt'
    );
  }

  /**
   * Initialize built-in rules and analyzers
   */
  initializeRules() {
    // Layer 1: Configuration rules
    this.addRule('config-modernization', {
      description: 'Modernize TypeScript and Next.js configuration',
      layer: 1,
      analyze: this.analyzeConfig.bind(this)
    });

    // Layer 2: Content standardization
    this.addRule('html-entities', {
      description: 'Convert HTML entities to proper characters',
      layer: 2,
      analyze: this.analyzeHtmlEntities.bind(this)
    });

    // Layer 3: Component intelligence
    this.addRule('missing-keys', {
      description: 'Add missing key props in React lists',
      layer: 3,
      analyze: this.analyzeMissingKeys.bind(this)
    });

    // Layer 4: Hydration safety
    this.addRule('ssr-safety', {
      description: 'Add SSR guards for client-side APIs',
      layer: 4,
      analyze: this.analyzeSSRSafety.bind(this)
    });

    // Layer 5: Next.js App Router
    this.addRule('app-router', {
      description: 'Add use client/use server directives',
      layer: 5,
      analyze: this.analyzeAppRouter.bind(this)
    });

    // Layer 6: Testing and validation
    this.addRule('testing-improvements', {
      description: 'Add error boundaries and accessibility',
      layer: 6,
      analyze: this.analyzeTesting.bind(this)
    });
  }

  /**
   * Initialize fallback analyzer for when AST parsing fails
   */
  initializeFallbackAnalyzer() {
    this.fallbackAnalyzer = {
      analyze: (code, options) => {
        const issues = [];
        const { filename = 'unknown', layers = [1, 2, 3, 4, 5, 6] } = options;
        
        try {
          // Regex-based fallback analysis
          if (layers.includes(2) && (code.includes('&quot;') || code.includes('&amp;'))) {
            issues.push({
              type: 'warning',
              message: 'HTML entities detected',
              description: 'Convert HTML entities to proper characters',
              layer: 2,
              location: { line: 1, column: 1 },
              ruleName: 'html-entities'
            });
          }

          if (layers.includes(2) && code.includes('console.log(')) {
            issues.push({
              type: 'warning',
              message: 'Console statements detected',
              description: 'Remove console statements for production',
              layer: 2,
              location: { line: 1, column: 1 },
              ruleName: 'console-cleanup'
            });
          }

          if (layers.includes(3) && code.includes('.map(') && !code.includes('key={')) {
            issues.push({
              type: 'warning',
              message: 'Missing key props in React lists',
              description: 'Add key props to React list items',
              layer: 3,
              location: { line: 1, column: 1 },
              ruleName: 'missing-keys'
            });
          }

          return issues;
        } catch (error) {
          return [];
        }
      }
    };
  }

  /**
   * Validate input parameters
   */
  validateInput(code, options = {}) {
    const errors = [];
    
    if (typeof code !== 'string') {
      errors.push('Code must be a string');
    }
    
    if (code.length === 0) {
      errors.push('Code cannot be empty');
    }
    
    if (code.length > 10 * 1024 * 1024) { // 10MB limit
      errors.push('Code file too large (max 10MB)');
    }
    
    if (options.layers && !Array.isArray(options.layers)) {
      errors.push('Layers must be an array');
    }
    
    if (options.layers) {
      const validLayers = [1, 2, 3, 4, 5, 6, 7];
      for (const layer of options.layers) {
        if (!validLayers.includes(layer)) {
          errors.push(`Invalid layer: ${layer}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Add a new rule to the engine
   */
  addRule(name, rule) {
    if (!name || typeof name !== 'string') {
      throw new Error('Rule name must be a non-empty string');
    }
    
    if (!rule || typeof rule !== 'object') {
      throw new Error('Rule must be an object');
    }
    
    if (!rule.description || typeof rule.description !== 'string') {
      throw new Error('Rule must have a description');
    }
    
    if (typeof rule.layer !== 'number' || rule.layer < 1 || rule.layer > 7) {
      throw new Error('Rule layer must be a number between 1 and 7');
    }
    
    // Ensure the rule methods are bound to this rule engine instance
    const boundRule = {
      ...rule,
      analyze: rule.analyze.bind(this),
      transform: rule.transform ? rule.transform.bind(this) : undefined
    };
    
    this.rules.set(name, boundRule);
  }

  /**
   * Analyze code and return issues with comprehensive error handling
   */
  async analyze(code, options = {}) {
    const {
      layers = [1, 2, 3, 4, 5, 6],
      filename = 'unknown',
      verbose = false,
      timeout = 30000 // 30 second timeout
    } = options;

    // Input validation
    const validation = this.validateInput(code, options);
    if (!validation.valid) {
      return {
        issues: [],
        error: `Input validation failed: ${validation.errors.join(', ')}`,
        summary: {
          totalIssues: 0,
          issuesByLayer: {},
          filename,
          validationErrors: validation.errors
        }
      };
    }

    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), timeout);
    });

    try {
      const analysisPromise = this.performAnalysis(code, layers, filename, verbose);
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      return {
        ...result,
        summary: {
          ...result.summary,
          analysisTime: Date.now(),
          layersAnalyzed: layers,
          totalRules: this.rules.size
        }
      };

    } catch (error) {
      // Fallback to regex-based analysis if AST parsing fails
      if (verbose && process.env.NEUROLINT_DEBUG === 'true') {
        process.stdout.write(`[DEBUG] AST parsing failed, using fallback analysis: ${error.message}\n`);
      }
      
      try {
        const fallbackIssues = await this.fallbackAnalyzer.analyze(code, { filename, layers });
        return {
          issues: fallbackIssues,
          summary: {
            totalIssues: fallbackIssues.length,
            issuesByLayer: this.groupIssuesByLayer(fallbackIssues),
            filename,
            fallbackUsed: true,
            originalError: error.message
          }
        };
      } catch (fallbackError) {
        return {
          issues: [],
          error: `Analysis failed: ${error.message}. Fallback also failed: ${fallbackError.message}`,
          summary: {
            totalIssues: 0,
            issuesByLayer: {},
            filename,
            analysisFailed: true
          }
        };
      }
    }
  }

  /**
   * Perform the actual analysis with proper error handling
   */
  async performAnalysis(code, layers, filename, verbose) {
    try {
      // Parse code to AST with comprehensive error handling
      let ast;
      try {
        ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
          allowImportExportEverywhere: true,
          strictMode: false
        });
      } catch (parseError) {
        throw new Error(`AST parsing failed: ${parseError.message}`);
      }

      const issues = [];
      const analysisErrors = [];

      // Run analysis for each enabled layer with individual error handling
      for (const layer of layers) {
        const layerRules = Array.from(this.rules.values())
          .filter(rule => rule.layer === layer);

        for (const rule of layerRules) {
          try {
            const ruleIssues = await rule.analyze(ast, { filename, verbose });
            
            if (Array.isArray(ruleIssues)) {
              issues.push(...ruleIssues.map(issue => ({
                ...issue,
                rule: rule.description,
                layer,
                ruleName: rule.description.toLowerCase().replace(/\s+/g, '-')
              })));
            } else {
              analysisErrors.push(`Rule ${rule.description} returned invalid result`);
            }
          } catch (error) {
            analysisErrors.push(`Rule ${rule.description} failed: ${error.message}`);
            if (verbose && process.env.NEUROLINT_DEBUG === 'true') {
              process.stdout.write(`[DEBUG] Rule ${rule.description} failed: ${error.message}\n`);
            }
          }
        }
      }

      return {
        issues,
        analysisErrors,
        summary: {
          totalIssues: issues.length,
          issuesByLayer: this.groupIssuesByLayer(issues),
          filename,
          analysisErrors: analysisErrors.length > 0 ? analysisErrors : undefined
        }
      };

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Apply fixes to code based on issues with comprehensive error handling
   */
  async applyFixes(code, issues, options = {}) {
    const {
      dryRun = false,
      verbose = false,
      timeout = 60000 // 60 second timeout for transformations
    } = options;

    // Input validation
    if (!Array.isArray(issues)) {
      return {
        success: false,
        error: 'Issues must be an array',
        code: code,
        appliedFixes: []
      };
    }

    if (issues.length === 0) {
      return {
        success: true,
        code: code,
        appliedFixes: [],
        message: 'No issues to fix'
      };
    }

    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Fix application timeout')), timeout);
    });

    try {
      const fixPromise = this.performFixes(code, issues, { dryRun, verbose });
      const result = await Promise.race([fixPromise, timeoutPromise]);
      
      return {
        ...result,
        appliedFixes: result.appliedFixes || [],
        totalFixes: result.appliedFixes?.length || 0
      };

    } catch (error) {
      return {
        success: false,
        error: `Fix application failed: ${error.message}`,
        code: code,
        appliedFixes: []
      };
    }
  }

  /**
   * Perform the actual fixes with proper error handling
   */
  async performFixes(code, issues, options) {
    try {
      // Parse code to AST
      let ast;
      try {
        ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
          allowImportExportEverywhere: true,
          strictMode: false
        });
      } catch (parseError) {
        throw new Error(`AST parsing failed: ${parseError.message}`);
      }

      const appliedFixes = [];
      const fixErrors = [];
      let modifiedAst = ast;

      // Apply fixes for each issue with individual error handling
      for (const issue of issues) {
        try {
          const rule = this.rules.get(issue.ruleName);
          if (rule && rule.transform) {
            const result = await rule.transform(modifiedAst, issue, options);
            if (result && result.success) {
              modifiedAst = result.ast;
              appliedFixes.push({
                rule: issue.rule,
                description: issue.description,
                location: issue.location,
                layer: issue.layer
              });
            }
          }
        } catch (error) {
          fixErrors.push(`Fix for ${issue.description} failed: ${error.message}`);
          if (options.verbose) {
            process.stdout.write(`Fix for ${issue.description} failed: ${error.message}\n`);
          }
        }
      }

      // Generate code from modified AST
      let transformedCode;
      try {
        const generated = generate(modifiedAst, {
          retainLines: true,
          retainFunctionParens: true
        });
        transformedCode = generated.code;
      } catch (generateError) {
        throw new Error(`Code generation failed: ${generateError.message}`);
      }

      return {
        success: true,
        code: transformedCode,
        appliedFixes,
        fixErrors: fixErrors.length > 0 ? fixErrors : undefined
      };

    } catch (error) {
      throw new Error(`Fix application failed: ${error.message}`);
    }
  }

  /**
   * Group issues by layer for reporting
   */
  groupIssuesByLayer(issues) {
    return issues.reduce((acc, issue) => {
      const layer = issue.layer;
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(issue);
      return acc;
    }, {});
  }

  /**
   * Group fixes by rule for reporting
   */
  groupFixesByRule(fixes) {
    return fixes.reduce((acc, fix) => {
      const rule = fix.rule;
      if (!acc[rule]) acc[rule] = [];
      acc[rule].push(fix);
      return acc;
    }, {});
  }

  // Layer 1: Configuration Analysis
  async analyzeConfig(ast, options) {
    const issues = [];
    
    // Check for outdated TypeScript targets
    traverse(ast, {
      ObjectProperty(path) {
        if (path.node.key.name === 'target' && 
            path.node.value.value === 'es5') {
          issues.push({
            type: 'config',
            description: 'Outdated TypeScript target (es5)',
            location: path.node.loc,
            severity: 'warning',
            suggestion: 'Upgrade to ES2022 or later'
          });
        }
      }
    });

    return issues;
  }

  // Layer 2: HTML Entities Analysis
  async analyzeHtmlEntities(ast, options) {
    const issues = [];
    
    traverse(ast, {
      StringLiteral(path) {
        const value = path.node.value;
        if (value.includes('&quot;') || value.includes('&amp;') || 
            value.includes('&lt;') || value.includes('&gt;')) {
          issues.push({
            type: 'pattern',
            description: 'HTML entities found',
            location: path.node.loc,
            severity: 'info',
            suggestion: 'Convert to proper characters'
          });
        }
      }
    });

    return issues;
  }

  // Layer 3: Missing Keys Analysis
  async analyzeMissingKeys(ast, options) {
    const issues = [];
    const self = this; // Capture this context
    
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.property && 
            path.node.callee.property.name === 'map') {
          const callback = path.node.arguments[0];
          if (callback && callback.type === 'ArrowFunctionExpression') {
            const body = callback.body;
            if (body.type === 'JSXElement' && !self.hasKeyProp(body)) {
              issues.push({
                type: 'component',
                description: 'Missing key prop in map function',
                location: path.node.loc,
                severity: 'warning',
                suggestion: 'Add unique key prop'
              });
            }
          }
        }
      }
    });

    return issues;
  }

  // Layer 4: SSR Safety Analysis
  async analyzeSSRSafety(ast, options) {
    const issues = [];
    const self = this; // Capture this context
    
    traverse(ast, {
      MemberExpression(path) {
        if (path.node.object.name === 'localStorage' || 
            path.node.object.name === 'sessionStorage' ||
            path.node.object.name === 'window') {
          const parent = path.parent;
          if (!self.hasSSRGuard(parent)) {
            issues.push({
              type: 'hydration',
              description: 'Unguarded client-side API usage',
              location: path.node.loc,
              severity: 'error',
              suggestion: 'Add typeof window check'
            });
          }
        }
      }
    });

    return issues;
  }

  // Layer 5: App Router Analysis
  async analyzeAppRouter(ast, options) {
    const issues = [];
    
    let hasUseClient = false;
    let hasUseServer = false;
    
    traverse(ast, {
      Directive(path) {
        if (path.node.value.value === 'use client') hasUseClient = true;
        if (path.node.value.value === 'use server') hasUseServer = true;
      }
    });

    // Check for interactive components without 'use client'
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.name === 'useState' || 
            path.node.callee.name === 'useEffect') {
          if (!hasUseClient) {
            issues.push({
              type: 'nextjs',
              description: 'Interactive component missing use client directive',
              location: path.node.loc,
              severity: 'warning',
              suggestion: 'Add use client directive'
            });
          }
        }
      }
    });

    return issues;
  }

  // Layer 6: Testing Analysis
  async analyzeTesting(ast, options) {
    const issues = [];
    const self = this; // Capture this context
    
    traverse(ast, {
      JSXElement(path) {
        if (path.node.openingElement.name.name === 'img' && 
            !self.hasAltProp(path.node)) {
          issues.push({
            type: 'accessibility',
            description: 'Image missing alt attribute',
            location: path.node.loc,
            severity: 'warning',
            suggestion: 'Add alt attribute for accessibility'
          });
        }
      }
    });

    return issues;
  }




}

// Create and export singleton instance
const ruleEngine = new RuleEngine();

module.exports = ruleEngine; 