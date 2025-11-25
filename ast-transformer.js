/**
 * NeuroLint - AST-based Transformation Engine
 * Replaces regex-based transformations with proper code parsing and manipulation
 * 
 * Copyright (c) 2025 NeuroLint
 * Licensed under the Business Source License 1.1
 * 
 * Use Limitation: You may not use this software to provide a commercial
 * SaaS offering that competes with NeuroLint's code transformation services.
 * 
 * Change Date: 2029-11-22
 * Change License: GPL-3.0-or-later
 * 
 * For commercial licensing: clivemakazhu@gmail.com
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
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
        retainLines: false,
        retainFunctionParens: true,
        compact: false,
        comments: true,
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

        // Replace console.log and alert with proper AST transformations
        CallExpression(path) {
          // Helper function to check if console.log is the entire body of an arrow function
          const isArrowFunctionBody = () => {
            const parent = path.parent;
            const parentPath = path.parentPath;
            
            // Check if parent is ArrowFunctionExpression and this CallExpression is the entire body
            if (t.isArrowFunctionExpression(parent) && parent.body === path.node) {
              return true;
            }
            
            // Also check if parent is ExpressionStatement inside ArrowFunctionExpression body
            if (t.isExpressionStatement(parent) && parentPath && parentPath.parent) {
              const grandParent = parentPath.parent;
              if (t.isBlockStatement(grandParent) && 
                  grandParent.body.length === 1 && 
                  grandParent.body[0] === parent) {
                const arrowPath = parentPath.parentPath;
                if (arrowPath && t.isArrowFunctionExpression(arrowPath.parent)) {
                  return true;
                }
              }
            }
            
            return false;
          };
          
          // Handle console.log (including all variants: log, info, warn, error, debug)
          if (t.isMemberExpression(path.node.callee)) {
            if (t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
                t.isIdentifier(path.node.callee.property) &&
                ['log', 'info', 'warn', 'error', 'debug'].includes(path.node.callee.property.name)) {
              
              const methodName = path.node.callee.property.name;
              const location = path.node.loc;
              
              // Get arguments as string for comment
              const args = path.node.arguments.map(arg => {
                try {
                  return generate(arg).code;
                } catch {
                  return '...';
                }
              }).join(', ');
              
              // Check if this is an expression-bodied arrow function
              if (isArrowFunctionBody()) {
                // Find the arrow function and convert expression body to block body with comment
                if (t.isArrowFunctionExpression(path.parent)) {
                  // Direct arrow body: () => console.log()
                  // Replace with empty block statement with comment
                  const comment = ` [NeuroLint] Removed console.${methodName}: ${args}`;
                  const emptyBlock = t.blockStatement([]);
                  path.parentPath.node.body = emptyBlock;
                  path.parentPath.addComment('trailing', comment);
                  
                  changes.push({
                    type: 'ArrowFunctionExpression',
                    location: location,
                    description: `Replaced console.${methodName} in arrow function body with empty block {}`
                  });
                  return;
                }
              }
              
              // For other contexts, replace with comment
              if (t.isExpressionStatement(path.parent)) {
                // Replace the entire expression statement with an EmptyStatement carrying the comment
                const commentText = `[NeuroLint] Removed console.${methodName}: ${args}`;
                const emptyStatement = t.emptyStatement();
                emptyStatement.leadingComments = [{
                  type: 'CommentLine',
                  value: ` ${commentText}`
                }];
                path.parentPath.replaceWith(emptyStatement);
                changes.push({
                  type: 'ExpressionStatement',
                  location: location,
                  description: `Removed console.${methodName} statement (added comment)`
                });
              } else {
                // For expression contexts, we need to maintain syntax but add comment
                // Replace with a comment expression (use undefined to maintain valid syntax)
                const commentText = `[NeuroLint] Removed console.${methodName}: ${args}`;
                const replacement = t.identifier('undefined');
                replacement.leadingComments = [{
                  type: 'CommentLine',
                  value: ` ${commentText}`
                }];
                path.replaceWith(replacement);
                changes.push({
                  type: 'CallExpression',
                  location: location,
                  description: `Replaced console.${methodName} with undefined (added comment)`
                });
              }
              return;
            }
          }
          
          // Handle alert
          if (t.isIdentifier(path.node.callee, { name: 'alert' })) {
            const location = path.node.loc;
            
            // Get arguments as string for comment
            const args = path.node.arguments.map(arg => {
              try {
                return generate(arg).code;
              } catch {
                return '...';
              }
            }).join(', ');
            
            // Check if this is an expression-bodied arrow function
            if (isArrowFunctionBody()) {
              if (t.isArrowFunctionExpression(path.parent)) {
                // Replace with empty block statement with comment
                const comment = ` [NeuroLint] Replace with toast notification: ${args}`;
                path.parentPath.node.body = t.blockStatement([]);
                path.parentPath.addComment('trailing', comment);
                
                changes.push({
                  type: 'ArrowFunctionExpression',
                  location: location,
                  description: 'Replaced alert in arrow function body with empty block {}'
                });
                return;
              }
            }
            
            // For other contexts, replace with comment
            if (t.isExpressionStatement(path.parent)) {
              const commentText = `[NeuroLint] Replace with toast notification: ${args}`;
              const emptyStatement = t.emptyStatement();
              emptyStatement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.parentPath.replaceWith(emptyStatement);
              changes.push({
                type: 'ExpressionStatement',
                location: location,
                description: 'Removed alert statement (added comment)'
              });
            } else {
              const commentText = `[NeuroLint] Replace with toast notification: ${args}`;
              const replacement = t.identifier('undefined');
              replacement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.replaceWith(replacement);
              changes.push({
                type: 'CallExpression',
                location: location,
                description: 'Replaced alert with undefined (added comment)'
              });
            }
          }
          
          // Handle confirm
          if (t.isIdentifier(path.node.callee, { name: 'confirm' })) {
            const location = path.node.loc;
            
            const args = path.node.arguments.map(arg => {
              try {
                return generate(arg).code;
              } catch {
                return '...';
              }
            }).join(', ');
            
            if (isArrowFunctionBody()) {
              if (t.isArrowFunctionExpression(path.parent)) {
                const comment = ` [NeuroLint] Replace with dialog: ${args}`;
                path.parentPath.node.body = t.blockStatement([]);
                path.parentPath.addComment('trailing', comment);
                
                changes.push({
                  type: 'ArrowFunctionExpression',
                  location: location,
                  description: 'Replaced confirm in arrow function body with empty block {}'
                });
                return;
              }
            }
            
            if (t.isExpressionStatement(path.parent)) {
              const commentText = `[NeuroLint] Replace with dialog: ${args}`;
              const emptyStatement = t.emptyStatement();
              emptyStatement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.parentPath.replaceWith(emptyStatement);
              changes.push({
                type: 'ExpressionStatement',
                location: location,
                description: 'Removed confirm statement (added comment)'
              });
            } else {
              const commentText = `[NeuroLint] Replace with dialog: ${args}`;
              const replacement = t.identifier('undefined');
              replacement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.replaceWith(replacement);
              changes.push({
                type: 'CallExpression',
                location: location,
                description: 'Replaced confirm with undefined (added comment)'
              });
            }
          }
          
          // Handle prompt
          if (t.isIdentifier(path.node.callee, { name: 'prompt' })) {
            const location = path.node.loc;
            
            const args = path.node.arguments.map(arg => {
              try {
                return generate(arg).code;
              } catch {
                return '...';
              }
            }).join(', ');
            
            if (isArrowFunctionBody()) {
              if (t.isArrowFunctionExpression(path.parent)) {
                const comment = ` [NeuroLint] Replace with dialog: ${args}`;
                path.parentPath.node.body = t.blockStatement([]);
                path.parentPath.addComment('trailing', comment);
                
                changes.push({
                  type: 'ArrowFunctionExpression',
                  location: location,
                  description: 'Replaced prompt in arrow function body with empty block {}'
                });
                return;
              }
            }
            
            if (t.isExpressionStatement(path.parent)) {
              const commentText = `[NeuroLint] Replace with dialog: ${args}`;
              const emptyStatement = t.emptyStatement();
              emptyStatement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.parentPath.replaceWith(emptyStatement);
              changes.push({
                type: 'ExpressionStatement',
                location: location,
                description: 'Removed prompt statement (added comment)'
              });
            } else {
              const commentText = `[NeuroLint] Replace with dialog: ${args}`;
              const replacement = t.identifier('undefined');
              replacement.leadingComments = [{
                type: 'CommentLine',
                value: ` ${commentText}`
              }];
              path.replaceWith(replacement);
              changes.push({
                type: 'CallExpression',
                location: location,
                description: 'Replaced prompt with undefined (added comment)'
              });
            }
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
            
            const callback = path.node.arguments[0];
            let paramName = null;
            let useIndex = false;
            let needsIndexParam = false;
            let foundStableProperty = false;
            
            if (callback) {
              if (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback)) {
                const params = callback.params;
                if (params && params.length > 0) {
                  const firstParam = params[0];
                  if (t.isIdentifier(firstParam)) {
                    paramName = firstParam.name;
                  } else if (t.isObjectPattern(firstParam)) {
                    // Try to find a stable property (id, key, _id, etc.)
                    const stableProps = ['id', 'key', '_id', 'uid'];
                    let foundProp = null;
                    
                    for (const prop of firstParam.properties) {
                      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        if (stableProps.includes(prop.key.name)) {
                          foundProp = t.isIdentifier(prop.value) ? prop.value.name : prop.key.name;
                          break;
                        }
                      }
                    }
                    
                    if (foundProp) {
                      paramName = foundProp;
                      foundStableProperty = true;
                    } else {
                      // No stable property found, use index
                      if (params.length > 1) {
                        // Handle both plain identifiers and assignment patterns (default params)
                        const secondParam = params[1];
                        if (t.isIdentifier(secondParam)) {
                          paramName = secondParam.name;
                          useIndex = true;
                        } else if (t.isAssignmentPattern(secondParam) && t.isIdentifier(secondParam.left)) {
                          // Handle default parameters like `idx = 0`
                          paramName = secondParam.left.name;
                          useIndex = true;
                        } else {
                          paramName = 'index';
                          useIndex = true;
                          needsIndexParam = true;
                        }
                      } else {
                        paramName = 'index';
                        useIndex = true;
                        needsIndexParam = true;
                      }
                    }
                  } else if (t.isArrayPattern(firstParam)) {
                    // For array destructuring, use index
                    if (params.length > 1) {
                      // Handle both plain identifiers and assignment patterns (default params)
                      const secondParam = params[1];
                      if (t.isIdentifier(secondParam)) {
                        paramName = secondParam.name;
                        useIndex = true;
                      } else if (t.isAssignmentPattern(secondParam) && t.isIdentifier(secondParam.left)) {
                        // Handle default parameters like `idx = 0`
                        paramName = secondParam.left.name;
                        useIndex = true;
                      } else {
                        paramName = 'index';
                        useIndex = true;
                        needsIndexParam = true;
                      }
                    } else {
                      paramName = 'index';
                      useIndex = true;
                      needsIndexParam = true;
                    }
                  } else if (t.isAssignmentPattern(firstParam)) {
                    // Handle first param with default value (item = {})
                    // Extract the actual parameter name
                    if (t.isIdentifier(firstParam.left)) {
                      paramName = firstParam.left.name;
                      // Check if there's a second param
                      if (params.length > 1) {
                        const secondParam = params[1];
                        if (t.isIdentifier(secondParam)) {
                          paramName = secondParam.name;
                          useIndex = true;
                        } else if (t.isAssignmentPattern(secondParam) && t.isIdentifier(secondParam.left)) {
                          paramName = secondParam.left.name;
                          useIndex = true;
                        } else {
                          // No valid second param, add index
                          useIndex = true;
                          needsIndexParam = true;
                          paramName = 'index';
                        }
                      } else {
                        // Only one param with default, add index
                        useIndex = true;
                        needsIndexParam = true;
                        paramName = 'index';
                      }
                    }
                  }
                }
              }
            }
            
            // Fall back to 'index' if no param name found
            if (!paramName) {
              paramName = 'index';
              useIndex = true;
              needsIndexParam = true;
            }
            
            // Add index parameter to callback if needed
            if (needsIndexParam && callback && (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback))) {
              callback.params.push(t.identifier('index'));
            }
            
            // Look for JSX elements inside the map function
            path.traverse({
              JSXElement(jsxPath) {
                // Check if key prop already exists
                const hasKey = jsxPath.node.openingElement.attributes.some(attr =>
                  t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'key' })
                );
                
                if (!hasKey) {
                  // Add key prop using the actual parameter name or index
                  let keyExpression;
                  if (useIndex || foundStableProperty) {
                    // For index or stable property from destructured params, just use the value
                    keyExpression = t.identifier(paramName);
                  } else {
                    // For normal params (item, todo, etc.), use param.id || param
                    keyExpression = t.logicalExpression(
                      '||',
                      t.memberExpression(
                        t.identifier(paramName),
                        t.identifier('id')
                      ),
                      t.identifier(paramName)
                    );
                  }
                  
                  const keyAttribute = t.jsxAttribute(
                    t.jsxIdentifier('key'),
                    t.jsxExpressionContainer(keyExpression)
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
   * Helper: Check if an expression is already protected by SSR guard
   */
  isAlreadySSRGuarded(path) {
    // Check parent nodes for typeof guards
    let current = path;
    let depth = 0;
    
    while (current && depth < 5) { // Check up to 5 levels
      // Check for typeof !== "undefined" pattern
      if (t.isConditionalExpression(current.node) || t.isIfStatement(current.node)) {
        const test = current.node.test;
        
        // typeof window !== "undefined" pattern
        if (t.isBinaryExpression(test) &&
            test.operator === '!==' &&
            t.isUnaryExpression(test.left) &&
            test.left.operator === 'typeof') {
          return true;
        }
        
        // window !== undefined pattern
        if (t.isBinaryExpression(test) &&
            (test.operator === '!==' || test.operator === '!==') &&
            t.isIdentifier(test.left, { name: 'window' })) {
          return true;
        }
      }
      
      current = current.parentPath;
      depth++;
    }
    
    return false;
  }

  /**
   * Layer 5: Next.js App Router Fixes (AST-based)
   * Production-ready implementation with robust hook detection, AST-based import management, and smart SSR guards
   */
  transformNextJS(code, options = {}) {
    const changes = [];
    let needsCreateRootImport = false;
    let needsHydrateRootImport = false;
    let reactDOMClientImportPath = null;
    let rootCounter = 0; // Counter for unique root variable names
    
    // Track imported hooks and their local bindings (handles aliases and destructuring)
    const importedHooks = new Set();
    const reactDefaultImport = { name: null }; // Track default React import
    
    try {
      const visitors = {
        // Consolidated Program visitor for directives and imports
        Program(path) {
          let hasClientHooks = false;
          let hasUseClient = false;
          let hasReactImport = false;
          let hasReactHooks = false;
          
          // Check for existing 'use client' directive
          path.node.directives.forEach(directive => {
            if (t.isDirectiveLiteral(directive.value, { value: 'use client' })) {
              hasUseClient = true;
            }
          });
          
          // Build map of imported hooks and track existing imports
          path.node.body.forEach(node => {
            if (t.isImportDeclaration(node)) {
              const source = node.source.value;
              
              // Track React imports
              if (source === 'react') {
                hasReactImport = true;
                
                node.specifiers.forEach(spec => {
                  // Default import: import React from 'react'
                  if (t.isImportDefaultSpecifier(spec)) {
                    reactDefaultImport.name = spec.local.name;
                  }
                  
                  // Named imports: import { useState, useEffect as useMyEffect } from 'react'
                  if (t.isImportSpecifier(spec)) {
                    const importedName = spec.imported.name;
                    const localName = spec.local.name;
                    
                    const hookNames = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect'];
                    if (hookNames.includes(importedName)) {
                      importedHooks.add(localName); // Track local binding (handles aliases)
                    }
                  }
                });
              }
              
              // Track react-dom/client imports
              if (source === 'react-dom/client') {
                reactDOMClientImportPath = path.node.body.indexOf(node);
              }
            }
          });
          
          // Check for client-side hooks and React usage
          path.traverse({
            // Detect variable declarations with destructuring: const { useState: useCount } = React
            VariableDeclarator(varPath) {
              if (t.isObjectPattern(varPath.node.id) && 
                  t.isIdentifier(varPath.node.init) &&
                  varPath.node.init.name === reactDefaultImport.name) {
                
                varPath.node.id.properties.forEach(prop => {
                  if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    const hookNames = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect'];
                    if (hookNames.includes(prop.key.name)) {
                      // Handle aliasing: { useState: useCount }
                      const localName = t.isIdentifier(prop.value) ? prop.value.name : prop.key.name;
                      importedHooks.add(localName);
                    }
                  }
                });
              }
            },
            
            CallExpression(callPath) {
              // Direct hook calls: useState()
              if (t.isIdentifier(callPath.node.callee)) {
                if (importedHooks.has(callPath.node.callee.name)) {
                  hasClientHooks = true;
                  hasReactHooks = true;
                }
              }
              
              // React.useState() calls
              if (t.isMemberExpression(callPath.node.callee) &&
                  t.isIdentifier(callPath.node.callee.object) &&
                  callPath.node.callee.object.name === reactDefaultImport.name &&
                  t.isIdentifier(callPath.node.callee.property)) {
                
                const hookNames = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect'];
                if (hookNames.includes(callPath.node.callee.property.name)) {
                  hasClientHooks = true;
                  hasReactHooks = true;
                }
              }
            },
            
            MemberExpression(memberPath) {
              // Detect browser-only APIs that require 'use client'
              if (t.isIdentifier(memberPath.node.object)) {
                const browserAPIs = ['window', 'document', 'localStorage', 'sessionStorage', 'navigator'];
                if (browserAPIs.includes(memberPath.node.object.name)) {
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
              description: 'Added use client directive for hooks/browser APIs'
            });
          }
          
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
              description: 'Added React import for hooks'
            });
          }
        },

        // Convert ReactDOM.render to createRoot (React 19)
        CallExpression(path) {
          // ReactDOM.render(<App />, container) -> createRoot(container).render(<App />)
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'ReactDOM' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'render' })) {
            
            const [element, container] = path.node.arguments;
            if (!element || !container) return;
            
            // Generate unique root variable name to avoid redeclaration errors
            const rootVarName = rootCounter === 0 ? 'root' : `root${rootCounter}`;
            rootCounter++;
            
            // Create: const root = createRoot(container);
            const rootDeclaration = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(rootVarName),
                t.callExpression(t.identifier('createRoot'), [container])
              )
            ]);
            
            // Create: root.render(element);
            const renderCall = t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier(rootVarName), t.identifier('render')),
                [element]
              )
            );
            
            // Replace the expression statement containing the call
            const statement = path.findParent(p => p.isExpressionStatement());
            if (statement) {
              statement.replaceWithMultiple([rootDeclaration, renderCall]);
              needsCreateRootImport = true;
              changes.push({
                type: 'CallExpression',
                location: path.node.loc,
                description: 'Converted ReactDOM.render to createRoot().render()'
              });
            }
          }
          
          // ReactDOM.hydrate(<App />, container) -> hydrateRoot(container, <App />)
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'ReactDOM' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'hydrate' })) {
            
            const [element, container] = path.node.arguments;
            if (!element || !container) return;
            
            // Create: hydrateRoot(container, element);
            // Note: parameter order is swapped from hydrate!
            const hydrateCall = t.callExpression(
              t.identifier('hydrateRoot'),
              [container, element]
            );
            
            path.replaceWith(hydrateCall);
            needsHydrateRootImport = true;
            changes.push({
              type: 'CallExpression',
              location: path.node.loc,
              description: 'Converted ReactDOM.hydrate to hydrateRoot()'
            });
          }
          
          // Detect ReactDOM.findDOMNode (removed in React 19)
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'ReactDOM' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'findDOMNode' })) {
            changes.push({
              type: 'Warning',
              location: path.node.loc,
              description: 'findDOMNode() is removed in React 19 - use refs instead'
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
      
      // Reuse the AST from transform() to preserve all mutations
      const ast = result.ast;
      
      // Add react-dom/client imports using AST manipulation (production-ready approach)
      if (needsCreateRootImport || needsHydrateRootImport) {
        const importsToAdd = [];
        if (needsCreateRootImport) importsToAdd.push('createRoot');
        if (needsHydrateRootImport) importsToAdd.push('hydrateRoot');
        
        let reactDOMClientImport = null;
        let insertIndex = 0;
        
        // Find existing react-dom/client import
        for (let i = 0; i < ast.program.body.length; i++) {
          const node = ast.program.body[i];
          if (t.isImportDeclaration(node) && node.source.value === 'react-dom/client') {
            reactDOMClientImport = node;
            break;
          }
          // Track insert position (after last import)
          if (t.isImportDeclaration(node)) {
            insertIndex = i + 1;
          }
        }
        
        if (reactDOMClientImport) {
          // Add to existing import (deduplicate)
          const existingImports = new Set(
            reactDOMClientImport.specifiers
              .filter(s => t.isImportSpecifier(s))
              .map(s => s.imported.name)
          );
          
          importsToAdd.forEach(importName => {
            if (!existingImports.has(importName)) {
              reactDOMClientImport.specifiers.push(
                t.importSpecifier(t.identifier(importName), t.identifier(importName))
              );
            }
          });
        } else {
          // Create new import declaration
          const newImport = t.importDeclaration(
            importsToAdd.map(name => t.importSpecifier(t.identifier(name), t.identifier(name))),
            t.stringLiteral('react-dom/client')
          );
          ast.program.body.splice(insertIndex, 0, newImport);
        }
      }
      
      // Generate final code from the mutated AST
      const transformedCode = this.generateCode(ast, options).code;
      
      return {
        code: transformedCode,
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

  /**
   * Layer 5: React 19 DOM API Transformations (AST-based)
   * Handles ReactDOM.render → createRoot and ReactDOM.hydrate → hydrateRoot
   */
  transformReact19DOM(code, options = {}) {
    const changes = [];
    let needsCreateRoot = false;
    let needsHydrateRoot = false;
    let rootCounter = 0; // Counter for generating unique root identifiers

    try {
      const visitors = {
        // Convert ReactDOM.render to createRoot().render()
        CallExpression(path) {
          // Check for ReactDOM.render calls
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'ReactDOM' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'render' })) {
            
            const [jsxElement, container] = path.node.arguments;
            
            if (jsxElement && container) {
              // Generate unique root identifier to avoid redeclaration errors
              const rootId = rootCounter === 0 ? 'root' : `root${rootCounter}`;
              rootCounter++;
              
              // Only convert if it's in a statement context
              if (t.isExpressionStatement(path.parent)) {
                // Create: const root = createRoot(container);
                const rootDeclaration = t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(rootId),
                    t.callExpression(
                      t.identifier('createRoot'),
                      [container]
                    )
                  )
                ]);
                
                // Create: root.render(jsxElement);
                const renderCall = t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier(rootId),
                      t.identifier('render')
                    ),
                    [jsxElement]
                  )
                );
                
                // Replace the ReactDOM.render call with both statements
                path.parentPath.replaceWithMultiple([rootDeclaration, renderCall]);
                
                needsCreateRoot = true;
                changes.push({
                  type: 'react19-render',
                  description: 'Converted ReactDOM.render to createRoot().render()',
                  location: path.node.loc
                });
                
                path.node._changed = true;
                path.node._changeDescription = 'Converted ReactDOM.render to createRoot().render()';
              } else {
                // Skip: ReactDOM.render used in non-statement context (e.g., assignment or return)
                // Cannot safely convert without breaking semantics
                changes.push({
                  type: 'react19-render-warning',
                  description: 'ReactDOM.render in non-statement context - manual migration required',
                  location: path.node.loc
                });
              }
            }
          }
          
          // Check for ReactDOM.hydrate calls
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'ReactDOM' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'hydrate' })) {
            
            const [jsxElement, container] = path.node.arguments;
            
            if (jsxElement && container) {
              // Create: hydrateRoot(container, jsxElement);
              // NOTE: hydrateRoot parameters are swapped compared to ReactDOM.hydrate!
              const hydrateCall = t.callExpression(
                t.identifier('hydrateRoot'),
                [container, jsxElement]
              );
              
              path.replaceWith(hydrateCall);
              
              needsHydrateRoot = true;
              changes.push({
                type: 'react19-hydrate',
                description: 'Converted ReactDOM.hydrate to hydrateRoot()',
                location: path.node.loc
              });
              
              path.node._changed = true;
              path.node._changeDescription = 'Converted ReactDOM.hydrate to hydrateRoot()';
            }
          }
        }
      };

      const result = this.transform(code, visitors, options);
      let transformedCode = result.code;
      
      // Add imports if needed
      if (needsCreateRoot || needsHydrateRoot) {
        const ast = this.parseCode(transformedCode, options.filename);
        let hasReactDomClientImport = false;
        let reactDomClientImportPath = null;
        
        // Check for existing react-dom/client import
        traverse(ast, {
          ImportDeclaration(path) {
            if (path.node.source.value === 'react-dom/client') {
              hasReactDomClientImport = true;
              reactDomClientImportPath = path;
            }
          }
        });
        
        if (!hasReactDomClientImport) {
          // Add new import at the top
          const imports = [];
          if (needsCreateRoot) imports.push(t.importSpecifier(t.identifier('createRoot'), t.identifier('createRoot')));
          if (needsHydrateRoot) imports.push(t.importSpecifier(t.identifier('hydrateRoot'), t.identifier('hydrateRoot')));
          
          const importDecl = t.importDeclaration(
            imports,
            t.stringLiteral('react-dom/client')
          );
          
          ast.program.body.unshift(importDecl);
          transformedCode = this.generateCode(ast).code;
        } else {
          // Add to existing import
          if (reactDomClientImportPath) {
            const existingSpecifiers = reactDomClientImportPath.node.specifiers;
            const existingNames = existingSpecifiers.map(s => s.imported?.name || s.local.name);
            
            if (needsCreateRoot && !existingNames.includes('createRoot')) {
              existingSpecifiers.push(t.importSpecifier(t.identifier('createRoot'), t.identifier('createRoot')));
            }
            if (needsHydrateRoot && !existingNames.includes('hydrateRoot')) {
              existingSpecifiers.push(t.importSpecifier(t.identifier('hydrateRoot'), t.identifier('hydrateRoot')));
            }
            
            transformedCode = this.generateCode(ast).code;
          }
        }
      }
      
      return {
        code: transformedCode,
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
   * Layer 5: 'use client' Directive Management (AST-based)
   * Adds or ensures 'use client' directive at top of file when needed
   */
  transformUseClient(code, options = {}) {
    const changes = [];
    
    try {
      const ast = this.parseCode(code, options.filename);
      let needsUseClient = false;
      let hasUseClient = false;
      
      // Check if 'use client' already exists
      if (ast.program.body.length > 0) {
        const firstNode = ast.program.body[0];
        if (t.isExpressionStatement(firstNode) && 
            (t.isStringLiteral(firstNode.expression, { value: 'use client' }) ||
             (t.isDirectiveLiteral(firstNode.expression) && firstNode.expression.value === 'use client'))) {
          hasUseClient = true;
        }
        
        // Check for directive
        if (ast.program.directives && ast.program.directives.length > 0) {
          hasUseClient = ast.program.directives.some(d => d.value.value === 'use client');
        }
      }
      
      // Check if file needs 'use client' by scanning for hooks and event handlers
      traverse(ast, {
        // Detect React hooks
        CallExpression(path) {
          const callee = path.node.callee;
          if (t.isIdentifier(callee)) {
            const hookNames = [
              'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 
              'useContext', 'useReducer', 'useImperativeHandle', 'useLayoutEffect',
              'useDebugValue', 'useId', 'useTransition', 'useDeferredValue',
              'useSyncExternalStore', 'useInsertionEffect'
            ];
            if (hookNames.includes(callee.name)) {
              needsUseClient = true;
            }
          }
        },
        
        // Detect event handlers (onClick, onChange, etc.)
        JSXAttribute(path) {
          if (t.isJSXIdentifier(path.node.name)) {
            const attrName = path.node.name.name;
            if (/^on[A-Z]/.test(attrName)) {
              needsUseClient = true;
            }
          }
        }
      });
      
      // Add 'use client' if needed and not present
      if (needsUseClient && !hasUseClient) {
        // Add as directive at the beginning
        const useClientDirective = t.directive(t.directiveLiteral('use client'));
        
        if (!ast.program.directives) {
          ast.program.directives = [];
        }
        ast.program.directives.unshift(useClientDirective);
        
        changes.push({
          type: 'use-client-directive',
          description: "Added 'use client' directive",
          location: { line: 1 }
        });
        
        const transformedCode = this.generateCode(ast).code;
        
        return {
          code: transformedCode,
          changes: changes,
          success: true
        };
      }
      
      return {
        code: code,
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
}

module.exports = ASTTransformer; 