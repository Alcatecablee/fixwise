#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * Turbopack Migration Assistant
 * 
 * Detects Webpack-specific configurations that won't work with Turbopack
 * Provides migration guidance and optimization suggestions
 */

const fs = require('fs').promises;
const path = require('path');

class TurbopackMigrationAssistant {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectPath = options.projectPath || process.cwd();
    this.issues = [];
    this.suggestions = [];
  }

  log(message, level = 'info') {
    if (this.verbose || level === 'error' || level === 'warning') {
      const prefix = level === 'error' ? '[ERROR]' : 
                     level === 'warning' ? '[WARNING]' : 
                     level === 'success' ? '[SUCCESS]' : '[INFO]';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Main migration check
   */
  async analyze() {
    this.log('Analyzing project for Turbopack compatibility...', 'info');

    try {
      await this.checkNextConfig();
      await this.checkWebpackConfig();
      await this.checkBabelConfig();
      await this.checkCustomLoaders();
      await this.checkPlugins();

      this.generateRecommendations();
      this.printReport();

      return {
        compatible: this.issues.length === 0,
        issues: this.issues,
        suggestions: this.suggestions
      };
    } catch (error) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Check next.config for Webpack-specific settings
   */
  async checkNextConfig() {
    const configPaths = [
      path.join(this.projectPath, 'next.config.js'),
      path.join(this.projectPath, 'next.config.mjs'),
      path.join(this.projectPath, 'next.config.ts')
    ];

    for (const configPath of configPaths) {
      try {
        const exists = await fs.access(configPath).then(() => true).catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(configPath, 'utf8');

        // Check for webpack function customization
        if (content.includes('webpack:') || content.includes('webpack(')) {
          this.issues.push({
            severity: 'high',
            file: path.basename(configPath),
            issue: 'Custom webpack configuration detected',
            description: 'Turbopack does not support custom webpack configurations',
            fix: 'Either remove webpack customizations or use --webpack flag to keep using Webpack'
          });
        }

        // Check for Webpack plugins
        if (content.includes('new webpack.') || content.includes('webpack.DefinePlugin')) {
          this.issues.push({
            severity: 'high',
            file: path.basename(configPath),
            issue: 'Webpack plugins detected',
            description: 'Turbopack has its own plugin system and doesn\'t support Webpack plugins',
            fix: 'Migrate to Turbopack-compatible alternatives or use --webpack flag'
          });
        }

        // Check for module aliases (these work but might need adjustment)
        if (content.includes('resolve.alias') || content.includes('resolve: {')) {
          this.suggestions.push({
            type: 'info',
            message: 'Webpack resolve.alias detected',
            recommendation: 'Turbopack supports path aliases via tsconfig.json or jsconfig.json. Consider migrating.'
          });
        }

        // Check if already using Turbopack filesystem caching
        if (!content.includes('turbopackFileSystemCacheForDev')) {
          this.suggestions.push({
            type: 'optimization',
            message: 'Enable Turbopack filesystem caching',
            recommendation: 'Add experimental.turbopackFileSystemCacheForDev: true for faster rebuilds',
            code: `experimental: {\n  turbopackFileSystemCacheForDev: true,\n}`
          });
        }

        return;
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Check for separate webpack.config.js
   */
  async checkWebpackConfig() {
    const webpackConfigPath = path.join(this.projectPath, 'webpack.config.js');
    const exists = await fs.access(webpackConfigPath).then(() => true).catch(() => false);

    if (exists) {
      this.issues.push({
        severity: 'high',
        file: 'webpack.config.js',
        issue: 'Standalone webpack configuration detected',
        description: 'Turbopack cannot use webpack.config.js files',
        fix: 'Migrate webpack configuration to next.config.js or remove if not needed with Turbopack'
      });
    }
  }

  /**
   * Check Babel configuration
   */
  async checkBabelConfig() {
    const babelPaths = [
      path.join(this.projectPath, '.babelrc'),
      path.join(this.projectPath, '.babelrc.json'),
      path.join(this.projectPath, '.babelrc.js'),
      path.join(this.projectPath, 'babel.config.js')
    ];

    for (const babelPath of babelPaths) {
      const exists = await fs.access(babelPath).then(() => true).catch(() => false);
      
      if (exists) {
        this.suggestions.push({
          type: 'info',
          message: `Babel configuration found: ${path.basename(babelPath)}`,
          recommendation: 'Turbopack automatically picks up Babel configs, but SWC is preferred for better performance. Consider migrating from Babel to SWC.'
        });
        return;
      }
    }

    // No Babel config - that's good for Turbopack
    this.suggestions.push({
      type: 'success',
      message: 'No Babel configuration detected',
      recommendation: 'Good! Turbopack uses SWC by default which is faster than Babel.'
    });
  }

  /**
   * Check for custom loaders
   */
  async checkCustomLoaders() {
    const loaderPatterns = [
      'style-loader',
      'css-loader',
      'sass-loader',
      'less-loader',
      'url-loader',
      'file-loader',
      'raw-loader'
    ];

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const foundLoaders = loaderPatterns.filter(loader => allDeps[loader]);

      if (foundLoaders.length > 0) {
        this.issues.push({
          severity: 'medium',
          file: 'package.json',
          issue: `Webpack loaders detected: ${foundLoaders.join(', ')}`,
          description: 'Turbopack has built-in support for CSS, Sass, and file imports',
          fix: 'Remove unused loaders if relying on Turbopack built-in features'
        });
      }
    } catch (error) {
      // package.json not found or invalid
    }
  }

  /**
   * Check for Webpack plugins in dependencies
   */
  async checkPlugins() {
    const pluginPatterns = [
      'html-webpack-plugin',
      'mini-css-extract-plugin',
      'copy-webpack-plugin',
      'webpack-bundle-analyzer'
    ];

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const foundPlugins = pluginPatterns.filter(plugin => allDeps[plugin]);

      if (foundPlugins.length > 0) {
        this.issues.push({
          severity: 'medium',
          file: 'package.json',
          issue: `Webpack plugins detected: ${foundPlugins.join(', ')}`,
          description: 'These plugins won\'t work with Turbopack',
          fix: 'Remove if not using Webpack, or continue using --webpack flag'
        });
      }
    } catch (error) {
      // package.json not found or invalid
    }
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    const highSeverityIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = this.issues.filter(i => i.severity === 'medium').length;

    if (highSeverityIssues > 0) {
      this.suggestions.unshift({
        type: 'critical',
        message: `${highSeverityIssues} critical compatibility issues found`,
        recommendation: 'Consider keeping Webpack for now using: next dev --webpack\nOr migrate away from custom Webpack configurations to use Turbopack'
      });
    } else if (mediumSeverityIssues > 0) {
      this.suggestions.unshift({
        type: 'warning',
        message: `${mediumSeverityIssues} minor issues found`,
        recommendation: 'Most issues can be resolved by cleaning up unused dependencies'
      });
    } else {
      this.suggestions.unshift({
        type: 'success',
        message: 'Project is Turbopack-ready!',
        recommendation: 'No blocking issues found. You can safely use Turbopack for faster builds.'
      });
    }

    // Always suggest enabling filesystem caching
    this.suggestions.push({
      type: 'optimization',
      message: 'Enable Turbopack optimizations',
      recommendation: 'For large projects, enable filesystem caching for even faster startup times',
      implementation: 'Add to next.config.js:\nexperimental: {\n  turbopackFileSystemCacheForDev: true,\n}'
    });
  }

  /**
   * Print formatted report
   */
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('  Turbopack Migration Analysis');
    console.log('='.repeat(60) + '\n');

    // Issues section
    if (this.issues.length > 0) {
      console.log(`Found ${this.issues.length} compatibility issues:\n`);
      
      this.issues.forEach((issue, i) => {
        const severity = issue.severity === 'high' ? 'HIGH' : 
                        issue.severity === 'medium' ? 'MEDIUM' : 'LOW';
        console.log(`${i + 1}. [${severity}] ${issue.issue}`);
        console.log(`   File: ${issue.file}`);
        console.log(`   ${issue.description}`);
        console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    } else {
      console.log('(no issues found) No compatibility issues found!\n');
    }

    // Suggestions section
    if (this.suggestions.length > 0) {
      console.log('Recommendations:\n');
      this.suggestions.forEach((sug, i) => {
        const prefix = sug.type === 'critical' ? '[CRITICAL]' :
                    sug.type === 'warning' ? '[WARNING]' :
                    sug.type === 'success' ? '[SUCCESS]' :
                    sug.type === 'optimization' ? '[OPTIMIZATION]' : '[INFO]';
        
        console.log(`${prefix} ${sug.message}`);
        console.log(`   ${sug.recommendation}`);
        if (sug.code || sug.implementation) {
          console.log('\n   ' + (sug.code || sug.implementation).split('\n').join('\n   '));
        }
        console.log('');
      });
    }

    // Migration commands
    console.log('Migration Commands:\n');
    console.log('# Use Turbopack (Next.js 16 default):');
    console.log('  next dev');
    console.log('\n# Continue using Webpack:');
    console.log('  next dev --webpack');
    console.log('  next build --webpack');
    console.log('\n# Enable Turbopack filesystem caching:');
    console.log('  # Add to next.config.js:');
    console.log('  experimental: { turbopackFileSystemCacheForDev: true }');

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Generate migration config
   */
  async generateMigrationConfig() {
    const config = {
      turbopackReady: this.issues.filter(i => i.severity === 'high').length === 0,
      recommendedApproach: this.issues.length === 0 ? 'turbopack' : 'webpack',
      optimizations: {
        filesystemCaching: true
      }
    };

    return config;
  }
}

module.exports = TurbopackMigrationAssistant;
