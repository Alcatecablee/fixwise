/**
 * Next.js Intelligence for NeuroLint Pro
 * Provides Next.js-specific code analysis and transformations
 */

import * as ts from 'typescript';

interface NextJSContext {
  isAppRouter: boolean;
  isPagesRouter: boolean;
  hasServerComponents: boolean;
  hasClientComponents: boolean;
  routingPattern: 'app' | 'pages' | 'mixed';
}

interface NextJSTransformResult {
  success: boolean;
  code: string;
  changes: number;
  warnings: string[];
  recommendations: string[];
}

export class NextJSIntelligence {
  private astEngine: any;

  constructor(astEngine: any) {
    this.astEngine = astEngine;
  }

  /**
   * Analyze Next.js patterns and provide recommendations
   */
  analyzeNextJSPatterns(sourceCode: string, filename: string): NextJSTransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          warnings: ['AST context not available'],
          recommendations: []
        };
      }

      const nextJSContext = this.detectNextJSContext(filename, context.ast);
      const recommendations = this.generateRecommendations(nextJSContext, context.ast);
      const warnings = this.detectWarnings(nextJSContext, context.ast);

      return {
        success: true,
        code: sourceCode,
        changes: 0,
        warnings,
        recommendations
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        recommendations: []
      };
    }
  }

  /**
   * Transform Pages Router patterns to App Router
   */
  transformToAppRouter(sourceCode: string, filename: string): NextJSTransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          warnings: ['AST context not available'],
          recommendations: []
        };
      }

      let changes = 0;
      let transformedCode = sourceCode;
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Transform getServerSideProps to Server Components
      const serverSideProps = this.findGetServerSideProps(context.ast);
      for (const prop of serverSideProps) {
        try {
          const result = this.transformGetServerSideProps(prop, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, prop, result.code);
            changes += result.changes;
          } else {
            warnings.push(...result.errors);
          }
        } catch (error) {
          warnings.push(`Failed to transform getServerSideProps: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Transform getStaticProps to Server Components
      const staticProps = this.findGetStaticProps(context.ast);
      for (const prop of staticProps) {
        try {
          const result = this.transformGetStaticProps(prop, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, prop, result.code);
            changes += result.changes;
          } else {
            warnings.push(...result.errors);
          }
        } catch (error) {
          warnings.push(`Failed to transform getStaticProps: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Transform API routes to App Router format
      const apiRoutes = this.findAPIRoutes(context.ast);
      for (const route of apiRoutes) {
        try {
          const result = this.transformAPIRoute(route, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, route, result.code);
            changes += result.changes;
          } else {
            warnings.push(...result.errors);
          }
        } catch (error) {
          warnings.push(`Failed to transform API route: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: changes > 0,
        code: transformedCode,
        changes,
        warnings,
        recommendations
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        recommendations: []
      };
    }
  }

  /**
   * Add proper client-side guards for hydration
   */
  addHydrationGuards(sourceCode: string, filename: string): NextJSTransformResult {
    try {
      const context = this.astEngine.get(filename);
      if (!context) {
        return {
          success: false,
          code: sourceCode,
          changes: 0,
          warnings: ['AST context not available'],
          recommendations: []
        };
      }

      let changes = 0;
      let transformedCode = sourceCode;
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Find browser API usage
      const browserAPIs = this.findBrowserAPIs(context.ast);
      for (const api of browserAPIs) {
        try {
          const result = this.addClientGuard(api, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, api, result.code);
            changes += result.changes;
          } else {
            warnings.push(...result.errors);
          }
        } catch (error) {
          warnings.push(`Failed to add client guard: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Find dynamic imports that need client-side handling
      const dynamicImports = this.findDynamicImports(context.ast);
      for (const dynamicImport of dynamicImports) {
        try {
          const result = this.addDynamicImportGuard(dynamicImport, context);
          if (result.success) {
            transformedCode = this.replaceInSource(transformedCode, dynamicImport, result.code);
            changes += result.changes;
          } else {
            warnings.push(...result.errors);
          }
        } catch (error) {
          warnings.push(`Failed to add dynamic import guard: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: changes > 0,
        code: transformedCode,
        changes,
        warnings,
        recommendations
      };
    } catch (error) {
      return {
        success: false,
        code: sourceCode,
        changes: 0,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        recommendations: []
      };
    }
  }

  private detectNextJSContext(filename: string, ast: ts.SourceFile): NextJSContext {
    const isAppRouter = filename.includes('/app/') || filename.includes('app/');
    const isPagesRouter = filename.includes('/pages/') || filename.includes('pages/');
    
    const hasServerComponents = this.hasServerComponentPatterns(ast);
    const hasClientComponents = this.hasClientComponentPatterns(ast);
    
    let routingPattern: 'app' | 'pages' | 'mixed' = 'mixed';
    if (isAppRouter && !isPagesRouter) routingPattern = 'app';
    else if (isPagesRouter && !isAppRouter) routingPattern = 'pages';

    return {
      isAppRouter,
      isPagesRouter,
      hasServerComponents,
      hasClientComponents,
      routingPattern
    };
  }

  private hasServerComponentPatterns(ast: ts.SourceFile): boolean {
    let hasServerPatterns = false;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        const text = node.getText();
        if (text.includes('getServerSideProps') || 
            text.includes('getStaticProps') ||
            text.includes('getStaticPaths')) {
          hasServerPatterns = true;
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return hasServerPatterns;
  }

  private hasClientComponentPatterns(ast: ts.SourceFile): boolean {
    let hasClientPatterns = false;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'useState') {
        hasClientPatterns = true;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return hasClientPatterns;
  }

  private generateRecommendations(context: NextJSContext, ast: ts.SourceFile): string[] {
    const recommendations: string[] = [];

    if (context.routingPattern === 'pages') {
      recommendations.push('Consider migrating to App Router for better performance and features');
    }

    if (context.hasServerComponents && context.hasClientComponents) {
      recommendations.push('Consider separating server and client components for better optimization');
    }

    if (this.hasLegacyDataFetching(ast)) {
      recommendations.push('Replace getServerSideProps/getStaticProps with Server Components');
    }

    if (this.hasLegacyAPIRoutes(ast)) {
      recommendations.push('Consider using Server Actions instead of API routes');
    }

    return recommendations;
  }

  private detectWarnings(context: NextJSContext, ast: ts.SourceFile): string[] {
    const warnings: string[] = [];

    if (this.hasHydrationIssues(ast)) {
      warnings.push('Potential hydration mismatch detected');
    }

    if (this.hasUnsafeBrowserAPIs(ast)) {
      warnings.push('Browser APIs used without proper client-side guards');
    }

    if (this.hasMixedServerClientLogic(ast)) {
      warnings.push('Server and client logic mixed in same component');
    }

    return warnings;
  }

  private findGetServerSideProps(ast: ts.SourceFile): ts.FunctionDeclaration[] {
    const functions: ts.FunctionDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.getText() === 'getServerSideProps') {
        functions.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return functions;
  }

  private findGetStaticProps(ast: ts.SourceFile): ts.FunctionDeclaration[] {
    const functions: ts.FunctionDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.getText() === 'getStaticProps') {
        functions.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return functions;
  }

  private findAPIRoutes(ast: ts.SourceFile): ts.FunctionDeclaration[] {
    const functions: ts.FunctionDeclaration[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && 
          (node.name?.getText() === 'handler' || 
           node.name?.getText().includes('API'))) {
        functions.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return functions;
  }

  private findBrowserAPIs(ast: ts.SourceFile): ts.CallExpression[] {
    const browserAPIs: ts.CallExpression[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const text = node.expression.getText();
        if (text.includes('window.') || 
            text.includes('document.') ||
            text.includes('localStorage.') ||
            text.includes('sessionStorage.')) {
          browserAPIs.push(node);
        }
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return browserAPIs;
  }

  private findDynamicImports(ast: ts.SourceFile): ts.CallExpression[] {
    const dynamicImports: ts.CallExpression[] = [];
    
    const visitNode = (node: ts.Node) => {
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'import') {
        dynamicImports.push(node);
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return dynamicImports;
  }

  private transformGetServerSideProps(node: ts.FunctionDeclaration, context: any): { success: boolean; code: string; changes: number; errors: string[] } {
    // Transform to async Server Component
    const componentName = this.extractComponentName(context.ast);
    const props = this.extractServerSideProps(node);
    
    const serverComponent = `async function ${componentName}() {
  // Server-side data fetching
  const data = await fetchData();
  
  return (
    <div>
      {/* Render with server-side data */}
    </div>
  );
}

export default ${componentName};`;

    return {
      success: true,
      code: serverComponent,
      changes: 1,
      errors: []
    };
  }

  private transformGetStaticProps(node: ts.FunctionDeclaration, context: any): { success: boolean; code: string; changes: number; errors: string[] } {
    // Similar to getServerSideProps but with caching
    const componentName = this.extractComponentName(context.ast);
    
    const serverComponent = `async function ${componentName}() {
  // Static data fetching with caching
  const data = await fetchData();
  
  return (
    <div>
      {/* Render with static data */}
    </div>
  );
}

export default ${componentName};`;

    return {
      success: true,
      code: serverComponent,
      changes: 1,
      errors: []
    };
  }

  private transformAPIRoute(node: ts.FunctionDeclaration, context: any): { success: boolean; code: string; changes: number; errors: string[] } {
    // Transform to Server Action
    const actionName = this.extractActionName(node);
    
    const serverAction = `'use server';

export async function ${actionName}(formData: FormData) {
  // Server action implementation
  const data = Object.fromEntries(formData);
  
  // Process data and return result
  return { success: true };
}`;

    return {
      success: true,
      code: serverAction,
      changes: 1,
      errors: []
    };
  }

  private addClientGuard(node: ts.CallExpression, context: any): { success: boolean; code: string; changes: number; errors: string[] } {
    const originalCode = node.getText();
    const guardedCode = `typeof window !== 'undefined' ? ${originalCode} : null`;
    
    return {
      success: true,
      code: guardedCode,
      changes: 1,
      errors: []
    };
  }

  private addDynamicImportGuard(node: ts.CallExpression, context: any): { success: boolean; code: string; changes: number; errors: string[] } {
    const originalCode = node.getText();
    const guardedCode = `typeof window !== 'undefined' ? ${originalCode} : Promise.resolve(null)`;
    
    return {
      success: true,
      code: guardedCode,
      changes: 1,
      errors: []
    };
  }

  private hasLegacyDataFetching(ast: ts.SourceFile): boolean {
    let hasLegacy = false;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && 
          (node.name?.getText() === 'getServerSideProps' || 
           node.name?.getText() === 'getStaticProps')) {
        hasLegacy = true;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return hasLegacy;
  }

  private hasLegacyAPIRoutes(ast: ts.SourceFile): boolean {
    let hasLegacy = false;
    
    const visitNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.getText() === 'handler') {
        hasLegacy = true;
      }
      ts.forEachChild(node, visitNode);
    };

    visitNode(ast);
    return hasLegacy;
  }

  private hasHydrationIssues(ast: ts.SourceFile): boolean {
    // Check for common hydration issues
    const text = ast.getText();
    return text.includes('useEffect') && 
           (text.includes('window.') || text.includes('document.'));
  }

  private hasUnsafeBrowserAPIs(ast: ts.SourceFile): boolean {
    const text = ast.getText();
    return text.includes('window.') || 
           text.includes('document.') ||
           text.includes('localStorage.') ||
           text.includes('sessionStorage.');
  }

  private hasMixedServerClientLogic(ast: ts.SourceFile): boolean {
    const text = ast.getText();
    return (text.includes('getServerSideProps') || text.includes('getStaticProps')) &&
           (text.includes('useState') || text.includes('useEffect'));
  }

  private extractComponentName(ast: ts.SourceFile): string {
    // Extract component name from file
    const filename = ast.fileName;
    const match = filename.match(/([^/\\]+)\.(tsx?|jsx?)$/);
    return match ? match[1] : 'Component';
  }

  private extractServerSideProps(node: ts.FunctionDeclaration): any {
    // Extract props from getServerSideProps return
    return {};
  }

  private extractActionName(node: ts.FunctionDeclaration): string {
    return node.name?.getText() || 'action';
  }

  private replaceInSource(sourceCode: string, node: ts.Node, replacement: string): string {
    const start = node.getStart();
    const end = node.getEnd();
    return sourceCode.slice(0, start) + replacement + sourceCode.slice(end);
  }
} 