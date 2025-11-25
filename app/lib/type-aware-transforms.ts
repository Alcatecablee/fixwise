/**
 * Type-Aware Transforms for NeuroLint Pro
 * Provides intelligent code transformations based on TypeScript type information
 */

import * as ts from 'typescript';

interface TransformContext {
  ast: ts.SourceFile;
  typeChecker: ts.TypeChecker;
  filename: string;
}

interface TransformResult {
  success: boolean;
  code: string;
  changes: number;
  errors: string[];
}

export class TypeAwareTransforms {
  private astEngine: any;

  constructor(astEngine: any) {
    this.astEngine = astEngine;
  }

  /**
   * Transform legacy class components to functional components
   */
  transformClassToFunction(sourceCode: string, filename: string): TransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          errors: ['AST context not available']
        };
      }

      let changes = 0;
      let transformedCode = sourceCode;
      const errors: string[] = [];

      // Find class components
      const classComponents = this.findClassComponents(context.ast);
      
      for (const classComponent of classComponents) {
        try {
          const result = this.transformClassComponent(classComponent, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, classComponent, result.code);
            changes += result.changes;
          } else {
            errors.push(...result.errors);
          }
        } catch (error) {
          errors.push(`Failed to transform class component: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: changes > 0,
        code: transformedCode,
        changes,
        errors
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Transform useState to useReducer for complex state
   */
  transformUseStateToUseReducer(sourceCode: string, filename: string): TransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          errors: ['AST context not available']
        };
      }

      let changes = 0;
      let transformedCode = sourceCode;
      const errors: string[] = [];

      // Find useState calls that could benefit from useReducer
      const useStateCalls = this.findUseStateCalls(context.ast);
      
      for (const useStateCall of useStateCalls) {
        if (this.shouldConvertToUseReducer(useStateCall, context)) {
          try {
            const result = this.transformUseStateToUseReducer(sourceCode, filename);
            if (result.success) {
              transformedCode = this.replaceInSource(transformedCode, useStateCall, result.code);
              changes += result.changes;
            } else {
              errors.push(...result.errors);
            }
          } catch (error) {
            errors.push(`Failed to transform useState: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        success: changes > 0,
        code: transformedCode,
        changes,
        errors
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Optimize imports based on usage
   */
  optimizeImports(sourceCode: string, filename: string): TransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          errors: ['AST context not available']
        };
      }

      let changes = 0;
      let transformedCode = sourceCode;
      const errors: string[] = [];

      // Find unused imports
      const unusedImports = this.findUnusedImports(context.ast, context.typeChecker);
      
      for (const unusedImport of unusedImports) {
        try {
          transformedCode = this.removeImport(transformedCode, unusedImport);
          changes++;
        } catch (error) {
          errors.push(`Failed to remove unused import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Consolidate imports
      const importGroups = this.groupImports(context.ast);
      for (const group of importGroups) {
        try {
          const consolidated = this.consolidateImportGroup(group);
          transformedCode = this.replaceImportGroup(transformedCode, group, consolidated);
          changes++;
        } catch (error) {
          errors.push(`Failed to consolidate imports: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: changes > 0,
        code: transformedCode,
        changes,
        errors
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private findClassComponents(ast: ts.SourceFile): ts.ClassDeclaration[] {
    const classComponents: ts.ClassDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && this.isReactClassComponent(node)) {
        classComponents.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return classComponents;
  }

  private isReactClassComponent(node: ts.ClassDeclaration): boolean {
    // Check if class extends React.Component or has render method
    if (node.heritageClauses) {
      for (const heritage of node.heritageClauses) {
        if (heritage.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const type of heritage.types) {
            if (type.expression.getText().includes('Component')) {
              return true;
            }
          }
        }
      }
    }

    // Check for render method
    if (node.members) {
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name.getText() === 'render') {
          return true;
        }
      }
    }

    return false;
  }

  private transformClassComponent(node: ts.ClassDeclaration, context: TransformContext): TransformResult {
    // This is a simplified transformation
    // In a real implementation, this would be much more complex
    const className = node.name?.getText() || 'Component';
    const props = this.extractClassProps(node);
    const state = this.extractClassState(node);
    const methods = this.extractClassMethods(node);
    const renderMethod = this.extractRenderMethod(node);

    if (!renderMethod) {
      return {
        success: false,
        code: '',
        changes: 0,
        errors: ['No render method found']
      };
    }

    // Generate functional component
    const functionalComponent = this.generateFunctionalComponent(
      className,
      props,
      state,
      methods,
      renderMethod
    );

    return {
      success: true,
      code: functionalComponent,
      changes: 1,
      errors: []
    };
  }

  private extractClassProps(node: ts.ClassDeclaration): string[] {
    const props: string[] = [];
    
    if (node.members) {
      for (const member of node.members) {
        if (ts.isPropertyDeclaration(member) && member.modifiers) {
          for (const modifier of member.modifiers) {
            if (modifier.kind === ts.SyntaxKind.ReadonlyKeyword) {
              props.push(member.name.getText());
            }
          }
        }
      }
    }

    return props;
  }

  private extractClassState(node: ts.ClassDeclaration): string[] {
    const state: string[] = [];
    
    if (node.members) {
      for (const member of node.members) {
        if (ts.isPropertyDeclaration(member) && !member.modifiers) {
          state.push(member.name.getText());
        }
      }
    }

    return state;
  }

  private extractClassMethods(node: ts.ClassDeclaration): ts.MethodDeclaration[] {
    const methods: ts.MethodDeclaration[] = [];
    
    if (node.members) {
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name.getText() !== 'render') {
          methods.push(member);
        }
      }
    }

    return methods;
  }

  private extractRenderMethod(node: ts.ClassDeclaration): ts.MethodDeclaration | null {
    if (node.members) {
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name.getText() === 'render') {
          return member;
        }
      }
    }
    return null;
  }

  private generateFunctionalComponent(
    className: string,
    props: string[],
    state: string[],
    methods: ts.MethodDeclaration[],
    renderMethod: ts.MethodDeclaration
  ): string {
    let component = `const ${className}: React.FC<${className}Props> = (props) => {\n`;

    // Add state hooks
    for (const stateItem of state) {
      component += `  const [${stateItem}, set${stateItem.charAt(0).toUpperCase() + stateItem.slice(1)}] = useState();\n`;
    }

    // Add method hooks
    for (const method of methods) {
      const methodName = method.name.getText();
      const parameters = method.parameters.map(p => p.name.getText()).join(', ');
      component += `  const ${methodName} = useCallback((${parameters}) => {\n`;
      component += `    // TODO: Implement ${methodName}\n`;
      component += `  }, []);\n`;
    }

    // Add render logic
    component += `\n  return (\n`;
    component += `    ${renderMethod.body?.getText().slice(1, -1) || ''}\n`;
    component += `  );\n`;
    component += `};\n\n`;
    component += `export default ${className};\n`;

    return component;
  }

  private findUseStateCalls(ast: ts.SourceFile): ts.CallExpression[] {
    const useStateCalls: ts.CallExpression[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'useState') {
        useStateCalls.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return useStateCalls;
  }

  private shouldConvertToUseReducer(node: ts.CallExpression, context: TransformContext): boolean {
    // Simple heuristic: if useState has complex initial value, consider useReducer
    if (node.arguments.length > 0) {
      const initialValue = node.arguments[0];
      return ts.isObjectLiteralExpression(initialValue) || 
             ts.isArrayLiteralExpression(initialValue);
    }
    return false;
  }

  private findUnusedImports(ast: ts.SourceFile, typeChecker: ts.TypeChecker): ts.ImportDeclaration[] {
    const unusedImports: ts.ImportDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
          for (const importSpecifier of importClause.namedBindings.elements) {
            const symbol = typeChecker.getSymbolAtLocation(importSpecifier.name);
            if (symbol && !this.isSymbolUsed(symbol, ast)) {
              unusedImports.push(node);
              break;
            }
          }
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return unusedImports;
  }

  private isSymbolUsed(symbol: ts.Symbol, ast: ts.SourceFile): boolean {
    let used = false;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isIdentifier(node) && node.text === symbol.name) {
        used = true;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return used;
  }

  private groupImports(ast: ts.SourceFile): ts.ImportDeclaration[][] {
    const importGroups: Map<string, ts.ImportDeclaration[]> = new Map();
    
    const visitNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText();
        const group = importGroups.get(moduleSpecifier) || [];
        group.push(node);
        importGroups.set(moduleSpecifier, group);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return Array.from(importGroups.values());
  }

  private consolidateImportGroup(group: ts.ImportDeclaration[]): string {
    if (group.length <= 1) return group[0].getText();
    
    const moduleSpecifier = group[0].moduleSpecifier.getText();
    const allImports: string[] = [];
    
    for (const importDecl of group) {
      if (importDecl.importClause?.namedBindings && ts.isNamedImports(importDecl.importClause.namedBindings)) {
        for (const importSpecifier of importDecl.importClause.namedBindings.elements) {
          allImports.push(importSpecifier.name.text);
        }
      }
    }
    
    return `import { ${allImports.join(', ')} } from ${moduleSpecifier};`;
  }

  private replaceInSource(sourceCode: string, node: ts.Node, replacement: string): string {
    const start = node.getStart();
    const end = node.getEnd();
    return sourceCode.slice(0, start) + replacement + sourceCode.slice(end);
  }

  private removeImport(sourceCode: string, importNode: ts.ImportDeclaration): string {
    return this.replaceInSource(sourceCode, importNode, '');
  }

  private replaceImportGroup(sourceCode: string, group: ts.ImportDeclaration[], consolidated: string): string {
    let result = sourceCode;
    for (const importDecl of group) {
      result = this.replaceInSource(result, importDecl, '');
    }
    // Insert consolidated import at the beginning
    const firstImport = group[0];
    const start = firstImport.getStart();
    return result.slice(0, start) + consolidated + '\n' + result.slice(start);
  }
} 