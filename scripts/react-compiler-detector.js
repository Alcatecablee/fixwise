#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * React Compiler Integration Detector
 * 
 * Detects manual memoization patterns that React Compiler would handle automatically
 * Suggests enabling React Compiler for performance gains
 */

const fs = require('fs').promises;
const path = require('path');

class ReactCompilerDetector {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectPath = options.projectPath || process.cwd();
    this.findings = [];
  }

  log(message, level = 'info') {
    if (this.verbose || level === 'error' || level === 'success') {
      const prefix = level === 'error' ? '[ERROR]' : 
                     level === 'success' ? '[SUCCESS]' : '[INFO]';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Main analysis entry point
   */
  async analyze() {
    this.log('Scanning for manual memoization patterns...', 'info');

    try {
      const files = await this.findSourceFiles();
      
      for (const file of files) {
        await this.analyzeFile(file);
      }

      this.calculatePotentialSavings();
      this.printReport();

      return {
        totalFindings: this.findings.length,
        findings: this.findings,
        recommendCompiler: this.findings.length >= 3
      };
    } catch (error) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Find all source files
   */
  async findSourceFiles() {
    const files = [];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
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

    await scan(this.projectPath);
    return files;
  }

  /**
   * Analyze a single file for memoization patterns
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.projectPath, filePath);

      // Detect useMemo
      const useMemoMatches = content.match(/useMemo\(/g);
      if (useMemoMatches) {
        this.findings.push({
          file: relativePath,
          pattern: 'useMemo',
          count: useMemoMatches.length,
          line: this.findLineNumber(content, 'useMemo('),
          description: 'Manual memoization with useMemo',
          benefit: 'React Compiler automatically memoizes values'
        });
      }

      // Detect useCallback
      const useCallbackMatches = content.match(/useCallback\(/g);
      if (useCallbackMatches) {
        this.findings.push({
          file: relativePath,
          pattern: 'useCallback',
          count: useCallbackMatches.length,
          line: this.findLineNumber(content, 'useCallback('),
          description: 'Manual callback memoization with useCallback',
          benefit: 'React Compiler automatically memoizes callbacks'
        });
      }

      // Detect React.memo
      const reactMemoMatches = content.match(/React\.memo\(|memo\(/g);
      if (reactMemoMatches) {
        this.findings.push({
          file: relativePath,
          pattern: 'React.memo',
          count: reactMemoMatches.length,
          line: this.findLineNumber(content, /React\.memo\(|memo\(/),
          description: 'Manual component memoization with React.memo',
          benefit: 'React Compiler automatically memoizes components'
        });
      }

      // Detect useRef for previous value tracking
      const prevValuePattern = /const\s+\w+Ref\s*=\s*useRef\(/g;
      const prevValueMatches = content.match(prevValuePattern);
      if (prevValueMatches && content.includes('useEffect')) {
        this.findings.push({
          file: relativePath,
          pattern: 'useRef for prev values',
          count: prevValueMatches.length,
          line: this.findLineNumber(content, prevValuePattern),
          description: 'Manual previous value tracking with useRef',
          benefit: 'React Compiler can optimize value comparisons automatically'
        });
      }

      // Detect manual dependency arrays that could be optimized
      const emptyDepsPattern = /useEffect\([^,]+,\s*\[\s*\]\)/g;
      const emptyDepsMatches = content.match(emptyDepsPattern);
      if (emptyDepsMatches && emptyDepsMatches.length > 3) {
        this.findings.push({
          file: relativePath,
          pattern: 'Complex dependency management',
          count: emptyDepsMatches.length,
          line: this.findLineNumber(content, emptyDepsPattern),
          description: 'Multiple effects with dependency arrays',
          benefit: 'React Compiler can track dependencies automatically'
        });
      }

    } catch (error) {
      // Skip files that can't be read
    }
  }

  /**
   * Find line number of a pattern
   */
  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    
    // Handle string patterns differently from regex patterns
    if (typeof pattern === 'string') {
      // For strings, do substring search (no regex needed)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
          return i + 1;
        }
      }
    } else {
      // For regex patterns, use test()
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          return i + 1;
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate potential performance savings
   */
  calculatePotentialSavings() {
    const totalMemoizations = this.findings.reduce((sum, f) => sum + f.count, 0);
    
    // Rough estimate: each manual memoization adds ~50 bytes to bundle
    // and requires runtime overhead
    this.potentialSavings = {
      bundleSize: totalMemoizations * 50,
      runtimeOptimizations: totalMemoizations,
      codeSimplification: this.findings.length
    };
  }

  /**
   * Print formatted report
   */
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('  React Compiler Opportunity Analysis');
    console.log('='.repeat(60) + '\n');

    if (this.findings.length === 0) {
      console.log('(no issues found) No manual memoization patterns detected\n');
      console.log('Your code is already optimized or doesn\'t need memoization.\n');
      return;
    }

    console.log(`Found ${this.findings.length} files with manual memoization:\n`);

    // Group by pattern
    const byPattern = {};
    this.findings.forEach(f => {
      if (!byPattern[f.pattern]) {
        byPattern[f.pattern] = [];
      }
      byPattern[f.pattern].push(f);
    });

    Object.keys(byPattern).forEach(pattern => {
      const items = byPattern[pattern];
      const totalCount = items.reduce((sum, item) => sum + item.count, 0);
      
      console.log(`${pattern} (${totalCount} occurrences in ${items.length} files)`);
      console.log(`   Benefit: ${items[0].benefit}`);
      console.log('');
      
      items.slice(0, 5).forEach(item => {
        console.log(`   • ${item.file}:${item.line || '?'} (${item.count}x)`);
      });
      
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more files`);
      }
      console.log('');
    });

    // Potential savings
    if (this.potentialSavings) {
      console.log('Potential Benefits of React Compiler:\n');
      console.log(`  - Reduce bundle size by ~${this.potentialSavings.bundleSize} bytes`);
      console.log(`  - Eliminate ${this.potentialSavings.runtimeOptimizations} manual optimization calls`);
      console.log(`  - Simplify code in ${this.potentialSavings.codeSimplification} files`);
      console.log('');
    }

    // Recommendation
    if (this.findings.length >= 3) {
      console.log('Strong Recommendation: Enable React Compiler\n');
      console.log('Your project has significant manual memoization that React Compiler');
      console.log('can handle automatically, resulting in cleaner code and better performance.\n');
    } else {
      console.log('Consider React Compiler\n');
      console.log('Your project has some manual memoization. React Compiler could simplify');
      console.log('your code, though the impact may be modest.\n');
    }

    // Setup instructions
    console.log('How to Enable React Compiler:\n');
    console.log('1. Install the compiler:');
    console.log('   npm install babel-plugin-react-compiler@latest');
    console.log('');
    console.log('2. Add to next.config.js:');
    console.log('   experimental: {');
    console.log('     reactCompiler: true');
    console.log('   }');
    console.log('');
    console.log('3. Optionally configure per-component:');
    console.log('   experimental: {');
    console.log('     reactCompiler: {');
    console.log('       compilationMode: "annotation" // or "all"');
    console.log('     }');
    console.log('   }');
    console.log('');
    console.log('4. After enabling, you can gradually remove manual useMemo/useCallback');

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Generate cleanup suggestions
   */
  async generateCleanupSuggestions() {
    const suggestions = [];

    this.findings.forEach(finding => {
      suggestions.push({
        file: finding.file,
        line: finding.line,
        pattern: finding.pattern,
        action: 'safe-to-remove-after-compiler',
        description: `After enabling React Compiler, this ${finding.pattern} can likely be removed`
      });
    });

    return suggestions;
  }
}

module.exports = ReactCompilerDetector;
