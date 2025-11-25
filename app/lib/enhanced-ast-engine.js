/**
 * Enhanced AST Transformation Engine for NeuroLint Pro
 *
 * Implements sophisticated semantic analysis and type-aware transformations
 * while maintaining compatibility with existing IMPLEMENTATION_PATTERNS.md
 *
 * CRITICAL: Follows Safe Layer Execution Pattern and Incremental Validation System
 */

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const {
  memoryManager,
  performanceMonitor,
  resourcePool,
} = require("./memory-manager");

/**
 * Enhanced AST Transformation Engine
 * Provides semantic code understanding beyond pattern matching
 */
class EnhancedASTEngine {
  constructor(options = {}) {
    this.options = {
      preserveComments: true,
      retainLines: true,
      plugins: ["typescript", "jsx", "decorators-legacy"],
      sourceType: "module",
      allowImportExportEverywhere: true,
      strictMode: false,
      ...options,
    };

    // Track transformations for validation
    this.transformationLog = [];
    this.semanticContext = new Map();
    this.errorLog = [];
  }

  /**
   * Parse code to AST with comprehensive error handling
   * Follows IMPLEMENTATION_PATTERNS.md AST vs Regex Fallback Strategy
   */
  parseCode(code, filename = "unknown.tsx") {
    try {
      // Input validation
      if (!code || typeof code !== "string") {
        throw new Error("Invalid code input: must be a non-empty string");
      }

      if (code.length > 1000000) {
        // 1MB limit
        throw new Error("Code too large for AST parsing (>1MB)");
      }

      console.log(`[AST ENGINE] Parsing ${filename}...`);

      const ast = parser.parse(code, this.options);

      // Build semantic context with error handling
      this.buildSemanticContext(ast, filename);

      return {
        success: true,
        ast,
        originalCode: code,
        filename,
      };
    } catch (error) {
      console.warn(`[AST ENGINE] Parse failed for ${filename}:`, error.message);
      this.errorLog.push({
        type: "parse-error",
        filename,
        error: error.message,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error.message,
        fallbackToRegex: true,
        originalCode: code,
        filename,
      };
    }
  }

  /**
   * Build semantic context from AST with comprehensive error handling
   */
  buildSemanticContext(ast, filename) {
    const context = {
      filename,
      imports: new Map(),
      exports: new Map(),
      components: new Map(),
      hooks: new Map(),
      types: new Map(),
      stateVariables: new Set(),
      props: new Map(),
      dependencies: new Set(),
    };

    try {
      traverse(ast, {
        // Track imports with error handling
        ImportDeclaration: (path) => {
          try {
            const source = path.node.source?.value;
            if (!source) return;

            const specifiers =
              path.node.specifiers
                ?.map((spec) => {
                  if (t.isImportDefaultSpecifier(spec)) {
                    return { type: "default", name: spec.local?.name };
                  } else if (t.isImportSpecifier(spec)) {
                    return {
                      type: "named",
                      name: spec.local?.name,
                      imported: spec.imported?.name || spec.local?.name,
                    };
                  } else if (t.isImportNamespaceSpecifier(spec)) {
                    return { type: "namespace", name: spec.local?.name };
                  }
                  return null;
                })
                .filter(Boolean) || [];

            context.imports.set(source, specifiers);

            // Track framework dependencies
            if (source.includes("react") || source.includes("next")) {
              context.dependencies.add(source);
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing import:`,
              error.message,
            );
          }
        },

        // Track React components with error handling
        FunctionDeclaration: (path) => {
          try {
            if (this.isReactComponent(path)) {
              const componentName = path.node.id?.name;
              if (componentName) {
                context.components.set(componentName, {
                  type: "function",
                  params: path.node.params || [],
                  hasHooks: this.findHooks(path),
                  propsType: this.inferPropsType(path),
                  isExported: this.isExported(path),
                });
              }
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing function component:`,
              error.message,
            );
          }
        },

        // Track React functional components (arrow functions)
        VariableDeclarator: (path) => {
          try {
            if (this.isReactComponentVariable(path)) {
              const componentName = path.node.id?.name;
              if (componentName) {
                context.components.set(componentName, {
                  type: "arrow",
                  hasHooks: this.findHooks(path),
                  propsType: this.inferPropsType(path),
                  isExported: this.isExported(path.parent),
                });
              }
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing arrow component:`,
              error.message,
            );
          }
        },

        // Track React hooks usage with error handling
        CallExpression: (path) => {
          try {
            if (this.isHookCall(path)) {
              const hookName = path.node.callee?.name;
              if (hookName) {
                if (!context.hooks.has(hookName)) {
                  context.hooks.set(hookName, []);
                }
                context.hooks.get(hookName).push({
                  arguments: path.node.arguments || [],
                  location: path.node.loc,
                });

                // Track state variables from useState
                if (
                  hookName === "useState" &&
                  t.isArrayPattern(path.parent?.id)
                ) {
                  const stateVar = path.parent.id.elements?.[0];
                  if (t.isIdentifier(stateVar)) {
                    context.stateVariables.add(stateVar.name);
                  }
                }
              }
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing hook call:`,
              error.message,
            );
          }
        },

        // Track TypeScript interfaces and types with error handling
        TSInterfaceDeclaration: (path) => {
          try {
            const interfaceName = path.node.id?.name;
            if (interfaceName) {
              context.types.set(interfaceName, {
                type: "interface",
                properties: path.node.body?.body || [],
                exported: this.isExported(path),
              });
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing interface:`,
              error.message,
            );
          }
        },

        TSTypeAliasDeclaration: (path) => {
          try {
            const typeName = path.node.id?.name;
            if (typeName) {
              context.types.set(typeName, {
                type: "alias",
                typeAnnotation: path.node.typeAnnotation,
                exported: this.isExported(path),
              });
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing type alias:`,
              error.message,
            );
          }
        },
      });

      this.semanticContext.set(filename, context);
      return context;
    } catch (error) {
      console.error(
        `[AST ENGINE] Critical error building semantic context:`,
        error.message,
      );
      this.errorLog.push({
        type: "context-build-error",
        filename,
        error: error.message,
        timestamp: Date.now(),
      });

      // Return minimal context to prevent crashes
      this.semanticContext.set(filename, context);
      return context;
    }
  }

  /**
   * Transform missing key props with enhanced error handling
   */
  transformMissingKeys(ast, context) {
    const transformations = [];

    try {
      traverse(ast, {
        CallExpression: (path) => {
          try {
            // Find .map() calls that render JSX without keys
            if (
              t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.property, { name: "map" })
            ) {
              const mapCallback = path.node.arguments?.[0];
              if (
                mapCallback &&
                (t.isArrowFunctionExpression(mapCallback) ||
                  t.isFunctionExpression(mapCallback))
              ) {
                // Check if callback returns JSX
                const body = mapCallback.body;
                let jsxElement = null;

                if (t.isJSXElement(body) || t.isJSXFragment(body)) {
                  jsxElement = body;
                } else if (t.isBlockStatement(body)) {
                  // Look for return statement with JSX
                  for (const stmt of body.body) {
                    if (
                      t.isReturnStatement(stmt) &&
                      (t.isJSXElement(stmt.argument) ||
                        t.isJSXFragment(stmt.argument))
                    ) {
                      jsxElement = stmt.argument;
                      break;
                    }
                  }
                }

                if (jsxElement && !this.hasKeyProp(jsxElement)) {
                  // Analyze the array data structure to suggest appropriate key
                  const keyPattern = this.suggestKeyPattern(
                    path,
                    mapCallback,
                    context,
                  );

                  transformations.push({
                    type: "missing-key",
                    location: jsxElement.loc,
                    element: jsxElement,
                    suggestedKey: keyPattern,
                    confidence: keyPattern.confidence,
                    action: () =>
                      this.addKeyProp(jsxElement, keyPattern.expression),
                  });
                }
              }
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error in map transformation:`,
              error.message,
            );
          }
        },
      });
    } catch (error) {
      console.error(
        `[AST ENGINE] Critical error in transformMissingKeys:`,
        error.message,
      );
    }

    return transformations;
  }

  /**
   * Generate transformed code with comprehensive error handling
   */
  generateCode(ast, originalCode) {
    try {
      // Validate AST before generation
      if (!ast || typeof ast !== "object") {
        throw new Error("Invalid AST provided for code generation");
      }

      const result = generate(ast, {
        retainLines: this.options.retainLines,
        comments: this.options.preserveComments,
        compact: false,
      });

      // Validate generated code
      if (!result.code || typeof result.code !== "string") {
        throw new Error("Code generation produced invalid output");
      }

      return {
        success: true,
        code: result.code,
        map: result.map,
      };
    } catch (error) {
      console.error("[AST ENGINE] Code generation failed:", error.message);
      this.errorLog.push({
        type: "code-generation-error",
        error: error.message,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error.message,
        fallbackCode: originalCode,
      };
    }
  }

  /**
   * Enhanced import optimization with better error handling
   */
  transformImports(ast, context) {
    const transformations = [];

    try {
      const usedImports = new Set();

      // First pass: find all identifier usage with error handling
      traverse(ast, {
        Identifier: (path) => {
          try {
            // Skip if it's part of an import declaration
            if (
              t.isImportSpecifier(path.parent) ||
              t.isImportDefaultSpecifier(path.parent)
            ) {
              return;
            }
            if (path.node.name) {
              usedImports.add(path.node.name);
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error analyzing identifier usage:`,
              error.message,
            );
          }
        },
      });

      // Second pass: check import usage with error handling
      traverse(ast, {
        ImportDeclaration: (path) => {
          try {
            const source = path.node.source?.value;
            if (!source) return;

            const unusedSpecifiers = [];

            path.node.specifiers?.forEach((spec) => {
              const localName = spec.local?.name;

              if (localName && !usedImports.has(localName)) {
                // Check for special cases
                if (
                  !this.isSideEffectImport(source) &&
                  !this.isTypeOnlyImport(spec)
                ) {
                  unusedSpecifiers.push(spec);
                }
              }
            });

            if (unusedSpecifiers.length > 0) {
              if (unusedSpecifiers.length === path.node.specifiers.length) {
                // Remove entire import
                transformations.push({
                  type: "remove-import",
                  location: path.node.loc,
                  source,
                  action: () => path.remove(),
                });
              } else {
                // Remove only unused specifiers
                transformations.push({
                  type: "clean-import",
                  location: path.node.loc,
                  source,
                  unusedSpecifiers,
                  action: () => {
                    path.node.specifiers = path.node.specifiers.filter(
                      (spec) => !unusedSpecifiers.includes(spec),
                    );
                  },
                });
              }
            }
          } catch (error) {
            console.warn(
              `[AST ENGINE] Error processing import declaration:`,
              error.message,
            );
          }
        },
      });
    } catch (error) {
      console.error(
        `[AST ENGINE] Critical error in transformImports:`,
        error.message,
      );
    }

    return transformations;
  }

  // Enhanced helper methods with better error handling

  isReactComponent(path) {
    try {
      if (!path.node.id?.name) return false;

      const name = path.node.id.name;
      // React components start with uppercase
      if (!/^[A-Z]/.test(name)) return false;

      // Check if function returns JSX
      let hasJSXReturn = false;
      traverse(path.node, {
        ReturnStatement: (returnPath) => {
          if (
            t.isJSXElement(returnPath.node.argument) ||
            t.isJSXFragment(returnPath.node.argument)
          ) {
            hasJSXReturn = true;
          }
        },
      });

      return hasJSXReturn;
    } catch (error) {
      console.warn(
        `[AST ENGINE] Error checking React component:`,
        error.message,
      );
      return false;
    }
  }

  isReactComponentVariable(path) {
    try {
      if (!t.isIdentifier(path.node.id)) return false;

      const name = path.node.id.name;
      if (!/^[A-Z]/.test(name)) return false;

      // Check if assigned function returns JSX
      const init = path.node.init;
      if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
        return this.containsJSX(init.body);
      }

      return false;
    } catch (error) {
      console.warn(
        `[AST ENGINE] Error checking React component variable:`,
        error.message,
      );
      return false;
    }
  }

  isHookCall(path) {
    try {
      return (
        t.isIdentifier(path.node.callee) &&
        path.node.callee.name?.startsWith("use") &&
        path.node.callee.name.length > 3
      );
    } catch (error) {
      return false;
    }
  }

  hasKeyProp(jsxElement) {
    try {
      if (!t.isJSXElement(jsxElement)) return false;

      return (
        jsxElement.openingElement?.attributes?.some(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name, { name: "key" }),
        ) || false
      );
    } catch (error) {
      return false;
    }
  }

  suggestKeyPattern(path, callback, context) {
    try {
      const itemParam = callback.params?.[0];
      const indexParam = callback.params?.[1];

      if (!itemParam) {
        return {
          expression: "index",
          confidence: 0.3,
          reason: "No item parameter found",
        };
      }

      const itemName = itemParam.name;

      let confidence = 0.5;
      let keyExpression = "index";
      let reason = "Default index fallback";

      // Check for common ID patterns with error handling
      if (this.hasProperty(callback.body, itemName, "id")) {
        keyExpression = `${itemName}.id`;
        confidence = 0.9;
        reason = "Found id property";
      } else if (this.hasProperty(callback.body, itemName, "key")) {
        keyExpression = `${itemName}.key`;
        confidence = 0.9;
        reason = "Found key property";
      } else if (this.hasProperty(callback.body, itemName, "uuid")) {
        keyExpression = `${itemName}.uuid`;
        confidence = 0.8;
        reason = "Found uuid property";
      } else if (indexParam) {
        keyExpression = indexParam.name;
        confidence = 0.4;
        reason = "Using index parameter";
      }

      return {
        expression: keyExpression,
        confidence,
        reason,
      };
    } catch (error) {
      console.warn(`[AST ENGINE] Error suggesting key pattern:`, error.message);
      return {
        expression: "index",
        confidence: 0.3,
        reason: "Error in analysis, using safe fallback",
      };
    }
  }

  hasProperty(node, objectName, propertyName) {
    try {
      let found = false;

      traverse(node, {
        MemberExpression: (path) => {
          if (
            t.isIdentifier(path.node.object, { name: objectName }) &&
            t.isIdentifier(path.node.property, { name: propertyName })
          ) {
            found = true;
          }
        },
      });

      return found;
    } catch (error) {
      return false;
    }
  }

  addKeyProp(jsxElement, keyExpression) {
    try {
      const keyAttr = t.jsxAttribute(
        t.jsxIdentifier("key"),
        t.jsxExpressionContainer(t.identifier(keyExpression)),
      );

      if (jsxElement.openingElement?.attributes) {
        jsxElement.openingElement.attributes.unshift(keyAttr);
      }
    } catch (error) {
      console.warn(`[AST ENGINE] Error adding key prop:`, error.message);
    }
  }

  containsJSX(node) {
    try {
      let hasJSX = false;
      traverse(node, {
        JSXElement: () => {
          hasJSX = true;
        },
        JSXFragment: () => {
          hasJSX = true;
        },
      });
      return hasJSX;
    } catch (error) {
      return false;
    }
  }

  isExported(path) {
    try {
      return (
        t.isExportDefaultDeclaration(path.parent) ||
        t.isExportNamedDeclaration(path.parent)
      );
    } catch (error) {
      return false;
    }
  }

  isSideEffectImport(source) {
    try {
      return (
        [".css", ".scss", ".sass", ".less"].some((ext) =>
          source.endsWith(ext),
        ) || source.includes("polyfill")
      );
    } catch (error) {
      return false;
    }
  }

  isTypeOnlyImport(spec) {
    try {
      return spec.importKind === "type";
    } catch (error) {
      return false;
    }
  }

  // Placeholder methods for future implementation
  findHooks(path) {
    return new Set();
  }
  inferPropsType(path) {
    return null;
  }
  hasPropsType(path) {
    return false;
  }
  inferComponentProps(path, context) {
    return [];
  }
  isKnownComponent(name, context) {
    return false;
  }
  suggestComponentOptimizations(path, context) {
    return [];
  }
  addPropsInterface(path, props) {}

  // Cleanup method to prevent memory leaks
  cleanup() {
    this.transformationLog = [];
    this.semanticContext.clear();
    this.errorLog = [];
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: this.errorLog.length,
      errorsByType: this.errorLog.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {}),
      recentErrors: this.errorLog.slice(-10),
    };
  }
}

module.exports = { EnhancedASTEngine };
