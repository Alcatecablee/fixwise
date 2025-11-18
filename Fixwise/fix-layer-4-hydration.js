#!/usr/bin/env node

/**
 * Layer 4: Hydration and SSR Fixes
 * - Fix hydration mismatches
 * - Add proper client-side guards
 * - Fix theme provider issues
 * - Add missing manifest files
 * - Fix dynamic imports for client-only components
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Layer 4: Hydration and SSR Fixes');

// Hydration fix patterns
const hydrationFixes = [
  // Fix localStorage access in SSR
  {
    name: 'LocalStorage SSR Guard',
    pattern: /localStorage\.getItem\(/g,
    replacement: 'typeof window !== "undefined" && localStorage.getItem(',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  
  // Fix window access in SSR
  {
    name: 'Window SSR Guard',
    pattern: /window\.matchMedia\(/g,
    replacement: 'typeof window !== "undefined" && window.matchMedia(',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  
  // Fix document access in SSR
  {
    name: 'Document SSR Guard',
    pattern: /document\.documentElement/g,
    replacement: 'typeof document !== "undefined" && document.documentElement',
    fileTypes: ['ts', 'tsx', 'js', 'jsx']
  },
  
  // Fix useEffect for client-only operations
  {
    name: 'Client-Only useEffect',
    pattern: /useEffect\(\(\) => \{[\s\S]*?localStorage/g,
    replacement: (match) => {
      return match.replace('useEffect(() => {', 'useEffect(() => {\n    if (typeof window === "undefined") return;');
    },
    fileTypes: ['ts', 'tsx']
  }
];

// Advanced hydration fixes
const advancedHydrationFixes = [
  // Fix theme provider hydration
  {
    name: 'Theme Provider Hydration',
    test: (content) => content.includes('ThemeProvider') && content.includes('useState') && !content.includes('mounted'),
    fix: (content) => {
      // Add mounted state to prevent hydration mismatch
      const mountedStatePattern = /const \[theme, setTheme\] = useState<Theme>\('light'\);/;
      if (mountedStatePattern.test(content)) {
        return content.replace(
          mountedStatePattern,
          `const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);`
        ).replace(
          /return \(\s*<ThemeContext\.Provider/,
          `if (!mounted) {
    return <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider`
        );
      }
      return content;
    },
    fileTypes: ['tsx']
  },
  
  // Fix client-only components
  {
    name: 'Client-Only Component Wrapper',
    test: (content) => content.includes('useTheme') && !content.includes('dynamic') && !content.includes('NoSSR'),
    fix: (content) => {
      // Add dynamic import for client-only components
      if (content.includes('export default function') && content.includes('useTheme')) {
        return `import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(() => Promise.resolve(function ClientComponent() {
${content.split('export default function')[1]}
}), { ssr: false });

export default ClientOnlyComponent;`;
      }
      return content;
    },
    fileTypes: ['tsx']
  },
  
  // Fix missing key props with proper keys
  {
    name: 'Proper Key Props',
    test: (content) => content.includes('.map(') && content.includes('key=') && content.includes('key={index}'),
    fix: (content) => {
      // Replace index-based keys with proper unique keys
      return content.replace(
        /\.map\(\(([^,)]+),\s*index\)\s*=>\s*<(\w+)[^>]*key=\{index\}/g,
        '.map(($1, index) => <$2 key={`$2-${index}-${$1.id || $1}`}'
      );
    },
    fileTypes: ['tsx', 'jsx']
  }
];

// Create missing files
const missingFiles = [
  // Web manifest
  {
    path: 'public/site.webmanifest',
    content: `{
  "name": "Taxfy - South African Tax Calculator",
  "short_name": "Taxfy",
  "description": "Professional South African tax refund calculator and analysis tool",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A1628",
  "theme_color": "#CCA43B",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`
  },
  
  // Robots.txt
  {
    path: 'public/robots.txt',
    content: `User-agent: *
Allow: /

Sitemap: https://taxfy.co.za/sitemap.xml`
  },
  
  // NoSSR component for client-only rendering
  {
    path: 'src/components/NoSSR.tsx',
    content: `'use client';

import { useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}`
  }
];

// Get relevant files for hydration fixes
function getHydrationFiles() {
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

// Apply hydration fixes
function applyHydrationFixes(filePath, content) {
  let fixedContent = content;
  let changesCount = 0;
  const fileExt = path.extname(filePath).slice(1);
  
  // Apply basic hydration fixes
  hydrationFixes.forEach(fix => {
    if (fix.fileTypes.includes(fileExt)) {
      const before = fixedContent;
      
      if (typeof fix.replacement === 'function') {
        fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      } else {
        fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      }
      
      if (before !== fixedContent) {
        changesCount++;
        console.log(`  ✓ Applied ${fix.name}`);
      }
    }
  });
  
  // Apply advanced hydration fixes
  advancedHydrationFixes.forEach(fix => {
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

// Create missing files
function createMissingFiles() {
  let filesCreated = 0;
  
  missingFiles.forEach(file => {
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

// Fix specific ThemeToggle component
function fixThemeToggle() {
  const themeTogglePath = path.join(process.cwd(), 'src/components/ThemeToggle.tsx');
  
  if (fs.existsSync(themeTogglePath)) {
    const content = fs.readFileSync(themeTogglePath, 'utf8');
    
    // Check if it needs hydration fixes
    if (content.includes('localStorage') && !content.includes('mounted')) {
      const fixedContent = `'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';

type Theme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load theme from localStorage only on client
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('taxfy-theme') as Theme;
      if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'high-contrast');
      root.classList.add(theme);
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('taxfy-theme', theme);
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch by returning consistent initial state
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function ThemeToggleComponent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'high-contrast':
        return <Contrast className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'high-contrast':
        return 'High contrast theme';
      default:
        return 'Light theme';
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Loading theme toggle"
        disabled
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={\`Switch to next theme (current: \${getLabel()})\`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}

export default ThemeToggleComponent;`;

      fs.writeFileSync(themeTogglePath, fixedContent);
      console.log(`  ✓ Fixed ThemeToggle hydration issues`);
      return 1;
    }
  }
  
  return 0;
}

// Main execution
async function runLayer4Fixes() {
  const files = getHydrationFiles();
  let totalChanges = 0;
  let filesChanged = 0;
  
  console.log(`📁 Processing ${files.length} files for hydration issues...`);
  
  // Create missing files first
  console.log('📄 Creating missing files...');
  const filesCreated = createMissingFiles();
  totalChanges += filesCreated;
  
  // Fix specific components
  console.log('🔧 Fixing specific components...');
  const themeToggleChanges = fixThemeToggle();
  totalChanges += themeToggleChanges;
  if (themeToggleChanges > 0) filesChanged++;
  
  // Process all files for hydration issues
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = applyHydrationFixes(filePath, content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        filesChanged++;
        totalChanges += changes;
        console.log(`📝 ${filePath}: ${changes} hydration fixes applied`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Layer 4 completed: ${totalChanges} fixes applied to ${filesChanged} files`);
}

// Ensure glob is available
try {
  require('glob');
} catch (error) {
  console.log('📦 Installing glob dependency...');
  require('child_process').execSync('npm install glob --save-dev', { stdio: 'inherit' });
}

runLayer4Fixes().catch(error => {
  console.error('❌ Layer 4 fixes failed:', error.message);
  process.exit(1);
}); 