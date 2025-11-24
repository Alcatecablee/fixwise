#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * Layer 3: Component Fixes (AST-based)
 * Adds React component improvements and accessibility using proper code parsing
 */

const fs = require('fs').promises;
const path = require('path');
const parser = require('@babel/parser');
const ASTTransformer = require('../ast-transformer');

async function isRegularFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Validate syntax of transformed code
 * Returns true if code is syntactically valid, false otherwise
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

function applyRegexFallbacks(input) {
  let code = input;
  const changes = [];

  // Ensure UI component imports for Button/Input/Card if used
  const needButtonImport = /<Button\b/.test(code) && !/import\s*{[^}]*Button[^}]*}\s*from\s*["']@\/components\/ui\/button["']/.test(code);
  const needInputImport = /<Input\b/.test(code) && !/import\s*{[^}]*Input[^}]*}\s*from\s*["']@\/components\/ui\/input["']/.test(code);
  const needCardImport = /<Card\b/.test(code) && !/import\s*{[^}]*Card[^}]*}\s*from\s*["']@\/components\/ui\/card["']/.test(code);

  const importLines = [];
  if (needButtonImport) importLines.push("import { Button } from \"@/components/ui/button\";");
  if (needInputImport) importLines.push("import { Input } from \"@/components/ui/input\";");
  if (needCardImport) importLines.push("import { Card } from \"@/components/ui/card\";");
  if (importLines.length) {
    code = importLines.join('\n') + '\n' + code;
    changes.push({ description: 'Added missing UI imports', location: { line: 1 } });
  }

  // Convert HTML button/input to components
  const beforeButtons = code;
  code = code.replace(/<button(\s+[^>]*)?>/g, (m, attrs = '') => `<Button${attrs || ''}>`);
  code = code.replace(/<\/button>/g, '</Button>');
  if (code !== beforeButtons) {
    changes.push({ description: 'Converted HTML button to Button component', location: {} });
    if (!/import\s*{[^}]*Button/.test(beforeButtons)) {
      if (!/import\s*{[^}]*Button[^}]*}\s*from\s*["']@\/components\/ui\/button["']/.test(code)) {
        code = `import { Button } from "@/components/ui/button";\n` + code;
      }
    }
  }

  const beforeInputs = code;
  code = code.replace(/<input(\s+[^>]*)?\/>/g, (m, attrs = '') => `<Input${attrs || ''} />`);
  if (code !== beforeInputs) {
    changes.push({ description: 'Converted HTML input to Input component', location: {} });
    if (!/import\s*{[^}]*Input/.test(beforeInputs)) {
      if (!/import\s*{[^}]*Input[^}]*}\s*from\s*["']@\/components\/ui\/input["']/.test(code)) {
        code = `import { Input } from "@/components/ui/input";\n` + code;
      }
    }
  }

  // Add default variant to Button without variant
  const btnVariantRegex = /<Button(?![^>]*\bvariant=)([^>]*)>/g;
  code = code.replace(btnVariantRegex, (m, attrs) => {
    changes.push({ description: 'Added default Button variant', location: {} });
    return `<Button variant="default"${attrs}>`;
  });

  // Add default type to Input without type
  const inputTypeRegex = /<Input(?![^>]*\btype=)([^>]*)\/>/g;
  code = code.replace(inputTypeRegex, (m, attrs) => {
    changes.push({ description: 'Added default Input type', location: {} });
    return `<Input type="text"${attrs} />`;
  });

  // Add aria-label to <button> turned into <Button> or existing Button without aria-label
  const ariaBtnRegex = /<Button(?![^>]*\baria-label=)([^>]*)>([^<]*)<\/Button>/g;
  code = code.replace(ariaBtnRegex, (m, attrs, inner) => {
    const label = (inner || 'Button').toString().trim() || 'Button';
    changes.push({ description: 'Added aria-label to Button', location: {} });
    return `<Button aria-label="${label}"${attrs}>${inner}</Button>`;
  });

  // Add alt text to img without alt
  const imgAltRegex = /<img(?![^>]*\balt=)([^>]*)>/g;
  code = code.replace(imgAltRegex, (m, attrs) => {
    changes.push({ description: 'Added alt attribute to img', location: {} });
    return `<img alt="Image"${attrs}>`;
  });

  // Tokenize parameters using stack-based parsing
  const tokenizeParams = (str) => {
    const tokens = [];
    let current = '';
    let depth = 0;
    let hasComplex = false;
    
    for (const char of str) {
      if (char === '(' || char === '{' || char === '[') {
        depth++;
        if (char === '{' || char === '[') hasComplex = true;
        current += char;
      } else if (char === ')' || char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        tokens.push(current.trim());
        current = '';
      } else {
        if (char === '=' || char === ':') hasComplex = true;
        current += char;
      }
    }
    if (current.trim()) tokens.push(current.trim());
    
    // Extract second identifier if it exists (handle defaults like `idx = 0`)
    let secondIdentifier = null;
    if (tokens.length > 1) {
      const secondToken = tokens[1];
      // Check if simple identifier OR identifier with default value
      const identMatch = secondToken.match(/^([a-zA-Z_$][\w$]*)(?:\s*=|$)/);
      if (identMatch) {
        secondIdentifier = identMatch[1];
      }
    }
    
    return { tokens, hasComplex, secondIdentifier };
  };
  
  // Classify params and generate key expression
  const classifyMapParams = (params) => {
    const trimmed = params.trim();
    const hadParens = trimmed.startsWith('(') && trimmed.endsWith(')');
    const inner = hadParens ? trimmed.slice(1, -1).trim() : trimmed;
    
    const { tokens, hasComplex, secondIdentifier } = tokenizeParams(inner);
    const firstToken = tokens[0]?.trim() || '';
    
    const isSimpleIdentifier = /^[a-zA-Z_$][\w$]*$/.test(firstToken);
    const isDestructured = firstToken.startsWith('{') || firstToken.startsWith('[');
    
    // Regex fallback rule: synthesize index for ALL callbacks without a second param
    let keyExpr, needsIndex;
    
    if (secondIdentifier) {
      // Has valid second parameter, reuse it
      keyExpr = secondIdentifier;
      needsIndex = false;
    } else {
      // No second param: synthesize index for determinism
      keyExpr = 'index';
      needsIndex = true;
    }
    
    return { keyExpr, needsIndex, originalParams: trimmed, hadParens };
  };
  
  // Insert index parameter properly
  const insertIndexParam = (params, hadParens) => {
    const trimmed = params.trim();
    
    if (hadParens) {
      const inner = trimmed.slice(1, -1).trim();
      // Handle empty params: () => becomes (index) =>
      if (!inner) {
        return '(index)';
      }
      // Insert before closing paren: (item) => becomes (item, index) =>
      return trimmed.slice(0, -1) + ', index)';
    } else {
      // Wrap and add index: item => becomes (item, index) =>
      return `(${trimmed}, index)`;
    }
  };
  
  // Add key prop to map items missing keys - PAIRED TAGS (e.g., <Tag>...</Tag>)
  // IMPROVED REGEX: Properly captures ALL parameter patterns including default params
  // Uses balanced parentheses matching to handle complex cases
  code = code.replace(
    /\{\s*([a-zA-Z_$][\w$]*)\.map\((\((?:[^()]|\([^()]*\))*\)|[^(),]+)\s*=>\s*<([A-Z][\w]*)\b([^>]*)>\s*([^<]*)\s*<\/\3>\s*\)\s*\}/g,
    (m, arr, params, tag, attrs, inner) => {
      if (/\bkey=/.test(m)) return m;
      
      try {
        const { keyExpr, needsIndex, originalParams, hadParens } = classifyMapParams(params);
        const newParams = needsIndex ? insertIndexParam(originalParams, hadParens) : originalParams;
        
        changes.push({ description: 'Added key prop in map()', location: {} });
        return `{ ${arr}.map(${newParams} => <${tag} key={${keyExpr}}${attrs}>${inner}</${tag}>) }`;
      } catch (error) {
        // If classification fails, return original to avoid corruption
        return m;
      }
    }
  );

  // Add key prop to map items missing keys - SELF-CLOSING TAGS (e.g., <Tag />)
  // Handles patterns like: items.map(item => <TodoItem {...item} />)
  code = code.replace(
    /\{\s*([a-zA-Z_$][\w$]*)\.map\((\((?:[^()]|\([^()]*\))*\)|[^(),]+)\s*=>\s*<([A-Z][\w]*)\b([^>]*)\/>\s*\)\s*\}/g,
    (m, arr, params, tag, attrs) => {
      if (/\bkey=/.test(m)) return m;
      
      try {
        const { keyExpr, needsIndex, originalParams, hadParens } = classifyMapParams(params);
        const newParams = needsIndex ? insertIndexParam(originalParams, hadParens) : originalParams;
        
        changes.push({ description: 'Added key prop in map() (self-closing)', location: {} });
        return `{ ${arr}.map(${newParams} => <${tag} key={${keyExpr}}${attrs} />) }`;
      } catch (error) {
        // If classification fails, return original to avoid corruption
        return m;
      }
    }
  );

  // Normalize newlines
  code = code.replace(/\r\n/g, '\n');

  return { code, changes };
}

/**
 * React 19: Component transformation helpers
 */
function convertForwardRefToDirectRef(code) {
  let transformedCode = code;

  // Match complete forwardRef patterns including the closing wrapper
  // Pattern 1: forwardRef with TS generics - full component
  const tsFullPattern = /const\s+(\w+)\s*=\s*forwardRef<[^>]+>\s*\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/g;
  transformedCode = transformedCode.replace(tsFullPattern, (match, name, propsParam, refParam, body) => {
    return `const ${name} = ({ ${refParam}, ...${propsParam} }: any) => {${body}};`;
  });

  // Pattern 2: forwardRef standard - full component with block body
  const stdFullPattern = /const\s+(\w+)\s*=\s*forwardRef\s*\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/g;
  transformedCode = transformedCode.replace(stdFullPattern, (match, name, propsParam, refParam, body) => {
    return `const ${name} = ({ ${refParam}, ...${propsParam} }) => {${body}};`;
  });

  // Pattern 3: forwardRef with single expression (arrow without braces)
  const arrowSinglePattern = /const\s+(\w+)\s*=\s*forwardRef\s*\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\(([\s\S]*?)\)\s*\)\s*;?/g;
  transformedCode = transformedCode.replace(arrowSinglePattern, (match, name, propsParam, refParam, expr) => {
    return `const ${name} = ({ ${refParam}, ...${propsParam} }) => (${expr});`;
  });

  // Import cleanup: remove forwardRef from react imports if not used anymore
  if (!transformedCode.includes('forwardRef(')) {
    transformedCode = transformedCode.replace(/import\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"];?/g, (match, imports) => {
      const list = imports.split(',').map(s => s.trim()).filter(s => s && !/^forwardRef\b/.test(s));
      return list.length > 0 ? `import { ${list.join(', ')} } from 'react';` : '';
    });
    transformedCode = transformedCode.replace(/import\s+React\s*,\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"];?/g, (match, imports) => {
      const list = imports.split(',').map(s => s.trim()).filter(s => s && !/^forwardRef\b/.test(s));
      return list.length > 0 ? `import React, { ${list.join(', ')} } from 'react';` : `import React from 'react';`;
    });
  }

  return transformedCode;
}

function convertStringRefsToCallbacks(code) {
  let transformedCode = code;
  const stringRefPattern = /ref=(["'])([\w$]+)\1/g;
  transformedCode = transformedCode.replace(stringRefPattern, (match, quote, refName) => {
    if (code.includes('class ') || code.includes('this.')) {
      return `ref={el => this.${refName} = el}`;
    }
    return `ref={${refName}Ref}`;
  });
  return transformedCode;
}

function detectPropTypesUsage(code) {
  const warnings = [];
  const propTypesPattern = /(\w+)\.propTypes\s*=\s*\{/g;
  let m;
  while ((m = propTypesPattern.exec(code)) !== null) {
    warnings.push({
      type: 'react19-propTypes',
      message: `PropTypes usage detected on ${m[1]} (React 19: consider TypeScript types instead)`,
      suggestion: 'Migrate PropTypes to TypeScript types or interfaces for function components.'
    });
  }
  return warnings;
}

function applyReact19ComponentFixes(code, options = {}) {
  const { verbose = false } = options;
  let transformedCode = code;
  const fixes = [];
  const warnings = [];

  // forwardRef
  if (transformedCode.includes('forwardRef')) {
    const before = transformedCode;
    transformedCode = convertForwardRefToDirectRef(transformedCode);
    if (transformedCode !== before) {
      fixes.push({ type: 'react19-forwardRef', description: 'Converted forwardRef to direct ref prop' });
      if (verbose) process.stdout.write('[INFO] Converted forwardRef to direct ref prop for React 19 compatibility\n');
    }
  }

  // string refs
  if (transformedCode.includes('ref="') || transformedCode.includes("ref='")) {
    const before = transformedCode;
    transformedCode = convertStringRefsToCallbacks(transformedCode);
    if (transformedCode !== before) {
      fixes.push({ type: 'react19-stringRefs', description: 'Converted string refs to callback/useRef pattern' });
      if (verbose) process.stdout.write('[INFO] Converted string refs to callback refs for React 19 compatibility\n');
    }
  }

  // PropTypes warnings
  const ptWarnings = detectPropTypesUsage(transformedCode);
  warnings.push(...ptWarnings);
  if (verbose && ptWarnings.length > 0) {
    ptWarnings.forEach(w => {
      process.stdout.write(`[WARNING] ${w.message}\n`);
      process.stdout.write(`[SUGGESTION] ${w.suggestion}\n`);
    });
  }

  return { code: transformedCode, fixes, warnings };
}

async function transform(code, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd() } = options;
  const results = [];
  let changeCount = 0;
  let updatedCode = code;
  const states = [code]; // Track state changes
  const changes = [];

  try {
    // Handle empty input
    if (!code.trim()) {
      return {
        success: false,
        code,
        originalCode: code,
        changeCount: 0,
        error: 'Empty input file',
        states: [code],
        changes
      };
    }

    // Create backup if not in dry-run mode and is a file
    const existsAsFile = await isRegularFile(filePath);
    const backupPath = `${filePath}.backup-${Date.now()}`;
    if (existsAsFile && !dryRun) {
      await fs.copyFile(filePath, backupPath);
      results.push({ type: 'backup', file: filePath, success: true, backupPath });
      if (verbose) process.stdout.write(`Created backup at ${path.basename(backupPath)}\n`);
    }

    const react19Only = options && options.react19Only === true;

    if (!react19Only) {
      // AST-FIRST STRATEGY: Only use regex fallback when AST fails
      let astSucceeded = false;
      let astCode = updatedCode;
      let astChanges = [];
      
      try {
        const transformer = new ASTTransformer();
        const transformResult = transformer.transformComponents(updatedCode, {
          filename: filePath
        });
        if (transformResult && transformResult.success) {
          astCode = transformResult.code;
          astChanges = transformResult.changes || [];
          astSucceeded = astChanges.length > 0;
        }
      } catch (error) {
        // AST failed, will use regex fallback
        if (verbose) process.stdout.write(`[INFO] AST transformation failed, using regex fallback\n`);
      }

      // SMART FALLBACK: Only apply regex if AST didn't make changes
      if (astSucceeded) {
        // AST succeeded - use AST result EXCLUSIVELY (no regex)
        updatedCode = astCode;
        astChanges.forEach(c => changes.push(c));
        if (verbose) process.stdout.write(`[INFO] Using AST transformation (regex skipped)\n`);
      } else {
        // AST failed or made no changes - try regex fallback with STRICT validation
        if (verbose) process.stdout.write(`[INFO] AST made no changes, attempting regex fallback\n`);
        
        const beforeRegex = updatedCode;
        const fallback = applyRegexFallbacks(updatedCode);
        
        // VALIDATE: Check if regex made changes and if output is syntactically valid
        const regexMadeChanges = fallback.code !== beforeRegex;
        const regexOutputValid = validateSyntax(fallback.code);
        
        if (regexMadeChanges && regexOutputValid) {
          // Regex produced valid changes - accept them
          updatedCode = fallback.code;
          fallback.changes.forEach(c => changes.push(c));
          if (verbose) process.stdout.write(`[INFO] Regex fallback succeeded with ${fallback.changes.length} changes\n`);
        } else if (regexMadeChanges && !regexOutputValid) {
          // Regex produced INVALID code - REJECT and revert
          if (verbose) process.stdout.write(`[ERROR] Regex fallback produced invalid syntax - REJECTING changes\n`);
          updatedCode = beforeRegex;
        } else {
          // Regex made no changes - keep original
          if (verbose) process.stdout.write(`[INFO] Regex fallback made no changes\n`);
          updatedCode = beforeRegex;
        }
      }
    }

    // Apply React 19 component fixes (forwardRef, string refs, PropTypes warnings)
    const react19 = applyReact19ComponentFixes(updatedCode, { verbose });
    updatedCode = react19.code;
    react19.fixes.forEach(f => changes.push(f));
    react19.warnings.forEach(w => changes.push(w));

    changeCount = changes.length;
    if (updatedCode !== code) states.push(updatedCode);

    if (dryRun) {
      if (verbose && changeCount > 0) {
        process.stdout.write(`[SUCCESS] Layer 3 identified ${changeCount} component fixes (dry-run)\n`);
      }
      return {
        success: true,
        code: updatedCode, // For L3 tests, dry-run still returns transformed code
        originalCode: code,
        changeCount,
        results,
        states: [code],
        changes
      };
    }

    // Write file if not in dry-run mode
    if (changeCount > 0 && existsAsFile) {
      await fs.writeFile(filePath, updatedCode);
      results.push({ type: 'write', file: filePath, success: true, changes: changeCount });
    }

    if (verbose && changeCount > 0) {
      process.stdout.write(`[SUCCESS] Layer 3 applied ${changeCount} component fixes to ${path.basename(filePath)}\n`);
    }

    return {
      success: true,
      code: updatedCode,
      originalCode: code,
      changeCount,
      results,
      states,
      changes
    };
  } catch (error) {
    if (verbose) process.stderr.write(`[ERROR] Layer 3 failed: ${error.message}\n`);
    return {
      success: false,
      code,
      originalCode: code,
      changeCount: 0,
      error: error.message,
      states: [code],
      changes
    };
  }
}

module.exports = { transform };