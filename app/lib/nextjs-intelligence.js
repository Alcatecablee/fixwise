/**
 * Next.js App Router Intelligence for NeuroLint Pro
 *
 * Provides framework-specific optimizations and transformations for Next.js 13+ App Router
 * Integrates with Enhanced AST Engine for semantic understanding
 *
 * Follows IMPLEMENTATION_PATTERNS.md for safe transformations
 */

const t = require("@babel/types");
const traverse = require("@babel/traverse").default;

/**
 * Next.js Framework Intelligence System
 * Provides intelligent transformations specific to Next.js App Router patterns
 */
class NextJSIntelligence {
  constructor(astEngine) {
    this.astEngine = astEngine;
    this.appRouterPatterns = this.initializeAppRouterPatterns();
    this.serverComponentPatterns = this.initializeServerComponentPatterns();
    this.clientComponentPatterns = this.initializeClientComponentPatterns();
  }

  /**
   * Initialize Next.js App Router patterns for intelligent detection
   */
  initializeAppRouterPatterns() {
    return {
      // File-based routing patterns
      layoutFiles: ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"],
      pageFiles: ["page.tsx", "page.ts", "page.jsx", "page.js"],
      loadingFiles: ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"],
      errorFiles: ["error.tsx", "error.ts", "error.jsx", "error.js"],
      notFoundFiles: [
        "not-found.tsx",
        "not-found.ts",
        "not-found.jsx",
        "not-found.js",
      ],
      templateFiles: [
        "template.tsx",
        "template.ts",
        "template.jsx",
        "template.js",
      ],

      // API route patterns
      routeFiles: ["route.ts", "route.js"],

      // Special app directory files
      globalErrorFiles: ["global-error.tsx", "global-error.ts"],

      // Reserved file names that should be avoided
      reservedNames: ["middleware", "instrumentation", "_app", "_document"],
    };
  }

  /**
   * Initialize Server Component patterns
   */
  initializeServerComponentPatterns() {
    return {
      // Server-only APIs and imports
      serverOnlyAPIs: [
        "fs",
        "path",
        "crypto",
        "os",
        "process.env",
        "import.meta.env",
      ],

      // Database and server-side libraries
      serverLibraries: [
        "prisma",
        "mongoose",
        "pg",
        "mysql2",
        "redis",
        "nodemailer",
        "stripe",
        "server-only",
      ],

      // Server Component indicators
      serverIndicators: [
        "async function",
        "await fetch",
        "cookies()",
        "headers()",
        "notFound()",
        "redirect()",
      ],
    };
  }

  /**
   * Initialize Client Component patterns
   */
  initializeClientComponentPatterns() {
    return {
      // Browser-only APIs
      browserAPIs: [
        "window",
        "document",
        "localStorage",
        "sessionStorage",
        "navigator",
        "location",
        "history",
      ],

      // Client-side hooks and features
      clientHooks: [
        "useState",
        "useEffect",
        "useLayoutEffect",
        "useReducer",
        "useCallback",
        "useMemo",
        "useRef",
        "useImperativeHandle",
        "useDebugValue",
        "useId",
        "useDeferredValue",
        "useTransition",
        "useSyncExternalStore",
      ],

      // Event handlers that require client-side execution
      eventHandlers: [
        "onClick",
        "onChange",
        "onSubmit",
        "onFocus",
        "onBlur",
        "onMouseOver",
        "onMouseOut",
        "onKeyDown",
        "onKeyUp",
        "onScroll",
      ],

      // Client-side libraries
      clientLibraries: [
        "client-only",
        "framer-motion",
        "react-spring",
        "react-transition-group",
      ],
    };
  }

  /**
   * Analyze component and determine if it needs 'use client' directive
   */
  analyzeClientDirectiveNeeds(ast, context) {
    const transformations = [];
    let needsClient = false;
    let reasons = [];
    let confidence = 0;

    traverse(ast, {
      Program(path) {
        // Check if already has 'use client' directive
        const hasClientDirective = path.node.directives.some(
          (directive) => directive.value.value === "use client",
        );

        if (hasClientDirective) {
          return; // Already marked as client component
        }

        // Analyze for client-side requirements
        const clientAnalysis = this.analyzeClientRequirements(path, context);

        if (clientAnalysis.needsClient) {
          transformations.push({
            type: "add-use-client-directive",
            reasons: clientAnalysis.reasons,
            confidence: clientAnalysis.confidence,
            location: { line: 1, column: 0 },
            action: () => this.addUseClientDirective(path),
          });
        }
      },
    });

    return transformations;
  }

  /**
   * Analyze client-side requirements in the AST
   */
  analyzeClientRequirements(programPath, context) {
    let needsClient = false;
    const reasons = [];
    let confidence = 0;

    traverse(programPath.node, {
      // Check for React hooks
      CallExpression: (path) => {
        if (t.isIdentifier(path.node.callee)) {
          const hookName = path.node.callee.name;
          if (this.clientComponentPatterns.clientHooks.includes(hookName)) {
            needsClient = true;
            reasons.push(`Uses React hook: ${hookName}`);
            confidence += 0.9;
          }
        }
      },

      // Check for browser APIs
      MemberExpression: (path) => {
        if (t.isIdentifier(path.node.object)) {
          const objectName = path.node.object.name;
          if (this.clientComponentPatterns.browserAPIs.includes(objectName)) {
            needsClient = true;
            reasons.push(`Uses browser API: ${objectName}`);
            confidence += 0.8;
          }
        }
      },

      // Check for event handlers in JSX
      JSXAttribute: (path) => {
        if (t.isJSXIdentifier(path.node.name)) {
          const attrName = path.node.name.name;
          if (this.clientComponentPatterns.eventHandlers.includes(attrName)) {
            needsClient = true;
            reasons.push(`Uses event handler: ${attrName}`);
            confidence += 0.7;
          }
        }
      },

      // Check for client-only imports
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        if (
          this.clientComponentPatterns.clientLibraries.some((lib) =>
            source.includes(lib),
          )
        ) {
          needsClient = true;
          reasons.push(`Imports client-only library: ${source}`);
          confidence += 0.9;
        }
      },
    });

    return {
      needsClient,
      reasons,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Optimize Server Components for performance
   */
  optimizeServerComponents(ast, context) {
    const transformations = [];

    traverse(ast, {
      // Optimize async data fetching
      FunctionDeclaration: (path) => {
        if (this.isServerComponent(path, context)) {
          const optimizations = this.analyzeServerComponentOptimizations(path);
          transformations.push(...optimizations);
        }
      },

      // Optimize imports for server components
      ImportDeclaration: (path) => {
        const serverOptimizations = this.optimizeServerImports(path);
        transformations.push(...serverOptimizations);
      },
    });

    return transformations;
  }

  /**
   * Fix SSR hydration issues
   */
  fixSSRHydrationIssues(ast, context) {
    const transformations = [];

    traverse(ast, {
      // Fix unguarded browser API usage
      MemberExpression: (path) => {
        if (this.isBrowserAPIUsage(path) && !this.hasSSRGuard(path)) {
          transformations.push({
            type: "add-ssr-guard",
            browserAPI: this.getBrowserAPIName(path),
            location: path.node.loc,
            action: () => this.addSSRGuard(path),
          });
        }
      },

      // Fix localStorage/sessionStorage usage
      CallExpression: (path) => {
        if (this.isStorageAPIUsage(path) && !this.hasSSRGuard(path)) {
          transformations.push({
            type: "wrap-storage-access",
            storageType: this.getStorageType(path),
            location: path.node.loc,
            action: () => this.wrapStorageAccess(path),
          });
        }
      },
    });

    return transformations;
  }

  /**
   * Optimize App Router file structure
   */
  optimizeAppRouterStructure(ast, context) {
    const transformations = [];
    const filename = context.filename;

    // Check if file follows App Router conventions
    if (this.isAppRouterFile(filename)) {
      const structureOptimizations = this.analyzeAppRouterFileStructure(
        ast,
        filename,
      );
      transformations.push(...structureOptimizations);
    }

    return transformations;
  }

  /**
   * Enhanced metadata optimization for App Router
   */
  optimizeMetadata(ast, context) {
    const transformations = [];

    if (this.isLayoutOrPageFile(context.filename)) {
      const metadataAnalysis = this.analyzeMetadataUsage(ast);

      if (metadataAnalysis.canOptimize) {
        transformations.push({
          type: "optimize-metadata",
          suggestions: metadataAnalysis.suggestions,
          location: metadataAnalysis.location,
          action: () => this.optimizeMetadataExport(ast, metadataAnalysis),
        });
      }
    }

    return transformations;
  }

  /**
   * Implementation methods
   */

  addUseClientDirective(programPath) {
    const directive = t.directive(t.directiveLiteral("use client"));
    programPath.node.directives.unshift(directive);
  }

  isServerComponent(path, context) {
    // Server components are default in App Router unless marked with 'use client'
    const hasClientDirective = this.hasClientDirective(context);
    const usesServerAPIs = this.usesServerAPIs(path);

    return !hasClientDirective || usesServerAPIs;
  }

  hasClientDirective(context) {
    return (
      context.directives &&
      context.directives.some((directive) => directive.value === "use client")
    );
  }

  usesServerAPIs(path) {
    let usesServer = false;

    traverse(path.node, {
      ImportDeclaration: (importPath) => {
        const source = importPath.node.source.value;
        if (
          this.serverComponentPatterns.serverLibraries.some((lib) =>
            source.includes(lib),
          )
        ) {
          usesServer = true;
        }
      },

      MemberExpression: (memberPath) => {
        const objectName = memberPath.node.object.name;
        if (this.serverComponentPatterns.serverOnlyAPIs.includes(objectName)) {
          usesServer = true;
        }
      },
    });

    return usesServer;
  }

  analyzeServerComponentOptimizations(path) {
    const optimizations = [];

    // Check for inefficient data fetching patterns
    traverse(path.node, {
      CallExpression: (callPath) => {
        if (this.isDataFetchingCall(callPath)) {
          const optimization = this.optimizeDataFetching(callPath);
          if (optimization) {
            optimizations.push(optimization);
          }
        }
      },
    });

    return optimizations;
  }

  isDataFetchingCall(path) {
    return (
      t.isIdentifier(path.node.callee, { name: "fetch" }) ||
      (t.isMemberExpression(path.node.callee) &&
        path.node.callee.property.name === "findMany") ||
      (t.isMemberExpression(path.node.callee) &&
        path.node.callee.property.name === "query")
    );
  }

  optimizeDataFetching(path) {
    // Suggest caching for fetch calls
    if (t.isIdentifier(path.node.callee, { name: "fetch" })) {
      return {
        type: "add-fetch-caching",
        location: path.node.loc,
        suggestion: "Add cache option to fetch call",
        action: () => this.addFetchCaching(path),
      };
    }
    return null;
  }

  addFetchCaching(path) {
    const args = path.node.arguments;
    if (args.length === 1) {
      // Add options object with cache
      const cacheOptions = t.objectExpression([
        t.objectProperty(t.identifier("cache"), t.stringLiteral("force-cache")),
      ]);
      args.push(cacheOptions);
    } else if (args.length === 2 && t.isObjectExpression(args[1])) {
      // Add cache property to existing options
      const cacheProperty = t.objectProperty(
        t.identifier("cache"),
        t.stringLiteral("force-cache"),
      );
      args[1].properties.push(cacheProperty);
    }
  }

  isBrowserAPIUsage(path) {
    if (t.isIdentifier(path.node.object)) {
      return this.clientComponentPatterns.browserAPIs.includes(
        path.node.object.name,
      );
    }
    return false;
  }

  getBrowserAPIName(path) {
    return path.node.object.name;
  }

  hasSSRGuard(path) {
    // Check if wrapped in typeof window !== 'undefined' check
    let current = path.parent;
    while (current) {
      if (
        t.isBinaryExpression(current) &&
        current.operator === "!==" &&
        t.isUnaryExpression(current.left) &&
        current.left.operator === "typeof" &&
        t.isIdentifier(current.left.argument, { name: "window" })
      ) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  addSSRGuard(path) {
    const guard = t.logicalExpression(
      "&&",
      t.binaryExpression(
        "!==",
        t.unaryExpression("typeof", t.identifier("window")),
        t.stringLiteral("undefined"),
      ),
      path.node,
    );

    path.replaceWith(guard);
  }

  isStorageAPIUsage(path) {
    return (
      t.isMemberExpression(path.node.callee) &&
      (t.isIdentifier(path.node.callee.object, { name: "localStorage" }) ||
        t.isIdentifier(path.node.callee.object, { name: "sessionStorage" }))
    );
  }

  getStorageType(path) {
    return path.node.callee.object.name;
  }

  wrapStorageAccess(path) {
    const storageAccess = path.node;
    const safeAccess = t.conditionalExpression(
      t.binaryExpression(
        "!==",
        t.unaryExpression("typeof", t.identifier("window")),
        t.stringLiteral("undefined"),
      ),
      storageAccess,
      t.nullLiteral(),
    );

    path.replaceWith(safeAccess);
  }

  isAppRouterFile(filename) {
    const basename = filename.split("/").pop() || "";
    return (
      this.appRouterPatterns.layoutFiles.includes(basename) ||
      this.appRouterPatterns.pageFiles.includes(basename) ||
      this.appRouterPatterns.loadingFiles.includes(basename) ||
      this.appRouterPatterns.errorFiles.includes(basename) ||
      this.appRouterPatterns.routeFiles.includes(basename)
    );
  }

  isLayoutOrPageFile(filename) {
    const basename = filename.split("/").pop() || "";
    return (
      this.appRouterPatterns.layoutFiles.includes(basename) ||
      this.appRouterPatterns.pageFiles.includes(basename)
    );
  }

  analyzeAppRouterFileStructure(ast, filename) {
    const optimizations = [];

    // Check for proper exports in App Router files
    if (this.isPageFile(filename)) {
      const hasDefaultExport = this.hasDefaultExport(ast);
      if (!hasDefaultExport) {
        optimizations.push({
          type: "add-default-export",
          file: filename,
          location: { line: 1, column: 0 },
          action: () => this.addDefaultPageExport(ast),
        });
      }
    }

    return optimizations;
  }

  analyzeMetadataUsage(ast) {
    let hasMetadataExport = false;
    let metadataLocation = null;
    const suggestions = [];

    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        if (
          path.node.declaration &&
          t.isVariableDeclaration(path.node.declaration)
        ) {
          const declarations = path.node.declaration.declarations;
          declarations.forEach((decl) => {
            if (t.isIdentifier(decl.id, { name: "metadata" })) {
              hasMetadataExport = true;
              metadataLocation = path.node.loc;
            }
          });
        }
      },
    });

    if (!hasMetadataExport) {
      suggestions.push("Add metadata export for SEO optimization");
    }

    return {
      canOptimize: suggestions.length > 0,
      hasMetadata: hasMetadataExport,
      suggestions,
      location: metadataLocation,
    };
  }

  optimizeMetadataExport(ast, analysis) {
    if (!analysis.hasMetadata) {
      // Add basic metadata export
      const metadataExport = this.createBasicMetadataExport();

      traverse(ast, {
        Program: (path) => {
          path.node.body.unshift(metadataExport);
        },
      });
    }
  }

  createBasicMetadataExport() {
    return t.exportNamedDeclaration(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("metadata"),
          t.objectExpression([
            t.objectProperty(
              t.identifier("title"),
              t.stringLiteral("Page Title"),
            ),
            t.objectProperty(
              t.identifier("description"),
              t.stringLiteral("Page description for SEO"),
            ),
          ]),
        ),
      ]),
    );
  }

  optimizeServerImports(path) {
    const optimizations = [];
    const source = path.node.source.value;

    // Suggest tree-shaking opportunities
    if (this.isLargeLibrary(source) && this.hasNamespaceImport(path)) {
      optimizations.push({
        type: "optimize-tree-shaking",
        library: source,
        location: path.node.loc,
        suggestion:
          "Use named imports instead of namespace import for better tree-shaking",
        action: () => this.convertToNamedImports(path),
      });
    }

    return optimizations;
  }

  isLargeLibrary(source) {
    const largeLibraries = ["lodash", "moment", "rxjs", "antd"];
    return largeLibraries.some((lib) => source.includes(lib));
  }

  hasNamespaceImport(path) {
    return path.node.specifiers.some((spec) =>
      t.isImportNamespaceSpecifier(spec),
    );
  }

  convertToNamedImports(path) {
    // This would require more sophisticated analysis to determine which functions are actually used
    // For now, just add a comment suggesting manual optimization
    path.addComment(
      "leading",
      " TODO: Consider using named imports for better tree-shaking",
    );
  }

  hasDefaultExport(ast) {
    let hasDefault = false;
    traverse(ast, {
      ExportDefaultDeclaration: () => {
        hasDefault = true;
      },
    });
    return hasDefault;
  }

  isPageFile(filename) {
    const basename = filename.split("/").pop() || "";
    return this.appRouterPatterns.pageFiles.includes(basename);
  }

  addDefaultPageExport(ast) {
    const defaultExport = t.exportDefaultDeclaration(
      t.functionDeclaration(
        t.identifier("Page"),
        [],
        t.blockStatement([
          t.returnStatement(
            t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier("div"), []),
              t.jsxClosingElement(t.jsxIdentifier("div")),
              [t.jsxText("Page content")],
              false,
            ),
          ),
        ]),
      ),
    );

    traverse(ast, {
      Program: (path) => {
        path.node.body.push(defaultExport);
      },
    });
  }
}

module.exports = { NextJSIntelligence };
