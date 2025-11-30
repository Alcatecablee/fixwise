/**
 * Common interface for analysis clients
 * Allows both API client and shared core adapter to be used interchangeably
 */

export interface AnalysisRequest {
  code: string;
  filename?: string;
  layers: number[];
  metadata?: any;
}

export interface AnalysisResult {
  success: boolean;
  transformedCode?: string;
  changes?: Array<{
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning" | "info";
    fix?: string;
  }>;
  errors?: string[];
  metadata?: any;
}

export interface AnalysisIssue {
  type: "error" | "warning" | "info";
  message: string;
  description: string;
  layer: number;
  location: { line: number; column: number };
  ruleName: string;
  rule?: string;
}

export interface AnalysisResponse {
  issues: AnalysisIssue[];
  error?: string;
  summary: {
    totalIssues: number;
    issuesByLayer: Record<number, AnalysisIssue[]>;
    filename: string;
    analysisTime?: number;
    layersAnalyzed?: number[];
    totalRules?: number;
    fallbackUsed?: boolean;
    originalError?: string;
    analysisFailed?: boolean;
    validationErrors?: string[];
  };
}

export interface FixRequest {
  code: string;
  issues: AnalysisIssue[];
  options?: {
    dryRun?: boolean;
    verbose?: boolean;
    timeout?: number;
  };
}

export interface FixResponse {
  success: boolean;
  code: string;
  appliedFixes: Array<{
    rule: string;
    description: string;
    location: { line: number; column: number };
    layer: number;
  }>;
  error?: string;
  message?: string;
  totalFixes?: number;
  fixErrors?: string[];
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team" | "enterprise";
  usage: {
    current: number;
    limit: number;
  };
  features: {
    premiumAnalysis: boolean;
    bulkProcessing: boolean;
    realTimeLinting: boolean;
    advancedRefactoring: boolean;
    teamCollaboration: boolean;
  };
}

export interface IAnalysisClient {
  analyzeCode(request: AnalysisRequest): Promise<AnalysisResult>;
  analyzeWorkspace(files: Array<{ filename: string; code: string }>): Promise<AnalysisResult>;
  
  // Enhanced analysis methods for production-ready functionality
  analyze(code: string, options?: {
    filename?: string;
    layers?: number[];
    verbose?: boolean;
    timeout?: number;
  }): Promise<AnalysisResponse>;
  
  applyFixes(code: string, issues: AnalysisIssue[], options?: {
    dryRun?: boolean;
    verbose?: boolean;
    timeout?: number;
  }): Promise<FixResponse>;
  
  getUserInfo(): Promise<UserInfo | null>;
  canUseFeature(feature: keyof UserInfo["features"]): Promise<boolean>;
  canUseLayers(layers: number[]): Promise<{
    allowed: boolean;
    restrictedLayers: number[];
    tier: string;
  }>;
  checkUsageLimit(): Promise<{
    canUse: boolean;
    usage: { current: number; limit: number };
    tier?: string;
  }>;
  isAuthenticated(): boolean;
  authenticate(apiKey: string): Promise<UserInfo>;
  setApiKey(apiKey: string): Promise<void>;
  validateApiKey(): Promise<boolean>;
  getUsageStats(): Promise<any>;
} 