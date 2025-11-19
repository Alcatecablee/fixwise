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
