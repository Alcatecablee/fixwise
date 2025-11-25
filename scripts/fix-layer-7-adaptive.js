#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * Layer 7: Adaptive Pattern Learning
 * Learns from previous layer transformations and applies patterns
 */

const fs = require('fs').promises;
const path = require('path');
const BackupManager = require('../backup-manager');

/**
 * Rule Store for managing learned patterns
 */
class RuleStore {
  constructor() {
    this.rules = [];
    this.storagePath = path.join(process.cwd(), '.neurolint', 'learned-rules.json');
  }

  // Ensure rules is always an array
  get rules() {
    return this._rules || [];
  }

  set rules(value) {
    this._rules = Array.isArray(value) ? value : [];
  }

  async load() {
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      this.rules = JSON.parse(data, (key, value) => {
        if (key === 'pattern' && typeof value === 'string' && value.startsWith('/')) {
          const [, pattern, flags] = value.match(/^\/(.*)\/([a-z]*)$/) || [];
          return new RegExp(pattern, flags || '');
        }
        return value;
      });
    } catch (error) {
      this.rules = [];
    }
  }

  async save() {
    try {
      const dir = path.dirname(this.storagePath);
      await fs.mkdir(dir, { recursive: true });
      const serialized = JSON.stringify(this.rules, (key, value) => {
        if (key === 'pattern' && value instanceof RegExp) return value.toString();
        return value;
      }, 2);
      await fs.writeFile(this.storagePath, serialized);
    } catch (error) {
      throw new Error(`Failed to save learned rules: ${error.message}`);
    }
  }

  async addRule(rule) {
    const existing = this.rules.find(r => r.pattern.toString() === rule.pattern.toString());
    if (existing) {
      existing.frequency++;
      existing.confidence = Math.min(1, existing.confidence + 0.05);
    } else {
      this.rules.push(rule);
    }
    await this.save();
  }

  async applyRules(code) {
    let transformedCode = code;
    const appliedRules = [];
    const minConfidence = 0.7;

    // Ensure rules is an array and filter safely
    const applicableRules = Array.isArray(this.rules) 
      ? this.rules.filter(r => r && r.confidence >= minConfidence)
      : [];

    for (const rule of applicableRules) {
      try {
        if (rule.pattern instanceof RegExp) {
          if (typeof rule.replacement === 'string' && rule.pattern.test(transformedCode)) {
            transformedCode = transformedCode.replace(rule.pattern, rule.replacement);
            appliedRules.push(rule.description);
          } else if (typeof rule.replacement === 'function' && rule.pattern.test(transformedCode)) {
            transformedCode = transformedCode.replace(rule.pattern, rule.replacement);
            appliedRules.push(rule.description);
          }
        }
      } catch {
        // Silently skip failed rules
      }
    }

    return { transformedCode, appliedRules };
  }

  async deleteRule(id) {
    if (id >= 0 && id < this.rules.length) {
      this.rules.splice(id, 1);
      await this.save();
      return true;
    }
    return false;
  }

  async resetRules() {
    this.rules = [];
    await this.save();
  }

  async editRule(id, updates) {
    if (id >= 0 && id < this.rules.length) {
      Object.assign(this.rules[id], updates);
      await this.save();
      return true;
    }
    return false;
  }

  async exportRules(filePath) {
    const data = JSON.stringify(this.rules, (key, value) => {
      if (key === 'pattern' && value instanceof RegExp) return value.toString();
      return value;
    }, 2);
    await fs.writeFile(filePath, data);
  }

  async importRules(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    this.rules = JSON.parse(data, (key, value) => {
      if (key === 'pattern' && typeof value === 'string' && value.startsWith('/')) {
        const [, pattern, flags] = value.match(/^\/(.*)\/([a-z]*)$/) || [];
        return new RegExp(pattern, flags || '');
      }
      return value;
    });
    await this.save();
  }
}

async function isRegularFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Transform code using adaptive pattern learning
 */
async function transform(code, options = {}) {
  const { dryRun = false, verbose = false, filePath = process.cwd(), previousResults = [] } = options;
  const results = [];
  let changeCount = 0;
  let updatedCode = code;
  const changes = [];

  try {
    const existsAsFile = await isRegularFile(filePath);
    if (existsAsFile && !dryRun) {
      try {
        const backupManager = new BackupManager({
          backupDir: '.neurolint-backups',
          maxBackups: 10
        });
        
        const backupResult = await backupManager.createBackup(filePath, 'layer-7-adaptive');
        
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

    if (!code.trim()) {
      results.push({ type: 'empty', file: filePath, success: false, error: 'Empty input provided' });
      return {
        success: false,
        code,
        originalCode: code,
        changeCount: 0,
        results,
        changes
      };
    }

    const ruleStore = new RuleStore();
    await ruleStore.load();

    // Learn from previous layer results
    if (Array.isArray(previousResults)) {
      for (const result of previousResults.filter(r => r && r.success && (r.changes > 0 || r.changeCount > 0))) {
        const patterns = extractPatterns(result.originalCode || code, result.code || code, result.layerId || result.layer);
        for (const pattern of patterns) {
          await ruleStore.addRule(pattern);
          results.push({
            type: 'learn',
            file: filePath,
            success: true,
            details: `Learned pattern: ${pattern.description} from Layer ${result.layerId || result.layer}`
          });
          changes.push({ type: 'learn', description: pattern.description, location: null });
        }
      }
    }

    // Apply learned rules
    const applyResult = await ruleStore.applyRules(updatedCode);
    updatedCode = applyResult.transformedCode;
    changeCount += applyResult.appliedRules.length;
    applyResult.appliedRules.forEach(rule => {
      results.push({
        type: 'apply',
        file: filePath,
        success: true,
        changes: 1,
        details: `Applied learned rule: ${rule}`
      });
      changes.push({ type: 'apply', description: rule, location: null });
    });

    // Add general adaptive suggestions for any file
    if (updatedCode.includes('console.') && !updatedCode.includes('// [NeuroLint]')) {
      changes.push({ 
        type: 'AdaptiveSuggestion', 
        description: 'Console statements detected - consider removing for production', 
        location: null 
      });
      changeCount++;
    }

    if (updatedCode.includes('style={{') && updatedCode.includes('}}')) {
      changes.push({ 
        type: 'AdaptiveSuggestion', 
        description: 'Inline styles detected - consider using CSS classes for better performance', 
        location: null 
      });
      changeCount++;
    }

    updatedCode = updatedCode.trim().replace(/\r\n/g, '\n');

    if (dryRun) {
      if (verbose && changeCount > 0) {
        process.stdout.write(`[SUCCESS] Layer 7 identified ${changeCount} adaptive pattern applications (dry-run)\n`);
      }
      return {
        success: true,
        code,
        originalCode: code,
        changeCount,
        results,
        changes
      };
    }

    if (changeCount > 0 && existsAsFile) {
      await fs.writeFile(filePath, updatedCode);
      results.push({ type: 'write', file: filePath, success: true, changes: changeCount });
    }

    if (verbose && changeCount > 0) {
      process.stdout.write(`[SUCCESS] Layer 7 applied ${changeCount} adaptive patterns to ${path.basename(filePath)}\n`);
    }

    return {
      success: true,
      code: updatedCode,
      originalCode: code,
      changeCount,
      results,
      changes
    };
  } catch (error) {
    if (verbose) process.stderr.write(`[ERROR] Layer 7 failed: ${error.message}\n`);
    return {
      success: false,
      code,
      originalCode: code,
      changeCount: 0,
      error: error.message,
      results,
      changes
    };
  }
}

function extractPatterns(before, after, layerId) {
  const patterns = [];
  if (!before || !after || before === after) return patterns;
  
  try {
    // Target small changed snippets for learning
    const beforeSnip = before.slice(0, 2000);
    const afterSnip = after.slice(0, 2000);
    
    if (beforeSnip !== afterSnip) {
      // Learn Layer 5 pattern: adding 'use client' directive
      if (layerId === 5 && afterSnip.includes("'use client'") && !beforeSnip.includes("'use client'")) {
        patterns.push({
          description: 'Add use client directive for React components',
          pattern: /^(import\s+.*?from\s+['"]react['"];?\s*\n)/m,
          replacement: "'use client';\n$1",
          confidence: 0.9,
          frequency: 1,
          layer: layerId
        });
        
        // Add a simpler pattern that just looks for React imports
        patterns.push({
          description: 'Add use client directive for any React import',
          pattern: /^(import\s+.*?from\s+['"]react['"];?\s*\n)/m,
          replacement: "'use client';\n$1",
          confidence: 0.8,
          frequency: 1,
          layer: layerId
        });
        
        // Add a very simple pattern that just adds 'use client' at the start
        patterns.push({
          description: 'Add use client directive at file start',
          pattern: /^/,
          replacement: "'use client';\n",
          confidence: 0.7,
          frequency: 1,
          layer: layerId
        });
      }
      
      // Learn Layer 6 pattern: adding error boundaries or memoization
      if (layerId === 6) {
        if (afterSnip.includes('ErrorBoundary') && !beforeSnip.includes('ErrorBoundary')) {
          patterns.push({
            description: 'Wrap components with ErrorBoundary',
            pattern: /^(function\s+\w+\([^)]*\)\s*\{[\s\S]*?return\s*<)([^>]+)(>[\s\S]*?<\/\2>[\s\S]*?\})/m,
            replacement: '$1ErrorBoundary>$2$3</ErrorBoundary>',
            confidence: 0.8,
            frequency: 1,
            layer: layerId
          });
        }
        
        if (afterSnip.includes('React.memo') && !beforeSnip.includes('React.memo')) {
          patterns.push({
            description: 'Memoize React components',
            pattern: /^(function\s+(\w+)\([^)]*\)\s*\{[\s\S]*?\n)(export\s+default\s+\2;?)$/m,
            replacement: 'const Memoized = React.memo($2);\n$1$3',
            confidence: 0.8,
            frequency: 1,
            layer: layerId
          });
        }
      }
      
      // Generic console removal rule
      if (afterSnip.includes('// [NeuroLint] Removed console') && beforeSnip.includes('console.')) {
        patterns.push({
          description: 'Remove console statements',
          pattern: /console\.(log|info|warn|error|debug)\([^\)]*\);?/g,
          replacement: (m) => `// [NeuroLint] Removed ${m.replace(/\(.*/, '')}: ...`,
          confidence: 0.8,
          frequency: 1,
          layer: layerId || 0
        });
      }
    }
  } catch (error) {
    // Silently handle extraction errors
  }
  
  return patterns;
}

module.exports = { transform, RuleStore };