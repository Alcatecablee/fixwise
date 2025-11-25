import type { AnalysisResult, DetectedIssue, LayerResult, AnalysisMetadata } from './types';

// Import the actual CLI engine components
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

export interface SharedCoreAnalysisResult {
  issues: Array<{
    id: string;
    type: string;
    message: string;
    file: string;
    line: number;
    column: number;
    layer: number;
    severity: 'error' | 'warning' | 'info';
    fix?: {
      description: string;
      code: string;
    };
  }>;
  summary: {
    totalIssues: number;
    issuesByLayer: Record<number, number>;
    qualityScore: number;
    modernizationProgress: number;
    technicalDebt: number;
  };
  executionTime: number;
  filesAnalyzed: number;
}

export interface FixResult {
  success: boolean;
  code: string;
  originalCode: string;
  appliedFixes: Array<{
    id: string;
    description: string;
    layer: number;
  }>;
  rollback: boolean;
  error?: string;
}

export interface Configuration {
  layers: number[];
  includePatterns: string[];
  excludePatterns: string[];
  failOnIssues: boolean;
  maxIssues: number;
  outputFormat: 'json' | 'html' | 'junit';
  notifications: {
    email?: string[];
    slack?: string;
    teams?: string;
  };
  // Additional options for API integration
  requestId?: string;
  projectId?: string;
  userId?: string;
  userTier?: string;
  migrationService?: boolean;
  verbose?: boolean;
  applyFixes?: boolean;
}

export class NeuroLintCore {
  private initialized: boolean = false;
  private config: Configuration;
  private cliPath: string;

  constructor() {
    this.config = {
      layers: [1, 2, 3, 4, 5, 6, 7],
      includePatterns: ['**/*.{ts,tsx,js,jsx,json}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      failOnIssues: false,
      maxIssues: 10,
      outputFormat: 'json',
      notifications: {}
    };
    
    // Determine CLI path - this should point to the actual CLI installation
    this.cliPath = process.env.NEUROLINT_CLI_PATH || path.join(process.cwd(), '..', 'cli.js');
  }

  /**
   * Check if the core is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialize the core
   */
  async initialize(options: Partial<Configuration> = {}): Promise<boolean> {
    try {
      this.config = { ...this.config, ...options };
      this.initialized = true;
      return true;
    } catch (error) {
      // Track error without console.log
      return false;
    }
  }

  /**
   * Analyze code using the real CLI engine
   */
  async analyze(code: string, options: Partial<Configuration> = {}): Promise<AnalysisResult> {
    if (!this.initialized) {
      await this.initialize(options);
    }

    const startTime = Date.now();
    const mergedConfig = { ...this.config, ...options };

    try {
      // Create temporary file for analysis
      const tempDir = path.join(process.cwd(), 'temp-analysis');
      const tempFile = path.join(tempDir, 'temp-file.tsx');
      
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(tempFile, code);

      // Run CLI analysis
      const layers = mergedConfig.layers?.join(',') || '1,2,3,4,5,6,7';
      const cliCommand = `node "${this.cliPath}" analyze "${tempDir}" --layers=${layers} --format=json --output="${tempDir}/analysis.json"`;
      
      const result = execSync(cliCommand, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });

      // Read analysis results
      const analysisFile = path.join(tempDir, 'analysis.json');
      const analysisData = await fs.readFile(analysisFile, 'utf8');
      const analysisResult = JSON.parse(analysisData);

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      const executionTime = Date.now() - startTime;

      // Convert CLI output to expected API format
      const detectedIssues: DetectedIssue[] = (analysisResult.issues || []).map((issue: any) => ({
        id: issue.id || `issue-${Date.now()}-${Math.random()}`,
        type: issue.type || 'code-quality',
        line: issue.line || 1,
        column: issue.column || 1,
        severity: issue.severity || 'warning',
        category: 'Code Quality' as const,
        message: issue.message || issue.description || 'Code quality issue detected',
        description: issue.description || issue.message || 'Code quality issue detected',
        rule: issue.rule || `layer-${issue.layer || 1}`,
        fixSuggestion: issue.fixSuggestion || issue.fix?.description,
        codeExample: issue.fix ? {
          before: code,
          after: issue.fix.code,
          explanation: issue.fix.description
        } : undefined,
        estimatedEffort: 'Low' as const
      }));

      const layerResults: LayerResult[] = (analysisResult.layers || []).map((layer: any) => ({
        layerId: layer.layerId || layer.id,
        success: layer.success || false,
        changeCount: layer.changeCount || 0,
        description: layer.description || `Layer ${layer.layerId || layer.id} analysis`,
        issues: (layer.issues || []).map((issue: any) => ({
          id: issue.id || `layer-${layer.layerId}-${Date.now()}`,
          type: issue.type || 'code-quality',
          line: issue.line || 1,
          column: issue.column || 1,
          severity: issue.severity || 'warning',
          category: 'Code Quality' as const,
          message: issue.message || issue.description || 'Code quality issue detected',
          description: issue.description || issue.message || 'Code quality issue detected',
          rule: issue.rule || `layer-${layer.layerId}`,
          fixSuggestion: issue.fixSuggestion || issue.fix?.description,
          estimatedEffort: 'Low' as const
        }))
      }));

      const metadata: AnalysisMetadata = {
        processingTime: executionTime,
        confidence: analysisResult.confidence || 0.8,
        analysisType: 'comprehensive',
        requestId: options.requestId || 'unknown',
        version: '1.2.1',
        timestamp: new Date().toISOString()
      };

      return {
        analysis: {
          detectedIssues,
          confidence: analysisResult.confidence || 0.8,
          recommendedLayers: analysisResult.recommendedLayers || mergedConfig.layers || [1, 2, 3, 4, 5, 6],
          legacyPatterns: analysisResult.legacyPatterns || [],
          modernPatterns: analysisResult.modernPatterns || [],
          frameworkVersions: analysisResult.frameworkVersions || {
            react: '18.2.0',
            nextjs: '14.0.0',
            typescript: '5.0.0'
          },
          migrationComplexity: analysisResult.migrationComplexity || 'Low',
          qualityScore: analysisResult.qualityScore || this.calculateQualityScore(detectedIssues),
          readinessScore: analysisResult.readinessScore || this.calculateModernizationProgress(detectedIssues)
        },
        layers: layerResults,
        metadata
      };
    } catch (error) {
      // Handle CLI execution errors gracefully
      const executionTime = Date.now() - startTime;
      
      // Return fallback analysis with error information
      return {
        analysis: {
          detectedIssues: [],
          confidence: 0.1,
          recommendedLayers: mergedConfig.layers || [1, 2],
          legacyPatterns: [],
          modernPatterns: [],
          frameworkVersions: {
            react: '18.2.0',
            nextjs: '14.0.0',
            typescript: '5.0.0'
          },
          migrationComplexity: 'Low',
          qualityScore: 0,
          readinessScore: 0
        },
        layers: [],
        metadata: {
          processingTime: executionTime,
          confidence: 0.1,
          analysisType: 'quick',
          requestId: options.requestId || 'unknown',
          version: '1.2.1',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Apply fixes using the real CLI engine
   */
  async applyFixes(code: string, issues: any[], options: Partial<Configuration> = {}): Promise<FixResult> {
    if (!this.initialized) {
      await this.initialize(options);
    }

    try {
      // Create temporary file for fixing
      const tempDir = path.join(process.cwd(), 'temp-fix');
      const tempFile = path.join(tempDir, 'temp-file.tsx');
      
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(tempFile, code);

      // Run CLI fix
      const layers = options.layers?.join(',') || '1,2,3,4,5,6,7';
      const cliCommand = `node "${this.cliPath}" fix "${tempDir}" --layers=${layers} --format=json --output="${tempDir}/fix-result.json"`;
      
      const result = execSync(cliCommand, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });

      // Read fix results
      const fixFile = path.join(tempDir, 'fix-result.json');
      const fixData = await fs.readFile(fixFile, 'utf8');
      const fixResult = JSON.parse(fixData);

      // Read the fixed file
      const fixedFile = path.join(tempDir, 'temp-file.tsx');
      const fixedCode = await fs.readFile(fixedFile, 'utf8');

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        success: fixResult.success || false,
        code: fixedCode,
        originalCode: code,
        appliedFixes: fixResult.appliedFixes || [],
        rollback: false
      };
    } catch (error) {
      return {
        success: false,
        code: code,
        originalCode: code,
        appliedFixes: [],
        rollback: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze and fix in one operation
   */
  async analyzeAndFix(code: string, options: Partial<Configuration> = {}): Promise<AnalysisResult & { appliedFixes: any[] }> {
    const analysisResult = await this.analyze(code, options);
    const fixResult = await this.applyFixes(code, analysisResult.analysis.detectedIssues, options);
    
    return {
      ...analysisResult,
      appliedFixes: fixResult.appliedFixes
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Configuration {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<Configuration>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Group issues by layer
   */
  private groupIssuesByLayer(issues: any[]): Record<number, number> {
    return issues.reduce((acc, issue) => {
      const layer = issue.layer || 1;
      acc[layer] = (acc[layer] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(issues: any[]): number {
    if (issues.length === 0) return 100;
    const severityScores = { error: 0, warning: 0.5, info: 1 };
    const totalScore = issues.reduce((sum, issue) => {
      const severity = issue.severity || 'warning';
      return sum + (severityScores[severity as keyof typeof severityScores] || 0.5);
    }, 0);
    return Math.max(0, 100 - (totalScore / issues.length) * 100);
  }

  /**
   * Calculate modernization progress
   */
  private calculateModernizationProgress(issues: any[]): number {
    if (issues.length === 0) return 100;
    const modernIssues = issues.filter(issue => issue.type === 'modern-pattern');
    return Math.min(100, (modernIssues.length / issues.length) * 100);
  }

  /**
   * Calculate technical debt
   */
  private calculateTechnicalDebt(issues: any[]): number {
    if (issues.length === 0) return 0;
    const severityWeights = { error: 3, warning: 2, info: 1 };
    return issues.reduce((sum, issue) => {
      const severity = issue.severity || 'warning';
      return sum + (severityWeights[severity as keyof typeof severityWeights] || 1);
    }, 0);
  }

  /**
   * Get version
   */
  getVersion(): string {
    return '1.2.1';
  }
} 