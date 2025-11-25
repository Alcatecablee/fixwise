/**
 * Enhanced Production-Ready Report Generator
 * Supports multiple report types, PDF generation, and enhanced CSV exports
 * This is separate from the existing ReportGenerator to avoid conflicts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface EnhancedReportData {
  analysisResults: any[];
  userInfo: any;
  projectInfo?: {
    name: string;
    description?: string;
    repository?: string;
  };
  metadata: {
    generatedAt: Date;
    reportType: EnhancedReportType;
    totalFiles: number;
    totalIssues: number;
    executionTime: number;
  };
}

export type EnhancedReportType = 'executive' | 'technical' | 'comprehensive' | 'issues-only' | 'summary';

export interface EnhancedReportOptions {
  type: EnhancedReportType;
  includeCodeSamples?: boolean;
  includeDiagrams?: boolean;
  includeRecommendations?: boolean;
  format: 'pdf' | 'csv' | 'html';
  customStyling?: boolean;
}

export interface EnhancedReportResult {
  success: boolean;
  content: string;
  filename: string;
  contentType: string;
  size: number;
  error?: string;
}

export class EnhancedReportGenerator {
  private static readonly REPORT_TEMPLATES = {
    executive: {
      title: 'Executive Summary Report',
      description: 'High-level overview for stakeholders',
      sections: ['summary', 'metrics', 'recommendations']
    },
    technical: {
      title: 'Technical Analysis Report',
      description: 'Detailed technical findings for developers',
      sections: ['summary', 'issues', 'code-samples', 'recommendations']
    },
    comprehensive: {
      title: 'Comprehensive Analysis Report',
      description: 'Complete analysis with all details',
      sections: ['summary', 'metrics', 'issues', 'code-samples', 'recommendations', 'appendix']
    },
    'issues-only': {
      title: 'Issues Report',
      description: 'Focus on detected issues only',
      sections: ['issues', 'recommendations']
    },
    summary: {
      title: 'Analysis Summary',
      description: 'Brief overview of findings',
      sections: ['summary', 'metrics']
    }
  };

  /**
   * Generate a complete report based on analysis data
   */
  static async generateReport(data: EnhancedReportData, options: EnhancedReportOptions): Promise<EnhancedReportResult> {
    try {
      const template = this.REPORT_TEMPLATES[options.type];
      if (!template) {
        throw new Error(`Invalid report type: ${options.type}`);
      }

      let content: string;
      let filename: string;
      let contentType: string;

      switch (options.format) {
        case 'pdf':
          content = await this.generatePDF(data, options);
          filename = `neurolint-${options.type}-${this.formatDate(data.metadata.generatedAt)}.pdf`;
          contentType = 'application/pdf';
          break;
        case 'csv':
          content = this.generateCSV(data, options);
          filename = `neurolint-${options.type}-${this.formatDate(data.metadata.generatedAt)}.csv`;
          contentType = 'text/csv';
          break;
        case 'html':
          content = this.generateHTML(data, options);
          filename = `neurolint-${options.type}-${this.formatDate(data.metadata.generatedAt)}.html`;
          contentType = 'text/html';
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      return {
        success: true,
        content,
        filename,
        contentType,
        size: Buffer.byteLength(content, 'utf8')
      };

    } catch (error) {
      return {
        success: false,
        content: '',
        filename: '',
        contentType: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate enhanced CSV report
   */
  private static generateCSV(data: EnhancedReportData, options: EnhancedReportOptions): string {
    const headers = [
      'File Path',
      'Analysis Date',
      'Layer',
      'Issue Type',
      'Severity',
      'Description',
      'Line Number',
      'Column',
      'Fix Applied',
      'Execution Time (ms)',
      'Success',
      'Recommendation',
      'Code Sample'
    ];

    const rows = [headers.join(',')];

    // Add summary row
    const summaryRow = [
      'SUMMARY',
      this.formatDate(data.metadata.generatedAt),
      'ALL',
      'Analysis Complete',
      'INFO',
      `Total: ${data.metadata.totalFiles} files, ${data.metadata.totalIssues} issues`,
      '',
      '',
      'N/A',
      data.metadata.executionTime,
      'Yes',
      'Review findings below',
      ''
    ];
    rows.push(summaryRow.join(','));

    // Add detailed issue rows
    data.analysisResults.forEach((analysis: any) => {
      const baseData = {
        filePath: analysis.file_path || '',
        analysisDate: analysis.created_at || '',
        executionTime: analysis.execution_time || 0,
        success: analysis.success || false
      };

      if (analysis.analysis_data?.detectedIssues) {
        analysis.analysis_data.detectedIssues.forEach((issue: any) => {
          const row = [
            `"${baseData.filePath}"`,
            `"${baseData.analysisDate}"`,
            issue.layer || '',
            `"${issue.type || ''}"`,
            issue.severity || '',
            `"${(issue.description || '').replace(/"/g, '""')}"`,
            issue.line || '',
            issue.column || '',
            issue.fixApplied ? 'Yes' : 'No',
            baseData.executionTime,
            baseData.success ? 'Yes' : 'No',
            `"${this.getRecommendation(issue)}"`,
            `"${this.getCodeSample(issue)}"`
          ];
          rows.push(row.join(','));
        });
      } else {
        // No issues found
        const row = [
          `"${baseData.filePath}"`,
          `"${baseData.analysisDate}"`,
          'Summary',
          'No Issues',
          'Info',
          '"Analysis completed successfully with no issues detected"',
          '',
          '',
          'N/A',
          baseData.executionTime,
          baseData.success ? 'Yes' : 'No',
          '"File is clean"',
          ''
        ];
        rows.push(row.join(','));
      }
    });

    return rows.join('\n');
  }

  /**
   * Generate HTML report
   */
  private static generateHTML(data: EnhancedReportData, options: EnhancedReportOptions): string {
    const template = this.REPORT_TEMPLATES[options.type];
    const issuesBySeverity = this.calculateIssuesBySeverity(data.analysisResults);
    const issuesByLayer = this.calculateIssuesByLayer(data.analysisResults);
    const recommendations = this.generateRecommendations(data.analysisResults);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.title} - NeuroLint</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    ${this.generateHeader(data, template)}
    ${this.generateSummary(data)}
    ${options.type !== 'issues-only' ? this.generateMetrics(issuesBySeverity, issuesByLayer) : ''}
    ${this.generateIssues(data.analysisResults, options)}
    ${options.includeRecommendations ? this.generateRecommendationsSection(recommendations) : ''}
    ${this.generateFooter(data)}
</body>
</html>`;
  }

  /**
   * Generate PDF report using HTML to PDF conversion
   */
  private static async generatePDF(data: EnhancedReportData, options: EnhancedReportOptions): Promise<string> {
    try {
      // Import PDFGenerator dynamically to avoid build issues if puppeteer isn't installed
      const { PDFGenerator } = await import('./pdf-generator');
      
      const htmlContent = this.generateHTML(data, options);
      
      // Add PDF-specific styling
      const pdfStyles = `
          @media print {
              body { margin: 0; padding: 20px; }
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; }
          }
      `;
      
      const enhancedHtml = htmlContent.replace('</style>', `${pdfStyles}</style>`);
      
      // Try to generate actual PDF if puppeteer is available
      const pdfResult = await PDFGenerator.generatePDF(enhancedHtml, {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      if (pdfResult.success && pdfResult.pdfBuffer) {
        // Return base64 encoded PDF
        return pdfResult.pdfBuffer.toString('base64');
      }
      
      // Fallback to HTML if PDF generation fails
      return enhancedHtml;
      
    } catch (error) {
      console.warn('PDF generation failed, falling back to HTML:', error);
      
      // Fallback to HTML with PDF styling
      const htmlContent = this.generateHTML(data, options);
      const pdfStyles = `
          @media print {
              body { margin: 0; padding: 20px; }
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; }
          }
      `;
      
      return htmlContent.replace('</style>', `${pdfStyles}</style>`);
    }
  }

  /**
   * Generate report header
   */
  private static generateHeader(data: EnhancedReportData, template: any): string {
    return `
    <div class="header">
        <div class="logo">NeuroLint Pro</div>
        <div class="report-title">${template.title}</div>
        <div class="report-subtitle">
            Generated on ${this.formatDate(data.metadata.generatedAt)} | 
            ${template.description}
        </div>
        ${data.projectInfo ? `
        <div class="project-info">
            <strong>Project:</strong> ${data.projectInfo.name}
            ${data.projectInfo.description ? `<br><strong>Description:</strong> ${data.projectInfo.description}` : ''}
            ${data.projectInfo.repository ? `<br><strong>Repository:</strong> ${data.projectInfo.repository}` : ''}
        </div>
        ` : ''}
    </div>`;
  }

  /**
   * Generate summary section
   */
  private static generateSummary(data: EnhancedReportData): string {
    const cleanFiles = data.analysisResults.filter(a => 
      (a.analysis_data?.detectedIssues?.length || 0) === 0
    ).length;
    const cleanPercentage = Math.round((cleanFiles / data.metadata.totalFiles) * 100);

    return `
    <div class="summary-section">
        <h2>Analysis Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">${data.metadata.totalFiles}</div>
                <div class="summary-label">Files Analyzed</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${data.metadata.totalIssues}</div>
                <div class="summary-label">Total Issues Found</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${cleanPercentage}%</div>
                <div class="summary-label">Clean Files</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${(data.metadata.executionTime / 1000).toFixed(1)}s</div>
                <div class="summary-label">Total Analysis Time</div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate metrics section
   */
  private static generateMetrics(issuesBySeverity: Record<string, number>, issuesByLayer: Record<string, number>): string {
    const totalSeverityIssues = Object.values(issuesBySeverity).reduce((a, b) => a + b, 0);
    const totalLayerIssues = Object.values(issuesByLayer).reduce((a, b) => a + b, 0);
    
    return `
    <div class="metrics-section">
        <h2>Issue Distribution</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Issues by Severity</h3>
                ${Object.entries(issuesBySeverity).map(([severity, count]) => `
                    <div class="metric-bar">
                        <span class="metric-label">${severity}</span>
                        <div class="metric-bar-fill severity-${severity}" style="width: ${count > 0 ? (count / totalSeverityIssues * 100) : 0}%">
                            ${count}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="metric-card">
                <h3>Issues by Layer</h3>
                ${Object.entries(issuesByLayer).map(([layer, count]) => `
                    <div class="metric-bar">
                        <span class="metric-label">${layer}</span>
                        <div class="metric-bar-fill layer-${layer.replace(/\s+/g, '-').toLowerCase()}" style="width: ${count > 0 ? (count / totalLayerIssues * 100) : 0}%">
                            ${count}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate issues section
   */
  private static generateIssues(analysisResults: any[], options: EnhancedReportOptions): string {
    const issues = analysisResults
      .flatMap(analysis => 
        (analysis.analysis_data?.detectedIssues || []).map((issue: any) => ({
          ...issue,
          filePath: analysis.file_path,
          analysisDate: analysis.created_at,
          executionTime: analysis.execution_time
        }))
      )
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 4) - 
               (severityOrder[b.severity as keyof typeof severityOrder] || 4);
      });

    return `
    <div class="issues-section">
        <h2>Detected Issues</h2>
        ${issues.length === 0 ? '<p class="no-issues">No issues detected in the analyzed files.</p>' : 
          issues.map(issue => `
            <div class="issue-item ${issue.severity}">
                <div class="issue-header">
                    <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                    <span class="issue-type">${issue.type}</span>
                    <span class="issue-file">${issue.filePath}</span>
                </div>
                <div class="issue-description">${issue.description}</div>
                ${issue.line ? `<div class="issue-location">Line ${issue.line}${issue.column ? `, Column ${issue.column}` : ''}</div>` : ''}
                ${options.includeCodeSamples && issue.codeSample ? `
                    <div class="issue-code">
                        <pre><code>${this.escapeHtml(issue.codeSample)}</code></pre>
                    </div>
                ` : ''}
                <div class="issue-recommendation">
                    <strong>Recommendation:</strong> ${this.getRecommendation(issue)}
                </div>
            </div>
          `).join('')
        }
    </div>`;
  }

  /**
   * Generate recommendations section
   */
  private static generateRecommendationsSection(recommendations: string[]): string {
    return `
    <div class="recommendations-section">
        <h2>Recommendations</h2>
        <ul class="recommendations-list">
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>`;
  }

  /**
   * Generate footer
   */
  private static generateFooter(data: EnhancedReportData): string {
    return `
    <div class="footer">
        <p>Report generated by NeuroLint Pro on ${this.formatDate(data.metadata.generatedAt)}</p>
        <p>For support, contact: support@neurolint.dev</p>
    </div>`;
  }

  /**
   * Get comprehensive report styles
   */
  private static getReportStyles(): string {
    return `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2196f3;
        }
        .logo {
            font-size: 36px;
            font-weight: bold;
            color: #2196f3;
            margin-bottom: 10px;
        }
        .report-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 5px;
        }
        .report-subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .project-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: left;
            max-width: 600px;
            margin: 0 auto;
        }
        .summary-section, .metrics-section, .issues-section, .recommendations-section {
            margin-bottom: 40px;
        }
        .summary-grid, .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .summary-card, .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .summary-value {
            font-size: 32px;
            font-weight: bold;
            color: #2196f3;
        }
        .summary-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .metric-bar {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        .metric-label {
            min-width: 100px;
            font-size: 14px;
            text-transform: capitalize;
        }
        .metric-bar-fill {
            height: 24px;
            border-radius: 12px;
            margin-left: 15px;
            flex: 1;
            display: flex;
            align-items: center;
            padding: 0 15px;
            color: white;
            font-size: 12px;
            font-weight: 600;
        }
        .severity-critical { background: #f44336; }
        .severity-high { background: #ff9800; }
        .severity-medium { background: #ffeb3b; color: #333; }
        .severity-low { background: #4caf50; }
        .severity-info { background: #2196f3; }
        .issue-item {
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #ddd;
        }
        .issue-item.critical { border-left-color: #f44336; }
        .issue-item.high { border-left-color: #ff9800; }
        .issue-item.medium { border-left-color: #ffeb3b; }
        .issue-item.low { border-left-color: #4caf50; }
        .issue-item.info { border-left-color: #2196f3; }
        .issue-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        .issue-severity {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .issue-type {
            font-weight: 600;
            color: #333;
        }
        .issue-file {
            font-family: monospace;
            color: #666;
            font-size: 14px;
        }
        .issue-description {
            margin-bottom: 10px;
            color: #333;
        }
        .issue-location {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .issue-code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .issue-code pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        .issue-recommendation {
            background: #e3f2fd;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #2196f3;
            margin-top: 10px;
        }
        .recommendations-list {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .recommendations-list li {
            margin-bottom: 10px;
            color: #333;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .no-issues {
            text-align: center;
            color: #4caf50;
            font-style: italic;
            font-size: 18px;
            padding: 40px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .summary-grid, .metrics-grid { grid-template-columns: 1fr; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
    `;
  }

  /**
   * Calculate issues by severity
   */
  private static calculateIssuesBySeverity(analysisResults: any[]): Record<string, number> {
    const issuesBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    analysisResults.forEach(analysis => {
      if (analysis.analysis_data?.detectedIssues) {
        analysis.analysis_data.detectedIssues.forEach((issue: any) => {
          const severity = issue.severity || 'info';
          if (issuesBySeverity[severity] !== undefined) {
            issuesBySeverity[severity]++;
          }
        });
      }
    });

    return issuesBySeverity;
  }

  /**
   * Calculate issues by layer
   */
  private static calculateIssuesByLayer(analysisResults: any[]): Record<string, number> {
    const issuesByLayer: Record<string, number> = {};

    analysisResults.forEach(analysis => {
      if (analysis.analysis_data?.detectedIssues) {
        analysis.analysis_data.detectedIssues.forEach((issue: any) => {
          const layer = `Layer ${issue.layer || 'Unknown'}`;
          issuesByLayer[layer] = (issuesByLayer[layer] || 0) + 1;
        });
      }
    });

    return issuesByLayer;
  }

  /**
   * Generate recommendations based on issues
   */
  private static generateRecommendations(analysisResults: any[]): string[] {
    const recommendations: string[] = [];
    const issuesBySeverity = this.calculateIssuesBySeverity(analysisResults);
    const issuesByLayer = this.calculateIssuesByLayer(analysisResults);

    // High severity issues
    if (issuesBySeverity.critical > 0 || issuesBySeverity.high > 0) {
      recommendations.push('Address critical and high severity issues immediately to improve code quality and security.');
    }

    // Layer-specific recommendations
    if (issuesByLayer['Layer 1'] > 0) {
      recommendations.push('Review configuration files (tsconfig.json, next.config.js) to ensure proper TypeScript and Next.js setup.');
    }
    if (issuesByLayer['Layer 2'] > 0) {
      recommendations.push('Standardize code patterns and remove console statements for production readiness.');
    }
    if (issuesByLayer['Layer 3'] > 0) {
      recommendations.push('Improve component accessibility and add proper React component patterns.');
    }
    if (issuesByLayer['Layer 4'] > 0) {
      recommendations.push('Add SSR guards for client-side APIs to prevent hydration mismatches.');
    }
    if (issuesByLayer['Layer 5'] > 0) {
      recommendations.push('Optimize Next.js App Router usage and implement proper routing patterns.');
    }
    if (issuesByLayer['Layer 6'] > 0) {
      recommendations.push('Add comprehensive testing and validation to ensure code reliability.');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Code quality is excellent! Consider implementing automated testing and monitoring.');
    }

    return recommendations;
  }

  /**
   * Get recommendation for specific issue
   */
  private static getRecommendation(issue: any): string {
    const recommendations: Record<string, string> = {
      'console-statement': 'Remove console statements for production code',
      'accessibility': 'Add proper accessibility attributes',
      'hydration': 'Add SSR guards for client-side APIs',
      'performance': 'Optimize code for better performance',
      'security': 'Address security vulnerability',
      'best-practice': 'Follow React/Next.js best practices',
      'configuration': 'Update configuration for better compatibility'
    };

    return recommendations[issue.type] || 'Review and address the identified issue';
  }

  /**
   * Get code sample for issue
   */
  private static getCodeSample(issue: any): string {
    return issue.codeSample || issue.suggestion || 'No code sample available';
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Escape HTML for safe display
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
} 