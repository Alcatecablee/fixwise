// Shared TypeScript types for NeuroLint Pro
// Centralizes type definitions to ensure consistency across the application

export type UserTier = 'free' | 'premium' | 'enterprise';

export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueCategory = 
  | 'Security' 
  | 'Performance' 
  | 'Modernization' 
  | 'Code Quality' 
  | 'Type Safety' 
  | 'Style'
  | 'General';

export interface DetectedIssue {
  id?: string;
  type: string;
  line?: number;
  column?: number;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  description?: string;
  rule?: string;
  fixSuggestion?: string;
  codeExample?: {
    before: string;
    after: string;
    explanation: string;
  };
  estimatedEffort?: 'Low' | 'Medium' | 'High';
}

export interface LegacyPattern {
  pattern: string;
  count: number;
  locations?: Array<{
    file: string;
    line: number;
    example: string;
  }>;
  modernEquivalent?: string;
  migrationComplexity?: 'Low' | 'Medium' | 'High';
}

export interface ModernPattern {
  pattern: string;
  count: number;
  benefits?: string[];
}

export interface FrameworkVersions {
  react?: string;
  nextjs?: string;
  typescript?: string;
  [key: string]: string | undefined;
}

export interface LayerResult {
  layerId: number;
  success: boolean;
  changeCount: number;
  description: string;
  issues?: DetectedIssue[];
  fixes?: Array<{
    file: string;
    changes: number;
    description: string;
  }>;
  executionTime?: number;
  errors?: string[];
}

export interface AnalysisMetadata {
  processingTime: number;
  confidence: number;
  analysisType?: 'quick' | 'comprehensive' | 'migration';
  requestId: string;
  version: string;
  timestamp: string;
}

export interface AnalysisResult {
  analysis: {
    detectedIssues: DetectedIssue[];
    confidence: number;
    recommendedLayers: number[];
    legacyPatterns: LegacyPattern[];
    modernPatterns: ModernPattern[];
    frameworkVersions: FrameworkVersions;
    migrationComplexity: 'Low' | 'Medium' | 'High';
    qualityScore?: number;
    readinessScore?: number;
  };
  layers: LayerResult[];
  metadata: AnalysisMetadata;
}

export interface ReportOptions {
  userTier: UserTier;
  analysisResult: AnalysisResult;
  filename: string;
  projectName?: string;
  generatePDF?: boolean;
  includeCodeDiffs?: boolean;
  template?: 'standard' | 'executive' | 'technical';
}

export type ReportSectionType = 
  | 'summary' 
  | 'issues' 
  | 'recommendations' 
  | 'migration' 
  | 'code_diff' 
  | 'upgrade'
  | 'security'
  | 'performance';

export interface ReportSection {
  title: string;
  content: any; // Will be typed more specifically based on section type
  type: ReportSectionType;
  tierRequired?: UserTier;
  priority?: 'high' | 'medium' | 'low';
}

export interface ReportSummary {
  totalIssues: number;
  criticalIssues: number;
  confidence: number;
  readinessScore: number;
  qualityScore?: number;
  estimatedFixTime?: string;
}

export interface GeneratedReport {
  reportId: string;
  level: 'basic' | 'detailed';
  userTier: UserTier;
  sections: ReportSection[];
  summary: ReportSummary;
  upgradePrompts?: {
    message: string;
    features: string[];
  };
  generatedAt: string;
  expiresAt?: string;
  pdfUrl?: string;
  filename: string;
  projectName?: string;
}

export interface UserTierLimits {
  scanningUnlimited: boolean;
  canApplyFixes: boolean;
  maxFileSize: number;
  featuresIncluded: string[];
  requestsPerHour: number;
  requestsPerDay: number;
  monthlyReports?: number;
  pdfExports?: number;
}

export interface TierInfo {
  current: UserTier;
  limits: UserTierLimits;
  canApplyFixes: boolean;
  reportLevel: 'basic' | 'detailed';
  upgradeMessage?: string;
  availableFeatures: string[];
  missingFeatures?: string[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  tier: UserTier;
  emailConfirmed: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    requestId: string;
    processingTimeMs: number;
    timestamp: string;
    version: string;
  };
  tierInfo?: TierInfo;
}

export interface AnalysisResponse extends APIResponse<AnalysisResult> {
  report?: GeneratedReport;
  previewMode?: boolean;
  fixesApplied?: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
}

export interface ReportResponse extends APIResponse<GeneratedReport> {
  pdfGenerated?: boolean;
  pdfError?: string;
}

export interface ModernizationAssessment {
  id: string;
  userId: string;
  projectName: string;
  filename: string;
  frameworkVersions: FrameworkVersions;
  legacyPatterns: LegacyPattern[];
  readinessScore: number;
  analysisType: 'quick' | 'comprehensive' | 'migration';
  targetFramework?: string;
  result: AnalysisResult;
  createdAt: string;
  processingTime: number;
}

export interface MigrationPlan {
  id: string;
  assessmentId: string;
  planType: 'react_upgrade' | 'nextjs_migration' | 'typescript_upgrade' | 'component_modernization';
  phases: Array<{
    phase: number;
    title: string;
    description: string;
    duration: string;
    tasks: string[];
    prerequisites?: string[];
  }>;
  estimatedHours: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  createdAt: string;
}

// Utility type for making properties optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for making properties required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Type guards for runtime type checking
export function isValidUserTier(tier: string): tier is UserTier {
  return ['free', 'premium', 'enterprise'].includes(tier);
}

export function isValidIssueSeverity(severity: string): severity is IssueSeverity {
  return ['error', 'warning', 'info'].includes(severity);
}

export function isValidIssueCategory(category: string): category is IssueCategory {
  return [
    'Security', 'Performance', 'Modernization', 
    'Code Quality', 'Type Safety', 'Style', 'General'
  ].includes(category);
}

// Constants for type-safe feature checking
export const TIER_FEATURES = {
  free: ['basic_analysis', 'basic_reports', 'preview_mode'] as const,
  premium: [
    'basic_analysis', 'basic_reports', 'preview_mode',
    'detailed_reports', 'apply_fixes', 'pdf_export', 'migration_plans'
  ] as const,
  enterprise: [
    'basic_analysis', 'basic_reports', 'preview_mode',
    'detailed_reports', 'apply_fixes', 'pdf_export', 'migration_plans',
    'batch_fixes', 'priority_support', 'custom_rules'
  ] as const,
} as const;

export type TierFeature = typeof TIER_FEATURES[UserTier][number];

// Type-safe feature checking
export function hasFeatureAccess(tier: UserTier, feature: string): boolean {
  return TIER_FEATURES[tier].includes(feature as any);
}
