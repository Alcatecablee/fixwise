/**
 * Convert ReactDOM test-utils imports to react imports (React 19)
 * react-dom/test-utils is removed in React 19, act is moved to react package
 */
function convertReactDOMTestUtils(code) {
  let transformedCode = code;
  const changes = [];
  
  // Pattern: import {act} from 'react-dom/test-utils'
  // Convert to: import {act} from 'react'
  const testUtilsPattern = /import\s*{\s*act\s*}\s*from\s*['"]react-dom\/test-utils['"]/g;
  
  let match;
  while ((match = testUtilsPattern.exec(code)) !== null) {
    const replacement = "import {act} from 'react'";
    transformedCode = transformedCode.replace(match[0], replacement);
    
    changes.push({
      type: 'react19-test-utils',
      description: 'Converted react-dom/test-utils import to react import',
      oldPattern: match[0],
      newPattern: replacement
    });
  }
  
  // Pattern: import {act, other} from 'react-dom/test-utils'
  // Convert to: import {act} from 'react'; import {other} from 'react-dom/test-utils'
  const testUtilsWithOthersPattern = /import\s*{\s*act\s*,\s*([^}]+)\s*}\s*from\s*['"]react-dom\/test-utils['"]/g;
  
  while ((match = testUtilsWithOthersPattern.exec(code)) !== null) {
    const otherImports = match[1].trim();
    const replacement = import {act} from 'react';\nimport {} from 'react-dom/test-utils';
    transformedCode = transformedCode.replace(match[0], replacement);
    
    changes.push({
      type: 'react19-test-utils-mixed',
      description: 'Separated act import from react-dom/test-utils to react package',
      oldPattern: match[0],
      newPattern: replacement
    });
  }
  
  return {
    code: transformedCode,
    changes
  };
}

/**
 * Apply all React 19 DOM API fixes
 */
function applyReact19DOMFixes(code, options = {}) {
  const { verbose = false } = options;
  let transformedCode = code;
  const fixes = [];
  const warnings = [];
  
  // 1. ReactDOM test-utils migration (NEW - Phase 1)
  if (transformedCode.includes('react-dom/test-utils')) {
    const testUtilsResult = convertReactDOMTestUtils(transformedCode);
    transformedCode = testUtilsResult.code;
    fixes.push(...testUtilsResult.changes);
    
    if (testUtilsResult.changes.length > 0 && verbose) {
      testUtilsResult.changes.forEach(change => {
        process.stdout.write([INFO] \n);
      });
    }
  }
  
  // 2. ReactDOM.render conversion
  if (transformedCode.includes('ReactDOM.render')) {
    const renderResult = convertReactDOMRender(transformedCode);
    transformedCode = renderResult.code;
    fixes.push(...renderResult.changes);
    
    if (renderResult.changes.length > 0 && verbose) {
      renderResult.changes.forEach(change => {
        process.stdout.write([INFO] \n);
      });
    }
  }
  
  // 3. ReactDOM.hydrate conversion
  if (transformedCode.includes('ReactDOM.hydrate')) {
    const hydrateResult = convertReactDOMHydrate(transformedCode);
    transformedCode = hydrateResult.code;
    fixes.push(...hydrateResult.changes);
    
    if (hydrateResult.changes.length > 0 && verbose) {
      hydrateResult.changes.forEach(change => {
        process.stdout.write([INFO] \n);
      });
    }
  }
  
  // 4. unmountComponentAtNode detection and warnings
  if (transformedCode.includes('unmountComponentAtNode')) {
    const unmountResult = convertUnmountComponentAtNode(transformedCode);
    warnings.push(...unmountResult.warnings);
    
    if (unmountResult.warnings.length > 0 && verbose) {
      unmountResult.warnings.forEach(warning => {
        process.stdout.write([WARNING] \n);
        process.stdout.write([SUGGESTION] \n);
      });
    }
  }
  
  // 5. findDOMNode detection and warnings
  if (transformedCode.includes('findDOMNode')) {
    const findDOMNodeWarnings = detectFindDOMNodeUsage(transformedCode);
    warnings.push(...findDOMNodeWarnings);
    
    if (findDOMNodeWarnings.length > 0 && verbose) {
      findDOMNodeWarnings.forEach(warning => {
        process.stdout.write([WARNING] \n);
        process.stdout.write([SUGGESTION] \n);
      });
    }
  }
  
  return {
    code: transformedCode,
    fixes,
    warnings,
    hasReact19Changes: fixes.length > 0 || warnings.length > 0
  };
}
