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
const parser = require('@babel/parser');

/**
 * Layer 4: Hydration and SSR Fixes (AST-based)
 * - Add window/document guards using proper code parsing
 * - Add mounted state for theme providers
 * - Fix hydration mismatches in useEffect
 * - Handles nested parentheses correctly via AST
 */

/**
 * Validate syntax using Babel parser
 * Returns true if code is valid JavaScript/TypeScript, false otherwise
 */
function validateSyntax(code) {
  try {
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      allowImportExportEverywhere: true,
      strictMode: false
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Regex-based fallback for hydration guards
 * Used when AST transformation fails
 */
function applyRegexHydrationFallbacks(input) {
  let code = input;
  const changes = [];
  
  // Simple regex fallback for localStorage access
  const localStoragePattern = /localStorage\.(getItem|setItem|removeItem|clear)\s*\(/g;
  let match;
  let lsCount = 0;
  
  while ((match = localStoragePattern.exec(input)) !== null) {
    lsCount++;
  }
  
  if (lsCount > 0) {
    // Wrap localStorage calls with typeof window check (simple fallback)
    code = code.replace(
      /localStorage\.(getItem|setItem|removeItem|clear)\s*\([^)]*\)/g,
      (match) => `(typeof window !== "undefined" ? ${match} : null)`
    );
    changes.push({
      type: 'storage-guard-fallback',
      description: `Added SSR guard for ${lsCount} localStorage calls (regex fallback)`,
      location: null
    });
  }
  
  // Simple regex fallback for sessionStorage access
  const sessionStoragePattern = /sessionStorage\.(getItem|setItem|removeItem|clear)\s*\(/g;
  let ssCount = 0;
  
  while ((match = sessionStoragePattern.exec(input)) !== null) {
    ssCount++;
  }
  
  if (ssCount > 0) {
    code = code.replace(
      /sessionStorage\.(getItem|setItem|removeItem|clear)\s*\([^)]*\)/g,
      (match) => `(typeof window !== "undefined" ? ${match} : null)`
    );
    changes.push({
      type: 'storage-guard-fallback',
      description: `Added SSR guard for ${ssCount} sessionStorage calls (regex fallback)`,
      location: null
    });
  }
  
  // Simple regex fallback for window.matchMedia, window.location, etc.
  const windowApiPattern = /window\.(matchMedia|location|navigator|innerWidth|innerHeight)\b/g;
  let windowCount = 0;
  
  while ((match = windowApiPattern.exec(input)) !== null) {
    windowCount++;
  }
  
  if (windowCount > 0) {
    code = code.replace(
      /window\.(matchMedia|location|navigator|innerWidth|innerHeight)([^;{]*)/g,
      (match, prop, rest) => `(typeof window !== "undefined" ? window.${prop}${rest} : null)`
    );
    changes.push({
      type: 'window-guard-fallback',
      description: `Added SSR guard for ${windowCount} window API calls (regex fallback)`,
      location: null
    });
  }
  
  // Simple regex fallback for document access
  const documentApiPattern = /document\.(querySelector|getElementById|body|documentElement)\b/g;
  let docCount = 0;
  
  while ((match = documentApiPattern.exec(input)) !== null) {
    docCount++;
  }
  
  if (docCount > 0) {
    code = code.replace(
      /document\.(querySelector|getElementById|querySelectorAll|getElementsByClassName|getElementsByTagName|body|documentElement)([^;{]*)/g,
      (match, method, rest) => `(typeof document !== "undefined" ? document.${method}${rest} : null)`
    );
    changes.push({
      type: 'document-guard-fallback',
      description: `Added SSR guard for ${docCount} document API calls (regex fallback)`,
      location: null
    });
  }
  
  return { code, changes };
}

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
 * Only accepts guards with !== operator and "undefined" literal
 */
function isAlreadyGuarded(path, guardType = 'window') {
  let parent = path.parentPath;
  
  // Traverse up to find conditional expression or if statement
  while (parent) {
    // Check for ternary operator: typeof window !== "undefined" ? ... : null
    if (t.isConditionalExpression(parent.node)) {
      const test = parent.node.test;
      if (t.isBinaryExpression(test) && 
          test.operator === '!==' &&
          t.isUnaryExpression(test.left) && 
          test.left.operator === 'typeof' &&
          t.isStringLiteral(test.right, { value: 'undefined' })) {
        
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
          test.operator === '!==' &&
          t.isUnaryExpression(test.left) && 
          test.left.operator === 'typeof' &&
          t.isStringLiteral(test.right, { value: 'undefined' })) {
        
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
 * Extract the root global identifier from a member expression tree
 * Walks the full tree regardless of depth
 * Returns 'window', 'document', or null
 */
function getRootGlobalName(node) {
  if (t.isIdentifier(node)) {
    return (node.name === 'window' || node.name === 'document') ? node.name : null;
  }
  if (t.isMemberExpression(node)) {
    return getRootGlobalName(node.object);
  }
  return null;
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
                  
                  // Preserve trailing comments intelligently
                  if (originalTrailing && originalTrailing.length > 0) {
                    if (statementPath.node.loc) {
                      // With location data, preserve same-line comments
                      const statementEndLine = statementPath.node.loc.end.line;
                      const sameLineComments = originalTrailing.filter(comment => 
                        comment.loc && comment.loc.start.line === statementEndLine
                      );
                      if (sameLineComments.length > 0) {
                        newStatement.trailingComments = sameLineComments;
                      }
                    } else {
                      // Without location data, preserve all trailing comments (safe fallback)
                      newStatement.trailingComments = originalTrailing;
                    }
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
                  
                  // Attach leading comments to the if statement
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
                  
                  // Preserve trailing comments intelligently
                  if (originalTrailing && originalTrailing.length > 0) {
                    if (statementPath.node.loc) {
                      // With location data, preserve same-line comments
                      const statementEndLine = statementPath.node.loc.end.line;
                      const sameLineComments = originalTrailing.filter(comment => 
                        comment.loc && comment.loc.start.line === statementEndLine
                      );
                      if (sameLineComments.length > 0) {
                        newStatement.trailingComments = sameLineComments;
                      }
                    } else {
                      // Without location data, preserve all trailing comments (safe fallback)
                      newStatement.trailingComments = originalTrailing;
                    }
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
                  
                  // Attach leading comments to the if statement
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
          // Use helper to extract root global name regardless of depth
          const globalName = getRootGlobalName(left);
          
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
              
              // Preserve trailing comments intelligently
              if (originalTrailing && originalTrailing.length > 0) {
                if (statementPath.node.loc) {
                  // With location data, preserve same-line comments
                  const statementEndLine = statementPath.node.loc.end.line;
                  const sameLineComments = originalTrailing.filter(comment => 
                    comment.loc && comment.loc.start.line === statementEndLine
                  );
                  if (sameLineComments.length > 0) {
                    newStatement.trailingComments = sameLineComments;
                  }
                } else {
                  // Without location data, preserve all trailing comments (safe fallback)
                  newStatement.trailingComments = originalTrailing;
                }
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
              
              // Attach leading comments to the if statement
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
          // Use helper to extract root global name regardless of depth
          const globalName = getRootGlobalName(argument);
          
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
              
              // Preserve trailing comments intelligently
              if (originalTrailing && originalTrailing.length > 0) {
                if (statementPath.node.loc) {
                  // With location data, preserve same-line comments
                  const statementEndLine = statementPath.node.loc.end.line;
                  const sameLineComments = originalTrailing.filter(comment => 
                    comment.loc && comment.loc.start.line === statementEndLine
                  );
                  if (sameLineComments.length > 0) {
                    newStatement.trailingComments = sameLineComments;
                  }
                } else {
                  // Without location data, preserve all trailing comments (safe fallback)
                  newStatement.trailingComments = originalTrailing;
                }
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
              
              // Attach leading comments to the if statement
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
            let body = effectCallback.body;
            let normalizedToBlock = false;
            
            // Normalize concise arrow callbacks to block statements
            // But preserve cleanup functions (arrow/function expressions)
            if (!t.isBlockStatement(body)) {
              // Check if it's already a cleanup function (returns arrow/function)
              if (t.isArrowFunctionExpression(body) || t.isFunctionExpression(body)) {
                // Keep it as a cleanup return - wrap in return statement
                const blockBody = t.blockStatement([
                  t.returnStatement(body)
                ]);
                effectCallback.body = blockBody;
                body = blockBody;
              } else {
                // It's an expression, convert to expression statement
                const blockBody = t.blockStatement([
                  t.expressionStatement(body)
                ]);
                effectCallback.body = blockBody;
                body = blockBody;
                normalizedToBlock = true;
              }
            }
            
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
            
            // If we have addEventListener but no cleanup, add cleanup function
            if (hasAddEventListener && !hasReturnCleanup && t.isBlockStatement(body)) {
              // Collect all addEventListener calls to generate cleanup
              const addEventListeners = [];
              
              body.body.forEach(statement => {
                if (t.isExpressionStatement(statement) && 
                    t.isCallExpression(statement.expression)) {
                  const call = statement.expression;
                  if (t.isMemberExpression(call.callee) && 
                      t.isIdentifier(call.callee.property, { name: 'addEventListener' })) {
                    // Store the object (e.g., window), event name, handler, and options (if any)
                    addEventListeners.push({
                      object: call.callee.object,
                      eventName: call.arguments[0],
                      handler: call.arguments[1],
                      options: call.arguments[2] || null
                    });
                  }
                }
              });
              
              // Generate cleanup function with removeEventListener calls
              if (addEventListeners.length > 0) {
                const cleanupStatements = addEventListeners.map(listener => {
                  // Build removeEventListener arguments (include options if present)
                  const removeArgs = [t.cloneNode(listener.eventName), t.cloneNode(listener.handler)];
                  if (listener.options) {
                    removeArgs.push(t.cloneNode(listener.options));
                  }
                  
                  return t.expressionStatement(
                    t.callExpression(
                      t.memberExpression(
                        t.cloneNode(listener.object),
                        t.identifier('removeEventListener')
                      ),
                      removeArgs
                    )
                  );
                });
                
                // Create return statement with cleanup function
                const returnCleanup = t.returnStatement(
                  t.arrowFunctionExpression(
                    [],
                    t.blockStatement(cleanupStatements)
                  )
                );
                
                // Add cleanup to the end of useEffect body
                body.body.push(returnCleanup);
                
                changes.push({
                  type: 'event-listener-cleanup',
                  description: `Added removeEventListener cleanup for ${addEventListeners.length} event listener(s)`,
                  location: path.node.loc
                });
                changeCount++;
                
                if (verbose) {
                  process.stdout.write(`[INFO] Added removeEventListener cleanup for ${addEventListeners.length} event listener(s)\n`);
                }
              }
            }
          }
        }
      }
    };

    // Apply AST transformations
    // Following orchestration pattern: AST-first with validation, fallback to regex
    let astSucceeded = false;
    let astValidationFailed = false;
    
    try {
      const result = transformer.transform(code, visitors, { filename: filePath });
      
      // Validate AST transformation output
      const isValid = validateSyntax(result.code);
      
      if (isValid) {
        // AST succeeded and output is valid - accept changes
        updatedCode = result.code;
        astSucceeded = true;
        
        results.push(...changes.map(c => ({
          type: 'hydration',
          file: filePath,
          success: true,
          changes: 1,
          details: c.description
        })));
        
        if (verbose && changes.length > 0) {
          process.stdout.write(`[INFO] AST-based hydration transformations: ${changes.length} changes (validated)\n`);
        }
      } else {
        // Validation failed - revert to original state
        astValidationFailed = true;
        updatedCode = code;
        changeCount = 0;
        changes.length = 0;
        
        if (verbose) {
          process.stderr.write(`[WARNING] AST transformation produced invalid syntax - reverted to original\n`);
        }
      }
    } catch (error) {
      // AST transformation failed - will try regex fallback below
      if (verbose) {
        process.stderr.write(`[WARNING] AST transformation failed: ${error.message}\n`);
      }
    }
    
    // If AST failed or validation failed, try regex fallback
    if (!astSucceeded) {
      if (verbose) {
        process.stdout.write(`[INFO] Attempting regex fallback for hydration transformations\n`);
      }
      
      const beforeRegex = code;
      const regexResult = applyRegexHydrationFallbacks(code);
      
      // Validate regex fallback output
      const regexMadeChanges = regexResult.code !== beforeRegex;
      const regexOutputValid = validateSyntax(regexResult.code);
      
      if (regexMadeChanges && regexOutputValid) {
        // Regex produced valid changes - accept them
        updatedCode = regexResult.code;
        changeCount = regexResult.changes.length;
        
        results.push(...regexResult.changes.map(c => ({
          type: 'hydration-fallback',
          file: filePath,
          success: true,
          changes: 1,
          details: c.description
        })));
        
        if (verbose) {
          process.stdout.write(`[INFO] Regex fallback succeeded with ${regexResult.changes.length} changes (validated)\n`);
        }
      } else if (regexMadeChanges && !regexOutputValid) {
        // Regex produced INVALID code - REJECT and revert
        updatedCode = beforeRegex;
        changeCount = 0;
        
        if (verbose) {
          process.stderr.write(`[ERROR] Regex fallback produced invalid syntax - rejected changes\n`);
        }
      } else {
        // Regex made no changes - keep original
        updatedCode = beforeRegex;
        changeCount = 0;
        
        if (verbose) {
          process.stdout.write(`[INFO] Regex fallback made no changes\n`);
        }
      }
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
