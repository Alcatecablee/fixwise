/**
 * Performance-Aware Refactoring Engine for NeuroLint Pro
 *
 * Identifies and automatically fixes common React performance anti-patterns
 * Provides intelligent optimizations based on component usage patterns
 *
 * Follows IMPLEMENTATION_PATTERNS.md for safe transformations
 */

const t = require("@babel/types");
const traverse = require("@babel/traverse").default;

/**
 * Performance Optimizer
 * Analyzes and fixes performance issues in React components
 */
class PerformanceOptimizer {
  constructor(astEngine, relationshipAnalyzer) {
    this.astEngine = astEngine;
    this.relationshipAnalyzer = relationshipAnalyzer;
    this.performanceIssues = [];
    this.optimizationCache = new Map();
  }

  /**
   * Analyze and optimize performance issues
   */
  optimizePerformance(ast, context) {
    this.performanceIssues = [];

    const optimizations = [
      ...this.optimizeRendering(ast, context),
      ...this.optimizeStateUpdates(ast, context),
      ...this.optimizeEventHandlers(ast, context),
      ...this.optimizeMemoryLeaks(ast, context),
      ...this.optimizeExpensiveOperations(ast, context),
      ...this.optimizeBundleSize(ast, context),
    ];

    return {
      optimizations,
      issues: this.performanceIssues,
      metrics: this.calculatePerformanceMetrics(ast, context),
    };
  }

  /**
   * Optimize rendering performance
   */
  optimizeRendering(ast, context) {
    const optimizations = [];

    traverse(ast, {
      // Add React.memo for pure components
      FunctionDeclaration: (path) => {
        if (this.astEngine.isReactComponent(path)) {
          const memoOptimization = this.analyzeMemoOptimization(path);
          if (memoOptimization.shouldMemo) {
            optimizations.push({
              type: "add-react-memo",
              component: path.node.id.name,
              reasoning: memoOptimization.reasoning,
              confidence: memoOptimization.confidence,
              location: path.node.loc,
              action: () => this.addReactMemo(path),
            });
          }
        }
      },

      // Optimize conditional rendering
      ConditionalExpression: (path) => {
        if (this.isInJSXContext(path)) {
          const condOptimization = this.analyzeConditionalRendering(path);
          if (condOptimization.canOptimize) {
            optimizations.push({
              type: "optimize-conditional-rendering",
              issue: condOptimization.issue,
              solution: condOptimization.solution,
              location: path.node.loc,
              action: () =>
                this.optimizeConditionalRendering(path, condOptimization),
            });
          }
        }
      },

      // Optimize list rendering
      CallExpression: (path) => {
        if (this.isMapInJSX(path)) {
          const listOptimization = this.analyzeListRendering(path);
          if (listOptimization.needsOptimization) {
            optimizations.push({
              type: "optimize-list-rendering",
              issues: listOptimization.issues,
              suggestions: listOptimization.suggestions,
              location: path.node.loc,
              action: () => this.optimizeListRendering(path, listOptimization),
            });
          }
        }
      },
    });

    return optimizations;
  }

  /**
   * Optimize state updates
   */
  optimizeStateUpdates(ast, context) {
    const optimizations = [];

    traverse(ast, {
      // Optimize useState batching
      CallExpression: (path) => {
        if (t.isIdentifier(path.node.callee, { name: "useState" })) {
          const stateOptimization = this.analyzeStateOptimization(path);
          if (stateOptimization.needsOptimization) {
            optimizations.push({
              type: "optimize-state-updates",
              issues: stateOptimization.issues,
              suggestions: stateOptimization.suggestions,
              location: path.node.loc,
              action: () => this.optimizeStateUpdates(path, stateOptimization),
            });
          }
        }
      },

      // Optimize useEffect dependencies
      CallExpression: (path) => {
        if (t.isIdentifier(path.node.callee, { name: "useEffect" })) {
          const effectOptimization = this.analyzeEffectOptimization(path);
          if (effectOptimization.needsOptimization) {
            optimizations.push({
              type: "optimize-use-effect",
              issues: effectOptimization.issues,
              suggestions: effectOptimization.suggestions,
              location: path.node.loc,
              action: () => this.optimizeUseEffect(path, effectOptimization),
            });
          }
        }
      },
    });

    return optimizations;
  }

  /**
   * Optimize event handlers
   */
  optimizeEventHandlers(ast, context) {
    const optimizations = [];

    traverse(ast, {
      JSXAttribute: (path) => {
        if (this.isEventHandler(path)) {
          const handlerOptimization =
            this.analyzeEventHandlerOptimization(path);
          if (handlerOptimization.needsOptimization) {
            optimizations.push({
              type: "optimize-event-handler",
              handler: handlerOptimization.handlerName,
              issue: handlerOptimization.issue,
              solution: handlerOptimization.solution,
              location: path.node.loc,
              action: () =>
                this.optimizeEventHandler(path, handlerOptimization),
            });
          }
        }
      },
    });

    return optimizations;
  }

  /**
   * Detect and fix memory leaks
   */
  optimizeMemoryLeaks(ast, context) {
    const optimizations = [];

    traverse(ast, {
      CallExpression: (path) => {
        if (t.isIdentifier(path.node.callee, { name: "useEffect" })) {
          const leakAnalysis = this.analyzeMemoryLeaks(path);
          if (leakAnalysis.hasLeaks) {
            optimizations.push({
              type: "fix-memory-leak",
              leakType: leakAnalysis.leakType,
              severity: leakAnalysis.severity,
              location: path.node.loc,
              action: () => this.fixMemoryLeak(path, leakAnalysis),
            });
          }
        }
      },
    });

    return optimizations;
  }

  /**
   * Optimize expensive operations
   */
  optimizeExpensiveOperations(ast, context) {
    const optimizations = [];

    traverse(ast, {
      // Optimize calculations with useMemo
      VariableDeclarator: (path) => {
        if (this.isExpensiveCalculation(path)) {
          const memoAnalysis = this.analyzeUseMemoOpportunity(path);
          if (memoAnalysis.shouldUseMemo) {
            optimizations.push({
              type: "add-use-memo",
              variable: path.node.id.name,
              reasoning: memoAnalysis.reasoning,
              dependencies: memoAnalysis.dependencies,
              location: path.node.loc,
              action: () => this.addUseMemo(path, memoAnalysis),
            });
          }
        }
      },

      // Optimize function definitions with useCallback
      FunctionExpression: (path) => {
        if (this.isInComponentScope(path) && this.shouldUseCallback(path)) {
          const callbackAnalysis = this.analyzeUseCallbackOpportunity(path);
          if (callbackAnalysis.shouldUseCallback) {
            optimizations.push({
              type: "add-use-callback",
              reasoning: callbackAnalysis.reasoning,
              dependencies: callbackAnalysis.dependencies,
              location: path.node.loc,
              action: () => this.addUseCallback(path, callbackAnalysis),
            });
          }
        }
      },
    });

    return optimizations;
  }

  /**
   * Optimize bundle size
   */
  optimizeBundleSize(ast, context) {
    const optimizations = [];

    traverse(ast, {
      ImportDeclaration: (path) => {
        const bundleOptimization = this.analyzeBundleOptimization(path);
        if (bundleOptimization.canOptimize) {
          optimizations.push({
            type: "optimize-imports",
            library: path.node.source.value,
            optimization: bundleOptimization.type,
            savings: bundleOptimization.estimatedSavings,
            location: path.node.loc,
            action: () => this.optimizeImports(path, bundleOptimization),
          });
        }
      },
    });

    return optimizations;
  }

  /**
   * Analysis methods
   */

  analyzeMemoOptimization(path) {
    const componentName = path.node.id.name;
    let shouldMemo = false;
    let reasoning = [];
    let confidence = 0;

    // Check if component receives many props
    const propsParam = path.node.params[0];
    if (t.isObjectPattern(propsParam) && propsParam.properties.length > 5) {
      shouldMemo = true;
      reasoning.push("Component has many props");
      confidence += 0.6;
    }

    // Check if component has no state or effects
    let hasState = false;
    let hasEffects = false;

    traverse(path.node, {
      CallExpression: (callPath) => {
        if (t.isIdentifier(callPath.node.callee, { name: "useState" })) {
          hasState = true;
        }
        if (t.isIdentifier(callPath.node.callee, { name: "useEffect" })) {
          hasEffects = true;
        }
      },
    });

    if (!hasState && !hasEffects) {
      shouldMemo = true;
      reasoning.push("Component is pure (no state or effects)");
      confidence += 0.8;
    }

    // Check if component is used in lists or frequently re-rendered contexts
    if (this.isUsedInLists(componentName)) {
      shouldMemo = true;
      reasoning.push("Component is used in lists");
      confidence += 0.7;
    }

    return {
      shouldMemo,
      reasoning,
      confidence: Math.min(confidence, 1.0),
    };
  }

  analyzeConditionalRendering(path) {
    const test = path.node.test;
    const consequent = path.node.consequent;
    const alternate = path.node.alternate;

    // Check for null/undefined conditional rendering anti-patterns
    if (
      t.isBooleanLiteral(alternate, { value: false }) ||
      t.isNullLiteral(alternate)
    ) {
      return {
        canOptimize: true,
        issue: "Inefficient conditional rendering with false/null",
        solution: "Use logical AND operator (&&) instead of ternary",
        optimizationType: "logical-and",
      };
    }

    // Check for expensive operations in conditional branches
    if (
      this.hasExpensiveOperations(consequent) ||
      this.hasExpensiveOperations(alternate)
    ) {
      return {
        canOptimize: true,
        issue: "Expensive operations in conditional rendering",
        solution: "Move expensive operations outside JSX or use useMemo",
        optimizationType: "extract-expensive",
      };
    }

    return { canOptimize: false };
  }

  analyzeListRendering(path) {
    const issues = [];
    const suggestions = [];
    let needsOptimization = false;

    // Check for missing keys
    const mapCallback = path.node.arguments[0];
    if (
      mapCallback &&
      (t.isArrowFunctionExpression(mapCallback) ||
        t.isFunctionExpression(mapCallback))
    ) {
      const jsxReturn = this.getJSXReturn(mapCallback);
      if (jsxReturn && !this.hasKeyProp(jsxReturn)) {
        issues.push("Missing key prop in list rendering");
        suggestions.push("Add unique key prop to each list item");
        needsOptimization = true;
      }
    }

    // Check for index as key anti-pattern
    if (this.usesIndexAsKey(path)) {
      issues.push("Using array index as key");
      suggestions.push("Use stable, unique identifier as key");
      needsOptimization = true;
    }

    // Check for expensive operations in render function
    if (this.hasExpensiveOperationsInMap(mapCallback)) {
      issues.push("Expensive operations in map callback");
      suggestions.push("Move expensive operations outside map or use useMemo");
      needsOptimization = true;
    }

    return {
      needsOptimization,
      issues,
      suggestions,
    };
  }

  analyzeEventHandlerOptimization(path) {
    const handlerName = path.node.name.name;
    const handlerValue = path.node.value;

    if (t.isJSXExpressionContainer(handlerValue)) {
      const expression = handlerValue.expression;

      // Check for inline arrow functions
      if (t.isArrowFunctionExpression(expression)) {
        return {
          needsOptimization: true,
          handlerName,
          issue: "Inline arrow function in event handler",
          solution: "Use useCallback to memoize handler",
          optimizationType: "use-callback",
        };
      }

      // Check for inline function calls
      if (t.isCallExpression(expression)) {
        return {
          needsOptimization: true,
          handlerName,
          issue: "Inline function call in event handler",
          solution: "Extract to separate handler function",
          optimizationType: "extract-handler",
        };
      }
    }

    return { needsOptimization: false };
  }

  analyzeMemoryLeaks(path) {
    const effectCallback = path.node.arguments[0];
    let hasLeaks = false;
    let leakType = "";
    let severity = "low";

    if (
      effectCallback &&
      (t.isArrowFunctionExpression(effectCallback) ||
        t.isFunctionExpression(effectCallback))
    ) {
      // Check for uncleared intervals/timeouts
      traverse(effectCallback.body, {
        CallExpression: (callPath) => {
          if (
            t.isIdentifier(callPath.node.callee, { name: "setInterval" }) ||
            t.isIdentifier(callPath.node.callee, { name: "setTimeout" })
          ) {
            // Check if there's a cleanup function
            if (!this.hasCleanupFunction(path)) {
              hasLeaks = true;
              leakType = "timer-leak";
              severity = "high";
            }
          }
        },
      });

      // Check for uncleaned event listeners
      traverse(effectCallback.body, {
        CallExpression: (callPath) => {
          if (
            this.isEventListenerCall(callPath) &&
            !this.hasCleanupFunction(path)
          ) {
            hasLeaks = true;
            leakType = "event-listener-leak";
            severity = "medium";
          }
        },
      });
    }

    return {
      hasLeaks,
      leakType,
      severity,
    };
  }

  /**
   * Optimization implementation methods
   */

  addReactMemo(path) {
    const componentName = path.node.id.name;

    // Wrap function declaration with React.memo
    const memoCall = t.callExpression(
      t.memberExpression(t.identifier("React"), t.identifier("memo")),
      [path.node],
    );

    // Replace function declaration with variable declaration
    const memoComponent = t.variableDeclaration("const", [
      t.variableDeclarator(t.identifier(componentName), memoCall),
    ]);

    path.replaceWith(memoComponent);

    // Ensure React is imported
    this.ensureReactImport(path);
  }

  optimizeConditionalRendering(path, optimization) {
    if (optimization.optimizationType === "logical-and") {
      // Convert ternary to logical AND
      const logicalAnd = t.logicalExpression(
        "&&",
        path.node.test,
        path.node.consequent,
      );
      path.replaceWith(logicalAnd);
    }
  }

  optimizeEventHandler(path, optimization) {
    if (optimization.optimizationType === "use-callback") {
      // This would need component-level context to properly implement useCallback
      // For now, add a comment suggesting the optimization
      path.addComment(
        "leading",
        " TODO: Consider using useCallback for this handler",
      );
    }
  }

  addUseMemo(path, analysis) {
    const variable = path.node.id;
    const init = path.node.init;

    // Create useMemo call
    const memoCall = t.callExpression(t.identifier("useMemo"), [
      t.arrowFunctionExpression([], init),
      t.arrayExpression(analysis.dependencies.map((dep) => t.identifier(dep))),
    ]);

    // Replace the initialization
    path.node.init = memoCall;

    // Ensure React is imported with useMemo
    this.ensureHookImport(path, "useMemo");
  }

  addUseCallback(path, analysis) {
    // Wrap function with useCallback
    const callbackCall = t.callExpression(t.identifier("useCallback"), [
      path.node,
      t.arrayExpression(analysis.dependencies.map((dep) => t.identifier(dep))),
    ]);

    path.replaceWith(callbackCall);

    // Ensure React is imported with useCallback
    this.ensureHookImport(path, "useCallback");
  }

  fixMemoryLeak(path, leakAnalysis) {
    if (leakAnalysis.leakType === "timer-leak") {
      this.addTimerCleanup(path);
    } else if (leakAnalysis.leakType === "event-listener-leak") {
      this.addEventListenerCleanup(path);
    }
  }

  addTimerCleanup(path) {
    const effectCallback = path.node.arguments[0];

    if (
      t.isArrowFunctionExpression(effectCallback) ||
      t.isFunctionExpression(effectCallback)
    ) {
      // Add return statement with cleanup function
      const cleanupFunction = t.arrowFunctionExpression(
        [],
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(t.identifier("clearInterval"), [
              t.identifier("intervalId"),
            ]),
          ),
        ]),
      );

      // This is a simplified implementation
      // In practice, we'd need to track the timer ID properly
      effectCallback.body.body.push(t.returnStatement(cleanupFunction));
    }
  }

  /**
   * Helper methods
   */

  ensureReactImport(path) {
    const program = path.scope.getProgramParent().path;

    // Check if React is already imported
    let hasReactImport = false;
    traverse(program.node, {
      ImportDeclaration: (importPath) => {
        if (importPath.node.source.value === "react") {
          hasReactImport = true;
        }
      },
    });

    if (!hasReactImport) {
      const reactImport = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier("React"))],
        t.stringLiteral("react"),
      );
      program.node.body.unshift(reactImport);
    }
  }

  ensureHookImport(path, hookName) {
    const program = path.scope.getProgramParent().path;

    // Find existing React import and add hook if needed
    traverse(program.node, {
      ImportDeclaration: (importPath) => {
        if (importPath.node.source.value === "react") {
          const hasHook = importPath.node.specifiers.some(
            (spec) =>
              t.isImportSpecifier(spec) && spec.imported.name === hookName,
          );

          if (!hasHook) {
            importPath.node.specifiers.push(
              t.importSpecifier(t.identifier(hookName), t.identifier(hookName)),
            );
          }
        }
      },
    });
  }

  calculatePerformanceMetrics(ast, context) {
    return {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(ast),
      cognitiveComplexity: this.calculateCognitiveComplexity(ast),
      renderingComplexity: this.calculateRenderingComplexity(ast),
      bundleImpact: this.estimateBundleImpact(ast),
    };
  }

  // Additional helper methods would be implemented here...
  isInJSXContext(path) {
    return false;
  }
  isMapInJSX(path) {
    return false;
  }
  isEventHandler(path) {
    return false;
  }
  isExpensiveCalculation(path) {
    return false;
  }
  isInComponentScope(path) {
    return false;
  }
  shouldUseCallback(path) {
    return false;
  }
  isUsedInLists(componentName) {
    return false;
  }
  hasExpensiveOperations(node) {
    return false;
  }
  getJSXReturn(callback) {
    return null;
  }
  hasKeyProp(jsxElement) {
    return false;
  }
  usesIndexAsKey(path) {
    return false;
  }
  hasExpensiveOperationsInMap(callback) {
    return false;
  }
  hasCleanupFunction(path) {
    return false;
  }
  isEventListenerCall(path) {
    return false;
  }
  calculateCyclomaticComplexity(ast) {
    return 1;
  }
  calculateCognitiveComplexity(ast) {
    return 1;
  }
  calculateRenderingComplexity(ast) {
    return 1;
  }
  estimateBundleImpact(ast) {
    return "low";
  }
  analyzeStateOptimization(path) {
    return { needsOptimization: false };
  }
  analyzeEffectOptimization(path) {
    return { needsOptimization: false };
  }
  analyzeUseMemoOpportunity(path) {
    return { shouldUseMemo: false };
  }
  analyzeUseCallbackOpportunity(path) {
    return { shouldUseCallback: false };
  }
  analyzeBundleOptimization(path) {
    return { canOptimize: false };
  }
  optimizeStateUpdates(path, optimization) {}
  optimizeUseEffect(path, optimization) {}
  optimizeListRendering(path, optimization) {}
  optimizeImports(path, optimization) {}
  addEventListenerCleanup(path) {}
}

module.exports = { PerformanceOptimizer };
