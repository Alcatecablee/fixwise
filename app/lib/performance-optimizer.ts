/**
 * Performance Optimizer for NeuroLint Pro
 * Provides performance optimization recommendations and automatic optimizations
 */

import * as ts from 'typescript';

interface PerformanceMetrics {
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  reRenderCount: number;
}

interface PerformanceAnalysis {
  metrics: PerformanceMetrics;
  bottlenecks: PerformanceBottleneck[];
  optimizations: PerformanceOptimization[];
}

interface PerformanceBottleneck {
  type: 'expensive-render' | 'large-bundle' | 'memory-leak' | 'unnecessary-re-renders';
  component: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
}

interface PerformanceOptimization {
  type: 'memoization' | 'lazy-loading' | 'code-splitting' | 'virtualization' | 'debouncing';
  component: string;
  description: string;
  benefit: number;
  effort: 'low' | 'medium' | 'high';
  codeExample?: string;
}

export class PerformanceOptimizer {
  private astEngine: any;
  private relationshipAnalyzer: any;

  constructor(astEngine: any, relationshipAnalyzer: any) {
    this.astEngine = astEngine;
    this.relationshipAnalyzer = relationshipAnalyzer;
  }

  /**
   * Analyze performance and generate optimizations
   */
  optimizePerformance(ast: ts.SourceFile, context: any): PerformanceAnalysis {
    try {
      const metrics = this.calculatePerformanceMetrics(ast);
      const bottlenecks = this.detectBottlenecks(ast, metrics);
      const optimizations = this.generateOptimizations(ast, bottlenecks);

      return {
        metrics,
        bottlenecks,
        optimizations
      };
    } catch (error) {
      console.warn('Performance analysis failed:', error);
      return {
        metrics: {
          renderTime: 0,
          bundleSize: 0,
          memoryUsage: 0,
          reRenderCount: 0
        },
        bottlenecks: [],
        optimizations: []
      };
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(ast: ts.SourceFile): PerformanceMetrics {
    let renderTime = 0;
    let bundleSize = 0;
    let memoryUsage = 0;
    let reRenderCount = 0;

    const visitNode = (node: ts.Node) => {
      // Estimate render time based on complexity
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const complexity = this.calculateComplexity(node);
        renderTime += complexity * 10; // ms per complexity unit
      }

      // Estimate bundle size
      if (ts.isImportDeclaration(node)) {
        bundleSize += 50; // KB per import
      }

      // Estimate memory usage
      if (ts.isVariableStatement(node)) {
        memoryUsage += 10; // KB per variable
      }

      // Count potential re-renders
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text.includes('useState')) {
        reRenderCount++;
      }

      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return { renderTime, bundleSize, memoryUsage, reRenderCount };
  }

  /**
   * Calculate complexity of a function
   */
  private calculateComplexity(node: ts.FunctionDeclaration | ts.ArrowFunction): number {
    let complexity = 0;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isIfStatement(node) || ts.isForStatement(node) || ts.isWhileStatement(node)) {
        complexity += 2;
      } else if (ts.isCallExpression(node)) {
        complexity += 1;
      } else if (ts.isBinaryExpression(node)) {
        complexity += 0.5;
      } else if (ts.isArrayLiteralExpression(node)) {
        complexity += node.elements.length * 0.2;
      } else if (ts.isObjectLiteralExpression(node)) {
        complexity += node.properties.length * 0.2;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(node);
    return complexity;
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(ast: ts.SourceFile, metrics: PerformanceMetrics): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Detect expensive renders
    if (metrics.renderTime > 100) {
      bottlenecks.push({
        type: 'expensive-render',
        component: 'Unknown',
        severity: metrics.renderTime > 500 ? 'high' : 'medium',
        description: `Render time of ${metrics.renderTime}ms exceeds recommended threshold`,
        impact: metrics.renderTime / 100
      });
    }

    // Detect large bundle size
    if (metrics.bundleSize > 1000) {
      bottlenecks.push({
        type: 'large-bundle',
        component: 'Bundle',
        severity: metrics.bundleSize > 2000 ? 'high' : 'medium',
        description: `Bundle size of ${metrics.bundleSize}KB exceeds recommended threshold`,
        impact: metrics.bundleSize / 1000
      });
    }

    // Detect memory leaks
    if (metrics.memoryUsage > 500) {
      bottlenecks.push({
        type: 'memory-leak',
        component: 'Memory',
        severity: metrics.memoryUsage > 1000 ? 'high' : 'medium',
        description: `Memory usage of ${metrics.memoryUsage}KB exceeds recommended threshold`,
        impact: metrics.memoryUsage / 500
      });
    }

    // Detect unnecessary re-renders
    if (metrics.reRenderCount > 10) {
      bottlenecks.push({
        type: 'unnecessary-re-renders',
        component: 'State',
        severity: metrics.reRenderCount > 20 ? 'high' : 'medium',
        description: `${metrics.reRenderCount} state updates detected, consider memoization`,
        impact: metrics.reRenderCount / 10
      });
    }

    return bottlenecks;
  }

  /**
   * Generate performance optimizations
   */
  private generateOptimizations(ast: ts.SourceFile, bottlenecks: PerformanceBottleneck[]): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'expensive-render':
          optimizations.push({
            type: 'memoization',
            component: bottleneck.component,
            description: 'Memoize component to prevent unnecessary re-renders',
            benefit: bottleneck.impact * 0.8,
            effort: 'low',
            codeExample: `const ${bottleneck.component} = memo(({ props }) => {
  // Component implementation
});`
          });
          break;

        case 'large-bundle':
          optimizations.push({
            type: 'code-splitting',
            component: 'Bundle',
            description: 'Implement code splitting to reduce initial bundle size',
            benefit: bottleneck.impact * 0.6,
            effort: 'medium',
            codeExample: `// Use dynamic imports
const LazyComponent = lazy(() => import('./LazyComponent'));

// Use React.lazy for route-based splitting
const routes = [
  {
    path: '/lazy',
    component: lazy(() => import('./LazyRoute'))
  }
];`
          });
          break;

        case 'memory-leak':
          optimizations.push({
            type: 'lazy-loading',
            component: 'Memory',
            description: 'Implement lazy loading to reduce memory usage',
            benefit: bottleneck.impact * 0.7,
            effort: 'medium',
            codeExample: `// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>`
          });
          break;

        case 'unnecessary-re-renders':
          optimizations.push({
            type: 'debouncing',
            component: 'State',
            description: 'Implement debouncing for frequent state updates',
            benefit: bottleneck.impact * 0.5,
            effort: 'low',
            codeExample: `// Debounce state updates
const debouncedSetState = useMemo(
  () => debounce(setState, 300),
  []
);`
          });
          break;
      }
    }

    return optimizations;
  }

  /**
   * Apply automatic performance optimizations
   */
  applyOptimizations(sourceCode: string, filename: string): { success: boolean; code: string; changes: number } {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0
        };
      }

      let changes = 0;
      let optimizedCode = sourceCode;

      // Apply memoization to expensive components
      const expensiveComponents = this.findExpensiveComponents(context.ast);
      for (const component of expensiveComponents) {
        const result = this.applyMemoization(component, context);
        if (result.success) {
          optimizedCode = this.replaceInSource(optimizedCode, component, result.code);
          changes += result.changes;
        }
      }

      // Apply lazy loading to heavy imports
      const heavyImports = this.findHeavyImports(context.ast);
      for (const importDecl of heavyImports) {
        const result = this.applyLazyLoading(importDecl, context);
        if (result.success) {
          optimizedCode = this.replaceInSource(optimizedCode, importDecl, result.code);
          changes += result.changes;
        }
      }

      // Apply debouncing to frequent state updates
      const frequentUpdates = this.findFrequentUpdates(context.ast);
      for (const update of frequentUpdates) {
        const result = this.applyDebouncing(update, context);
        if (result.success) {
          optimizedCode = this.replaceInSource(optimizedCode, update, result.code);
          changes += result.changes;
        }
      }

      return {
        success: changes > 0,
        code: optimizedCode,
        changes
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0
      };
    }
  }

  /**
   * Find expensive components
   */
  private findExpensiveComponents(ast: ts.SourceFile): ts.FunctionDeclaration[] {
    const expensiveComponents: ts.FunctionDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && this.isReactComponent(node)) {
        const complexity = this.calculateComplexity(node);
        if (complexity > 10) {
          expensiveComponents.push(node);
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return expensiveComponents;
  }

  /**
   * Check if function is a React component
   */
  private isReactComponent(node: ts.FunctionDeclaration): boolean {
    const text = node.getText();
    return text.includes('return') && (text.includes('<') || text.includes('jsx'));
  }

  /**
   * Apply memoization to component
   */
  private applyMemoization(node: ts.FunctionDeclaration, context: any): { success: boolean; code: string; changes: number } {
    const componentName = node.name?.text || 'Component';
    const memoizedCode = `const ${componentName} = memo(({ props }) => {
  ${node.body?.getText().slice(1, -1) || ''}
});

export default ${componentName};`;

    return {
      success: true,
      code: memoizedCode,
      changes: 1
    };
  }

  /**
   * Find heavy imports
   */
  private findHeavyImports(ast: ts.SourceFile): ts.ImportDeclaration[] {
    const heavyImports: ts.ImportDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText();
        // Consider large libraries as heavy imports
        if (moduleSpecifier.includes('lodash') || 
            moduleSpecifier.includes('moment') ||
            moduleSpecifier.includes('date-fns')) {
          heavyImports.push(node);
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return heavyImports;
  }

  /**
   * Apply lazy loading to import
   */
  private applyLazyLoading(node: ts.ImportDeclaration, context: any): { success: boolean; code: string; changes: number } {
    const moduleSpecifier = node.moduleSpecifier.getText();
    const lazyCode = `const LazyModule = lazy(() => import(${moduleSpecifier}));`;

    return {
      success: true,
      code: lazyCode,
      changes: 1
    };
  }

  /**
   * Find frequent state updates
   */
  private findFrequentUpdates(ast: ts.SourceFile): ts.CallExpression[] {
    const frequentUpdates: ts.CallExpression[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isCallExpression(node) && 
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'setState') {
        frequentUpdates.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return frequentUpdates;
  }

  /**
   * Apply debouncing to state update
   */
  private applyDebouncing(node: ts.CallExpression, context: any): { success: boolean; code: string; changes: number } {
    const originalCode = node.getText();
    const debouncedCode = `debouncedSetState(${node.arguments.map(arg => arg.getText()).join(', ')})`;

    return {
      success: true,
      code: debouncedCode,
      changes: 1
    };
  }

  /**
   * Replace code in source
   */
  private replaceInSource(sourceCode: string, node: ts.Node, replacement: string): string {
    const start = node.getStart();
    const end = node.getEnd();
    return sourceCode.slice(0, start) + replacement + sourceCode.slice(end);
  }
} 