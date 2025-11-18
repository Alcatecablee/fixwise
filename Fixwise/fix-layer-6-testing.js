#!/usr/bin/env node

/**
 * Layer 6: Testing and Validation Fixes
 * - Add comprehensive testing patterns
 * - Validate component exports
 * - Check for circular dependencies
 * - Validate TypeScript types
 * - Add error boundaries
 * - Performance optimizations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Layer 6: Testing and Validation Fixes');

// Testing and validation fix patterns
const testingFixes = [
  // Add missing error boundaries
  {
    name: 'Missing Error Boundaries',
    test: (content) => {
      return content.includes('export default function') && 
             content.includes('useState') && 
             !content.includes('ErrorBoundary') &&
             !content.includes('componentDidCatch');
    },
    fix: (content) => {
      // Add error boundary wrapper for components that might fail
      if (content.includes('PDF') || content.includes('upload') || content.includes('API')) {
        const componentName = content.match(/export default function (\w+)/)?.[1];
        if (componentName) {
          return content.replace(
            `export default function ${componentName}`,
            `function ${componentName}WithErrorBoundary(props: any) {
  try {
    return <${componentName} {...props} />;
  } catch (error) {
    console.error('Component error:', error);
    return <div className="p-4 text-red-600">Something went wrong. Please try again.</div>;
  }
}

function ${componentName}`
          ).replace(
            `export default function ${componentName}`,
            `export default ${componentName}WithErrorBoundary;

function ${componentName}`
          );
        }
      }
      return content;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Add proper prop validation
  {
    name: 'Missing Prop Types',
    test: (content) => {
      return content.includes('export default function') && 
             content.includes('props') &&
             !content.includes('interface') &&
             !content.includes('type Props');
    },
    fix: (content) => {
      const componentMatch = content.match(/export default function (\w+)\(\s*{\s*([^}]+)\s*}/);
      if (componentMatch) {
        const [, componentName, props] = componentMatch;
        const propNames = props.split(',').map(p => p.trim().split(':')[0].trim());
        
        const interfaceDefinition = `interface ${componentName}Props {
  ${propNames.map(prop => `${prop}: any;`).join('\n  ')}
}

`;
        
        return interfaceDefinition + content.replace(
          `export default function ${componentName}({ ${props} }`,
          `export default function ${componentName}({ ${props} }: ${componentName}Props`
        );
      }
      return content;
    },
    fileTypes: ['tsx']
  },
  
  // Add loading states
  {
    name: 'Missing Loading States',
    test: (content) => {
      return content.includes('async') && 
             content.includes('useState') &&
             !content.includes('loading') &&
             !content.includes('isLoading');
    },
    fix: (content) => {
      // Add loading state for async operations
      if (content.includes('const [') && content.includes('useState')) {
        const stateMatch = content.match(/const \[([^,]+),\s*set[^\]]+\] = useState/);
        if (stateMatch) {
          return content.replace(
            stateMatch[0],
            `const [isLoading, setIsLoading] = useState(false);\n  ${stateMatch[0]}`
          );
        }
      }
      return content;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Validate component exports
  {
    name: 'Invalid Component Exports',
    test: (content) => {
      // Check for components that don't have proper default exports
      return content.includes('function ') && 
             !content.includes('export default') &&
             !content.includes('export {');
    },
    fix: (content) => {
      const functionMatch = content.match(/function (\w+)\s*\(/);
      if (functionMatch && !content.includes(`export default ${functionMatch[1]}`)) {
        return content + `\n\nexport default ${functionMatch[1]};`;
      }
      return content;
    },
    fileTypes: ['tsx', 'jsx', 'ts', 'js']
  },
  
  // Add accessibility attributes
  {
    name: 'Missing Accessibility Attributes',
    test: (content) => {
      return content.includes('<button') && 
             !content.includes('aria-label') &&
             !content.includes('aria-describedby');
    },
    fix: (content) => {
      // Add basic accessibility attributes to buttons
      return content.replace(
        /<button([^>]*?)>/g,
        (match, attributes) => {
          if (!attributes.includes('aria-label')) {
            return `<button${attributes} aria-label="Button">`;
          }
          return match;
        }
      );
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Performance optimizations
  {
    name: 'Missing React.memo for Pure Components',
    test: (content) => {
      return content.includes('export default function') && 
             !content.includes('useState') &&
             !content.includes('useEffect') &&
             !content.includes('React.memo') &&
             content.includes('props');
    },
    fix: (content) => {
      const componentMatch = content.match(/export default function (\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        return content.replace(
          `export default function ${componentName}`,
          `const ${componentName} = React.memo(function ${componentName}`
        ).replace(
          /}\s*$/, 
          '});\n\nexport default ' + componentName + ';'
        );
      }
      return content;
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Advanced validation patterns
const validationFixes = [
  // Check for circular dependencies
  {
    name: 'Potential Circular Dependencies',
    test: (content, filePath) => {
      const imports = content.match(/import.*from ['"]([^'"]+)['"]/g) || [];
      const currentDir = path.dirname(filePath);
      
      return imports.some(imp => {
        const importPath = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (importPath && importPath.startsWith('.')) {
          const resolvedPath = path.resolve(currentDir, importPath);
          return resolvedPath.includes(path.basename(filePath, path.extname(filePath)));
        }
        return false;
      });
    },
    fix: (content) => {
      // Add comment warning about potential circular dependency
      return `// Warning: Potential circular dependency detected\n// Consider refactoring to avoid circular imports\n\n${content}`;
    },
    fileTypes: ['tsx', 'jsx', 'ts', 'js']
  },
  
  // Validate TypeScript strict mode compliance
  {
    name: 'TypeScript Strict Mode Issues',
    test: (content) => {
      return content.includes('any') && 
             !content.includes('// @ts-ignore') &&
             content.includes('interface');
    },
    fix: (content) => {
      // Replace 'any' with more specific types where possible
      return content.replace(/:\s*any(?!\[\])/g, ': unknown')
                   .replace(/any\[\]/g, 'unknown[]');
    },
    fileTypes: ['ts', 'tsx']
  },
  
  // Add proper error handling
  {
    name: 'Missing Error Handling',
    test: (content) => {
      return content.includes('async') && 
             content.includes('await') &&
             !content.includes('try') &&
             !content.includes('catch');
    },
    fix: (content) => {
      // Wrap async operations in try-catch
      const asyncFunctionMatch = content.match(/(const \w+ = async \([^)]*\) => {[\s\S]*?})/);
      if (asyncFunctionMatch) {
        const asyncFunction = asyncFunctionMatch[1];
        const wrappedFunction = asyncFunction.replace(
          /(async \([^)]*\) => {)([\s\S]*)(})/,
          '$1\n    try {$2\n    } catch (error) {\n      console.error("Error:", error);\n    }\n  $3'
        );
        return content.replace(asyncFunction, wrappedFunction);
      }
      return content;
    },
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  }
];

// Get all relevant files
function getTestingFiles() {
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.js'
  ];
  
  let files = [];
  patterns.forEach(pattern => {
    try {
      files = files.concat(glob.sync(pattern));
    } catch (error) {
      console.warn(`Warning: Could not process pattern ${pattern}`);
    }
  });
  
  return [...new Set(files)];
}

// Apply testing fixes
function applyTestingFixes(filePath, content) {
  let fixedContent = content;
  let changesCount = 0;
  const fileExt = path.extname(filePath).slice(1);
  
  // Apply testing fixes
  testingFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt) && fix.test(fixedContent)) {
      const before = fixedContent;
      fixedContent = fix.fix(fixedContent);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name} to ${path.basename(filePath)}`);
      }
    }
  });
  
  // Apply validation fixes
  validationFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt) && fix.test(fixedContent, filePath)) {
      const before = fixedContent;
      fixedContent = fix.fix(fixedContent);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name} to ${path.basename(filePath)}`);
      }
    }
  });
  
  return { content: fixedContent, changes: changesCount };
}

// Create test files if missing
function createTestFiles() {
  const testFiles = [
    {
      path: 'src/components/__tests__/Layout.test.tsx',
      content: `import { render, screen } from '@testing-library/react';
import Layout from '../Layout';

describe('Layout', () => {
  it('renders without crashing', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});`
    },
    {
      path: 'src/utils/errorBoundary.tsx',
      content: `'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;`
    }
  ];
  
  let filesCreated = 0;
  
  testFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, file.content);
      filesCreated++;
      console.log(`  ✓ Created ${file.path}`);
    }
  });
  
  return filesCreated;
}

// Main execution
async function runLayer6Fixes() {
  const files = getTestingFiles();
  let totalChanges = 0;
  let filesChanged = 0;
  
  console.log(`📁 Processing ${files.length} files for testing and validation...`);
  
  // Create missing test files
  console.log('📄 Creating missing test files...');
  const filesCreated = createTestFiles();
  totalChanges += filesCreated;
  
  // Process all files for testing improvements
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = applyTestingFixes(filePath, content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        filesChanged++;
        totalChanges += changes;
        console.log(`📝 ${filePath}: ${changes} testing fixes applied`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Layer 6 completed: ${totalChanges} fixes applied to ${filesChanged} files`);
}

// Ensure glob is available
try {
  require('glob');
} catch (error) {
  console.log('📦 Installing glob dependency...');
  require('child_process').execSync('npm install glob --save-dev', { stdio: 'inherit' });
}

runLayer6Fixes().catch(error => {
  console.error('❌ Layer 6 fixes failed:', error.message);
  process.exit(1);
}); 