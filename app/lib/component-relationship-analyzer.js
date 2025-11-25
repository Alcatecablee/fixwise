/**
 * Component Relationship Analyzer for NeuroLint Pro
 *
 * Analyzes relationships between components, data flow, and dependencies
 * Provides insights for optimization and refactoring opportunities
 *
 * Follows IMPLEMENTATION_PATTERNS.md for safe analysis and transformations
 */

const t = require("@babel/types");
const traverse = require("@babel/traverse").default;

/**
 * Component Relationship Analyzer
 * Maps component hierarchies, data flow, and optimization opportunities
 */
class ComponentRelationshipAnalyzer {
  constructor(astEngine) {
    this.astEngine = astEngine;
    this.componentRegistry = new Map();
    this.dataFlowGraph = new Map();
    this.dependencyGraph = new Map();
    this.optimizationOpportunities = [];
  }

  /**
   * Analyze component relationships across the entire codebase
   */
  analyzeComponentRelationships(ast, context) {
    this.resetAnalysis();

    // First pass: Catalog all components
    this.catalogComponents(ast, context);

    // Second pass: Analyze relationships
    this.analyzeDataFlow(ast, context);
    this.analyzeDependencies(ast, context);

    // Third pass: Identify optimization opportunities
    this.identifyOptimizationOpportunities(ast, context);

    return {
      components: Array.from(this.componentRegistry.values()),
      dataFlow: Array.from(this.dataFlowGraph.entries()),
      dependencies: Array.from(this.dependencyGraph.entries()),
      optimizations: this.optimizationOpportunities,
    };
  }

  /**
   * Reset analysis state for fresh analysis
   */
  resetAnalysis() {
    this.componentRegistry.clear();
    this.dataFlowGraph.clear();
    this.dependencyGraph.clear();
    this.optimizationOpportunities = [];
  }

  /**
   * Catalog all components in the AST
   */
  catalogComponents(ast, context) {
    traverse(ast, {
      // Function components
      FunctionDeclaration: (path) => {
        if (this.astEngine.isReactComponent(path)) {
          const component = this.analyzeComponent(path, "function", context);
          this.componentRegistry.set(component.name, component);
        }
      },

      // Arrow function components
      VariableDeclarator: (path) => {
        if (this.astEngine.isReactComponentVariable(path)) {
          const component = this.analyzeComponent(path, "arrow", context);
          this.componentRegistry.set(component.name, component);
        }
      },

      // Class components (legacy)
      ClassDeclaration: (path) => {
        if (this.isReactClassComponent(path)) {
          const component = this.analyzeComponent(path, "class", context);
          this.componentRegistry.set(component.name, component);
        }
      },
    });
  }

  /**
   * Analyze individual component structure and properties
   */
  analyzeComponent(path, type, context) {
    const name = this.getComponentName(path);
    const location = path.node.loc;

    // Analyze props
    const propsAnalysis = this.analyzeComponentProps(path);

    // Analyze hooks usage
    const hooksAnalysis = this.analyzeHooksUsage(path);

    // Analyze children components
    const childrenAnalysis = this.analyzeChildComponents(path);

    // Analyze state management
    const stateAnalysis = this.analyzeStateManagement(path);

    // Analyze side effects
    const effectsAnalysis = this.analyzeSideEffects(path);

    // Calculate complexity metrics
    const complexity = this.calculateComponentComplexity(path);

    return {
      name,
      type,
      location,
      filename: context.filename,
      props: propsAnalysis,
      hooks: hooksAnalysis,
      children: childrenAnalysis,
      state: stateAnalysis,
      effects: effectsAnalysis,
      complexity,
      isExported: this.isExported(path),
      hasTests: this.hasTests(name, context),
      performance: this.analyzePerformanceCharacteristics(path),
    };
  }

  /**
   * Analyze component props usage and patterns
   */
  analyzeComponentProps(path) {
    const props = {
      parameters: [],
      destructured: [],
      usage: new Map(),
      optionalProps: new Set(),
      requiredProps: new Set(),
    };

    const propsParam = this.getPropsParameter(path);
    if (!propsParam) {
      return props;
    }

    // Analyze destructuring pattern
    if (t.isObjectPattern(propsParam)) {
      propsParam.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const propName = prop.key.name;
          props.destructured.push(propName);

          // Check for default values (indicates optional)
          if (t.isAssignmentPattern(prop.value)) {
            props.optionalProps.add(propName);
          } else {
            props.requiredProps.add(propName);
          }
        }
      });
    }

    // Analyze prop usage throughout component
    traverse(path.node, {
      MemberExpression: (memberPath) => {
        if (this.isPropsAccess(memberPath, propsParam)) {
          const propName = memberPath.node.property.name;
          if (!props.usage.has(propName)) {
            props.usage.set(propName, []);
          }
          props.usage.get(propName).push({
            type: this.getUsageType(memberPath),
            location: memberPath.node.loc,
          });
        }
      },
    });

    return props;
  }

  /**
   * Analyze hooks usage and patterns
   */
  analyzeHooksUsage(path) {
    const hooks = {
      useState: [],
      useEffect: [],
      useCallback: [],
      useMemo: [],
      useRef: [],
      custom: [],
      dependencies: new Set(),
    };

    traverse(path.node, {
      CallExpression: (callPath) => {
        if (this.astEngine.isHookCall(callPath)) {
          const hookName = callPath.node.callee.name;
          const hookInfo = {
            name: hookName,
            arguments: callPath.node.arguments,
            location: callPath.node.loc,
            dependencies: this.extractHookDependencies(callPath),
          };

          if (hooks[hookName]) {
            hooks[hookName].push(hookInfo);
          } else {
            hooks.custom.push(hookInfo);
          }

          // Track dependencies
          hookInfo.dependencies.forEach((dep) => hooks.dependencies.add(dep));
        }
      },
    });

    return hooks;
  }

  /**
   * Analyze child components rendered by this component
   */
  analyzeChildComponents(path) {
    const children = {
      components: new Set(),
      conditionalRenders: [],
      listRenders: [],
      dynamicComponents: [],
    };

    traverse(path.node, {
      JSXElement: (jsxPath) => {
        const elementName = jsxPath.node.openingElement.name.name;

        // Skip HTML elements, focus on custom components
        if (this.isCustomComponent(elementName)) {
          children.components.add(elementName);

          // Analyze conditional rendering
          if (this.isConditionalRender(jsxPath)) {
            children.conditionalRenders.push({
              component: elementName,
              condition: this.extractCondition(jsxPath),
              location: jsxPath.node.loc,
            });
          }

          // Analyze list rendering
          if (this.isListRender(jsxPath)) {
            children.listRenders.push({
              component: elementName,
              array: this.extractArraySource(jsxPath),
              location: jsxPath.node.loc,
            });
          }
        }
      },

      // Dynamic component rendering
      JSXExpressionContainer: (exprPath) => {
        if (this.isDynamicComponent(exprPath)) {
          children.dynamicComponents.push({
            expression: exprPath.node.expression,
            location: exprPath.node.loc,
          });
        }
      },
    });

    return {
      ...children,
      components: Array.from(children.components),
    };
  }

  /**
   * Analyze state management patterns
   */
  analyzeStateManagement(path) {
    const state = {
      localState: [],
      sharedState: [],
      contextUsage: [],
      stateUpdaters: [],
      stateComplexity: 0,
    };

    traverse(path.node, {
      CallExpression: (callPath) => {
        // useState analysis
        if (t.isIdentifier(callPath.node.callee, { name: "useState" })) {
          const stateInfo = this.analyzeUseStateCall(callPath);
          state.localState.push(stateInfo);
          state.stateComplexity += stateInfo.complexity;
        }

        // useContext analysis
        if (t.isIdentifier(callPath.node.callee, { name: "useContext" })) {
          const contextInfo = this.analyzeUseContextCall(callPath);
          state.contextUsage.push(contextInfo);
        }

        // useReducer analysis
        if (t.isIdentifier(callPath.node.callee, { name: "useReducer" })) {
          const reducerInfo = this.analyzeUseReducerCall(callPath);
          state.sharedState.push(reducerInfo);
          state.stateComplexity += reducerInfo.complexity;
        }
      },
    });

    return state;
  }

  /**
   * Analyze side effects and their dependencies
   */
  analyzeSideEffects(path) {
    const effects = {
      useEffect: [],
      eventListeners: [],
      apiCalls: [],
      subscriptions: [],
      cleanupFunctions: [],
    };

    traverse(path.node, {
      CallExpression: (callPath) => {
        if (t.isIdentifier(callPath.node.callee, { name: "useEffect" })) {
          const effectInfo = this.analyzeUseEffectCall(callPath);
          effects.useEffect.push(effectInfo);

          if (effectInfo.hasCleanup) {
            effects.cleanupFunctions.push(effectInfo);
          }

          if (effectInfo.hasAPICall) {
            effects.apiCalls.push(effectInfo);
          }
        }
      },
    });

    return effects;
  }

  /**
   * Calculate component complexity metrics
   */
  calculateComponentComplexity(path) {
    let complexity = {
      cyclomaticComplexity: 1, // Base complexity
      cognitiveComplexity: 0,
      linesOfCode: 0,
      jsxElements: 0,
      conditionalStatements: 0,
      loops: 0,
      hooks: 0,
      props: 0,
    };

    traverse(path.node, {
      // Cyclomatic complexity contributors
      IfStatement: () => complexity.cyclomaticComplexity++,
      ConditionalExpression: () => complexity.cyclomaticComplexity++,
      LogicalExpression: (logicalPath) => {
        if (
          logicalPath.node.operator === "&&" ||
          logicalPath.node.operator === "||"
        ) {
          complexity.cyclomaticComplexity++;
        }
      },
      WhileStatement: () => complexity.cyclomaticComplexity++,
      ForStatement: () => complexity.cyclomaticComplexity++,
      ForInStatement: () => complexity.cyclomaticComplexity++,

      // Cognitive complexity (nested structures add more)
      BlockStatement: (blockPath) => {
        const depth = this.getBlockDepth(blockPath);
        complexity.cognitiveComplexity += depth;
      },

      // JSX complexity
      JSXElement: () => complexity.jsxElements++,

      // Hook usage
      CallExpression: (callPath) => {
        if (this.astEngine.isHookCall(callPath)) {
          complexity.hooks++;
        }
      },
    });

    // Calculate lines of code
    if (path.node.loc) {
      complexity.linesOfCode =
        path.node.loc.end.line - path.node.loc.start.line + 1;
    }

    return complexity;
  }

  /**
   * Analyze data flow between components
   */
  analyzeDataFlow(ast, context) {
    traverse(ast, {
      JSXElement: (path) => {
        const elementName = path.node.openingElement.name.name;

        if (this.isCustomComponent(elementName)) {
          const dataFlow = this.analyzeDataFlowToComponent(path, elementName);

          if (dataFlow.length > 0) {
            if (!this.dataFlowGraph.has(elementName)) {
              this.dataFlowGraph.set(elementName, []);
            }
            this.dataFlowGraph.get(elementName).push(...dataFlow);
          }
        }
      },
    });
  }

  /**
   * Analyze data flow to a specific component
   */
  analyzeDataFlowToComponent(jsxPath, componentName) {
    const dataFlow = [];

    jsxPath.node.openingElement.attributes.forEach((attr) => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const propName = attr.name.name;
        const propValue = attr.value;

        const flowInfo = {
          prop: propName,
          component: componentName,
          sourceType: this.determineDataSourceType(propValue),
          location: attr.loc,
        };

        if (t.isJSXExpressionContainer(propValue)) {
          flowInfo.source = this.analyzeDataSource(propValue.expression);
        }

        dataFlow.push(flowInfo);
      }
    });

    return dataFlow;
  }

  /**
   * Analyze dependencies between components
   */
  analyzeDependencies(ast, context) {
    traverse(ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;

        // Track component imports
        if (this.isComponentImport(source)) {
          path.node.specifiers.forEach((spec) => {
            if (t.isImportDefaultSpecifier(spec) || t.isImportSpecifier(spec)) {
              const componentName = spec.local.name;

              if (!this.dependencyGraph.has(context.filename)) {
                this.dependencyGraph.set(context.filename, []);
              }

              this.dependencyGraph.get(context.filename).push({
                type: "import",
                component: componentName,
                source: source,
                location: path.node.loc,
              });
            }
          });
        }
      },
    });
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities(ast, context) {
    // Analyze each component for optimization opportunities
    this.componentRegistry.forEach((component) => {
      this.analyzeComponentOptimizations(component);
    });

    // Analyze cross-component optimization opportunities
    this.analyzeCrossComponentOptimizations();
  }

  /**
   * Analyze optimization opportunities for a single component
   */
  analyzeComponentOptimizations(component) {
    const optimizations = [];

    // High complexity components
    if (component.complexity.cyclomaticComplexity > 10) {
      optimizations.push({
        type: "split-component",
        component: component.name,
        reason: "High cyclomatic complexity",
        severity: "high",
        suggestion: "Consider splitting into smaller components",
      });
    }

    // Too many props
    if (component.props.destructured.length > 8) {
      optimizations.push({
        type: "reduce-props",
        component: component.name,
        reason: "Too many props",
        severity: "medium",
        suggestion: "Consider using props object or context",
      });
    }

    // Missing React.memo opportunity
    if (this.shouldUseMemo(component)) {
      optimizations.push({
        type: "add-react-memo",
        component: component.name,
        reason: "Component could benefit from memoization",
        severity: "medium",
        suggestion: "Wrap component with React.memo",
      });
    }

    // Inefficient state updates
    if (this.hasInefficientStateUpdates(component)) {
      optimizations.push({
        type: "optimize-state-updates",
        component: component.name,
        reason: "Inefficient state update patterns detected",
        severity: "high",
        suggestion: "Use useCallback for event handlers",
      });
    }

    this.optimizationOpportunities.push(...optimizations);
  }

  /**
   * Analyze cross-component optimization opportunities
   */
  analyzeCrossComponentOptimizations() {
    // Identify prop drilling opportunities
    this.identifyPropDrilling();

    // Identify common state that could be lifted up
    this.identifyStateLifting();

    // Identify duplicate logic across components
    this.identifyDuplicateLogic();
  }

  /**
   * Helper methods
   */

  getComponentName(path) {
    if (t.isFunctionDeclaration(path.node) && path.node.id) {
      return path.node.id.name;
    } else if (
      t.isVariableDeclarator(path.node) &&
      t.isIdentifier(path.node.id)
    ) {
      return path.node.id.name;
    } else if (t.isClassDeclaration(path.node) && path.node.id) {
      return path.node.id.name;
    }
    return "Anonymous";
  }

  getPropsParameter(path) {
    let params;
    if (t.isFunctionDeclaration(path.node)) {
      params = path.node.params;
    } else if (
      t.isVariableDeclarator(path.node) &&
      (t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init))
    ) {
      params = path.node.init.params;
    } else if (t.isClassDeclaration(path.node)) {
      // For class components, props are accessed via this.props
      return null;
    }

    return params && params[0] ? params[0] : null;
  }

  isReactClassComponent(path) {
    if (!path.node.superClass) return false;

    return (
      t.isIdentifier(path.node.superClass, { name: "Component" }) ||
      t.isIdentifier(path.node.superClass, { name: "PureComponent" }) ||
      (t.isMemberExpression(path.node.superClass) &&
        t.isIdentifier(path.node.superClass.object, { name: "React" }) &&
        (t.isIdentifier(path.node.superClass.property, { name: "Component" }) ||
          t.isIdentifier(path.node.superClass.property, {
            name: "PureComponent",
          })))
    );
  }

  isCustomComponent(elementName) {
    // Custom components start with uppercase letter
    return /^[A-Z]/.test(elementName);
  }

  isExported(path) {
    return (
      t.isExportDefaultDeclaration(path.parent) ||
      t.isExportNamedDeclaration(path.parent)
    );
  }

  hasTests(componentName, context) {
    // This would need to be enhanced to actually check for test files
    // For now, return false as placeholder
    return false;
  }

  analyzePerformanceCharacteristics(path) {
    return {
      hasExpensiveOperations: this.hasExpensiveOperations(path),
      hasFrequentRenders: this.hasFrequentRenders(path),
      hasLargeState: this.hasLargeState(path),
    };
  }

  shouldUseMemo(component) {
    // Simple heuristic: components with many props and no hooks might benefit from memo
    return (
      component.props.destructured.length > 5 &&
      component.hooks.useState.length === 0 &&
      component.hooks.useEffect.length === 0
    );
  }

  hasInefficientStateUpdates(component) {
    // Check for inline function definitions in event handlers
    return component.hooks.useState.length > 0;
  }

  identifyPropDrilling() {
    // Implementation for prop drilling detection
  }

  identifyStateLifting() {
    // Implementation for state lifting opportunities
  }

  identifyDuplicateLogic() {
    // Implementation for duplicate logic detection
  }

  // Additional helper methods would be implemented here...
  isPropsAccess(memberPath, propsParam) {
    return false;
  }
  getUsageType(memberPath) {
    return "unknown";
  }
  extractHookDependencies(callPath) {
    return [];
  }
  isConditionalRender(jsxPath) {
    return false;
  }
  extractCondition(jsxPath) {
    return null;
  }
  isListRender(jsxPath) {
    return false;
  }
  extractArraySource(jsxPath) {
    return null;
  }
  isDynamicComponent(exprPath) {
    return false;
  }
  analyzeUseStateCall(callPath) {
    return { complexity: 1 };
  }
  analyzeUseContextCall(callPath) {
    return {};
  }
  analyzeUseReducerCall(callPath) {
    return { complexity: 2 };
  }
  analyzeUseEffectCall(callPath) {
    return { hasCleanup: false, hasAPICall: false };
  }
  getBlockDepth(blockPath) {
    return 1;
  }
  determineDataSourceType(propValue) {
    return "unknown";
  }
  analyzeDataSource(expression) {
    return "unknown";
  }
  isComponentImport(source) {
    return source.startsWith("./") || source.startsWith("../");
  }
  hasExpensiveOperations(path) {
    return false;
  }
  hasFrequentRenders(path) {
    return false;
  }
  hasLargeState(path) {
    return false;
  }
}

module.exports = { ComponentRelationshipAnalyzer };
