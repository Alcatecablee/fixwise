#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * React 19 Dependency Checker
 * 
 * Scans package.json for React 19 incompatible dependencies
 * Provides compatibility reports and suggests fixes
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class React19DependencyChecker {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectPath = options.projectPath || process.cwd();
    
    // Known incompatible packages with React 19
    this.knownIssues = {
      'react-is': {
        incompatibleVersions: ['<19.0.0'],
        fix: 'npm install react-is@^19.0.0 --force',
        description: 'react-is versions below 19.0.0 have peer dependency conflicts'
      },
      '@radix-ui/react-select': {
        incompatibleVersions: ['<1.2.0'],
        fix: 'npm install @radix-ui/react-select@latest --force',
        description: 'Older Radix UI versions throw useEffectEvent errors with React 19'
      },
      '@radix-ui/react-dropdown-menu': {
        incompatibleVersions: ['<2.1.0'],
        fix: 'npm install @radix-ui/react-dropdown-menu@latest --force',
        description: 'Older Radix UI versions throw useEffectEvent errors with React 19'
      },
      'antd': {
        incompatibleVersions: ['<5.12.0'],
        fix: 'npm install antd@latest --force',
        description: 'Ant Design versions below 5.12.0 have ref handling issues with React 19'
      },
      'next-auth': {
        incompatibleVersions: ['<5.0.0'],
        fix: 'npm install next-auth@beta --force or use --legacy-peer-deps',
        description: 'next-auth v4 has peer dependency conflicts. Consider upgrading to v5 (Auth.js)'
      },
      'recharts': {
        incompatibleVersions: ['<2.10.0'],
        fix: 'Add override in package.json: "overrides": { "react-is": "19.0.0" }',
        description: 'recharts has outdated react-is dependency'
      }
    };
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
   * Main check entry point
   */
  async check() {
    this.log('Scanning dependencies for React 19 compatibility...', 'info');
    
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const results = {
        react: await this.checkReactVersion(packageJson),
        dependencies: await this.checkDependencies(packageJson),
        peerDependencies: await this.checkPeerDependencies(packageJson),
        suggestions: [],
        fixes: []
      };

      // Generate fix suggestions
      results.suggestions = this.generateSuggestions(results);
      results.fixes = this.generateFixes(results);

      // Print report
      this.printReport(results);

      return results;
    } catch (error) {
      this.log(`Failed to check dependencies: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Check React version
   */
  async checkReactVersion(packageJson) {
    const reactVersion = packageJson.dependencies?.react || 
                        packageJson.devDependencies?.react ||
                        packageJson.peerDependencies?.react;

    if (!reactVersion) {
      return {
        status: 'missing',
        message: 'React is not listed in dependencies'
      };
    }

    const version = reactVersion.replace(/[\^~]/g, '');
    const majorVersion = parseInt(version.split('.')[0]);

    if (majorVersion >= 19) {
      return {
        status: 'compatible',
        version: reactVersion,
        message: 'React 19 or higher detected'
      };
    } else {
      return {
        status: 'incompatible',
        version: reactVersion,
        message: `React ${reactVersion} is not compatible with this check. Upgrade to React 19+`
      };
    }
  }

  /**
   * Check all dependencies for known React 19 issues
   */
  async checkDependencies(packageJson) {
    const issues = [];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [pkg, version] of Object.entries(allDeps)) {
      if (this.knownIssues[pkg]) {
        const issue = this.knownIssues[pkg];
        const cleanVersion = version.replace(/[\^~]/g, '');
        
        // Check if version matches incompatible pattern
        if (this.isIncompatibleVersion(cleanVersion, issue.incompatibleVersions)) {
          issues.push({
            package: pkg,
            currentVersion: version,
            issue: issue.description,
            fix: issue.fix
          });
        }
      }

      // Check for Radix UI packages (generic check)
      if (pkg.startsWith('@radix-ui/')) {
        const majorVersion = parseInt(version.replace(/[\^~]/g, '').split('.')[0]);
        if (majorVersion < 1) {
          issues.push({
            package: pkg,
            currentVersion: version,
            issue: 'Older Radix UI packages may have compatibility issues with React 19',
            fix: `npm install ${pkg}@latest --force`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check peer dependencies
   */
  async checkPeerDependencies(packageJson) {
    const warnings = [];

    // Check if using --legacy-peer-deps flag is needed
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const hasKnownIssues = Object.keys(allDeps).some(pkg => 
      this.knownIssues[pkg] !== undefined
    );

    if (hasKnownIssues) {
      warnings.push({
        type: 'peer_deps',
        message: 'Some packages may require --legacy-peer-deps flag during installation',
        suggestion: 'Add "legacy-peer-deps=true" to .npmrc or use npm install --legacy-peer-deps'
      });
    }

    return warnings;
  }

  /**
   * Check if version is incompatible
   */
  isIncompatibleVersion(version, incompatiblePatterns) {
    for (const pattern of incompatiblePatterns) {
      if (pattern.startsWith('<')) {
        const targetVersion = pattern.replace('<', '');
        if (this.compareVersions(version, targetVersion) < 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Compare semantic versions
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * Generate suggestions based on findings
   */
  generateSuggestions(results) {
    const suggestions = [];

    if (results.dependencies.length > 0) {
      suggestions.push({
        priority: 'high',
        type: 'dependency_updates',
        message: `Update ${results.dependencies.length} incompatible packages`,
        action: 'Run the suggested npm install commands below'
      });
    }

    if (results.peerDependencies.length > 0) {
      suggestions.push({
        priority: 'medium',
        type: 'peer_deps_config',
        message: 'Configure npm to handle peer dependency conflicts',
        action: 'Create .npmrc file with legacy-peer-deps=true'
      });
    }

    // Check for package.json overrides
    suggestions.push({
      priority: 'medium',
      type: 'package_overrides',
      message: 'Use package.json overrides for stubborn dependencies',
      action: 'Add "overrides" field to package.json (npm) or "resolutions" (yarn)'
    });

    return suggestions;
  }

  /**
   * Generate specific fix commands
   */
  generateFixes(results) {
    const fixes = [];

    // Individual package fixes
    results.dependencies.forEach(dep => {
      fixes.push({
        type: 'update',
        package: dep.package,
        command: dep.fix
      });
    });

    // Create .npmrc file
    if (results.peerDependencies.length > 0) {
      fixes.push({
        type: 'config',
        file: '.npmrc',
        content: 'legacy-peer-deps=true\n',
        description: 'Create .npmrc to allow legacy peer dependencies'
      });
    }

    // Package.json overrides
    fixes.push({
      type: 'override',
      file: 'package.json',
      content: {
        overrides: {
          'react-is': '^19.0.0'
        }
      },
      description: 'Add to package.json to force compatible versions'
    });

    return fixes;
  }

  /**
   * Print formatted report
   */
  printReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('  React 19 Dependency Compatibility Report');
    console.log('='.repeat(60) + '\n');

    // React version
    console.log('React Version:');
    if (results.react.status === 'compatible') {
      console.log(`  [OK] ${results.react.version} (Compatible)`);
    } else if (results.react.status === 'incompatible') {
      console.log(`  [X] ${results.react.version} (Needs upgrade)`);
    } else {
      console.log(`  ? Not found in package.json`);
    }
    console.log('');

    // Dependency issues
    if (results.dependencies.length > 0) {
      console.log(`Found ${results.dependencies.length} potential compatibility issues:\n`);
      
      results.dependencies.forEach((dep, i) => {
        console.log(`${i + 1}. ${dep.package} (${dep.currentVersion})`);
        console.log(`   Issue: ${dep.issue}`);
        console.log(`   Fix: ${dep.fix}`);
        console.log('');
      });
    } else {
      console.log('[OK] No known compatibility issues found\n');
    }

    // Suggestions
    if (results.suggestions.length > 0) {
      console.log('Recommendations:\n');
      results.suggestions.forEach((sug, i) => {
        const priority = sug.priority === 'high' ? '[HIGH]' : 
                        sug.priority === 'medium' ? '[MEDIUM]' : '[LOW]';
        console.log(`${priority} ${sug.message}`);
        console.log(`   ${sug.action}`);
        console.log('');
      });
    }

    // Quick fixes
    console.log('Quick Fix Commands:\n');
    console.log('# Update all packages:');
    results.dependencies.forEach(dep => {
      console.log(`  ${dep.fix}`);
    });
    
    console.log('\n# Or use force install for all:');
    console.log('  npm install --force');
    
    console.log('\n# Or use legacy peer deps:');
    console.log('  npm install --legacy-peer-deps');

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Apply automatic fixes
   */
  async applyFixes(fixes) {
    this.log('Applying automatic fixes...', 'info');

    for (const fix of fixes) {
      if (fix.type === 'config' && fix.file === '.npmrc') {
        const npmrcPath = path.join(this.projectPath, '.npmrc');
        await fs.writeFile(npmrcPath, fix.content, 'utf8');
        this.log(`Created ${fix.file}`, 'success');
      }

      if (fix.type === 'override' && fix.file === 'package.json') {
        const packageJsonPath = path.join(this.projectPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        packageJson.overrides = {
          ...(packageJson.overrides || {}),
          ...fix.content.overrides
        };

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        this.log(`Updated ${fix.file} with overrides`, 'success');
      }
    }
  }
}

module.exports = React19DependencyChecker;
