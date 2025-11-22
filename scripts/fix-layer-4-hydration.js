#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */


const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('../backup-manager');
const ASTTransformer = require('../ast-transformer');
const t = require('@babel/types');

/**
 * Layer 4: Hydration and SSR Fixes (AST-based)
 * - Add window/document guards using proper code parsing
 * - Add mounted state for theme providers
 * - Fix hydration mismatches in useEffect
 * - Handles nested parentheses correctly via AST
 */

async function isRegularFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a node is already wrapped in SSR guard
 */
function isAlreadyGuarded(path, guardType = 'window') {
  let parent = path.parentPath;
  
  // Traverse up to find conditional expression or if statement
  while (parent) {
    // Check for ternary operator: typeof window !== "undefined" ? ... : null
    if (t.isConditionalExpression(parent.node)) {
      const test = parent.node.test;
      if (t.isBinaryExpression(test) && 
          t.isUnaryExpression(test.left) && 
          test.left.operator === 'typeof') {
        
        const arg = test.left.argument;
        if (t.isIdentifier(arg)) {
          if (guardType === 'window' && arg.name === 'window') return true;
          if (guardType === 'document' && arg.name === 'document') return true;
        }
      }
    }
    
    // Check for if statement: if (typeof window !== "undefined") { ... }
    if (t.isIfStatement(parent.node)) {
      const test = parent.node.test;
      if (t.isBinaryExpression(test) && 
          t.isUnaryExpression(test.left) && 
          test.left.operator === 'typeof') {
        
        const arg = test.left.argument;
        if (t.isIdentifier(arg)) {
          if (guardType === 'window' && arg.name === 'window') return true;
          if (guardType === 'document' && arg.name === 'document') return true;
        }
      }
    }
    
    parent = parent.parentPath;
  }
  return false;
}

/**
 * Wrap an expression with SSR guard
 */
function wrapWithSSRGuard(expression, guardType = 'window') {
  // Create: typeof window !== "undefined" ? expression : null
  return t.conditionalExpression(
    t.binaryExpression(
      '!==',
      t.unaryExpression('typeof', t.identifier(guardType)),
      t.stringLiteral('undefined')
    ),
    expression,
    t.nullLiteral()
  );
}

/**
 * Main AST-based hydration transform
 */
async function transform(code, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd() } = options;
  const results = [];
  let changeCount = 0;
  let updatedCode = code;

  try {
    // Create centralized backup
    const existsAsFile = await isRegularFile(filePath);
    if (existsAsFile && !dryRun) {
      try {
        const backupManager = new BackupManager({
          backupDir: '.neurolint-backups',
          maxBackups: 10
        });
        
        const backupResult = await backupManager.createBackup(filePath, 'layer-4-hydration');
        
        if (backupResult.success) {
          results.push({ type: 'backup', file: filePath, success: true, backupPath: backupResult.backupPath });
          if (verbose) process.stdout.write(`Created centralized backup: ${path.basename(backupResult.backupPath)}\n`);
        } else {
          if (verbose) process.stderr.write(`Warning: Could not create backup: ${backupResult.error}\n`);
        }
      } catch (error) {
        if (verbose) process.stderr.write(`Warning: Backup creation failed: ${error.message}\n`);
      }
    }

    // Check for empty input
    if (!code.trim()) {
      results.push({ type: 'empty', file: filePath, success: false, error: 'No changes were made' });
      return {
        success: false,
        code,
        originalCode: code,
        changeCount: 0,
        results
      };
    }

    // File type check
    const fileExt = path.extname(filePath).slice(1);
    if (!['ts', 'tsx', 'js', 'jsx'].includes(fileExt)) {
      return {
        success: true,
        code,
        originalCode: code,
        changeCount: 0,
        results
      };
    }

    // Create AST transformer
    const transformer = new ASTTransformer();
    const changes = [];

    // Define AST visitors for Layer 4 hydration fixes
    const visitors = {
      // Handle localStorage, sessionStorage calls
      MemberExpression(path) {
        // Check for localStorage/sessionStorage method calls
        if (t.isIdentifier(path.node.object)) {
          const objName = path.node.object.name;
          const propName = path.node.property.name;
          
          // localStorage.getItem, setItem, removeItem, etc.
          if ((objName === 'localStorage' || objName === 'sessionStorage') &&
              ['getItem', 'setItem', 'removeItem', 'clear'].includes(propName)) {
            
            // Only wrap if it's part of a call expression
            if (t.isCallExpression(path.parent) && path.parent.callee === path.node) {
              // Check if already guarded
              if (!isAlreadyGuarded(path.parentPath, 'window')) {
                // Wrap the entire CallExpression
                const callExpr = path.parentPath.node;
                const guarded = wrapWithSSRGuard(callExpr, 'window');
                path.parentPath.replaceWith(guarded);
                
                changes.push({
                  type: 'storage-guard',
                  description: `Added SSR guard for ${objName}.${propName}()`,
                  location: path.node.loc
                });
                changeCount++;
                
                if (verbose) {
                  process.stdout.write(`[INFO] Added SSR guard for ${objName}.${propName}()\n`);
                }
              }
            }
          }
          
          // window.matchMedia, window.location, etc.
          if (objName === 'window' && 
              ['matchMedia', 'location', 'navigator', 'innerWidth', 'innerHeight', 'scrollY', 'scrollX'].includes(propName)) {
            
            // Don't guard addEventListener/removeEventListener here (handled separately)
            if (['addEventListener', 'removeEventListener'].includes(propName)) {
              return;
            }
            
            if (!isAlreadyGuarded(path, 'window')) {
              // Find the top of the member/call chain
              let topPath = path;
              while (topPath.parentPath) {
                const parent = topPath.parent;
                // Continue climbing if parent is MemberExpression and we're the object
                if (t.isMemberExpression(parent) && parent.object === topPath.node) {
                  topPath = topPath.parentPath;
                  continue;
                }
                // Continue climbing if parent is CallExpression and we're the callee
                if (t.isCallExpression(parent) && parent.callee === topPath.node) {
                  topPath = topPath.parentPath;
                  continue;
                }
                // Otherwise stop climbing
                break;
              }
              
              // Check if this chain is the LHS of an assignment or part of an update expression
              let currentPath = topPath;
              let needsStatementGuard = false;
              
              // Check for assignment LHS using parentKey (not object identity)
              if (currentPath.parentPath && currentPath.parentPath.isAssignmentExpression() && 
                  currentPath.key === 'left') {
                needsStatementGuard = true;
              }
              
              // Check for update expression (++, --) using parentKey
              if (currentPath.parentPath && currentPath.parentPath.isUpdateExpression() &&
                  currentPath.key === 'argument') {
                needsStatementGuard = true;
              }
              
              if (needsStatementGuard) {
                // Find the enclosing statement
                let statementPath = currentPath;
                while (statementPath && !t.isStatement(statementPath.node)) {
                  statementPath = statementPath.parentPath;
                }
                
                if (statementPath && t.isExpressionStatement(statementPath.node)) {
                  // Preserve comments from original
                  const originalLeading = statementPath.node.leadingComments;
                  const originalTrailing = statementPath.node.trailingComments;
                  
                  // Create a fresh expression statement (not cloned) to avoid comment issues
                  const newStatement = t.expressionStatement(
                    t.cloneNode(statementPath.node.expression, /*deep*/ true, /*withoutLoc*/ false)
                  );
                  
                  // Attach only trailing comments to the new statement inside the block
                  if (originalTrailing) {
                    newStatement.trailingComments = originalTrailing;
                  }
                  
                  // Wrap the entire statement in if (typeof window !== "undefined")
                  const ifStatement = t.ifStatement(
                    t.binaryExpression(
                      '!==',
                      t.unaryExpression('typeof', t.identifier('window'), true),
                      t.stringLiteral('undefined')
                    ),
                    t.blockStatement([newStatement])
                  );
                  
                  // Attach only leading comments to the if statement
                  if (originalLeading) {
                    ifStatement.leadingComments = originalLeading;
                  }
                  
                  statementPath.replaceWith(ifStatement);
                  
                  changes.push({
                    type: 'window-guard-statement',
                    description: `Wrapped window.${propName} assignment/update in SSR guard`,
                    location: path.node.loc
                  });
                  changeCount++;
                  
                  if (verbose) {
                    process.stdout.write(`[INFO] Wrapped window.${propName} assignment/update in SSR guard\n`);
                  }
                }
                return;
              }
              
              // For read operations, wrap the entire chain
              const guarded = wrapWithSSRGuard(topPath.node, 'window');
              topPath.replaceWith(guarded);
              
              changes.push({
                type: 'window-guard',
                description: `Added SSR guard for window.${propName} chain`,
                location: path.node.loc
              });
              changeCount++;
              
              if (verbose) {
                process.stdout.write(`[INFO] Added SSR guard for window.${propName} chain\n`);
              }
            }
          }
          
          // document.querySelector, document.getElementById, etc.
          if (objName === 'document' && 
              ['querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 
               'getElementsByTagName', 'body', 'documentElement', 'head'].includes(propName)) {
            
            if (!isAlreadyGuarded(path, 'document')) {
              // Find the top of the member/call chain
              let topPath = path;
              while (topPath.parentPath) {
                const parent = topPath.parent;
                // Continue climbing if parent is MemberExpression and we're the object
                if (t.isMemberExpression(parent) && parent.object === topPath.node) {
                  topPath = topPath.parentPath;
                  continue;
                }
                // Continue climbing if parent is CallExpression and we're the callee
                if (t.isCallExpression(parent) && parent.callee === topPath.node) {
                  topPath = topPath.parentPath;
                  continue;
                }
                // Otherwise stop climbing
                break;
              }
              
              // Check if this chain is the LHS of an assignment or part of an update expression
              let currentPath = topPath;
              let needsStatementGuard = false;
              
              // Check for assignment LHS using parentKey (not object identity)
              if (currentPath.parentPath && currentPath.parentPath.isAssignmentExpression() && 
                  currentPath.key === 'left') {
                needsStatementGuard = true;
              }
              
              // Check for update expression (++, --) using parentKey
              if (currentPath.parentPath && currentPath.parentPath.isUpdateExpression() &&
                  currentPath.key === 'argument') {
                needsStatementGuard = true;
              }
              
              if (needsStatementGuard) {
                // Find the enclosing statement
                let statementPath = currentPath;
                while (statementPath && !t.isStatement(statementPath.node)) {
                  statementPath = statementPath.parentPath;
                }
                
                if (statementPath && t.isExpressionStatement(statementPath.node)) {
                  // Preserve comments from original
                  const originalLeading = statementPath.node.leadingComments;
                  const originalTrailing = statementPath.node.trailingComments;
                  
                  // Create a fresh expression statement (not cloned) to avoid comment issues
                  const newStatement = t.expressionStatement(
                    t.cloneNode(statementPath.node.expression, /*deep*/ true, /*withoutLoc*/ false)
                  );
                  
                  // Attach only trailing comments to the new statement inside the block
                  if (originalTrailing) {
                    newStatement.trailingComments = originalTrailing;
                  }
                  
                  // Wrap the entire statement in if (typeof document !== "undefined")
                  const ifStatement = t.ifStatement(
                    t.binaryExpression(
                      '!==',
                      t.unaryExpression('typeof', t.identifier('document'), true),
                      t.stringLiteral('undefined')
                    ),
                    t.blockStatement([newStatement])
                  );
                  
                  // Attach only leading comments to the if statement
                  if (originalLeading) {
                    ifStatement.leadingComments = originalLeading;
                  }
                  
                  statementPath.replaceWith(ifStatement);
                  
                  changes.push({
                    type: 'document-guard-statement',
                    description: `Wrapped document.${propName} assignment/update in SSR guard`,
                    location: path.node.loc
                  });
                  changeCount++;
                  
                  if (verbose) {
                    process.stdout.write(`[INFO] Wrapped document.${propName} assignment/update in SSR guard\n`);
                  }
                }
                return;
              }
              
              // For read operations, wrap the entire chain
              const guarded = wrapWithSSRGuard(topPath.node, 'document');
              topPath.replaceWith(guarded);
              
              changes.push({
                type: 'document-guard',
                description: `Added SSR guard for document.${propName} chain`,
                location: path.node.loc
              });
              changeCount++;
              
              if (verbose) {
                process.stdout.write(`[INFO] Added SSR guard for document.${propName} chain\n`);
              }
            }
          }
        }
      },
      
      // Handle assignments and updates to window/document properties
      AssignmentExpression(path) {
        const left = path.node.left;
        
        // Debug: log all assignments
        if (verbose) {
          console.log('[DEBUG] Found AssignmentExpression');
        }
        
        // Check if LHS starts with window or document
        const startsWithGlobal = (node) => {
          if (t.isIdentifier(node)) {
            return node.name === 'window' || node.name === 'document';
          }
          if (t.isMemberExpression(node)) {
            return startsWithGlobal(node.object);
          }
          return false;
        };
        
        if (startsWithGlobal(left)) {
          if (verbose) {
            console.log('[DEBUG] Assignment starts with global');
          }
          const globalName = t.isIdentifier(left) ? left.name : 
                            t.isMemberExpression(left) && t.isIdentifier(left.object) ? left.object.name :
                            left.object && left.object.object && t.isIdentifier(left.object.object) ? left.object.object.name :
                            null;
          
          if (globalName && !isAlreadyGuarded(path, globalName)) {
            // Find the enclosing statement
            let statementPath = path;
            while (statementPath && !t.isStatement(statementPath.node)) {
              statementPath = statementPath.parentPath;
            }
            
            if (statementPath && t.isExpressionStatement(statementPath.node)) {
              // Preserve comments from original
              const originalLeading = statementPath.node.leadingComments;
              const originalTrailing = statementPath.node.trailingComments;
              
              // Create a fresh expression statement (not cloned) to avoid comment issues
              const newStatement = t.expressionStatement(
                t.cloneNode(statementPath.node.expression, /*deep*/ true, /*withoutLoc*/ false)
              );
              
              // Attach only trailing comments to the new statement inside the block
              if (originalTrailing) {
                newStatement.trailingComments = originalTrailing;
              }
              
              // Wrap in if (typeof global !== "undefined")
              const ifStatement = t.ifStatement(
                t.binaryExpression(
                  '!==',
                  t.unaryExpression('typeof', t.identifier(globalName), true),
                  t.stringLiteral('undefined')
                ),
                t.blockStatement([newStatement])
              );
              
              // Attach only leading comments to the if statement
              if (originalLeading) {
                ifStatement.leadingComments = originalLeading;
              }
              
              statementPath.replaceWith(ifStatement);
              statementPath.skip(); // Skip the newly created if statement to prevent re-visiting
              
              changes.push({
                type: `${globalName}-guard-assignment`,
                description: `Wrapped ${globalName} assignment in SSR guard`,
                location: path.node.loc
              });
              changeCount++;
              
              if (verbose) {
                process.stdout.write(`[INFO] Wrapped ${globalName} assignment in SSR guard\n`);
              }
            }
          }
        }
      },
      
      // Handle update expressions (++, --) on window/document properties
      UpdateExpression(path) {
        const argument = path.node.argument;
        
        // Check if argument starts with window or document
        const startsWithGlobal = (node) => {
          if (t.isIdentifier(node)) {
            return node.name === 'window' || node.name === 'document';
          }
          if (t.isMemberExpression(node)) {
            return startsWithGlobal(node.object);
          }
          return false;
        };
        
        if (startsWithGlobal(argument)) {
          const globalName = t.isIdentifier(argument) ? argument.name : 
                            t.isMemberExpression(argument) && t.isIdentifier(argument.object) ? argument.object.name :
                            argument.object && argument.object.object && t.isIdentifier(argument.object.object) ? argument.object.object.name :
                            null;
          
          if (globalName && !isAlreadyGuarded(path, globalName)) {
            // Find the enclosing statement
            let statementPath = path;
            while (statementPath && !t.isStatement(statementPath.node)) {
              statementPath = statementPath.parentPath;
            }
            
            if (statementPath && t.isExpressionStatement(statementPath.node)) {
              // Preserve comments from original
              const originalLeading = statementPath.node.leadingComments;
              const originalTrailing = statementPath.node.trailingComments;
              
              // Create a fresh expression statement (not cloned) to avoid comment issues
              const newStatement = t.expressionStatement(
                t.cloneNode(statementPath.node.expression, /*deep*/ true, /*withoutLoc*/ false)
              );
              
              // Attach only trailing comments to the new statement inside the block
              if (originalTrailing) {
                newStatement.trailingComments = originalTrailing;
              }
              
              // Wrap in if (typeof global !== "undefined")
              const ifStatement = t.ifStatement(
                t.binaryExpression(
                  '!==',
                  t.unaryExpression('typeof', t.identifier(globalName), true),
                  t.stringLiteral('undefined')
                ),
                t.blockStatement([newStatement])
              );
              
              // Attach only leading comments to the if statement
              if (originalLeading) {
                ifStatement.leadingComments = originalLeading;
              }
              
              statementPath.replaceWith(ifStatement);
              
              changes.push({
                type: `${globalName}-guard-update`,
                description: `Wrapped ${globalName} update in SSR guard`,
                location: path.node.loc
              });
              changeCount++;
              
              if (verbose) {
                process.stdout.write(`[INFO] Wrapped ${globalName} update in SSR guard\n`);
              }
              
              // Skip further processing
              path.skip();
            }
          }
        }
      },
      
      // Handle useEffect with addEventListener that needs cleanup
      CallExpression(path) {
        // Look for useEffect calls
        if (t.isIdentifier(path.node.callee, { name: 'useEffect' })) {
          const effectCallback = path.node.arguments[0];
          
          if (t.isArrowFunctionExpression(effectCallback) || t.isFunctionExpression(effectCallback)) {
            const body = effectCallback.body;
            
            // Track if we found addEventListener without cleanup
            let hasAddEventListener = false;
            let hasRemoveEventListener = false;
            let hasReturnCleanup = false;
            
            // Check body for addEventListener
            const checkBody = (node) => {
              if (t.isBlockStatement(node)) {
                node.body.forEach(statement => {
                  // Check for addEventListener
                  if (t.isExpressionStatement(statement) && 
                      t.isCallExpression(statement.expression)) {
                    const call = statement.expression;
                    if (t.isMemberExpression(call.callee)) {
                      const method = call.callee.property;
                      if (t.isIdentifier(method, { name: 'addEventListener' })) {
                        hasAddEventListener = true;
                      }
                    }
                  }
                  
                  // Check for return cleanup function
                  if (t.isReturnStatement(statement) && 
                      (t.isArrowFunctionExpression(statement.argument) || 
                       t.isFunctionExpression(statement.argument))) {
                    hasReturnCleanup = true;
                    
                    // Check if cleanup has removeEventListener
                    const cleanupBody = statement.argument.body;
                    if (t.isBlockStatement(cleanupBody)) {
                      cleanupBody.body.forEach(cleanupStmt => {
                        if (t.isExpressionStatement(cleanupStmt) && 
                            t.isCallExpression(cleanupStmt.expression)) {
                          const call = cleanupStmt.expression;
                          if (t.isMemberExpression(call.callee) && 
                              t.isIdentifier(call.callee.property, { name: 'removeEventListener' })) {
                            hasRemoveEventListener = true;
                          }
                        }
                      });
                    }
                  }
                });
              }
            };
            
            checkBody(body);
            
            // If we have addEventListener but no cleanup, add warning
            if (hasAddEventListener && !hasReturnCleanup) {
              changes.push({
                type: 'event-listener-warning',
                description: 'useEffect with addEventListener should return cleanup function',
                location: path.node.loc
              });
              
              if (verbose) {
                process.stdout.write('[WARNING] useEffect with addEventListener missing cleanup\n');
              }
            }
          }
        }
      }
    };

    // Apply AST transformations
    try {
      const result = transformer.transform(code, visitors, { filename: filePath });
      updatedCode = result.code;
      
      results.push(...changes.map(c => ({
        type: 'hydration',
        file: filePath,
        success: true,
        changes: 1,
        details: c.description
      })));
    } catch (error) {
      if (verbose) process.stderr.write(`AST transformation error: ${error.message}\n`);
      // Fall back to original code if AST fails
      return {
        success: false,
        code,
        originalCode: code,
        changeCount: 0,
        results: [{ type: 'error', file: filePath, success: false, error: error.message }]
      };
    }

    // Write changes if not dry-run
    if (dryRun) {
      return {
        success: true,
        code: updatedCode,
        originalCode: code,
        changeCount,
        results
      };
    }

    if (changeCount > 0 && existsAsFile) {
      await fs.writeFile(filePath, updatedCode);
      results.push({ type: 'write', file: filePath, success: true, changes: changeCount });
    }

    if (verbose && changeCount > 0) {
      process.stdout.write(`Layer 4 applied ${changeCount} changes to ${path.basename(filePath)}\n`);
    }

    return {
      success: results.every(r => r.success !== false),
      code: updatedCode,
      originalCode: code,
      changeCount,
      results
    };
  } catch (error) {
    if (verbose) process.stderr.write(`Layer 4 failed: ${error.message}\n`);
    results.push({ type: 'error', file: filePath, success: false, error: error.message });
    return {
      success: false,
      code,
      originalCode: code,
      changeCount: 0,
      results
    };
  }
}

module.exports = { transform };
