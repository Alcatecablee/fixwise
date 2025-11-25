/**
 * NeuroLint - Analytics and Metrics Engine
 * 
 * Tracks usage, performance, and provides insights across
 * CLI, VS Code, and Web App platforms.
 * 
 * Copyright (c) 2025 NeuroLint
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class Analytics {
  constructor() {
    this.metrics = {
      analysis: {
        totalFiles: 0,
        totalIssues: 0,
        issuesByLayer: {},
        issuesByType: {},
        performance: {
          averageTime: 0,
          totalTime: 0,
          slowestFiles: []
        }
      },
      fixes: {
        totalApplied: 0,
        successRate: 0,
        fixesByLayer: {},
        fixesByRule: {},
        rollbacks: 0
      },
      usage: {
        commands: {},
        platforms: {},
        sessions: 0,
        activeUsers: new Set()
      },
      quality: {
        codeQualityScore: 0,
        modernizationProgress: 0,
        technicalDebt: 0
      }
    };
    
    this.analyticsPath = path.join(process.cwd(), '.neurolint', 'analytics.json');
    this.queuePath = path.join(process.cwd(), '.neurolint', 'analytics-queue.json');
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    this.eventQueue = [];
    this.syncConfig = {
      apiUrl: process.env.NEUROLINT_API_URL || null,
      apiKey: process.env.NEUROLINT_API_KEY || null,
      userId: process.env.NEUROLINT_USER_ID || null,
      enabled: false,
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 1000
    };
    
    this.loadSyncConfig();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load sync configuration from environment or config file
   */
  loadSyncConfig() {
    this.syncConfig.enabled = !!(this.syncConfig.apiUrl && this.syncConfig.apiKey);
  }

  /**
   * Configure sync settings
   */
  configureSync(options = {}) {
    this.syncConfig = {
      ...this.syncConfig,
      ...options
    };
    this.syncConfig.enabled = !!(this.syncConfig.apiUrl && this.syncConfig.apiKey);
    return this.syncConfig.enabled;
  }

  /**
   * Queue an analytics event for later syncing
   */
  queueEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
    
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.syncConfig.batchSize) {
      this.syncEvents().catch(() => {});
    }
  }

  /**
   * Sync queued events to the API
   */
  async syncEvents(retryCount = 0) {
    if (!this.syncConfig.enabled || this.eventQueue.length === 0) {
      return { success: false, reason: 'sync_disabled_or_empty_queue' };
    }

    const eventsToSync = this.eventQueue.splice(0, this.syncConfig.batchSize);
    
    try {
      await this.saveQueue();
      
      const url = new URL('/api/cli/analytics', this.syncConfig.apiUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const payload = JSON.stringify({
        events: eventsToSync,
        sessionId: this.sessionId,
        platform: 'cli'
      });
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${this.syncConfig.apiKey}`
        }
      };
      
      const response = await new Promise((resolve, reject) => {
        const req = protocol.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: JSON.parse(data || '{}') });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
      
      return response;
      
    } catch (error) {
      this.eventQueue.unshift(...eventsToSync);
      
      if (retryCount < this.syncConfig.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, this.syncConfig.retryDelay * (retryCount + 1))
        );
        return this.syncEvents(retryCount + 1);
      }
      
      await this.saveQueue();
      return { success: false, error: error.message };
    }
  }

  /**
   * Save event queue to disk
   */
  async saveQueue() {
    try {
      const queueDir = path.dirname(this.queuePath);
      await fs.mkdir(queueDir, { recursive: true });
      await fs.writeFile(this.queuePath, JSON.stringify(this.eventQueue, null, 2));
    } catch (error) {
    }
  }

  /**
   * Load event queue from disk
   */
  async loadQueue() {
    try {
      const data = await fs.readFile(this.queuePath, 'utf8');
      this.eventQueue = JSON.parse(data);
    } catch (error) {
      this.eventQueue = [];
    }
  }

  /**
   * Track analysis event
   */
  trackAnalysis(data) {
    const {
      files,
      issues,
      executionTime,
      layers,
      platform = 'cli',
      result
    } = data;

    // Update file count
    this.metrics.analysis.totalFiles += files.length;

    // Update issue count
    this.metrics.analysis.totalIssues += issues.length;

    // Track issues by layer
    issues.forEach(issue => {
      const layer = issue.layer || 'unknown';
      this.metrics.analysis.issuesByLayer[layer] = 
        (this.metrics.analysis.issuesByLayer[layer] || 0) + 1;
      
      const type = issue.type || 'unknown';
      this.metrics.analysis.issuesByType[type] = 
        (this.metrics.analysis.issuesByType[type] || 0) + 1;
    });

    // Track performance
    this.metrics.analysis.performance.totalTime += executionTime;
    this.metrics.analysis.performance.averageTime = 
      this.metrics.analysis.performance.totalTime / 
      (this.metrics.analysis.totalFiles || 1);

    // Track slowest files
    if (executionTime > 1000) { // Files taking more than 1 second
      this.metrics.analysis.performance.slowestFiles.push({
        file: files[0] || 'unknown',
        time: executionTime,
        timestamp: new Date().toISOString()
      });
      
      // Keep only top 10 slowest files
      this.metrics.analysis.performance.slowestFiles.sort((a, b) => b.time - a.time);
      this.metrics.analysis.performance.slowestFiles = 
        this.metrics.analysis.performance.slowestFiles.slice(0, 10);
    }

    // Track platform usage
    this.metrics.usage.platforms[platform] = 
      (this.metrics.usage.platforms[platform] || 0) + 1;
    
    // Queue event for API sync if enabled
    if (this.syncConfig.enabled) {
      this.queueEvent('analysis', {
        filename: files[0] || 'unknown',
        success: result?.success || true,
        analysis: result?.analysis || {},
        issues: issues || [],
        layers: layers || [],
        summary: result?.summary || {},
        executionTime: executionTime,
        platform: platform
      });
    }
  }

  /**
   * Track fix application event
   */
  trackFix(data) {
    const {
      appliedFixes,
      success,
      rollback,
      layer,
      rule,
      platform = 'cli'
    } = data;

    if (success) {
      this.metrics.fixes.totalApplied += appliedFixes.length;
      
      // Track fixes by layer
      if (layer) {
        this.metrics.fixes.fixesByLayer[layer] = 
          (this.metrics.fixes.fixesByLayer[layer] || 0) + 1;
      }
      
      // Track fixes by rule
      if (rule) {
        this.metrics.fixes.fixesByRule[rule] = 
          (this.metrics.fixes.fixesByRule[rule] || 0) + 1;
      }
    } else {
      this.metrics.fixes.rollbacks += 1;
    }

    // Update success rate
    const totalAttempts = this.metrics.fixes.totalApplied + this.metrics.fixes.rollbacks;
    this.metrics.fixes.successRate = totalAttempts > 0 ? 
      (this.metrics.fixes.totalApplied / totalAttempts) * 100 : 0;
    
    // Queue event for API sync if enabled
    if (this.syncConfig.enabled) {
      this.queueEvent('fix', {
        appliedFixes: appliedFixes || [],
        success,
        rollback,
        layer,
        rule,
        platform
      });
    }
  }

  /**
   * Track command usage
   */
  trackCommand(command, options = {}) {
    const {
      platform = 'cli',
      executionTime,
      success = true
    } = options;

    this.metrics.usage.commands[command] = 
      (this.metrics.usage.commands[command] || 0) + 1;

    // Track platform usage
    this.metrics.usage.platforms[platform] = 
      (this.metrics.usage.platforms[platform] || 0) + 1;

    // Track session
    this.metrics.usage.sessions += 1;
    
    // Queue event for API sync if enabled
    if (this.syncConfig.enabled) {
      this.queueEvent('usage', {
        command,
        action: command,
        platform,
        executionTime,
        success,
        filesProcessed: options.filesProcessed || 0,
        layersUsed: options.layers || []
      });
    }
  }

  /**
   * Track user activity
   */
  trackUser(userId, action) {
    this.metrics.usage.activeUsers.add(userId);
    
    // Track user-specific metrics
    if (!this.metrics.users) {
      this.metrics.users = {};
    }
    
    if (!this.metrics.users[userId]) {
      this.metrics.users[userId] = {
        actions: [],
        lastActive: new Date().toISOString(),
        totalActions: 0
      };
    }
    
    this.metrics.users[userId].actions.push({
      action,
      timestamp: new Date().toISOString()
    });
    
    this.metrics.users[userId].lastActive = new Date().toISOString();
    this.metrics.users[userId].totalActions += 1;
  }

  /**
   * Calculate code quality score
   */
  calculateQualityScore(issues, totalFiles) {
    if (totalFiles === 0) return 100;
    
    const issueDensity = issues.length / totalFiles;
    const baseScore = 100;
    const penalty = Math.min(issueDensity * 10, 50); // Max 50 point penalty
    
    this.metrics.quality.codeQualityScore = Math.max(0, baseScore - penalty);
    return this.metrics.quality.codeQualityScore;
  }

  /**
   * Calculate modernization progress
   */
  calculateModernizationProgress(issuesByLayer) {
    const totalIssues = Object.values(issuesByLayer).reduce((sum, count) => sum + count, 0);
    const modernizedIssues = (issuesByLayer[1] || 0) + (issuesByLayer[2] || 0); // Layers 1-2 are basic modernization
    
    this.metrics.quality.modernizationProgress = totalIssues > 0 ? 
      (modernizedIssues / totalIssues) * 100 : 0;
    
    return this.metrics.quality.modernizationProgress;
  }

  /**
   * Calculate technical debt
   */
  calculateTechnicalDebt(issuesByType) {
    const criticalIssues = (issuesByType.error || 0) * 3; // Errors count 3x
    const warningIssues = (issuesByType.warning || 0) * 2; // Warnings count 2x
    const infoIssues = (issuesByType.info || 0) * 1; // Info counts 1x
    
    this.metrics.quality.technicalDebt = criticalIssues + warningIssues + infoIssues;
    return this.metrics.quality.technicalDebt;
  }

  /**
   * Generate analytics report
   */
  generateReport(options = {}) {
    const {
      includeUsers = false,
      includePerformance = true,
      includeQuality = true
    } = options;

    const report = {
      summary: {
        totalFiles: this.metrics.analysis.totalFiles,
        totalIssues: this.metrics.analysis.totalIssues,
        totalFixes: this.metrics.fixes.totalApplied,
        successRate: this.metrics.fixes.successRate,
        sessions: this.metrics.usage.sessions,
        activeUsers: this.metrics.usage.activeUsers.size
      },
      trends: {
        issuesByLayer: this.metrics.analysis.issuesByLayer,
        issuesByType: this.metrics.analysis.issuesByType,
        fixesByLayer: this.metrics.fixes.fixesByLayer,
        fixesByRule: this.metrics.fixes.fixesByRule,
        platformUsage: this.metrics.usage.platforms,
        commandUsage: this.metrics.usage.commands
      }
    };

    if (includePerformance) {
      report.performance = {
        averageAnalysisTime: this.metrics.analysis.performance.averageTime,
        slowestFiles: this.metrics.analysis.performance.slowestFiles,
        totalExecutionTime: this.metrics.analysis.performance.totalTime
      };
    }

    if (includeQuality) {
      report.quality = {
        codeQualityScore: this.metrics.quality.codeQualityScore,
        modernizationProgress: this.metrics.quality.modernizationProgress,
        technicalDebt: this.metrics.quality.technicalDebt
      };
    }

    if (includeUsers) {
      report.users = this.metrics.users;
    }

    return report;
  }

  /**
   * Save analytics data
   */
  async saveAnalytics() {
    try {
      const analyticsDir = path.dirname(this.analyticsPath);
      await fs.mkdir(analyticsDir, { recursive: true });
      
      const data = {
        version: '1.2.1',
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        sessionDuration: Date.now() - this.startTime,
        metrics: this.metrics
      };
      
      await fs.writeFile(this.analyticsPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.warn('Failed to save analytics:', error.message);
      return false;
    }
  }

  /**
   * Load analytics data
   */
  async loadAnalytics() {
    try {
      const data = await fs.readFile(this.analyticsPath, 'utf8');
      const analytics = JSON.parse(data);
      
      // Merge with current metrics
      this.metrics = {
        analysis: { ...this.metrics.analysis, ...analytics.metrics.analysis },
        fixes: { ...this.metrics.fixes, ...analytics.metrics.fixes },
        usage: { ...this.metrics.usage, ...analytics.metrics.usage },
        quality: { ...this.metrics.quality, ...analytics.metrics.quality }
      };
      
      return analytics;
    } catch (error) {
      // No existing analytics file, start fresh
      return null;
    }
  }

  /**
   * Export analytics for external analysis
   */
  exportAnalytics(format = 'json') {
    const data = this.generateReport({ includeUsers: true, includePerformance: true, includeQuality: true });
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'html':
        return this.convertToHTML(data);
      
      default:
        return data;
    }
  }

  /**
   * Convert analytics to CSV format
   */
  convertToCSV(data) {
    const lines = [];
    
    // Summary
    lines.push('Metric,Value');
    lines.push(`Total Files,${data.summary.totalFiles}`);
    lines.push(`Total Issues,${data.summary.totalIssues}`);
    lines.push(`Total Fixes,${data.summary.totalFixes}`);
    lines.push(`Success Rate,${data.summary.successRate}%`);
    
    // Issues by layer
    lines.push('');
    lines.push('Layer,Issues');
    Object.entries(data.trends.issuesByLayer).forEach(([layer, count]) => {
      lines.push(`${layer},${count}`);
    });
    
    return lines.join('\n');
  }

  /**
   * Convert analytics to HTML format
   */
  convertToHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>NeuroLint Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>NeuroLint Analytics Report</h1>
    
    <div class="metric">
        <h2>Summary</h2>
        <p>Total Files: ${data.summary.totalFiles}</p>
        <p>Total Issues: ${data.summary.totalIssues}</p>
        <p>Total Fixes: ${data.summary.totalFixes}</p>
        <p>Success Rate: ${data.summary.successRate}%</p>
    </div>
    
    <div class="chart">
        <h2>Issues by Layer</h2>
        <ul>
            ${Object.entries(data.trends.issuesByLayer)
              .map(([layer, count]) => `<li>Layer ${layer}: ${count} issues</li>`)
              .join('')}
        </ul>
    </div>
</body>
</html>
    `;
  }

  /**
   * Reset analytics data
   */
  resetAnalytics() {
    this.metrics = {
      analysis: {
        totalFiles: 0,
        totalIssues: 0,
        issuesByLayer: {},
        issuesByType: {},
        performance: {
          averageTime: 0,
          totalTime: 0,
          slowestFiles: []
        }
      },
      fixes: {
        totalApplied: 0,
        successRate: 0,
        fixesByLayer: {},
        fixesByRule: {},
        rollbacks: 0
      },
      usage: {
        commands: {},
        platforms: {},
        sessions: 0,
        activeUsers: new Set()
      },
      quality: {
        codeQualityScore: 0,
        modernizationProgress: 0,
        technicalDebt: 0
      }
    };
  }
}

// Create and export singleton instance
const analytics = new Analytics();

module.exports = analytics; 