import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { IAnalysisClient, AnalysisRequest, AnalysisResult, UserInfo, AnalysisIssue, AnalysisResponse, FixResponse } from "./IAnalysisClient";

/**
 * Shared Core Adapter for VS Code Extension
 * 
 * Integrates the NeuroLint shared core with VS Code extension
 * without using console.log, alert, prompt, or other problematic behaviors.
 * Production-ready with comprehensive error handling and validation.
 */

export class SharedCoreAdapter implements IAnalysisClient {
  private neurolintCore: any;
  private outputChannel: vscode.OutputChannel;
  private workspaceRoot: string;
  private isInitializing = false;

  constructor(outputChannel: vscode.OutputChannel, workspaceRoot: string) {
    this.outputChannel = outputChannel;
    this.workspaceRoot = workspaceRoot;
    this.initializeCore();
  }

  /**
   * Initialize the shared core with error handling
   */
  private async initializeCore() {
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      // Get the path to the shared core relative to the extension
      const extensionPath = path.join(__dirname, '..', '..', '..', 'shared-core');
      
      // Check if shared core exists
      try {
        await fs.access(extensionPath);
      } catch {
        // If shared core doesn't exist in extension, try relative to workspace
        const workspaceCorePath = path.join(this.workspaceRoot, 'shared-core');
        try {
          await fs.access(workspaceCorePath);
          this.neurolintCore = require(workspaceCorePath);
        } catch {
          throw new Error('Shared core not found. Please ensure NeuroLint CLI is installed.');
        }
      }

      if (!this.neurolintCore) {
        this.neurolintCore = require(extensionPath);
      }

      // Initialize the core
      await this.neurolintCore.core.initialize({
        platform: 'vscode',
        configPath: path.join(this.workspaceRoot, '.neurolint', 'config.json')
      });

      this.outputChannel.appendLine('Shared core initialized successfully');
    } catch (error) {
      this.outputChannel.appendLine(`Failed to initialize shared core: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Validate input parameters for analysis
   */
  private validateAnalysisInput(code: string, options?: any): { valid: boolean; error?: string } {
    try {
      if (typeof code !== 'string') {
        return { valid: false, error: 'Code must be a string' };
      }

      if (code.length === 0) {
        return { valid: false, error: 'Code cannot be empty' };
      }

      if (code.length > 10 * 1024 * 1024) { // 10MB limit
        return { valid: false, error: 'Code file too large (max 10MB)' };
      }

      if (options?.layers && !Array.isArray(options.layers)) {
        return { valid: false, error: 'Layers must be an array' };
      }

      if (options?.layers) {
        const validLayers = [1, 2, 3, 4, 5, 6, 7];
        for (const layer of options.layers) {
          if (!validLayers.includes(layer)) {
            return { valid: false, error: `Invalid layer: ${layer}` };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Enhanced analyze method with comprehensive error handling
   */
  public async analyze(code: string, options?: {
    filename?: string;
    layers?: number[];
    verbose?: boolean;
    timeout?: number;
  }): Promise<AnalysisResponse> {
    try {
      // Validate inputs
      const validation = this.validateAnalysisInput(code, options);
      if (!validation.valid) {
        return {
          issues: [],
          error: `Input validation failed: ${validation.error}`,
          summary: {
            totalIssues: 0,
            issuesByLayer: {},
            filename: options?.filename || 'unknown',
            validationErrors: [validation.error!]
          }
        };
      }

      // Ensure core is initialized
      if (!this.neurolintCore) {
        await this.initializeCore();
      }

      // Set up timeout
      const timeout = options?.timeout || 30000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), timeout);
      });

      // Perform analysis
      const analysisPromise = this.performAnalysis(code, options);
      const result = await Promise.race([analysisPromise, timeoutPromise]);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.outputChannel.appendLine(`[ERROR] Analysis failed: ${errorMessage}`);
      
      return {
        issues: [],
        error: `Analysis failed: ${errorMessage}`,
        summary: {
          totalIssues: 0,
          issuesByLayer: {},
          filename: options?.filename || 'unknown',
          analysisFailed: true
        }
      };
    }
  }

  /**
   * Perform the actual analysis with proper error handling
   */
  private async performAnalysis(code: string, options?: any): Promise<AnalysisResponse> {
    try {
      const analysisOptions = {
        layers: options?.layers || [1, 2, 3, 4, 5, 6],
        filename: options?.filename || 'untitled.tsx',
        platform: 'vscode',
        verbose: options?.verbose || false,
        timeout: options?.timeout || 30000
      };

      const result = await this.neurolintCore.analyze(code, analysisOptions);

      // Convert shared core result to VS Code format
      const issues: AnalysisIssue[] = result.issues.map((issue: any) => ({
        type: this.mapSeverity(issue.severity),
        message: issue.message,
        description: issue.description || issue.message,
        layer: issue.layer || 1,
        location: {
          line: issue.location?.line || 1,
          column: issue.location?.column || 1
        },
        ruleName: issue.ruleName || issue.rule || 'unknown',
        rule: issue.rule
      }));

      return {
        issues,
        summary: {
          totalIssues: issues.length,
          issuesByLayer: this.groupIssuesByLayer(issues),
          filename: analysisOptions.filename,
          analysisTime: Date.now(),
          layersAnalyzed: analysisOptions.layers,
          totalRules: this.neurolintCore.rules?.size || 0
        }
      };

    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced applyFixes method with comprehensive error handling
   */
  public async applyFixes(code: string, issues: AnalysisIssue[], options?: {
    dryRun?: boolean;
    verbose?: boolean;
    timeout?: number;
  }): Promise<FixResponse> {
    try {
      // Validate inputs
      if (!Array.isArray(issues)) {
        return {
          success: false,
          code: code,
          appliedFixes: [],
          error: 'Issues must be an array'
        };
      }

      if (issues.length === 0) {
        return {
          success: true,
          code: code,
          appliedFixes: [],
          message: 'No issues to fix'
        };
      }

      // Ensure core is initialized
      if (!this.neurolintCore) {
        await this.initializeCore();
      }

      // Set up timeout
      const timeout = options?.timeout || 60000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fix application timeout')), timeout);
      });

      // Apply fixes
      const fixPromise = this.performFixes(code, issues, options);
      const result = await Promise.race([fixPromise, timeoutPromise]);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.outputChannel.appendLine(`[ERROR] Fix application failed: ${errorMessage}`);
      
      return {
        success: false,
        code: code,
        appliedFixes: [],
        error: `Fix application failed: ${errorMessage}`
      };
    }
  }

  /**
   * Perform the actual fixes with proper error handling
   */
  private async performFixes(code: string, issues: AnalysisIssue[], options?: any): Promise<FixResponse> {
    try {
      const fixOptions = {
        dryRun: options?.dryRun || false,
        verbose: options?.verbose || false,
        platform: 'vscode'
      };

      const result = await this.neurolintCore.applyFixes(code, issues, fixOptions);

      if (!result.success) {
        throw new Error(result.error || 'Fix application failed');
      }

      const appliedFixes = result.appliedFixes?.map((fix: any) => ({
        rule: fix.rule,
        description: fix.description,
        location: fix.location,
        layer: fix.layer
      })) || [];

      return {
        success: true,
        code: result.code,
        appliedFixes,
        totalFixes: appliedFixes.length,
        fixErrors: result.fixErrors
      };

    } catch (error) {
      throw new Error(`Fix application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Group issues by layer for summary
   */
  private groupIssuesByLayer(issues: AnalysisIssue[]): Record<number, AnalysisIssue[]> {
    const grouped: Record<number, AnalysisIssue[]> = {};
    
    for (const issue of issues) {
      if (!grouped[issue.layer]) {
        grouped[issue.layer] = [];
      }
      grouped[issue.layer].push(issue);
    }
    
    return grouped;
  }

  /**
   * Analyze code using shared core (legacy method)
   */
  public async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      const result = await this.analyze(request.code, {
        filename: request.filename || 'unknown',
        layers: request.layers,
        verbose: false
      });

      // Convert to legacy format
      const changes = result.issues.map(issue => ({
        line: issue.location.line,
        column: issue.location.column,
        message: issue.message,
        severity: issue.type,
        fix: issue.description
      }));

      return {
        success: !result.error,
        transformedCode: request.code, // Use original code as fallback
        changes,
        errors: result.error ? [result.error] : [],
        metadata: {
          ...request.metadata,
          source: 'vscode-extension',
          version: '1.2.1',
          layers: request.layers,
          issuesFound: result.issues.length
        }
      };

    } catch (error) {
      return {
        success: false,
        transformedCode: request.code,
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: request.metadata
      };
    }
  }

  /**
   * Apply fixes to code (legacy method)
   */
  public async applyFixesLegacy(code: string, issues: any[], options: any = {}): Promise<AnalysisResult> {
    try {
      const result = await this.applyFixes(code, issues as AnalysisIssue[], options);

      return {
        success: result.success,
        transformedCode: result.code,
        changes: result.appliedFixes.map((fix: any) => ({
          line: fix.location.line,
          column: fix.location.column,
          message: fix.description,
          severity: 'info' as const,
          fix: fix.description
        })),
        errors: result.error ? [result.error] : [],
        metadata: {
          source: 'vscode-extension',
          version: '1.2.1',
          fixesApplied: result.totalFixes || 0
        }
      };

    } catch (error) {
      return {
        success: false,
        transformedCode: code,
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          source: 'vscode-extension',
          version: '1.2.1'
        }
      };
    }
  }

  /**
   * Analyze workspace files
   */
  public async analyzeWorkspace(files: Array<{ filename: string; code: string }>): Promise<AnalysisResult> {
    try {
      const allIssues: AnalysisIssue[] = [];
      const allChanges: any[] = [];

      for (const file of files) {
        try {
          const result = await this.analyze(file.code, {
            filename: file.filename,
            layers: [1, 2, 3, 4, 5, 6],
            verbose: false
          });

          if (result.issues) {
            allIssues.push(...result.issues);
            allChanges.push(...result.issues.map(issue => ({
              line: issue.location.line,
              column: issue.location.column,
              message: issue.message,
              severity: issue.type,
              fix: issue.description,
              filename: file.filename
            })));
          }
        } catch (error) {
          this.outputChannel.appendLine(`Failed to analyze ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        transformedCode: '', // Empty string as fallback
        changes: allChanges,
        metadata: {
          source: 'vscode-extension',
          version: '1.2.1',
          filesAnalyzed: files.length,
          totalIssues: allIssues.length
        }
      };

    } catch (error) {
      return {
        success: false,
        transformedCode: '', // Empty string as fallback
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          source: 'vscode-extension',
          version: '1.2.1'
        }
      };
    }
  }

  /**
   * Check if user can use specific layers
   */
  public async canUseLayers(layers: number[]): Promise<{
    allowed: boolean;
    restrictedLayers: number[];
    tier: string;
  }> {
    try {
      // For now, allow all layers in VS Code extension
      return {
        allowed: true,
        restrictedLayers: [],
        tier: 'vscode-extension'
      };
    } catch (error) {
      return {
        allowed: false,
        restrictedLayers: layers,
        tier: 'error'
      };
    }
  }

  /**
   * Authenticate user
   */
  public async authenticate(apiKey: string): Promise<UserInfo> {
    // VS Code extension doesn't require authentication
    return {
      id: 'vscode-user',
      email: 'user@vscode.local',
      name: 'VS Code User',
      plan: 'free',
      usage: { current: 0, limit: 1000 },
      features: {
        premiumAnalysis: false,
        bulkProcessing: false,
        realTimeLinting: true,
        advancedRefactoring: false,
        teamCollaboration: false
      }
    };
  }

  /**
   * Set API key
   */
  public async setApiKey(apiKey: string): Promise<void> {
    // VS Code extension doesn't use API keys
    this.outputChannel.appendLine('API key set (not used in VS Code extension)');
  }

  /**
   * Validate API key
   */
  public async validateApiKey(): Promise<boolean> {
    // VS Code extension doesn't require API key validation
    return true;
  }

  /**
   * Get usage statistics
   */
  public async getUsageStats(): Promise<any> {
    return {
      platform: 'vscode',
      version: '1.2.1',
      features: ['real-time-analysis', 'quick-fixes']
    };
  }

  /**
   * Get configuration
   */
  public getConfig(key?: string): any {
    try {
      if (!this.neurolintCore?.config) {
        return key ? undefined : {};
      }
      return key ? this.neurolintCore.config[key] : this.neurolintCore.config;
    } catch (error) {
      this.outputChannel.appendLine(`Failed to get config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return key ? undefined : {};
    }
  }

  /**
   * Set configuration
   */
  public setConfig(key: string, value: any): void {
    try {
      if (!this.neurolintCore?.config) {
        this.neurolintCore = this.neurolintCore || {};
        this.neurolintCore.config = {};
      }
      this.neurolintCore.config[key] = value;
    } catch (error) {
      this.outputChannel.appendLine(`Failed to set config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save configuration
   */
  public async saveConfig(): Promise<boolean> {
    try {
      if (!this.neurolintCore?.config) {
        return false;
      }
      
      const configPath = path.join(this.workspaceRoot, '.neurolint', 'config.json');
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(this.neurolintCore.config, null, 2));
      
      return true;
    } catch (error) {
      this.outputChannel.appendLine(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Get analytics report
   */
  public getAnalyticsReport(options: any = {}): any {
    return {
      platform: 'vscode',
      version: '1.2.1',
      timestamp: Date.now(),
      features: ['real-time-analysis', 'quick-fixes', 'error-handling']
    };
  }

  /**
   * Track user action
   */
  public trackUser(userId: string, action: string): void {
    this.outputChannel.appendLine(`[ANALYTICS] User ${userId} performed action: ${action}`);
  }

  /**
   * Track command execution
   */
  public trackCommand(command: string, options: any = {}): void {
    this.outputChannel.appendLine(`[ANALYTICS] Command executed: ${command}`);
  }

  /**
   * Get available rules
   */
  public getRules(): any[] {
    try {
      if (!this.neurolintCore?.rules) {
        return [];
      }
      return Array.from(this.neurolintCore.rules.values());
    } catch (error) {
      this.outputChannel.appendLine(`Failed to get rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Check if layer is enabled
   */
  public isLayerEnabled(layerId: number): boolean {
    try {
      const config = this.getConfig();
      const enabledLayers = config.enabledLayers || [1, 2, 3, 4, 5, 6];
      return enabledLayers.includes(layerId);
    } catch (error) {
      this.outputChannel.appendLine(`Failed to check layer status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return true; // Default to enabled
    }
  }

  /**
   * Get enabled layers
   */
  public getEnabledLayers(): number[] {
    try {
      const config = this.getConfig();
      return config.enabledLayers || [1, 2, 3, 4, 5, 6];
    } catch (error) {
      this.outputChannel.appendLine(`Failed to get enabled layers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [1, 2, 3, 4, 5, 6]; // Default layers
    }
  }

  /**
   * Map severity levels
   */
  private mapSeverity(severity: string): "error" | "warning" | "info" {
    switch (severity?.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Get user information
   */
  public async getUserInfo(): Promise<UserInfo> {
    return {
      id: 'vscode-user',
      email: 'user@vscode.local',
      name: 'VS Code User',
      plan: 'free',
      usage: { current: 0, limit: 1000 },
      features: {
        premiumAnalysis: false,
        bulkProcessing: false,
        realTimeLinting: true,
        advancedRefactoring: false,
        teamCollaboration: false
      }
    };
  }

  /**
   * Check if user can use specific feature
   */
  public async canUseFeature(feature: keyof UserInfo["features"]): Promise<boolean> {
    const userInfo = await this.getUserInfo();
    return userInfo.features[feature] || false;
  }

  /**
   * Check usage limits
   */
  public async checkUsageLimit(): Promise<{
    canUse: boolean;
    usage: { current: number; limit: number };
    tier?: string;
  }> {
    const userInfo = await this.getUserInfo();
    return {
      canUse: userInfo.usage.current < userInfo.usage.limit,
      usage: userInfo.usage,
      tier: userInfo.plan
    };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    // VS Code extension doesn't require authentication
    return true;
  }

  /**
   * Shutdown the adapter
   */
  public async shutdown(): Promise<boolean> {
    try {
      this.outputChannel.appendLine('Shared core adapter shutting down...');
      return true;
    } catch (error) {
      this.outputChannel.appendLine(`Failed to shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
} 