/**
 * Enhanced AST Engine for NeuroLint Pro
 * Provides advanced code analysis and transformation capabilities
 */

import * as ts from 'typescript';

interface ASTContext {
  filename: string;
  sourceCode: string;
  ast: ts.SourceFile;
  typeChecker?: ts.TypeChecker;
  program?: ts.Program;
}

interface SemanticContext {
  imports: Map<string, string[]>;
  exports: Map<string, string[]>;
  components: Map<string, ComponentInfo>;
  hooks: Map<string, HookInfo>;
  types: Map<string, TypeInfo>;
}

interface ComponentInfo {
  name: string;
  props: string[];
  children: boolean;
  hooks: string[];
  imports: string[];
  exports: string[];
}

interface HookInfo {
  name: string;
  dependencies: string[];
  returnType: string;
  usage: string[];
}

interface TypeInfo {
  name: string;
  definition: string;
  usage: string[];
}

interface ParseResult {
  success: boolean;
  ast?: ts.SourceFile;
  context?: ASTContext;
  semanticContext?: SemanticContext;
  error?: string;
}

export class EnhancedASTEngine {
  private contexts: Map<string, ASTContext> = new Map();
  private semanticContexts: Map<string, SemanticContext> = new Map();
  private compilerOptions: ts.CompilerOptions;

  constructor() {
    this.compilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.React,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      allowJs: true,
      skipLibCheck: true,
      strict: false,
    };
  }

  parseCode(sourceCode: string, filename: string): ParseResult {
    try {
      // Validate input
      if (!sourceCode || typeof sourceCode !== 'string') {
        return {
          success: false,
          error: 'Invalid source code provided'
        };
      }

      if (!filename || typeof filename !== 'string') {
        return {
          success: false,
          error: 'Invalid filename provided'
        };
      }

      // Create a program for this file
      const program = ts.createProgram([filename], this.compilerOptions);
      const sourceFile = program.getSourceFile(filename);
      
      if (!sourceFile) {
        return {
          success: false,
          error: 'Failed to parse source file'
        };
      }

      const typeChecker = program.getTypeChecker();
      const context: ASTContext = {
        filename,
        sourceCode,
        ast: sourceFile,
        typeChecker,
        program
      };

      this.contexts.set(filename, context);

      // Build semantic context with error handling
      try {
        const semanticContext = this.buildSemanticContext(sourceFile, typeChecker);
        this.semanticContexts.set(filename, semanticContext);
      } catch (semanticError) {
        // Continue without semantic context if it fails
        console.warn('Semantic context building failed:', semanticError);
      }

      return {
        success: true,
        ast: sourceFile,
        context,
        semanticContext: this.semanticContexts.get(filename)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  private buildSemanticContext(sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker): SemanticContext {
    const semanticContext: SemanticContext = {
      imports: new Map(),
      exports: new Map(),
      components: new Map(),
      hooks: new Map(),
      types: new Map()
    };

    // Visit all nodes to extract semantic information
    const visitNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        this.extractImportInfo(node, semanticContext);
      } else if (ts.isExportDeclaration(node)) {
        this.extractExportInfo(node, semanticContext);
      } else if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        this.extractComponentInfo(node, semanticContext, typeChecker);
      } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        this.extractTypeInfo(node, semanticContext);
      }

      ts.forEachChild(node, visitNode);
    };

    visitNode(sourceFile);
    return semanticContext;
  }

  private extractImportInfo(node: ts.ImportDeclaration, context: SemanticContext) {
    const moduleSpecifier = node.moduleSpecifier.getText().slice(1, -1);
    const namedImports: string[] = [];

    if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      node.importClause.namedBindings.elements.forEach(element => {
        namedImports.push(element.name.text);
      });
    }

    if (node.importClause?.name) {
      namedImports.push(node.importClause.name.text);
    }

    context.imports.set(moduleSpecifier, namedImports);
  }

  private extractExportInfo(node: ts.ExportDeclaration, context: SemanticContext) {
    const moduleSpecifier = node.moduleSpecifier?.getText().slice(1, -1) || '';
    const namedExports: string[] = [];

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        namedExports.push(element.name.text);
      });
    }

    context.exports.set(moduleSpecifier, namedExports);
  }

  private extractComponentInfo(node: ts.Node, context: SemanticContext, typeChecker: ts.TypeChecker) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const componentName = node.name.text;
      if (this.isReactComponent(node)) {
        const componentInfo: ComponentInfo = {
          name: componentName,
          props: this.extractProps(node),
          children: this.hasChildren(node),
          hooks: this.extractHooks(node),
          imports: [],
          exports: []
        };
        context.components.set(componentName, componentInfo);
      }
    }
  }

  private isReactComponent(node: ts.FunctionDeclaration): boolean {
    // Check if function returns JSX or has React component patterns
    const returnType = node.type;
    if (returnType && ts.isTypeReferenceNode(returnType)) {
      return returnType.typeName.getText() === 'JSX.Element' || 
             returnType.typeName.getText() === 'ReactElement';
    }
    return false;
  }

  private extractProps(node: ts.FunctionDeclaration): string[] {
    const props: string[] = [];
    if (node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isParameter(firstParam) && firstParam.type && ts.isTypeReferenceNode(firstParam.type)) {
        // Extract prop names from type reference
        const typeName = firstParam.type.typeName.getText();
        // This would need more sophisticated type analysis
        props.push(typeName);
      }
    }
    return props;
  }

  private hasChildren(node: ts.FunctionDeclaration): boolean {
    // Check if component uses children prop
    const childrenPattern = /children/i;
    return childrenPattern.test(node.getText());
  }

  private extractHooks(node: ts.FunctionDeclaration): string[] {
    const hooks: string[] = [];
    const hookPattern = /use[A-Z][a-zA-Z]*/g;
    const text = node.getText();
    const matches = text.match(hookPattern);
    if (matches) {
      hooks.push(...matches);
    }
    return hooks;
  }

  private extractTypeInfo(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, context: SemanticContext) {
    const typeName = node.name.text;
    const typeInfo: TypeInfo = {
      name: typeName,
      definition: node.getText(),
      usage: []
    };
    context.types.set(typeName, typeInfo);
  }

  get(filename: string): ASTContext | undefined {
    return this.contexts.get(filename);
  }

  getSemanticContext(filename: string): SemanticContext | undefined {
    return this.semanticContexts.get(filename);
  }

  isInitialized(): boolean {
    return this.contexts.size > 0;
  }

  clear(): void {
    this.contexts.clear();
    this.semanticContexts.clear();
  }
} 