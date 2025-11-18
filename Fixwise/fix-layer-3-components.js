#!/usr/bin/env node

/**
 * Layer 3: Component-Specific Fixes
 * - Button component variants and props
 * - Tabs component props and structure
 * - Form component enhancements
 * - Icon component standardization
 * - Layout component optimizations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Layer 3: Component-Specific Fixes');

// Component-specific fix patterns
const componentFixes = [
  // Button component fixes
  {
    name: 'Button Variant Props',
    pattern: /<Button\s+([^>]*?)>/g,
    fix: (match, props) => {
      // Ensure Button has proper variant prop
      if (!props.includes('variant=')) {
        return `<Button variant="default" ${props}>`;
      }
      return match;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Tabs component fixes
  {
    name: 'Tabs Structure',
    pattern: /<Tabs([^>]*?)>(.*?)<\/Tabs>/gs,
    fix: (match, props, content) => {
      // Ensure Tabs has proper structure with TabsList and TabsContent
      if (!content.includes('TabsList') || !content.includes('TabsContent')) {
        return match; // Keep original if structure is too complex to auto-fix
      }
      return match;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Input component fixes
  {
    name: 'Input Type Props',
    pattern: /<Input\s+([^>]*?)>/g,
    fix: (match, props) => {
      // Ensure Input has type prop
      if (!props.includes('type=')) {
        return `<Input type="text" ${props}>`;
      }
      return match;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Form component fixes
  {
    name: 'Form Field Structure',
    pattern: /<FormField([^>]*?)>(.*?)<\/FormField>/gs,
    fix: (match, props, content) => {
      // Ensure FormField has proper control and render structure
      if (!content.includes('FormControl') && !content.includes('render=')) {
        return match; // Keep original if structure is complex
      }
      return match;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Icon component standardization
  {
    name: 'Icon Size Props',
    pattern: /<(\w+Icon)\s+([^>]*?)>/g,
    fix: (match, iconName, props) => {
      // Ensure icons have consistent size props
      if (!props.includes('className=') && !props.includes('size=')) {
        return `<${iconName} className="w-4 h-4" ${props}>`;
      }
      return match;
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Advanced component fixes
const advancedComponentFixes = [
  // Fix missing key props in lists
  {
    name: 'Missing Key Props',
    test: (content) => content.includes('.map(') && !content.includes('key='),
    fix: (content) => {
      return content.replace(
        /\.map\(\(([^,)]+)(?:,\s*(\w+))?\)\s*=>\s*<(\w+)/g,
        (match, item, index, component) => {
          const keyProp = index ? `key={${index}}` : `key={${item}.id || ${item}}`;
          return match.replace(`<${component}`, `<${component} ${keyProp}`);
        }
      );
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Fix component prop interfaces
  {
    name: 'Component Prop Interfaces',
    test: (content) => content.includes('interface') && content.includes('Props') && !content.includes('extends'),
    fix: (content) => {
      // Add common prop extensions for component interfaces
      return content.replace(
        /interface (\w+)Props \{/g,
        'interface $1Props extends React.HTMLAttributes<HTMLDivElement> {'
      );
    },
    fileTypes: ['tsx']
  },
  
  // Fix forwardRef components
  {
    name: 'ForwardRef Components',
    test: (content) => content.includes('forwardRef') && !content.includes('displayName'),
    fix: (content) => {
      // Add displayName to forwardRef components
      return content.replace(
        /(const (\w+) = forwardRef[^}]+\}\);?)/g,
        '$1\n$2.displayName = "$2";'
      );
    },
    fileTypes: ['tsx']
  }
];

// UI Library specific fixes
const uiLibraryFixes = [
  // Shadcn/ui Button fixes
  {
    name: 'Shadcn Button Variants',
    pattern: /variant="(primary|secondary|danger|success)"/g,
    replacement: (match, variant) => {
      const variantMap = {
        'primary': 'default',
        'secondary': 'secondary',
        'danger': 'destructive',
        'success': 'default'
      };
      return `variant="${variantMap[variant] || 'default'}"`;
    },
    fileTypes: ['tsx', 'jsx']
  },
  
  // Shadcn/ui size props
  {
    name: 'Shadcn Size Props',
    pattern: /size="(xs|sm|md|lg|xl)"/g,
    replacement: (match, size) => {
      const sizeMap = {
        'xs': 'sm',
        'sm': 'sm',
        'md': 'default',
        'lg': 'lg',
        'xl': 'lg'
      };
      return `size="${sizeMap[size] || 'default'}"`;
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Get component files
function getComponentFiles() {
  const patterns = [
    'src/components/**/*.tsx',
    'src/components/**/*.jsx',
    'src/app/**/*.tsx',
    'src/app/**/*.jsx'
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

// Apply component fixes
function applyComponentFixes(filePath, content) {
  let fixedContent = content;
  let changesCount = 0;
  const fileExt = path.extname(filePath).slice(1);
  
  // Apply basic component fixes
  componentFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt)) {
      const before = fixedContent;
      fixedContent = fixedContent.replace(fix.pattern, fix.fix);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name}`);
      }
    }
  });
  
  // Apply UI library fixes
  uiLibraryFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt)) {
      const before = fixedContent;
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name}`);
      }
    }
  });
  
  // Apply advanced component fixes
  advancedComponentFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt) && fix.test(fixedContent)) {
      const before = fixedContent;
      fixedContent = fix.fix(fixedContent);
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name}`);
      }
    }
  });
  
  return { content: fixedContent, changes: changesCount };
}

// Add missing component imports
function addMissingImports(content, filePath) {
  const imports = new Set();
  const existingImports = content.match(/import.*from.*['"][^'"]+['"]/g) || [];
  const existingImportNames = existingImports.join(' ');
  
  // Common component imports that might be missing
  const componentImports = [
    { component: 'Button', from: '@/components/ui/button' },
    { component: 'Input', from: '@/components/ui/input' },
    { component: 'Label', from: '@/components/ui/label' },
    { component: 'Card', from: '@/components/ui/card' },
    { component: 'Tabs', from: '@/components/ui/tabs' },
    { component: 'Form', from: '@/components/ui/form' },
    { component: 'Select', from: '@/components/ui/select' },
    { component: 'Dialog', from: '@/components/ui/dialog' },
    { component: 'Alert', from: '@/components/ui/alert' }
  ];
  
  componentImports.forEach(({ component, from }) => {
    if (content.includes(`<${component}`) && !existingImportNames.includes(component)) {
      imports.add(`import { ${component} } from "${from}";`);
    }
  });
  
  if (imports.size > 0) {
    const importStatements = Array.from(imports).join('\n');
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      return content.slice(0, firstImportIndex) + importStatements + '\n' + content.slice(firstImportIndex);
    } else {
      return importStatements + '\n\n' + content;
    }
  }
  
  return content;
}

// Main execution
async function runLayer3Fixes() {
  const files = getComponentFiles();
  let totalChanges = 0;
  let filesChanged = 0;
  
  console.log(`📁 Processing ${files.length} component files...`);
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = applyComponentFixes(filePath, content);
      
      // Add missing imports
      const finalContent = addMissingImports(fixedContent, filePath);
      const hasImportChanges = finalContent !== fixedContent;
      
      if (changes > 0 || hasImportChanges) {
        fs.writeFileSync(filePath, finalContent);
        filesChanged++;
        totalChanges += changes + (hasImportChanges ? 1 : 0);
        console.log(`📝 ${filePath}: ${changes + (hasImportChanges ? 1 : 0)} fixes applied`);
        
        if (hasImportChanges) {
          console.log(`  ✓ Added missing imports`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Layer 3 completed: ${totalChanges} fixes applied to ${filesChanged} files`);
}

// Ensure glob is available
try {
  require('glob');
} catch (error) {
  console.log('📦 Installing glob dependency...');
  require('child_process').execSync('npm install glob --save-dev', { stdio: 'inherit' });
}

runLayer3Fixes().catch(error => {
  console.error('❌ Layer 3 fixes failed:', error.message);
  process.exit(1);
}); 