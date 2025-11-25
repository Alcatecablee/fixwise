/**
 * Component Relationship Analyzer for NeuroLint Pro
 * Analyzes relationships between React components and provides optimization recommendations
 */

import * as ts from 'typescript';

interface ComponentRelationship {
  source: string;
  target: string;
  type: 'import' | 'usage' | 'props' | 'children';
  strength: number; // 0-1
  frequency: number;
}

interface ComponentAnalysis {
  name: string;
  props: string[];
  children: boolean;
  hooks: string[];
  dependencies: string[];
  complexity: number;
  relationships: ComponentRelationship[];
}

interface RelationshipAnalysis {
  components: Map<string, ComponentAnalysis>;
  dataFlow: DataFlowAnalysis;
  optimizations: OptimizationRecommendation[];
}

interface DataFlowAnalysis {
  propDrilling: PropDrillingIssue[];
  stateLifting: StateLiftingOpportunity[];
  memoization: MemoizationOpportunity[];
}

interface PropDrillingIssue {
  component: string;
  depth: number;
  props: string[];
  recommendation: string;
}

interface StateLiftingOpportunity {
  component: string;
  sharedState: string[];
  targetComponent: string;
  benefit: number;
}

interface MemoizationOpportunity {
  component: string;
  expensiveProps: string[];
  benefit: number;
}

interface OptimizationRecommendation {
  type: 'prop-drilling' | 'state-lifting' | 'memoization' | 'splitting' | 'composition';
  component: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  codeExample?: string;
}

export class ComponentRelationshipAnalyzer {
  private astEngine: any;

  constructor(astEngine: any) {
    this.astEngine = astEngine;
  }

  /**
   * Analyze component relationships in a codebase
   */
  analyzeComponentRelationships(ast: ts.SourceFile, context: any): RelationshipAnalysis {
    try {
      const components = this.extractComponents(ast);
      const relationships = this.analyzeRelationships(components, ast);
      const dataFlow = this.analyzeDataFlow(components, relationships);
      const optimizations = this.generateOptimizations(components, dataFlow);

      return {
        components,
        dataFlow,
        optimizations
      };
    } catch (error) {
      console.warn('Component relationship analysis failed:', error);
      return {
        components: new Map(),
        dataFlow: {
          propDrilling: [],
          stateLifting: [],
          memoization: []
        },
        optimizations: []
      };
    }
  }

  /**
   * Extract all components from AST
   */
  private extractComponents(ast: ts.SourceFile): Map<string, ComponentAnalysis> {
    const components = new Map<string, ComponentAnalysis>();

    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const componentName = node.name.text;
        if (this.isReactComponent(node)) {
          const analysis = this.analyzeComponent(node);
          components.set(componentName, analysis);
        }
      } else if (ts.isVariableStatement(node)) {
        // Handle const Component = () => {} patterns
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && 
              declaration.initializer && 
              ts.isArrowFunction(declaration.initializer)) {
            const componentName = declaration.name.text;
            if (this.isReactComponent(declaration.initializer)) {
              const analysis = this.analyzeComponent(declaration.initializer);
              components.set(componentName, analysis);
            }
          }
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return components;
  }

  /**
   * Check if a function is a React component
   */
  private isReactComponent(node: ts.FunctionDeclaration | ts.ArrowFunction): boolean {
    const text = node.getText();
    
    // Check for JSX return
    if (text.includes('return') && (text.includes('<') || text.includes('jsx'))) {
      return true;
    }

    // Check for React.FC type
    if (node.type && ts.isTypeReferenceNode(node.type)) {
      const typeName = node.type.typeName.getText();
      return typeName.includes('FC') || typeName.includes('Component');
    }

    // Check for props parameter
    if (node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isParameter(firstParam) && firstParam.name.getText().includes('props')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze a single component
   */
  private analyzeComponent(node: ts.FunctionDeclaration | ts.ArrowFunction): ComponentAnalysis {
    const name = ts.isFunctionDeclaration(node) ? node.name?.text || 'Component' : 'Component';
    const props = this.extractProps(node);
    const children = this.hasChildren(node);
    const hooks = this.extractHooks(node);
    const dependencies = this.extractDependencies(node);
    const complexity = this.calculateComplexity(node);
    const relationships: ComponentRelationship[] = [];

    return {
      name,
      props,
      children,
      hooks,
      dependencies,
      complexity,
      relationships
    };
  }

  /**
   * Extract props from component
   */
  private extractProps(node: ts.FunctionDeclaration | ts.ArrowFunction): string[] {
    const props: string[] = [];
    
    if (node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isParameter(firstParam)) {
        if (ts.isObjectBindingPattern(firstParam.name)) {
          // Destructured props: ({ prop1, prop2 }) => {}
          for (const element of firstParam.name.elements) {
            if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
              props.push(element.name.text);
            }
          }
        } else if (ts.isIdentifier(firstParam.name)) {
          // Single props parameter: (props) => {}
          props.push(firstParam.name.text);
        }
      }
    }

    return props;
  }

  /**
   * Check if component uses children
   */
  private hasChildren(node: ts.FunctionDeclaration | ts.ArrowFunction): boolean {
    const text = node.getText();
    return text.includes('children') || text.includes('{children}');
  }

  /**
   * Extract hooks used in component
   */
  private extractHooks(node: ts.FunctionDeclaration | ts.ArrowFunction): string[] {
    const hooks: string[] = [];
    const text = node.getText();
    const hookPattern = /use[A-Z][a-zA-Z]*/g;
    const matches = text.match(hookPattern);
    if (matches) {
      hooks.push(...matches);
    }
    return hooks;
  }

  /**
   * Extract component dependencies
   */
  private extractDependencies(node: ts.FunctionDeclaration | ts.ArrowFunction): string[] {
    const dependencies: string[] = [];
    const text = node.getText();
    
    // Find JSX elements that might be components
    const jsxPattern = /<([A-Z][a-zA-Z]*)/g;
    const matches = text.match(jsxPattern);
    if (matches) {
      for (const match of matches) {
        const componentName = match.slice(1); // Remove '<'
        if (componentName !== 'div' && componentName !== 'span' && componentName !== 'button') {
          dependencies.push(componentName);
        }
      }
    }

    return dependencies;
  }

  /**
   * Calculate component complexity
   */
  private calculateComplexity(node: ts.FunctionDeclaration | ts.ArrowFunction): number {
    let complexity = 0;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isIfStatement(node) || ts.isForStatement(node) || ts.isWhileStatement(node)) {
        complexity += 1;
      } else if (ts.isCallExpression(node)) {
        complexity += 0.5;
      } else if (ts.isBinaryExpression(node)) {
        complexity += 0.2;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(node);
    return complexity;
  }

  /**
   * Analyze relationships between components
   */
  private analyzeRelationships(components: Map<string, ComponentAnalysis>, ast: ts.SourceFile): ComponentRelationship[] {
    const relationships: ComponentRelationship[] = [];

    for (const [componentName, analysis] of components) {
      for (const dependency of analysis.dependencies) {
        if (components.has(dependency)) {
          relationships.push({
            source: componentName,
            target: dependency,
            type: 'usage',
            strength: 0.8,
            frequency: 1
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Analyze data flow patterns
   */
  private analyzeDataFlow(components: Map<string, ComponentAnalysis>, relationships: ComponentRelationship[]): DataFlowAnalysis {
    const propDrilling = this.detectPropDrilling(components, relationships);
    const stateLifting = this.detectStateLifting(components, relationships);
    const memoization = this.detectMemoizationOpportunities(components);

    return {
      propDrilling,
      stateLifting,
      memoization
    };
  }

  /**
   * Detect prop drilling issues
   */
  private detectPropDrilling(components: Map<string, ComponentAnalysis>, relationships: ComponentRelationship[]): PropDrillingIssue[] {
    const issues: PropDrillingIssue[] = [];

    for (const [componentName, analysis] of components) {
      if (analysis.props.length > 3) {
        // Check if props are passed down multiple levels
        const propFlow = this.tracePropFlow(componentName, relationships);
        if (propFlow.depth > 2) {
          issues.push({
            component: componentName,
            depth: propFlow.depth,
            props: analysis.props,
            recommendation: `Consider using Context API or state management for ${analysis.props.join(', ')}`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect state lifting opportunities
   */
  private detectStateLifting(components: Map<string, ComponentAnalysis>, relationships: ComponentRelationship[]): StateLiftingOpportunity[] {
    const opportunities: StateLiftingOpportunity[] = [];

    // Find components that share similar state patterns
    const statePatterns = new Map<string, string[]>();
    
    for (const [componentName, analysis] of components) {
      const stateHooks = analysis.hooks.filter(hook => hook.includes('useState'));
      if (stateHooks.length > 0) {
        statePatterns.set(componentName, stateHooks);
      }
    }

    // Find opportunities to lift shared state
    for (const [component1, hooks1] of statePatterns) {
      for (const [component2, hooks2] of statePatterns) {
        if (component1 !== component2) {
          const sharedHooks = hooks1.filter(hook => hooks2.includes(hook));
          if (sharedHooks.length > 0) {
            opportunities.push({
              component: component1,
              sharedState: sharedHooks,
              targetComponent: this.findCommonAncestor(component1, component2, relationships),
              benefit: sharedHooks.length * 0.5
            });
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * Detect memoization opportunities
   */
  private detectMemoizationOpportunities(components: Map<string, ComponentAnalysis>): MemoizationOpportunity[] {
    const opportunities: MemoizationOpportunity[] = [];

    for (const [componentName, analysis] of components) {
      if (analysis.complexity > 5 && analysis.props.length > 2) {
        opportunities.push({
          component: componentName,
          expensiveProps: analysis.props,
          benefit: analysis.complexity * 0.3
        });
      }
    }

    return opportunities;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizations(components: Map<string, ComponentAnalysis>, dataFlow: DataFlowAnalysis): OptimizationRecommendation[] {
    const optimizations: OptimizationRecommendation[] = [];

    // Prop drilling optimizations
    for (const issue of dataFlow.propDrilling) {
      optimizations.push({
        type: 'prop-drilling',
        component: issue.component,
        description: issue.recommendation,
        impact: issue.depth > 3 ? 'high' : 'medium',
        effort: 'medium',
        codeExample: `// Use Context API
const ${issue.component}Context = createContext();

export const ${issue.component}Provider = ({ children }) => {
  const [state, setState] = useState();
  return (
    <${issue.component}Context.Provider value={{ state, setState }}>
      {children}
    </${issue.component}Context.Provider>
  );
};`
      });
    }

    // State lifting optimizations
    for (const opportunity of dataFlow.stateLifting) {
      optimizations.push({
        type: 'state-lifting',
        component: opportunity.component,
        description: `Lift shared state (${opportunity.sharedState.join(', ')}) to ${opportunity.targetComponent}`,
        impact: opportunity.benefit > 1 ? 'high' : 'medium',
        effort: 'medium'
      });
    }

    // Memoization optimizations
    for (const opportunity of dataFlow.memoization) {
      optimizations.push({
        type: 'memoization',
        component: opportunity.component,
        description: `Memoize ${opportunity.component} to prevent unnecessary re-renders`,
        impact: opportunity.benefit > 2 ? 'high' : 'medium',
        effort: 'low',
        codeExample: `// Wrap component with memo
const ${opportunity.component} = memo(({ ${opportunity.expensiveProps.join(', ')} }) => {
  // Component implementation
});`
      });
    }

    return optimizations;
  }

  /**
   * Trace prop flow through component hierarchy
   */
  private tracePropFlow(componentName: string, relationships: ComponentRelationship[]): { depth: number; path: string[] } {
    const visited = new Set<string>();
    const queue = [{ component: componentName, depth: 0, path: [componentName] }];
    let maxDepth = 0;
    let maxPath: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.component)) continue;
      visited.add(current.component);

      if (current.depth > maxDepth) {
        maxDepth = current.depth;
        maxPath = current.path;
      }

      // Find children
      for (const rel of relationships) {
        if (rel.source === current.component) {
          queue.push({
            component: rel.target,
            depth: current.depth + 1,
            path: [...current.path, rel.target]
          });
        }
      }
    }

    return { depth: maxDepth, path: maxPath };
  }

  /**
   * Find common ancestor component
   */
  private findCommonAncestor(component1: string, component2: string, relationships: ComponentRelationship[]): string {
    // Simple implementation - in practice, this would do a more sophisticated analysis
    const component1Ancestors = this.findAncestors(component1, relationships);
    const component2Ancestors = this.findAncestors(component2, relationships);

    for (const ancestor of component1Ancestors) {
      if (component2Ancestors.includes(ancestor)) {
        return ancestor;
      }
    }

    return 'App'; // Default fallback
  }

  /**
   * Find all ancestors of a component
   */
  private findAncestors(component: string, relationships: ComponentRelationship[]): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();

    const findAncestorsRecursive = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);

      for (const rel of relationships) {
        if (rel.target === current) {
          ancestors.push(rel.source);
          findAncestorsRecursive(rel.source);
        }
      }
    };

    findAncestorsRecursive(component);
    return ancestors;
  }
} 