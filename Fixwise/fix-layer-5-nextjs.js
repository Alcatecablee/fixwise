#!/usr/bin/env node

/**
 * Layer 5: Next.js App Router Fixes
 * - Fix misplaced 'use client' directives
 * - Ensure proper client component structure
 * - Fix import order issues
 * - Add missing 'use client' directives
 * - Fix corrupted import statements
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Layer 5: Next.js App Router Fixes');

// Next.js App Router fix patterns
const nextjsFixes = [
  // Fix corrupted import statements
  {
    name: 'Corrupted Import Statements',
    test: (content) => {
      // Check for incomplete import statements or malformed imports
      return /import\s*{\s*$|import\s*{\s*\n\s*import/m.test(content) || 
             /import\s*{\s*[^}]*\n\s*[^}]*from/m.test(content);
    },
    fix: (content) => {
      // Fix incomplete import statements
      let fixed = content;
      
      // Fix pattern: import {\n import { ... } from "..."
      fixed = fixed.replace(/import\s*{\s*\n\s*import\s*{([^}]+)}\s*from\s*["']([^"']+)["']/gm, 
        'import { $1 } from "$2"');
      
      // Fix pattern: import {\n  SomeComponent,\n} from "..."
      fixed = fixed.replace(/import\s*{\s*\n\s*([^}]+)\n\s*}\s*from\s*["']([^"']+)["']/gm, 
        'import {\n  $1\n} from "$2"');
      
      // Fix standalone import { without closing
      fixed = fixed.replace(/^import\s*{\s*$/gm, '');
      
      // Clean up duplicate imports
      const lines = fixed.split('\n');
      const cleanedLines = [];
      const seenImports = new Set();
      
      for (const line of lines) {
        if (line.trim().startsWith('import ')) {
          const importKey = line.trim().replace(/\s+/g, ' ');
          if (!seenImports.has(importKey)) {
            seenImports.add(importKey);
            cleanedLines.push(line);
          }
        } else {
          cleanedLines.push(line);
        }
      }
      
      return cleanedLines.join('\n');
    },
    fileTypes: ['tsx', 'jsx', 'ts', 'js']
  },
  
  // Fix misplaced 'use client' directives
  {
    name: 'Misplaced Use Client Directive',
    test: (content) => {
      const lines = content.split('\n');
      const useClientIndex = lines.findIndex(line => line.trim() === "'use client';");
      if (useClientIndex === -1) return false;
      
      // Check if there are imports or other statements before 'use client'
      for (let i = 0; i < useClientIndex; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*')) {
          return true;
        }
      }
      return false;
    },
    fix: (content) => {
      const lines = content.split('\n');
      
      // Remove all 'use client' directives
      const filteredLines = lines.filter(line => line.trim() !== "'use client';");
      
      // Find the first non-comment, non-empty line
      let insertIndex = 0;
      for (let i = 0; i < filteredLines.length; i++) {
        const line = filteredLines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*')) {
          insertIndex = i;
          break;
        }
      }
      
      // Insert 'use client' at the top
      filteredLines.splice(insertIndex, 0, "'use client';", '');
      
      return filteredLines.join('\n');
    },
    fileTypes: ['tsx', 'jsx', 'ts', 'js']
  },
  
  // Add missing 'use client' for components using hooks
  {
    name: 'Missing Use Client for Hooks',
    test: (content) => {
      const hasHooks = /use(State|Effect|Router|Context|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue)/.test(content);
      const hasUseClient = content.includes("'use client'");
      const isComponent = content.includes('export default function') || content.includes('export function');
      
      return hasHooks && !hasUseClient && isComponent;
    },
    fix: (content) => {
      return "'use client';\n\n" + content;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Fix import order after adding 'use client'
  {
    name: 'Import Order After Use Client',
    test: (content) => {
      return content.startsWith("'use client';") && content.includes('\n\nimport');
    },
    fix: (content) => {
      // Ensure proper spacing after 'use client'
      return content.replace(/^'use client';\n+/, "'use client';\n\n");
    },
    fileTypes: ['tsx', 'jsx', 'ts', 'js']
  },
  
  // Fix React import issues
  {
    name: 'React Import Cleanup',
    test: (content) => {
      return content.includes("'use client'") && 
             !content.includes('import React') && 
             (content.includes('useState') || content.includes('useEffect'));
    },
    fix: (content) => {
      const lines = content.split('\n');
      const useClientIndex = lines.findIndex(line => line.trim() === "'use client';");
      
      if (useClientIndex !== -1) {
        // Add React import after 'use client'
        lines.splice(useClientIndex + 1, 0, '', "import React from 'react';");
      }
      
      return lines.join('\n');
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Get all relevant files
function getNextjsFiles() {
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

// Apply Next.js fixes
function applyNextjsFixes(filePath, content) {
  let fixedContent = content;
  let changesCount = 0;
  const fileExt = path.extname(filePath).slice(1);
  
  nextjsFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt) && fix.test(fixedContent)) {
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

// Fix specific problematic files
function fixSpecificFiles() {
  const problematicFiles = [
    'src/components/IRP5Upload.tsx',
    'src/components/ManualEntryForm.tsx',
    'src/components/Layout.tsx'
  ];
  
  let filesFixed = 0;
  
  problematicFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let fixedContent = content;
      let hasChanges = false;
      
      // Fix corrupted imports first
      if (filePath.includes('Layout.tsx')) {
        // Specific fix for Layout.tsx corruption
        fixedContent = fixedContent.replace(/import\s*{\s*\nimport\s*{([^}]+)}\s*from\s*["']([^"']+)["']/gm, 
          'import {\n  $1\n} from "$2"');
        
        // Fix the specific corruption pattern in Layout.tsx
        fixedContent = fixedContent.replace(
          /import\s*{\s*\nimport\s*{\s*AnimatePresence,\s*motion\s*}\s*from\s*["']framer-motion["'];/gm,
          'import { AnimatePresence, motion } from "framer-motion";'
        );
        
        // Fix missing Sidebar imports
        if (!fixedContent.includes('Sidebar,') && fixedContent.includes('SidebarProvider')) {
          fixedContent = fixedContent.replace(
            /import\s*{\s*\n\s*Sidebar,/gm,
            'import {\n  Sidebar,'
          );
        }
        
        hasChanges = true;
      }
      
      // Fix 'use client' placement
      const lines = fixedContent.split('\n');
      const useClientIndex = lines.findIndex(line => line.trim() === "'use client';");
      
      if (useClientIndex > 0) {
        // Remove misplaced 'use client'
        lines.splice(useClientIndex, 1);
        
        // Add at the top
        lines.unshift("'use client';", '');
        fixedContent = lines.join('\n');
        hasChanges = true;
      } else if (useClientIndex === -1 && (content.includes('useState') || content.includes('useEffect'))) {
        // Add missing 'use client'
        fixedContent = "'use client';\n\n" + fixedContent;
        hasChanges = true;
      }
      
      if (hasChanges) {
        fs.writeFileSync(fullPath, fixedContent);
        filesFixed++;
        console.log(`  ✓ Fixed ${filePath}`);
      }
    }
  });
  
  return filesFixed;
}

// Main execution
async function runLayer5Fixes() {
  const files = getNextjsFiles();
  let totalChanges = 0;
  let filesChanged = 0;
  
  console.log(`📁 Processing ${files.length} Next.js files...`);
  
  // Fix specific problematic files first
  console.log('🔧 Fixing specific problematic files...');
  const specificFileChanges = fixSpecificFiles();
  totalChanges += specificFileChanges;
  if (specificFileChanges > 0) filesChanged += specificFileChanges;
  
  // Process all Next.js files
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = applyNextjsFixes(filePath, content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        filesChanged++;
        totalChanges += changes;
        console.log(`📝 ${filePath}: ${changes} Next.js fixes applied`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Layer 5 completed: ${totalChanges} fixes applied to ${filesChanged} files`);
}

// Ensure glob is available
try {
  require('glob');
} catch (error) {
  console.log('📦 Installing glob dependency...');
  require('child_process').execSync('npm install glob --save-dev', { stdio: 'inherit' });
}

runLayer5Fixes().catch(error => {
  console.error('❌ Layer 5 fixes failed:', error.message);
  process.exit(1);
}); 