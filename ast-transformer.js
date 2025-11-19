/**
 * AST-based Transformation Engine
 * Replaces regex-based transformations with proper code parsing and manipulation
 */

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

class ASTTransformer {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread'
      ]
    };
  }

  /**
   * Parse code into AST
   */
  parseCode(code, filename = 'unknown') {
    try {
      return parser.parse(code, {
        ...this.parserOptions,
        filename
      });
    } catch (error) {
      throw new Error(`Syntax error: ${error.message}`);
    }
  }

  /**
   * Generate code from AST
   */
  generateCode(ast, options = {}) {
    try {
      return generate(ast, {
        retainLines: true,
        retainFunctionParens: true,
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  /**
   * Transform code using AST visitors
   */
  transform(code, visitors, options = {}) {
    let ast;
    try {
      ast = this.parseCode(code, options.filename);
    } catch (error) {
      throw error;
    }
    const changes = [];

    traverse(ast, {
      ...visitors,
      // Track changes
      enter(path) {
        if (path.node._changed) {
          changes.push({
            type: path.node.type,
            location: path.node.loc,
            description: path.node._changeDescription
          });
        }
      }
    });

    const result = this.generateCode(ast, options);
    return {
      code: result.code,
      changes,
      ast
    };
  }

  /**
   * Layer 2: Pattern Fixes (AST-based)
   */
  transformPatterns(code, options = {}) {
    const changes = [];
    
    try {
      const visitors = {
        // Fix HTML entities in string literals
        StringLiteral(path) {
          const value = path.node.value;
          const originalValue = value;
          let newValue = value;

          // Replace HTML entities
          const entityMap = {
            '&quot;': '"',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&apos;': "'",
            '&nbsp;': ' '
          };

          let hasChanges = false;
          for (const [entity, replacement] of Object.entries(entityMap)) {
            if (newValue.includes(entity)) {
              newValue = newValue.replace(new RegExp(entity, 'g'), replacement);
              hasChanges = true;
            }
          }

          if (hasChanges) {
            path.node.value = newValue;
            path.node._changed = true;
            path.node._changeDescription = `Fixed HTML entities: ${originalValue} → ${newValue}`;
            changes.push({
              type: 'StringLiteral',
              location: path.node.loc,
              description: `Fixed HTML entities: ${originalValue} → ${newValue}`
            });
          }
        },

        // Replace console.log and alert with comments
        CallExpression(path) {
          // Handle console.log
          if (t.isMemberExpression(path.node.callee)) {
            if (t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
                t.isIdentifier(path.node.callee.property, { name: 'log' })) {
              
              // Capture location before removing
              const location = path.node.loc;
              // Remove the console.log statement
              path.remove();
              changes.push({
                type: 'CallExpression',
                location: location,
                description: `Removed console.log statement`
              });
              return;
            }
          }
          
          // Handle alert
          if (t.isIdentifier(path.node.callee, { name: 'alert' })) {
            // Capture location before removing
            const location = path.node.loc;
            // Remove the alert statement
            path.remove();
            changes.push({
              type: 'CallExpression',
              location: location,
              description: `Removed alert statement`
            });
          }
        },

        // Replace var with const/let
        VariableDeclaration(path) {
          if (path.node.kind === 'var') {
            // Determine if it should be const or let
            const isConst = path.node.declarations.every(decl => 
              !decl.init || 
              (t.isLiteral(decl.init) && !t.isRegExpLiteral(decl.init)) ||
              t.isObjectExpression(decl.init) ||
              t.isArrayExpression(decl.init)
            );
            
            path.node.kind = isConst ? 'const' : 'let';
            path.node._changed = true;
            path.node._changeDescription = `Replaced var with ${isConst ? 'const' : 'let'}`;
            changes.push({
              type: 'VariableDeclaration',
              location: path.node.loc,
              description: `Replaced var with ${isConst ? 'const' : 'let'}`
            });
          }
        }
      };

      const result = this.transform(code, visitors, options);
      
      return {
        code: result.code,
        changes: changes,
        success: true
      };
      
    } catch (error) {
      return {
        code: code,
        changes: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Layer 3: Component Fixes (AST-based)
   */
  transformComponents(code, options = {}) {
    const changes = [];
    
    try {
      const visitors = {
        // Add missing key props to map functions
        CallExpression(path) {
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.property, { name: 'map' })) {
            
            // Look for JSX elements inside the map function
            path.traverse({
              JSXElement(jsxPath) {
                // Check if key prop already exists
                const hasKey = jsxPath.node.openingElement.attributes.some(attr =>
                  t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'key' })
                );
                
                if (!hasKey) {
                  // Add key prop
                  const keyAttribute = t.jsxAttribute(
                    t.jsxIdentifier('key'),
                    t.jsxExpressionContainer(
                      t.logicalExpression(
                        '||',
                        t.memberExpression(
                          t.identifier('item'),
                          t.identifier('id')
                        ),
                        t.identifier('item')
                      )
                    )
                  );
                  
                  jsxPath.node.openingElement.attributes.push(keyAttribute);
                  jsxPath.node._changed = true;
                  jsxPath.node._changeDescription = 'Added key prop to map function';
                  changes.push({
                    type: 'JSXElement',
                    location: jsxPath.node.loc,
                    description: 'Added key prop to map function'
                  });
                }
              }
            });
          }
        },

        // Combined JSXElement visitor for all component fixes
        JSXElement(path) {
          const componentName = path.node.openingElement.name.name;
          
          // Add missing type props to Input components
          if (t.isJSXIdentifier(path.node.openingElement.name, { name: 'Input' })) {
            const attributes = path.node.openingElement.attributes;
            const hasType = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'type' })
            );
            
            if (!hasType) {
              const typeAttribute = t.jsxAttribute(
                t.jsxIdentifier('type'),
                t.stringLiteral('text')
              );
              
              attributes.push(typeAttribute);
              path.node._changed = true;
              path.node._changeDescription = 'Added type="text" to Input component';
              changes.push({
                type: 'JSXElement',
                location: path.node.loc,
                description: 'Added type="text" to Input component'
              });
            }
          }
          
          // Add size props to Icon components
          if (componentName && componentName.endsWith('Icon')) {
            const attributes = path.node.openingElement.attributes;
            const hasClassName = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'className' })
            );
            const hasSize = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'size' })
            );
            
            if (!hasClassName && !hasSize) {
              const sizeAttribute = t.jsxAttribute(
                t.jsxIdentifier('className'),
                t.stringLiteral('w-4 h-4')
              );
              
              attributes.push(sizeAttribute);
              path.node._changed = true;
              path.node._changeDescription = 'Added size className to Icon component';
              changes.push({
                type: 'JSXElement',
                location: path.node.loc,
                description: 'Added size className to Icon component'
              });
            }
          }
          
          // Add aria-label to buttons
          if (t.isJSXIdentifier(path.node.openingElement.name, { name: 'button' })) {
            const attributes = path.node.openingElement.attributes;
            const hasAriaLabel = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'aria-label' })
            );
            
            if (!hasAriaLabel) {
              const ariaLabelAttribute = t.jsxAttribute(
                t.jsxIdentifier('aria-label'),
                t.stringLiteral('Button')
              );
              
              attributes.push(ariaLabelAttribute);
              path.node._changed = true;
              path.node._changeDescription = 'Added aria-label to button';
              changes.push({
                type: 'JSXElement',
                location: path.node.loc,
                description: 'Added aria-label to button'
              });
            }
          }
          
          // Add alt to images
          if (t.isJSXIdentifier(path.node.openingElement.name, { name: 'img' })) {
            const attributes = path.node.openingElement.attributes;
            const hasAlt = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'alt' })
            );
            
            if (!hasAlt) {
              const altAttribute = t.jsxAttribute(
                t.jsxIdentifier('alt'),
                t.stringLiteral('Image')
              );
              
              attributes.push(altAttribute);
              path.node._changed = true;
              path.node._changeDescription = 'Added alt attribute to image';
              changes.push({
                type: 'JSXElement',
                location: path.node.loc,
                description: 'Added alt attribute to image'
              });
            }
          }
          
          // Convert HTML buttons to Button components
          if (t.isJSXIdentifier(path.node.openingElement.name, { name: 'button' })) {
            // Change button to Button
            path.node.openingElement.name = t.jsxIdentifier('Button');
            if (path.node.closingElement) {
              path.node.closingElement.name = t.jsxIdentifier('Button');
            }
            
            // Add variant prop if not present
            const attributes = path.node.openingElement.attributes;
            const hasVariant = attributes.some(attr =>
              t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'variant' })
            );
            
            if (!hasVariant) {
              const variantAttribute = t.jsxAttribute(
                t.jsxIdentifier('variant'),
                t.stringLiteral('default')
              );
              
              attributes.push(variantAttribute);
            }
            
            path.node._changed = true;
            path.node._changeDescription = 'Converted HTML button to Button component';
            changes.push({
              type: 'JSXElement',
              location: path.node.loc,
              description: 'Converted HTML button to Button component'
            });
          }
          
          // Convert HTML inputs to Input components
          if (t.isJSXIdentifier(path.node.openingElement.name, { name: 'input' })) {
            // Change input to Input
            path.node.openingElement.name = t.jsxIdentifier('Input');
            if (path.node.closingElement) {
              path.node.closingElement.name = t.jsxIdentifier('Input');
            }
            
            path.node._changed = true;
            path.node._changeDescription = 'Converted HTML input to Input component';
            changes.push({
              type: 'JSXElement',
              location: path.node.loc,
              description: 'Converted HTML input to Input component'
            });
          }
        }
      };

      const result = this.transform(code, visitors, options);
      
      return {
        code: result.code,
        changes: changes,
        success: true
      };
      
    } catch (error) {
      return {
        code: code,
        changes: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Layer 5: Next.js App Router Fixes (AST-based)
   */
  transformNextJS(code, options = {}) {
    const changes = [];
    
    try {
      const visitors = {
        // Add 'use client' directive for components with hooks
        Program(path) {
          let hasClientHooks = false;
          let hasUseClient = false;
          
          // Check for existing 'use client' directive
          path.node.directives.forEach(directive => {
            if (t.isDirectiveLiteral(directive.value, { value: 'use client' })) {
              hasUseClient = true;
            }
          });
          
          // Check for client-side hooks
          path.traverse({
            CallExpression(callPath) {
              if (t.isIdentifier(callPath.node.callee)) {
                const hookNames = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
                if (hookNames.includes(callPath.node.callee.name)) {
                  hasClientHooks = true;
                }
              }
            }
          });
          
          // Add 'use client' if needed and not present
          if (hasClientHooks && !hasUseClient) {
            const useClientDirective = t.directive(t.directiveLiteral('use client'));
            path.node.directives.unshift(useClientDirective);
            path.node._changed = true;
            path.node._changeDescription = 'Added use client directive';
            changes.push({
              type: 'Program',
              location: path.node.loc,
              description: 'Added use client directive'
            });
          }
        },

        // Fix malformed import statements
        ImportDeclaration(path) {
          const specifiers = path.node.specifiers;
          let hasChanges = false;
          
          // Fix nested import statements
          specifiers.forEach(specifier => {
            if (t.isImportSpecifier(specifier)) {
              // Check for malformed specifiers
              if (specifier.imported && specifier.imported.name.includes('\n')) {
                const cleanName = specifier.imported.name.replace(/\s+/g, ' ').trim();
                specifier.imported.name = cleanName;
                hasChanges = true;
              }
            }
          });
          
          if (hasChanges) {
            path.node._changed = true;
            path.node._changeDescription = 'Fixed malformed import statement';
            changes.push({
              type: 'ImportDeclaration',
              location: path.node.loc,
              description: 'Fixed malformed import statement'
            });
          }
        },

        // Add missing React imports
        Program(path) {
          let hasReactImport = false;
          let hasReactHooks = false;
          
          // Check for existing React import
          path.node.body.forEach(node => {
            if (t.isImportDeclaration(node) && 
                t.isStringLiteral(node.source, { value: 'react' })) {
              hasReactImport = true;
            }
          });
          
          // Check for React hooks usage
          path.traverse({
            CallExpression(callPath) {
              if (t.isIdentifier(callPath.node.callee)) {
                const hookNames = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
                if (hookNames.includes(callPath.node.callee.name)) {
                  hasReactHooks = true;
                }
              }
            }
          });
          
          // Add React import if needed
          if (hasReactHooks && !hasReactImport) {
            const reactImport = t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier('React'))],
              t.stringLiteral('react')
            );
            
            // Insert at the beginning
            path.node.body.unshift(reactImport);
            path.node._changed = true;
            path.node._changeDescription = 'Added React import';
            changes.push({
              type: 'Program',
              location: path.node.loc,
              description: 'Added React import'
            });
          }
        },

        // Convert metadata exports to generateMetadata
        ExportNamedDeclaration(path) {
          if (path.node.declaration && 
              t.isVariableDeclaration(path.node.declaration)) {
            
            const declaration = path.node.declaration;
            declaration.declarations.forEach(decl => {
              if (t.isIdentifier(decl.id, { name: 'metadata' })) {
                // Convert to generateMetadata function
                const generateMetadata = t.exportNamedDeclaration(
                  t.functionDeclaration(
                    t.identifier('generateMetadata'),
                    [t.identifier('{ params }')],
                    t.blockStatement([
                      t.returnStatement(
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier('title'),
                            t.stringLiteral('Test Page')
                          )
                        ])
                      )
                    ]),
                    false,
                    true // async
                  )
                );
                
                path.replaceWith(generateMetadata);
                path.node._changed = true;
                path.node._changeDescription = 'Converted metadata to generateMetadata function';
                changes.push({
                  type: 'ExportNamedDeclaration',
                  location: path.node.loc,
                  description: 'Converted metadata to generateMetadata function'
                });
              }
            });
          }
        }
      };

      const result = this.transform(code, visitors, options);
      
      return {
        code: result.code,
        changes: changes,
        success: true
      };
      
    } catch (error) {
      return {
        code: code,
        changes: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Layer 6: Testing Fixes (AST-based)
   */
  transformTesting(code, options = {}) {
    const visitors = {
      // Add error boundaries
      FunctionDeclaration(path) {
        if (path.node.id && 
            path.node.id.name.endsWith('Component') &&
            !path.node.id.name.includes('ErrorBoundary')) {
          
          // Check if this is a React component
          const body = path.node.body;
          if (t.isBlockStatement(body)) {
            const hasReturn = body.body.some(stmt => 
              t.isReturnStatement(stmt) && 
              t.isJSXElement(stmt.argument)
            );

            if (hasReturn) {
              // Wrap in error boundary
              const errorBoundary = t.functionDeclaration(
                t.identifier(`${path.node.id.name}ErrorBoundary`),
                [t.identifier('props')],
                t.blockStatement([
                  t.returnStatement(
                    t.jsxElement(
                      t.jsxOpeningElement(t.jsxIdentifier('ErrorBoundary'), [], false),
                      t.jsxClosingElement(t.jsxIdentifier('ErrorBoundary')),
                      [t.jsxElement(
                        t.jsxOpeningElement(t.jsxIdentifier(path.node.id.name), [], false),
                        t.jsxClosingElement(t.jsxIdentifier(path.node.id.name)),
                        []
                      )]
                    )
                  )
                ])
              );

              path.insertAfter(errorBoundary);
              path.node._changed = true;
              path.node._changeDescription = 'Wrapped component in error boundary';
            }
          }
        }
      },

      // Add loading states
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        if (openingElement.name.name === 'Suspense') {
          const hasFallback = openingElement.attributes.some(
            attr => t.isJSXAttribute(attr) && 
            t.isJSXIdentifier(attr.name, { name: 'fallback' })
          );

          if (!hasFallback) {
            const fallbackAttribute = t.jsxAttribute(
              t.jsxIdentifier('fallback'),
              t.jsxExpressionContainer(
                t.jsxElement(
                  t.jsxOpeningElement(t.jsxIdentifier('div'), [], false),
                  t.jsxClosingElement(t.jsxIdentifier('div')),
                  [t.jsxText('Loading...')]
                )
              )
            );
            openingElement.attributes.push(fallbackAttribute);
            openingElement._changed = true;
            openingElement._changeDescription = 'Added fallback to Suspense';
          }
        }
      }
    };

    return this.transform(code, visitors, options);
  }

  /**
   * Analyze code for issues using AST
   */
  analyzeCode(code, options = {}) {
    const ast = this.parseCode(code, options.filename);
    const issues = [];

    traverse(ast, {
      // Detect HTML entities
      StringLiteral(path) {
        const value = path.node.value;
        if (value.includes('&quot;') || value.includes('&amp;') || 
            value.includes('&lt;') || value.includes('&gt;')) {
          issues.push({
            type: 'html_entities',
            message: 'HTML entities detected',
            location: path.node.loc,
            layer: 2
          });
        }
      },

      // Detect console statements
      CallExpression(path) {
        const callee = path.node.callee;
        if (t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object, { name: 'console' })) {
          issues.push({
            type: 'console_statement',
            message: 'Console statement detected',
            location: path.node.loc,
            layer: 2
          });
        }
      },

      // Detect missing keys in map
      CallExpression(path) {
        const callee = path.node.callee;
        if (t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: 'map' })) {
          const callback = path.node.arguments[0];
          if (t.isArrowFunctionExpression(callback) ||
              t.isFunctionExpression(callback)) {
            
            const body = callback.body;
            if (t.isJSXElement(body) || 
                (t.isBlockStatement(body) && 
                 body.body.some(stmt => t.isJSXElement(stmt.expression)))) {
              
              const jsxElement = t.isJSXElement(body) ? body : 
                body.body.find(stmt => t.isJSXElement(stmt.expression)).expression;
              
              const hasKey = jsxElement.openingElement.attributes.some(
                attr => t.isJSXAttribute(attr) && 
                t.isJSXIdentifier(attr.name, { name: 'key' })
              );

              if (!hasKey) {
                issues.push({
                  type: 'missing_key',
                  message: 'Missing key prop in map function',
                  location: jsxElement.loc,
                  layer: 3
                });
              }
            }
          }
        }
      },

      // Detect missing accessibility attributes
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        const elementName = openingElement.name.name;

        if (elementName === 'button') {
          const hasAriaLabel = openingElement.attributes.some(
            attr => t.isJSXAttribute(attr) && 
            (t.isJSXIdentifier(attr.name, { name: 'aria-label' }) ||
             t.isJSXIdentifier(attr.name, { name: 'aria-labelledby' }))
          );

          if (!hasAriaLabel) {
            issues.push({
              type: 'missing_aria_label',
              message: 'Button missing aria-label',
              location: openingElement.loc,
              layer: 3
            });
          }
        }

        if (elementName === 'img') {
          const hasAlt = openingElement.attributes.some(
            attr => t.isJSXAttribute(attr) && 
            t.isJSXIdentifier(attr.name, { name: 'alt' })
          );

          if (!hasAlt) {
            issues.push({
              type: 'missing_alt',
              message: 'Image missing alt attribute',
              location: openingElement.loc,
              layer: 3
            });
          }
        }
      },

      // Detect client-side APIs without SSR guards
      MemberExpression(path) {
        const object = path.node.object;
        if (t.isIdentifier(object, { name: 'window' }) ||
            t.isIdentifier(object, { name: 'document' }) ||
            t.isIdentifier(object, { name: 'localStorage' })) {
          
          let hasTypeofCheck = false;
          let currentPath = path;
          
          while (currentPath.parentPath) {
            if (t.isUnaryExpression(currentPath.parentPath.node) &&
                currentPath.parentPath.node.operator === 'typeof') {
              hasTypeofCheck = true;
              break;
            }
            currentPath = currentPath.parentPath;
          }

          if (!hasTypeofCheck) {
            issues.push({
              type: 'unsafe_browser_api',
              message: 'Browser API used without SSR guard',
              location: path.node.loc,
              layer: 4
            });
          }
        }
      },

      // Detect missing 'use client' directive
      Program(path) {
        const body = path.node.body;
        const hasUseClient = body.some(node => 
          t.isExpressionStatement(node) &&
          t.isStringLiteral(node.expression, { value: 'use client' })
        );

        if (!hasUseClient) {
          let needsUseClient = false;
          
          path.traverse({
            CallExpression(callPath) {
              const callee = callPath.node.callee;
              if (t.isIdentifier(callee, { name: 'useState' }) ||
                  t.isIdentifier(callee, { name: 'useEffect' })) {
                needsUseClient = true;
              }
            }
          });

          if (needsUseClient) {
            issues.push({
              type: 'missing_use_client',
              message: 'Component uses client-side hooks but missing use client directive',
              location: body[0]?.loc,
              layer: 5
            });
          }
        }
      }
    });

    return issues;
  }
}

module.exports = ASTTransformer; 