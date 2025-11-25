/**
 * Report Generator for NeuroLint Pro
 * Generates reports based on analysis results
 */

import { GeneratedReport, UserTier, ReportSectionType } from './types';

export interface ReportOptions {
  userTier: UserTier;
  analysisResult: any;
  filename: string;
  projectName?: string;
}

export interface ReportResult {
  success: boolean;
  report?: GeneratedReport;
  error?: string;
}

export class ReportGenerator {
  static generateReport(options: ReportOptions): GeneratedReport {
    const { userTier, analysisResult, filename, projectName } = options;
    
    // Generate report based on user tier
    const report: GeneratedReport = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      generatedAt: new Date().toISOString(),
      level: this.getReportLevel(userTier),
      userTier,
      filename,
      projectName,
      summary: this.generateSummary(analysisResult),
      sections: this.generateSections(analysisResult, userTier)
    };

    return report;
  }

  private static getReportLevel(userTier: string): 'basic' | 'detailed' {
    switch (userTier) {
      case 'free':
        return 'basic';
      case 'basic':
      case 'professional':
      case 'business':
      case 'enterprise':
        return 'detailed';
      default:
        return 'basic';
    }
  }

  private static generateSummary(analysisResult: any) {
    const issues = analysisResult.analysis?.detectedIssues || [];
    const criticalIssues = this.countCriticalIssues(analysisResult);
    
    return {
      totalIssues: issues.length,
      criticalIssues,
      confidence: analysisResult.analysis?.confidence || 0,
      readinessScore: this.calculateReadinessScore(analysisResult)
    };
  }

  private static generateSections(analysisResult: any, userTier: string) {
    const sections = [];

    // Summary section
    sections.push({
      type: 'summary' as ReportSectionType,
      title: 'Analysis Summary',
      content: {
        project: analysisResult.filename || 'Unknown Project',
        filename: analysisResult.filename || 'Unknown File',
        frameworkDetected: 'React/Next.js',
        complexity: 'Medium',
        layersAnalyzed: [1, 2, 3, 4, 5, 6]
      }
    });

    // Issues section
    const issues = analysisResult.analysis?.detectedIssues || [];
    if (userTier === 'free') {
      // Basic tier - limited issue details
      sections.push({
        type: 'issues' as ReportSectionType,
        title: 'Detected Issues',
        content: {
          totalIssues: issues.length,
          categories: this.categorizeIssues(issues),
          topIssues: issues.slice(0, 5),
          upgradeNote: 'Upgrade to premium for detailed issue analysis and automated fixes'
        }
      });
    } else {
      // Premium tier - detailed issues
      sections.push({
        type: 'issues' as ReportSectionType,
        title: 'Detailed Issue Analysis',
        content: {
          totalIssues: issues.length,
          detailedIssues: issues.slice(0, 10)
        }
      });
    }

    // Recommendations section
    if (userTier === 'free') {
      sections.push({
        type: 'recommendations' as ReportSectionType,
        title: 'Recommendations',
        content: {
          priority: this.generatePriorityRecommendations(issues),
          layerSuggestions: this.generateLayerSuggestions(issues),
          nextSteps: [
            'Review detected issues',
            'Consider upgrading to premium for automated fixes',
            'Implement suggested improvements'
          ]
        }
      });
    } else {
      sections.push({
        type: 'recommendations' as ReportSectionType,
        title: 'Technical Recommendations',
        content: {
          maintainabilityScore: this.calculateMaintainabilityScore(analysisResult),
          codeQualityMetrics: this.analyzeCodeQuality(analysisResult)
        }
      });
    }

    return sections;
  }

  private static countCriticalIssues(analysisResult: any): number {
    const issues = analysisResult.analysis?.detectedIssues || [];
    return issues.filter((issue: any) => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length;
  }

  private static calculateReadinessScore(analysisResult: any): number {
    const issues = analysisResult.analysis?.detectedIssues || [];
    const totalIssues = issues.length;
    
    if (totalIssues === 0) return 100;
    
    const criticalIssues = this.countCriticalIssues(analysisResult);
    const baseScore = Math.max(0, 100 - (totalIssues * 2) - (criticalIssues * 10));
    
    return Math.round(baseScore);
  }

  private static categorizeIssues(issues: any[]) {
    const categories = {
      'Configuration Issues': { count: 0, priority: 'medium' },
      'Code Quality Issues': { count: 0, priority: 'low' },
      'Performance Issues': { count: 0, priority: 'high' },
      'Security Issues': { count: 0, priority: 'critical' }
    };

    issues.forEach(issue => {
      if (issue.type?.includes('config')) {
        categories['Configuration Issues'].count++;
      } else if (issue.type?.includes('performance')) {
        categories['Performance Issues'].count++;
      } else if (issue.type?.includes('security')) {
        categories['Security Issues'].count++;
      } else {
        categories['Code Quality Issues'].count++;
      }
    });

    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({ name, ...data }));
  }

  private static generatePriorityRecommendations(issues: any[]) {
    const recommendations = [];
    
    if (issues.length > 0) {
      recommendations.push({
        title: 'Address Critical Issues',
        description: 'Fix high-priority issues first to improve code quality',
        priority: 'high',
        effort: '1-2 hours'
      });
    }

    return recommendations;
  }

  private static generateLayerSuggestions(issues: any[]) {
    const layerMap = {
      1: 'Configuration Modernization',
      2: 'Content Standardization', 
      3: 'Component Intelligence',
      4: 'SSR/Hydration Safety',
      5: 'Next.js App Router Optimization',
      6: 'Testing & Validation'
    };

    const layerIssues = issues.reduce((acc, issue) => {
      const layer = (issue.layer as number) || 1;
      acc[layer] = (acc[layer] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(layerIssues).map(([layer, count]) => ({
      layer: parseInt(layer),
      description: layerMap[parseInt(layer) as keyof typeof layerMap] || 'Unknown Layer',
      benefit: `Fix ${count} issues in this layer`
    }));
  }

  private static calculateMaintainabilityScore(analysisResult: any): number {
    const issues = analysisResult.analysis?.detectedIssues || [];
    const totalIssues = issues.length;
    
    if (totalIssues === 0) return 95;
    
    const baseScore = Math.max(0, 95 - (totalIssues * 3));
    return Math.round(baseScore);
  }

  private static analyzeCodeQuality(analysisResult: any) {
    return {
      maintainability: 'Good',
      complexity: 'Medium',
      testability: 'High'
    };
  }
}
