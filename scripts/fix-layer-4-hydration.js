#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('../backup-manager');

/**
 * Layer 4: Hydration and SSR Fixes
 * - Add window/document guards
 * - Add mounted state for theme providers
 * - Fix hydration mismatches in useEffect
 */
async function isRegularFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function transform(code, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd() } = options;
  const results = [];
  let changeCount = 0;
  let updatedCode = code;

  try {
    // Create centralized backup if it exists and is regular file
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

    // Phase 3: Enhanced Hydration Fixes (Layer 4)
    const hydrationFixes = [
      // Phase 3: Enhanced LocalStorage SSR Guard
      {
        name: 'LocalStorage SSR Guard',
        pattern: /localStorage\.(getItem|setItem|removeItem)\(([^)]+)\)/g,
        replacement: (match, method, args) => `typeof window !== "undefined" ? localStorage.${method}(${args}) : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Enhanced Window SSR Guard
      {
        name: 'Window SSR Guard',
        pattern: /window\.matchMedia\(([^)]+)\)/g,
        replacement: (match, args) => `typeof window !== "undefined" ? window.matchMedia(${args}) : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Enhanced Document SSR Guard
      {
        name: 'Document SSR Guard',
        pattern: /document\.(documentElement|body|querySelector)\b(\([^)]*\))?/g,
        replacement: (match, method, call = '') => `typeof document !== "undefined" ? document.${method}${call} : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add mounted state patterns
      {
        name: 'Mounted State Pattern',
        pattern: /const\s+\[([^,]+),\s*set([^\]]+)\]\s*=\s*useState\s*\(\s*localStorage\.getItem\s*\([^)]+\)\s*\)\s*;?\s*$/gm,
        replacement: (match, stateName, setterName) => {
          return `const [${stateName}, set${setterName}] = useState('light');
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  set${setterName}(localStorage.getItem('theme') || 'light');
}, []);`;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add hydration mismatch prevention
      {
        name: 'Hydration Mismatch Prevention',
        pattern: /return\s+<[^>]*>\s*\{([^}]+)\}\s*<\/[^>]*>\s*;?\s*$/gm,
        replacement: (match, content) => {
          if (content.includes('localStorage') || content.includes('window.') || content.includes('document.')) {
            return `return (
  <div>
    {mounted ? ${content} : <div>Loading...</div>}
  </div>
);`;
          }
          return match;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add proper useEffect cleanup
      {
        name: 'useEffect Cleanup',
        pattern: /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?addEventListener\s*\([^)]+\)\s*;?\s*\}\s*,\s*\[[^\]]*\]\s*\)\s*;?\s*$/gm,
        replacement: (match) => {
          return match.replace(/addEventListener\s*\(([^)]+)\)\s*;?\s*/, (addMatch, args) => {
            const [event, handler] = args.split(',').map(s => s.trim());
            return `addEventListener(${event}, ${handler});
    return () => removeEventListener(${event}, ${handler});`;
          });
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add proper error boundaries for hydration
      {
        name: 'Hydration Error Boundary',
        pattern: /export\s+default\s+function\s+(\w+)\s*\(\s*\)\s*\{[\s\S]*?return\s+<[^>]*>[\s\S]*<\/[^>]*>\s*;?\s*\}\s*$/gm,
        replacement: (match, componentName) => {
          if (match.includes('localStorage') || match.includes('window.') || match.includes('document.')) {
            return `import { ErrorBoundary } from 'react-error-boundary';

export default function ${componentName}() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      {/* Your component content */}
    </ErrorBoundary>
  );
}`;
          }
          return match;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add proper loading states for async operations
      {
        name: 'Async Loading State',
        pattern: /const\s+\[([^,]+),\s*set([^\]]+)\]\s*=\s*useState\s*\(\s*null\s*\)\s*;?\s*$/gm,
        replacement: (match, stateName, setterName) => {
          return `const [${stateName}, set${setterName}] = useState(null);
const [loading, setLoading] = useState(true);`;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add proper error states
      {
        name: 'Error State Management',
        pattern: /const\s+\[([^,]+),\s*set([^\]]+)\]\s*=\s*useState\s*\(\s*null\s*\)\s*;?\s*$/gm,
        replacement: (match, stateName, setterName) => {
          return `const [${stateName}, set${setterName}] = useState(null);
const [error, setError] = useState(null);`;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      
      // Phase 3: Add proper suspense boundaries
      {
        name: 'Suspense Boundary',
        pattern: /export\s+default\s+function\s+(\w+)\s*\(\s*\)\s*\{[\s\S]*?return\s+<[^>]*>[\s\S]*<\/[^>]*>\s*;?\s*\}\s*$/gm,
        replacement: (match, componentName) => {
          if (match.includes('dynamic') || match.includes('lazy')) {
            return `import { Suspense } from 'react';

export default function ${componentName}() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* Your component content */}
    </Suspense>
  );
}`;
          }
          return match;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      }
    ];

    // Phase 3: Enhanced hydration pattern detection
    const hydrationPatterns = [
      // Phase 3: Detect hydration mismatches
      {
        pattern: /useState\s*\(\s*localStorage\.getItem\s*\([^)]+\)\s*\)/g,
        description: 'Direct localStorage usage in useState can cause hydration mismatches'
      },
      {
        pattern: /window\./g,
        description: 'Direct window usage without SSR guards'
      },
      {
        pattern: /document\./g,
        description: 'Direct document usage without SSR guards'
      },
      {
        pattern: /addEventListener\s*\([^)]+\)/g,
        description: 'Event listeners without cleanup can cause memory leaks'
      }
    ];

    // Phase 3: Apply enhanced hydration fixes
    const fileExt = path.extname(filePath).slice(1);
    let hydrationChanges = 0;
    
    hydrationFixes.forEach(fix => {
      if (fix.fileTypes.includes(fileExt)) {
        const matches = updatedCode.match(fix.pattern) || [];
        if (matches.length) {
          updatedCode = updatedCode.replace(fix.pattern, fix.replacement);
          hydrationChanges += matches.length;
          results.push({
            type: 'hydration',
            file: filePath,
            success: true,
            changes: matches.length,
            details: `Applied ${fix.name}`
          });
          if (verbose) {
            process.stdout.write(`[INFO] Applied Phase 3 hydration fix: ${fix.name}\n`);
          }
        }
      }
    });

    // Phase 3: Detect and warn about hydration issues
    hydrationPatterns.forEach(pattern => {
      const matches = updatedCode.match(pattern.pattern) || [];
      if (matches.length > 0) {
        results.push({
          type: 'hydration-warning',
          file: filePath,
          success: true,
          changes: 0,
          details: `Detected ${matches.length} potential hydration issues: ${pattern.description}`
        });
        if (verbose) {
          process.stdout.write(`[WARNING] Potential hydration issue: ${pattern.description}\n`);
        }
      }
    });

    changeCount += hydrationChanges;

    // Enhanced SSR Guards and Hydration Safety Patterns (Next.js 15.5 + Community patterns)
    const enhancedHydrationFixes = [
      {
        name: 'Mounted State Pattern',
        pattern: /const\s+\[([^,]+),\s*set([^\]]+)\]\s*=\s*useState\s*\(\s*([^)]+)\s*\)/g,
        replacement: (match, stateVar, setterVar, initialValue) => {
          // Check if this is a theme or browser-dependent state
          if (stateVar.includes('theme') || stateVar.includes('mounted') || 
              initialValue.includes('localStorage') || initialValue.includes('window')) {
            return `const [${stateVar}, set${setterVar}] = useState(${initialValue});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);`;
          }
          return match;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      {
        name: 'Theme Provider SSR Guard',
        pattern: /document\.documentElement\.classList\.(add|remove|toggle)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        replacement: (match, method, className) => 
          `typeof document !== "undefined" ? document.documentElement.classList.${method}('${className}') : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      {
        name: 'Hydration Mismatch Prevention',
        pattern: /return\s+<([^>]+)>([^<]*)<\/\1>/g,
        replacement: (match, tag, content) => {
          // Only apply if content contains actual browser API usage (not in comments/strings)
          const hasBrowserUsage = /(?<!\/\/.*)(?<!\/\*.*\*\/)(?<!".*")(?<!'.*')(?<!`.*`)window|document|localStorage/.test(content);
          
          // Check if this is a simple text content that might cause hydration mismatch
          const hasDynamicContent = hasBrowserUsage && (
            content.includes('window') || 
            content.includes('document') || 
            content.includes('localStorage') ||
            content.includes('sessionStorage')
          );
          
          if (hasDynamicContent) {
            return `return mounted ? <${tag}>${content}</${tag}> : null`;
          }
          return match;
        },
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      {
        name: 'Event Listener SSR Guard',
        pattern: /(addEventListener|removeEventListener)\s*\(\s*([^,]+),\s*([^)]+)\s*\)/g,
        replacement: (match, method, event, handler) => 
          `typeof window !== "undefined" ? ${method}(${event}, ${handler}) : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      },
      {
        name: 'Timeout/Interval SSR Guard',
        pattern: /(setTimeout|setInterval)\s*\(\s*([^,]+)(?:,\s*([^)]+))?\s*\)/g,
        replacement: (match, method, callback, delay) => 
          `typeof window !== "undefined" ? ${method}(${callback}${delay ? `, ${delay}` : ''}) : null`,
        fileTypes: ['ts', 'tsx', 'js', 'jsx']
      }
    ];

    enhancedHydrationFixes.forEach(fix => {
      if (fix.fileTypes.includes(fileExt)) {
        const matches = updatedCode.match(fix.pattern) || [];
        if (matches.length) {
          updatedCode = updatedCode.replace(fix.pattern, fix.replacement);
          changeCount += matches.length;
          results.push({
            type: 'enhanced-hydration',
            file: filePath,
            success: true,
            changes: matches.length,
            details: `Applied ${fix.name}`
          });
        }
      }
    });

    // Theme Provider Hydration
    if (fileExt === 'tsx' && updatedCode.includes('ThemeProvider') && !updatedCode.includes('mounted')) {
      const mountedStatePattern = /const \[theme, setTheme\] = useState<Theme>\('light'\);/;
      if (mountedStatePattern.test(updatedCode)) {
        updatedCode = updatedCode.replace(
          mountedStatePattern,
          `const [theme, setTheme] = useState<Theme>('light');\n  const [mounted, setMounted] = useState(false);\n\n  useEffect(() => {\n    setMounted(true);\n  }, []);`
        ).replace(
          /return \(\s*<ThemeContext\.Provider/,
          `if (!mounted) {\n    return <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>{children}</ThemeContext.Provider>;\n  }\n\n  return (\n    <ThemeContext.Provider`
        );
        changeCount++;
        results.push({
          type: 'theme_provider',
          file: filePath,
          success: true,
          changes: 1,
          details: 'Added mounted state to ThemeProvider'
        });
      }
    }

    // Add 'use client' directive for client-only components
    if (fileExt === 'tsx' && updatedCode.includes('useTheme') && !updatedCode.includes("'use client'")) {
      updatedCode = "'use client';\n\n" + updatedCode;
      changeCount++;
      results.push({
        type: 'client_directive',
        file: filePath,
        success: true,
        changes: 1,
        details: "Added 'use client' directive"
      });
    }

    if (dryRun) {
      return {
        success: true,
        code: updatedCode,
        originalCode: code,
        changeCount,
        results
      };
    }

    // Write changes if not dry-run
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