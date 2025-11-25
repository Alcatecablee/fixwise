#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * Next.js 16 Migration Script
 * 
 * Handles comprehensive migration to Next.js 16 including:
 * - middleware.ts → proxy.ts rename
 * - experimental.ppr → Cache Components migration
 * - Function export update (middleware → proxy)
 * - Async params/searchParams updates
 * - New caching APIs (updateTag, refresh, cacheLife)
 */

const fs = require('fs').promises;
const path = require('path');

class NextJS16Migrator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.changes = [];
  }

  log(message, level = 'info') {
    if (this.verbose || level === 'error') {
      const prefix = level === 'error' ? '[ERROR]' : level === 'success' ? '[SUCCESS]' : '[INFO]';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Main migration entry point
   */
  async migrate(projectPath = process.cwd()) {
    this.log('Starting Next.js 16 migration...', 'info');
    
    try {
      // Step 1: Migrate middleware.ts to proxy.ts
      await this.migrateMiddlewareToProxy(projectPath);
      
      // Step 2: Migrate experimental.ppr to Cache Components
      await this.migratePPRToCacheComponents(projectPath);
      
      // Step 3: Update next.config files for Next.js 16 compatibility
      await this.updateNextConfig(projectPath);
      
      // Step 4: Migrate caching APIs
      await this.migrateCachingAPIs(projectPath);
      
      // Step 5: Update async request APIs
      await this.updateAsyncAPIs(projectPath);
      
      this.log(`Migration complete! ${this.changes.length} changes made.`, 'success');
      return {
        success: true,
        changes: this.changes,
        summary: this.generateSummary()
      };
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Migrate middleware.ts to proxy.ts
   */
  async migrateMiddlewareToProxy(projectPath) {
    this.log('Checking for middleware.ts...', 'info');
    
    const possiblePaths = [
      path.join(projectPath, 'middleware.ts'),
      path.join(projectPath, 'middleware.js'),
      path.join(projectPath, 'src', 'middleware.ts'),
      path.join(projectPath, 'src', 'middleware.js')
    ];

    for (const middlewarePath of possiblePaths) {
      try {
        const exists = await fs.access(middlewarePath).then(() => true).catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(middlewarePath, 'utf8');
        const ext = path.extname(middlewarePath);
        const dir = path.dirname(middlewarePath);
        const proxyPath = path.join(dir, `proxy${ext}`);

        // Transform the content
        let newContent = content;

        // 1. Rename exported function from 'middleware' to 'proxy'
        newContent = newContent.replace(
          /export\s+(async\s+)?function\s+middleware\s*\(/g,
          'export $1function proxy('
        );

        // 2. Update default export if it references middleware
        newContent = newContent.replace(
          /export\s+default\s+middleware/g,
          'export default proxy'
        );

        // 3. Ensure Node.js runtime is specified
        if (!newContent.includes('export const runtime')) {
          const runtimeDeclaration = `\n// Next.js 16 requires explicit runtime declaration\nexport const runtime = "nodejs";\n\n`;
          newContent = runtimeDeclaration + newContent;
        }

        // 4. Add migration comment
        const migrationComment = `/**\n * Migrated from middleware.ts to proxy.ts for Next.js 16\n * The proxy.ts file makes the app's network boundary explicit\n * and runs on the Node.js runtime.\n */\n\n`;
        newContent = migrationComment + newContent;

        if (!this.dryRun) {
          await fs.writeFile(proxyPath, newContent, 'utf8');
          this.log(`Created ${proxyPath}`, 'success');
          
          // Keep original file with .backup extension
          await fs.rename(middlewarePath, `${middlewarePath}.backup`);
          this.log(`Backed up original to ${middlewarePath}.backup`, 'info');
        }

        this.changes.push({
          type: 'middleware_to_proxy',
          from: middlewarePath,
          to: proxyPath,
          description: 'Migrated middleware.ts to proxy.ts for Next.js 16'
        });

        this.log('Successfully migrated middleware to proxy', 'success');
        return;
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    this.log('No middleware.ts file found (this is OK if not using middleware)', 'info');
  }

  /**
   * Migrate experimental.ppr to Cache Components
   */
  async migratePPRToCacheComponents(projectPath) {
    this.log('Checking for experimental.ppr configuration...', 'info');
    
    const configPaths = [
      path.join(projectPath, 'next.config.js'),
      path.join(projectPath, 'next.config.mjs'),
      path.join(projectPath, 'next.config.ts')
    ];

    for (const configPath of configPaths) {
      try {
        const exists = await fs.access(configPath).then(() => true).catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(configPath, 'utf8');
        
        // More flexible pattern matching for ppr detection
        if (content.includes('experimental.ppr') || content.match(/experimental\s*:\s*{[^}]*ppr\s*:/)) {
          let newContent = content;

          // Remove experimental.ppr
          newContent = newContent.replace(
            /experimental:\s*{\s*ppr:\s*['"]?(?:true|incremental)['"]?\s*,?\s*}/g,
            'experimental: {}'
          );

          newContent = newContent.replace(
            /ppr:\s*['"]?(?:true|incremental)['"]?\s*,?/g,
            ''
          );

          // Clean up empty experimental objects
          newContent = newContent.replace(
            /experimental:\s*{\s*}/g,
            ''
          );

          // Add Cache Components configuration
          const cacheComponentsConfig = `
  // Next.js 16: Cache Components replace experimental.ppr
  // Use 'use cache' directive in components for explicit caching
  experimental: {
    // Cache Components are now the default caching model
    dynamicIO: true, // Enable dynamic data fetching improvements
  },`;

          // Insert before the closing brace of module.exports or export default
          if (newContent.includes('module.exports')) {
            newContent = newContent.replace(
              /(const\s+nextConfig\s*=\s*{)/,
              `$1${cacheComponentsConfig}`
            );
          } else if (newContent.includes('export default')) {
            newContent = newContent.replace(
              /(export\s+default\s+{)/,
              `$1${cacheComponentsConfig}`
            );
          }

          // Add migration comment
          const migrationComment = `/**\n * Next.js 16 Migration:\n * - Removed experimental.ppr (deprecated)\n * - Cache Components are now the default\n * - Use 'use cache' directive in components for explicit caching\n * - See: https://nextjs.org/docs/app/api-reference/directives/use-cache\n */\n\n`;
          newContent = migrationComment + newContent;

          if (!this.dryRun) {
            await fs.writeFile(configPath, newContent, 'utf8');
            this.log(`Updated ${configPath}`, 'success');
          }

          this.changes.push({
            type: 'ppr_to_cache_components',
            file: configPath,
            description: 'Migrated experimental.ppr to Cache Components model'
          });

          this.log('Successfully migrated PPR to Cache Components', 'success');
          return;
        }
      } catch (error) {
        continue;
      }
    }

    this.log('No experimental.ppr configuration found', 'info');
  }

  /**
   * Update next.config for Next.js 16 compatibility
   */
  async updateNextConfig(projectPath) {
    this.log('Updating next.config for Next.js 16...', 'info');
    
    const configPaths = [
      path.join(projectPath, 'next.config.js'),
      path.join(projectPath, 'next.config.mjs'),
      path.join(projectPath, 'next.config.ts')
    ];

    for (const configPath of configPaths) {
      try {
        const exists = await fs.access(configPath).then(() => true).catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(configPath, 'utf8');
        let newContent = content;
        let modified = false;

        // Add Turbopack filesystem caching if not present
        if (!newContent.includes('turbopackFileSystemCacheForDev') && 
            !newContent.includes('experimental')) {
          const turbopackConfig = `
  experimental: {
    // Enable Turbopack filesystem caching for faster rebuilds
    turbopackFileSystemCacheForDev: true,
  },`;
          
          newContent = newContent.replace(
            /(const\s+nextConfig\s*=\s*{)/,
            `$1${turbopackConfig}`
          );
          modified = true;
        }

        // Remove deprecated image optimization settings
        if (newContent.includes('images: {') && newContent.includes('domains:')) {
          newContent = newContent.replace(
            /domains:\s*\[.*?\],?\s*/gs,
            '// domains is deprecated in Next.js 16. Use remotePatterns instead.\n  '
          );
          modified = true;
        }

        if (modified && !this.dryRun) {
          await fs.writeFile(configPath, newContent, 'utf8');
          this.log(`Updated ${configPath} for Next.js 16 compatibility`, 'success');
          
          this.changes.push({
            type: 'config_update',
            file: configPath,
            description: 'Updated next.config for Next.js 16 compatibility'
          });
        }

        return;
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Migrate old caching APIs to new Next.js 16 APIs
   */
  async migrateCachingAPIs(projectPath) {
    this.log('Scanning for old caching API usage...', 'info');
    
    const files = await this.findSourceFiles(projectPath);
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        let newContent = content;
        let modified = false;

        // 1. Auto-add 'use cache' to components that fetch data
        const shouldAddUseCache = this.shouldAddUseCacheDirective(content);
        if (shouldAddUseCache && !content.includes("'use cache'") && !content.includes('"use cache"')) {
          newContent = this.addUseCacheDirective(newContent);
          modified = true;
          this.log(`Added 'use cache' directive to ${path.basename(filePath)}`, 'success');
        }

        // 2. Replace unstable_cache with 'use cache' pattern
        if (content.includes('unstable_cache')) {
          newContent = newContent.replace(
            /unstable_cache\(/g,
            '/* MIGRATED: Use "use cache" directive instead */ unstable_cache('
          );
          modified = true;
        }

        // 3. Add cacheLife recommendation (not modification to revalidateTag)
        // revalidateTag() signature remains: revalidateTag(tag: string)
        // cacheLife should be used in cache definition, not in revalidateTag call
        if (content.includes('revalidateTag(') && !content.includes('cacheLife')) {
          // Add comment recommending cacheLife usage at cache definition
          const cacheLifeComment = `
// Next.js 16: Consider using cacheLife() in your cache configuration
// Example: 
//   'use cache';
//   export const revalidate = cacheLife('hours');
//   
// Then call: revalidateTag('your-tag')
`;
          if (!content.includes('Consider using cacheLife')) {
            newContent = cacheLifeComment + newContent;
            modified = true;
          }
        }

        // 4. Add new Next.js 16 caching APIs (updateTag, refresh)
        // Detect manual cache invalidation patterns and suggest updateTag
        if (content.includes('fetch') && content.includes('POST') && !content.includes('updateTag')) {
          const hasManualInvalidation = content.match(/(?:mutate|invalidate|refresh).*cache/i);
          if (hasManualInvalidation) {
            const updateTagComment = `
// Next.js 16: Consider using updateTag() for read-your-writes consistency
// import { updateTag } from 'next/cache'
// updateTag('${path.basename(filePath, path.extname(filePath))}')
`;
            if (!content.includes('Consider using updateTag')) {
              newContent = updateTagComment + newContent;
              modified = true;
            }
          }
        }

        if (modified && !this.dryRun) {
          await fs.writeFile(filePath, newContent, 'utf8');
          this.changes.push({
            type: 'caching_api_migration',
            file: filePath,
            description: 'Updated caching APIs for Next.js 16'
          });
        }
      } catch (error) {
        // Skip files that can't be processed
        continue;
      }
    }

    if (this.changes.filter(c => c.type === 'caching_api_migration').length > 0) {
      this.log('Migrated caching APIs', 'success');
    }
  }

  /**
   * Check if component should have 'use cache' directive
   */
  shouldAddUseCacheDirective(content) {
    // Don't add to client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      return false;
    }

    // Add to components that fetch data
    const hasFetch = content.includes('await fetch') || content.includes('fetch(');
    const hasDatabase = content.match(/(?:prisma|db|database)\./i);
    const hasAsyncComponent = content.match(/export\s+(?:default\s+)?async\s+function/);
    
    return hasFetch || hasDatabase || hasAsyncComponent;
  }

  /**
   * Add 'use cache' directive to file
   */
  addUseCacheDirective(content) {
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find position after imports
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || 
          lines[i].trim().startsWith('const ') ||
          lines[i].trim().startsWith('type ') ||
          lines[i].trim() === '') {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, '', "'use cache';", '');
    return lines.join('\n');
  }

  /**
   * Update async request APIs (params, searchParams, cookies, headers)
   */
  async updateAsyncAPIs(projectPath) {
    this.log('Updating async request APIs...', 'info');
    
    const files = await this.findSourceFiles(projectPath);
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        let newContent = content;
        let modified = false;

        // 1. Auto-convert sync params destructuring to async
        // Pattern: ({ params }) => { const { slug } = params }
        // Convert to: async (props) => { const { slug } = await props.params }
        if (content.match(/\(\s*{\s*params\s*(?:,\s*searchParams\s*)?\}\s*\)/)) {
          newContent = this.convertSyncParamsToAsync(newContent);
          modified = true;
          this.log(`Converted sync params to async in ${path.basename(filePath)}`, 'success');
        }

        // 2. Auto-add await to cookies() and headers()
        // Pattern: const x = cookies()
        // Convert to: const x = await cookies()
        const cookiesMatch = content.match(/const\s+(\w+)\s*=\s*cookies\(\)/g);
        const headersMatch = content.match(/const\s+(\w+)\s*=\s*headers\(\)/g);
        
        if ((cookiesMatch && !content.includes('await cookies()')) || 
            (headersMatch && !content.includes('await headers()'))) {
          
          if (cookiesMatch && !content.includes('await cookies()')) {
            newContent = newContent.replace(
              /const\s+(\w+)\s*=\s*cookies\(\)/g,
              'const $1 = await cookies()'
            );
            modified = true;
            this.log(`Added await to cookies() in ${path.basename(filePath)}`, 'success');
          }

          if (headersMatch && !content.includes('await headers()')) {
            newContent = newContent.replace(
              /const\s+(\w+)\s*=\s*headers\(\)/g,
              'const $1 = await headers()'
            );
            modified = true;
            this.log(`Added await to headers() in ${path.basename(filePath)}`, 'success');
          }

          // Add explanatory comment at the top of the file
          if (!newContent.includes('cookies() and headers() are now async')) {
            const lines = newContent.split('\n');
            let insertIndex = 0;
            
            // Find position after imports
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].trim().startsWith('import ') ||
                  lines[i].trim().startsWith('type ') ||
                  lines[i].trim() === '' || 
                  lines[i].trim().startsWith("'use cache'") ||
                  lines[i].trim().startsWith('"use cache"')) {
                insertIndex = i + 1;
              } else {
                break;
              }
            }
            
            lines.splice(insertIndex, 0, '', '// Next.js 16: cookies() and headers() are now async', '');
            newContent = lines.join('\n');
          }
        }

        // 3. Ensure function is async if using await
        if (modified && newContent.includes('await') && !content.match(/export\s+(?:default\s+)?async\s+function/)) {
          newContent = this.ensureFunctionIsAsync(newContent);
        }

        if (modified && !this.dryRun) {
          await fs.writeFile(filePath, newContent, 'utf8');
          this.changes.push({
            type: 'async_api_update',
            file: filePath,
            description: 'Converted params/searchParams/cookies/headers to async APIs'
          });
        }
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Convert sync params destructuring to async
   */
  convertSyncParamsToAsync(content) {
    // Pattern 1: Page component with params
    // export default function Page({ params }) { const { id } = params }
    // → export default async function Page(props) { const { id} = await props.params }
    
    let newContent = content;

    // Convert ({ params }) to (props) and add async
    newContent = newContent.replace(
      /(export\s+default\s+)(function\s+(\w+))\s*\(\s*{\s*params\s*(,\s*searchParams\s*)?\}\s*\)/g,
      '$1async $2(props)'
    );

    // Convert params usage inside function
    // const { id } = params → const { id } = await props.params
    newContent = newContent.replace(
      /const\s+{([^}]+)}\s*=\s*params(?!\.)/g,
      'const {$1} = await props.params'
    );

    // Convert searchParams usage
    newContent = newContent.replace(
      /const\s+{([^}]+)}\s*=\s*searchParams(?!\.)/g,
      'const {$1} = await props.searchParams'
    );

    // Add explanatory comment at the top of the file
    if (!newContent.includes('params and searchParams are now async')) {
      const lines = newContent.split('\n');
      let insertIndex = 0;
      
      // Find position after imports
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') ||
            lines[i].trim().startsWith('type ') ||
            lines[i].trim() === '') {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
      
      lines.splice(insertIndex, 0, '', '// Next.js 16: params and searchParams are now async', '');
      newContent = lines.join('\n');
    }

    return newContent;
  }

  /**
   * Ensure function is async
   */
  ensureFunctionIsAsync(content) {
    // Add async to export default function if not present
    let newContent = content.replace(
      /export\s+default\s+function(?!\s+async)/g,
      'export default async function'
    );

    // Add async to named exports
    newContent = newContent.replace(
      /export\s+function\s+(?!async)/g,
      'export async function '
    );

    return newContent;
  }

  /**
   * Find all source files in the project
   */
  async findSourceFiles(projectPath) {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

    async function scan(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!ignoreDirs.includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }

    await scan(projectPath);
    return files;
  }

  /**
   * Generate migration summary
   */
  generateSummary() {
    const summary = {
      total: this.changes.length,
      byType: {}
    };

    this.changes.forEach(change => {
      summary.byType[change.type] = (summary.byType[change.type] || 0) + 1;
    });

    return summary;
  }
}

module.exports = NextJS16Migrator;
