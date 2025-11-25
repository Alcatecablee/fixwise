#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * Router Complexity Assessor
 * Analyzes Next.js projects and recommends optimal routing setup
 */

const fs = require('fs').promises;
const path = require('path');

class RouterComplexityAssessor {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectPath = options.projectPath || process.cwd();
  }

  log(message, level = 'info') {
    if (this.verbose) {
      const prefix = level === 'error' ? '[ERROR]' : level === 'success' ? '[SUCCESS]' : '[INFO]';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Main assessment entry point
   */
  async assess() {
    this.log('Analyzing router complexity...', 'info');
    
    try {
      const metrics = {
        hasAppRouter: await this.detectAppRouter(),
        hasPagesRouter: await this.detectPagesRouter(),
        routeCount: await this.countRoutes(),
        hasMiddleware: await this.detectMiddleware(),
        hasAPIRoutes: await this.detectAPIRoutes(),
        hasServerComponents: await this.detectServerComponents(),
        hasClientComponents: await this.detectClientComponents(),
        usesSSR: await this.detectSSR(),
        usesSSG: await this.detectSSG(),
        complexityScore: 0
      };

      // Calculate complexity score (0-100)
      metrics.complexityScore = this.calculateComplexity(metrics);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics);
      
      // Print report
      this.printReport(metrics, recommendations);

      return {
        metrics,
        recommendations,
        level: this.getComplexityLevel(metrics.complexityScore)
      };
    } catch (error) {
      this.log(`Assessment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Detect App Router usage
   */
  async detectAppRouter() {
    const appDirPath = path.join(this.projectPath, 'app');
    const srcAppDirPath = path.join(this.projectPath, 'src', 'app');
    
    try {
      await fs.access(appDirPath);
      return true;
    } catch {
      try {
        await fs.access(srcAppDirPath);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Detect Pages Router usage
   */
  async detectPagesRouter() {
    const pagesDirPath = path.join(this.projectPath, 'pages');
    const srcPagesDirPath = path.join(this.projectPath, 'src', 'pages');
    
    try {
      await fs.access(pagesDirPath);
      return true;
    } catch {
      try {
        await fs.access(srcPagesDirPath);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Count total routes
   */
  async countRoutes() {
    let count = 0;
    
    const dirs = [
      path.join(this.projectPath, 'app'),
      path.join(this.projectPath, 'src', 'app'),
      path.join(this.projectPath, 'pages'),
      path.join(this.projectPath, 'src', 'pages')
    ];

    for (const dir of dirs) {
      try {
        count += await this.countFilesInDir(dir, /page\.(tsx?|jsx?)$|index\.(tsx?|jsx?)$/);
      } catch {
        // Directory doesn't exist
      }
    }

    return count;
  }

  /**
   * Detect middleware
   */
  async detectMiddleware() {
    const middlewarePaths = [
      path.join(this.projectPath, 'middleware.ts'),
      path.join(this.projectPath, 'middleware.js'),
      path.join(this.projectPath, 'src', 'middleware.ts'),
      path.join(this.projectPath, 'src', 'middleware.js'),
      path.join(this.projectPath, 'proxy.ts'),
      path.join(this.projectPath, 'proxy.js')
    ];

    for (const middlewarePath of middlewarePaths) {
      try {
        await fs.access(middlewarePath);
        return true;
      } catch {
        // Continue
      }
    }

    return false;
  }

  /**
   * Detect API routes
   */
  async detectAPIRoutes() {
    const apiDirs = [
      path.join(this.projectPath, 'pages', 'api'),
      path.join(this.projectPath, 'src', 'pages', 'api'),
      path.join(this.projectPath, 'app', 'api'),
      path.join(this.projectPath, 'src', 'app', 'api')
    ];

    for (const dir of apiDirs) {
      try {
        const count = await this.countFilesInDir(dir, /\.(tsx?|jsx?)$/);
        if (count > 0) return true;
      } catch {
        // Continue
      }
    }

    return false;
  }

  /**
   * Detect Server Components
   */
  async detectServerComponents() {
    const files = await this.findSourceFiles();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const isServerComponent = !content.includes("'use client'") && 
                                  !content.includes('"use client"') &&
                                  content.includes('async function') &&
                                  content.includes('export default');
        if (isServerComponent) return true;
      } catch {
        // Skip file
      }
    }

    return false;
  }

  /**
   * Detect Client Components
   */
  async detectClientComponents() {
    const files = await this.findSourceFiles();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes("'use client'") || content.includes('"use client"')) {
          return true;
        }
      } catch {
        // Skip file
      }
    }

    return false;
  }

  /**
   * Detect SSR usage
   */
  async detectSSR() {
    const files = await this.findSourceFiles();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('getServerSideProps') || content.includes('cookies()') || content.includes('headers()')) {
          return true;
        }
      } catch {
        // Skip file
      }
    }

    return false;
  }

  /**
   * Detect SSG usage
   */
  async detectSSG() {
    const files = await this.findSourceFiles();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('getStaticProps') || content.includes('generateStaticParams')) {
          return true;
        }
      } catch {
        // Skip file
      }
    }

    return false;
  }

  /**
   * Calculate complexity score (0-100)
   */
  calculateComplexity(metrics) {
    let score = 0;

    // Base score for using Next.js
    score += 20;

    // Router complexity
    if (metrics.hasAppRouter && metrics.hasPagesRouter) score += 20; // Mixed routers = complex
    if (metrics.hasAppRouter) score += 10;

    // Route count
    if (metrics.routeCount > 50) score += 20;
    else if (metrics.routeCount > 20) score += 15;
    else if (metrics.routeCount > 10) score += 10;
    else if (metrics.routeCount > 5) score += 5;

    // Features
    if (metrics.hasMiddleware) score += 10;
    if (metrics.hasAPIRoutes) score += 10;
    if (metrics.hasServerComponents) score += 10;
    if (metrics.usesSSR) score += 10;
    if (metrics.usesSSG) score += 5;

    return Math.min(100, score);
  }

  /**
   * Get complexity level
   */
  getComplexityLevel(score) {
    if (score <= 30) return 'Simple';
    if (score <= 60) return 'Moderate';
    if (score <= 80) return 'Complex';
    return 'Enterprise';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    // Recommendation based on complexity
    if (metrics.complexityScore <= 30) {
      recommendations.push({
        type: 'simplify',
        message: 'Consider plain React - Next.js may be overkill for this project',
        command: 'neurolint simplify ./src --target=react --dry-run'
      });
    }

    if (metrics.hasAppRouter && metrics.hasPagesRouter) {
      recommendations.push({
        type: 'router-migration',
        message: 'Mixed App Router and Pages Router detected - consider migrating fully to App Router',
        command: 'neurolint migrate-nextjs-16 . --dry-run'
      });
    }

    if (!metrics.hasServerComponents && metrics.hasAppRouter) {
      recommendations.push({
        type: 'underutilized',
        message: 'App Router detected but no Server Components found - consider using them for better performance',
        command: null
      });
    }

    if (!metrics.usesSSR && !metrics.usesSSG && metrics.routeCount < 10) {
      recommendations.push({
        type: 'static-site',
        message: 'No SSR/SSG detected - consider using a static site generator or plain React',
        command: 'neurolint assess . --verbose'
      });
    }

    if (metrics.hasAPIRoutes && !metrics.hasMiddleware) {
      recommendations.push({
        type: 'api-protection',
        message: 'API routes detected without middleware - consider adding authentication/rate limiting',
        command: null
      });
    }

    return recommendations;
  }

  /**
   * Print assessment report
   */
  printReport(metrics, recommendations) {
    console.log('\n' + '='.repeat(60));
    console.log('Next.js Router Complexity Assessment');
    console.log('='.repeat(60));
    console.log(`\nComplexity Score: ${metrics.complexityScore}/100 (${this.getComplexityLevel(metrics.complexityScore)})`);
    console.log(`\nRouter Configuration:`);
    console.log(`  App Router: ${metrics.hasAppRouter ? 'Yes' : 'No'}`);
    console.log(`  Pages Router: ${metrics.hasPagesRouter ? 'Yes' : 'No'}`);
    console.log(`  Total Routes: ${metrics.routeCount}`);
    console.log(`\nFeatures:`);
    console.log(`  Middleware: ${metrics.hasMiddleware ? 'Yes' : 'No'}`);
    console.log(`  API Routes: ${metrics.hasAPIRoutes ? 'Yes' : 'No'}`);
    console.log(`  Server Components: ${metrics.hasServerComponents ? 'Yes' : 'No'}`);
    console.log(`  Client Components: ${metrics.hasClientComponents ? 'Yes' : 'No'}`);
    console.log(`  SSR: ${metrics.usesSSR ? 'Yes' : 'No'}`);
    console.log(`  SSG: ${metrics.usesSSG ? 'Yes' : 'No'}`);
    
    if (recommendations.length > 0) {
      console.log(`\nRecommendations:`);
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.message}`);
        if (rec.command) {
          console.log(`     Command: ${rec.command}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Helper: Count files in directory
   */
  async countFilesInDir(dir, pattern) {
    let count = 0;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          count += await this.countFilesInDir(fullPath, pattern);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          count++;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return count;
  }

  /**
   * Helper: Find all source files
   */
  async findSourceFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

    const scan = async (dir) => {
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
      } catch {
        // Skip inaccessible directories
      }
    };

    await scan(this.projectPath);
    return files;
  }
}

module.exports = RouterComplexityAssessor;
