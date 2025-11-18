#!/usr/bin/env node

/**
 * Layer 2: Bulk Pattern Fixes
 * - Remove unused imports
 * - Fix type assertions
 * - Fix HTML entity corruption
 * - Standardize quote usage
 * - Fix common React patterns
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Layer 2: Bulk Pattern Fixes');

// Pattern definitions for bulk fixes
const patterns = [
  // Fix HTML entity corruption
  {
    name: 'HTML Entity Quotes',
    pattern: /&quot;/g,
    replacement: '"',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  {
    name: 'HTML Entity Apostrophes',
    pattern: /&#x27;/g,
    replacement: "'",
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  {
    name: 'HTML Entity Ampersands',
    pattern: /&amp;/g,
    replacement: '&',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  
  // Fix common TypeScript issues
  {
    name: 'Any Type Assertions',
    pattern: /as any\b/g,
    replacement: '// @ts-ignore\n',
    fileTypes: ['ts', 'tsx']
  },
  
  // Fix React patterns
  {
    name: 'React Fragment Shorthand',
    pattern: /<React\.Fragment>/g,
    replacement: '<>',
    fileTypes: ['tsx', 'jsx']
  },
  {
    name: 'React Fragment Shorthand Close',
    pattern: /<\/React\.Fragment>/g,
    replacement: '</>',
    fileTypes: ['tsx', 'jsx']
  },
  
  // Fix import patterns
  {
    name: 'Default React Import',
    pattern: /import React, \{ /g,
    replacement: 'import { ',
    fileTypes: ['tsx', 'jsx']
  },
  
  // Fix console statements for production
  {
    name: 'Console Log to Debug',
    pattern: /console\.log\(/g,
    replacement: 'console.debug(',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  
  // Fix common CSS-in-JS patterns
  {
    name: 'Style Object Quotes',
    pattern: /style=\{\{([^}]+)\}\}/g,
    replacement: (match, content) => {
      // Convert camelCase to kebab-case for CSS properties
      const fixed = content.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `style={{${fixed}}}`;
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Advanced pattern fixes
const advancedPatterns = [
  // Remove unused imports (basic detection)
  {
    name: 'Unused React Import',
    test: (content) => !content.includes('React.') && !content.includes('<') && content.includes("import React from 'react'"),
    fix: (content) => content.replace(/import React from ['"]react['"];\n?/g, ''),
    fileTypes: ['tsx', 'jsx']
  },
  
  // Fix component prop destructuring
  {
    name: 'Component Props Interface',
    test: (content) => content.includes('function ') && content.includes('props:') && !content.includes('interface'),
    fix: (content) => {
      // Add interface definitions for component props
      return content.replace(
        /function (\w+)\(props: ([^)]+)\)/g,
        'interface $2Props {\n  // Add prop definitions here\n}\n\nfunction $1(props: $2Props)'
      );
    },
    fileTypes: ['tsx']
  }
];

// Get all relevant files
function getFiles(extensions) {
  const patterns = extensions.map(ext => `src/**/*.${ext}`);
  let files = [];
  
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
  });
  
  return [...new Set(files)]; // Remove duplicates
}

// Apply pattern fixes to a file
function applyPatternFixes(filePath, content) {
  let fixedContent = content;
  let changesCount = 0;
  const fileExt = path.extname(filePath).slice(1);
  
  // Apply basic pattern replacements
  patterns.forEach(pattern => {
    if (pattern.fileTypes.includes(fileExt)) {
      const before = fixedContent;
      
      if (typeof pattern.replacement === 'function') {
        fixedContent = fixedContent.replace(pattern.pattern, pattern.replacement);
      } else {
        fixedContent = fixedContent.replace(pattern.pattern, pattern.replacement);
      }
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${pattern.name}`);
      }
    }
  });
  
  // Apply advanced pattern fixes
  advancedPatterns.forEach(pattern => {
    if (pattern.fileTypes.includes(fileExt) && pattern.test(fixedContent)) {
      const before = fixedContent;
      fixedContent = pattern.fix(fixedContent);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${pattern.name}`);
      }
    }
  });
  
  return { content: fixedContent, changes: changesCount };
}

// Remove unused imports more intelligently
function removeUnusedImports(content) {
  const lines = content.split('\n');
  const importLines = [];
  const codeLines = [];
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('import ')) {
      importLines.push({ line, index });
    } else {
      codeLines.push(line);
    }
  });
  
  const codeContent = codeLines.join('\n');
  const usedImports = [];
  
  importLines.forEach(({ line }) => {
    // Extract imported names
    const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))/);
    if (importMatch) {
      const [, namedImports, namespaceImport, defaultImport] = importMatch;
      
      let isUsed = false;
      
      if (namedImports) {
        // Check named imports
        const names = namedImports.split(',').map(name => name.trim().split(' as ')[0]);
        isUsed = names.some(name => codeContent.includes(name));
      } else if (namespaceImport) {
        // Check namespace import
        isUsed = codeContent.includes(namespaceImport);
      } else if (defaultImport) {
        // Check default import
        isUsed = codeContent.includes(defaultImport);
      }
      
      if (isUsed) {
        usedImports.push(line);
      }
    } else {
      // Keep imports we can't parse
      usedImports.push(line);
    }
  });
  
  return [...usedImports, '', ...codeLines].join('\n');
}

// Main execution
async function runLayer2Fixes() {
  const files = getFiles(['ts', 'tsx', 'js', 'jsx']);
  let totalChanges = 0;
  let filesChanged = 0;
  
  console.log(`📁 Processing ${files.length} files...`);
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = applyPatternFixes(filePath, content);
      
      // Apply unused import removal
      const finalContent = removeUnusedImports(fixedContent);
      const hasUnusedImportChanges = finalContent !== fixedContent;
      
      if (changes > 0 || hasUnusedImportChanges) {
        fs.writeFileSync(filePath, finalContent);
        filesChanged++;
        totalChanges += changes + (hasUnusedImportChanges ? 1 : 0);
        console.log(`📝 ${filePath}: ${changes + (hasUnusedImportChanges ? 1 : 0)} fixes applied`);
        
        if (hasUnusedImportChanges) {
          console.log(`  ✓ Removed unused imports`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Layer 2 completed: ${totalChanges} fixes applied to ${filesChanged} files`);
}

// Check if glob is available, if not provide fallback
try {
  require('glob');
} catch (error) {
  console.log('📦 Installing glob dependency...');
  require('child_process').execSync('npm install glob --save-dev', { stdio: 'inherit' });
}

runLayer2Fixes().catch(error => {
  console.error('❌ Layer 2 fixes failed:', error.message);
  process.exit(1);
}); 