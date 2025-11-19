const fs = require('fs').promises;
const path = require('path');

/**
 * Analytics and Metrics Engine for NeuroLint
 * 
 * Tracks usage, performance, and provides insights across
 * CLI, VS Code, and Web App platforms.
 */

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
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      platform = 'cli'
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