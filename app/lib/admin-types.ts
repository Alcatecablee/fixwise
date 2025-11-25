// Common types for admin dashboard

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "devops" | "developer" | "viewer";
  status: "active" | "inactive" | "pending";
  lastActive: Date;
  permissions: {
    ruleEditing: boolean;
    projectMonitoring: boolean;
    systemConfig: boolean;
    userManagement: boolean;
  };
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  lastAnalysis: Date | null;
  lastFix: Date | null;
  layersExecuted: number[];
  executionTime: number;
  successRate: number;
  errorTrends: Array<{
    type: string;
    count: number;
    trend: "up" | "down" | "stable";
  }>;
  status: "active" | "inactive" | "error";
}

export interface Rule {
  id: string;
  name: string;
  layer: number;
  type: "regex" | "ast";
  enabled: boolean;
  pattern: string;
  description: string;
  version: string;
  lastModified: Date;
  usage: number;
}

export interface Layer {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  ruleCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  project: string;
  layer: number;
  action: "analysis" | "fix" | "rollback";
  status: "success" | "error" | "warning";
  duration: number;
  errors: Array<{
    type: string;
    message: string;
    file?: string;
    line?: number;
  }>;
  details: {
    filesProcessed: number;
    changesApplied: number;
    issuesFixed: number;
  };
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: Date;
  details: string;
}

export interface AnalyticsData {
  totalLinesAnalyzed: number;
  totalLinesTransformed: number;
  totalIssuesFixed: number;
  timesSaved: number; // in hours
  topIssueTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  layerPerformance: Array<{
    layer: number;
    name: string;
    avgExecutionTime: number;
    successRate: number;
    usage: number;
  }>;
  timeRangeData: Array<{
    date: string;
    analyses: number;
    fixes: number;
    errors: number;
  }>;
}

export interface RollbackPoint {
  id: string;
  project: string;
  timestamp: Date;
  version: string;
  changes: Array<{
    file: string;
    type: "added" | "modified" | "deleted";
    linesChanged: number;
  }>;
  reason: string;
  canRollback: boolean;
}

export interface DiffItem {
  file: string;
  beforeContent: string;
  afterContent: string;
  timestamp: Date;
}

export interface SystemConfig {
  defaultBehavior: {
    alwaysDryRun: boolean;
    autoBackup: boolean;
    notificationsEnabled: boolean;
    maxFileSize: number;
    timeoutSeconds: number;
  };
  layerSequence: number[];
  notifications: {
    slack: {
      enabled: boolean;
      webhook: string;
      channels: string[];
    };
    email: {
      enabled: boolean;
      recipients: string[];
      frequency: "immediate" | "hourly" | "daily";
    };
  };
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    lastUsed: Date | null;
    created: Date;
  }>;
}

export interface VersionInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseNotes: string;
  updateHistory: Array<{
    version: string;
    date: Date;
    type: "major" | "minor" | "patch";
    changes: string[];
  }>;
  environments: Array<{
    name: string;
    version: string;
    status: "up-to-date" | "outdated" | "error";
    lastUpdated: Date;
  }>;
}

export interface ActivityItem {
  id: string;
  type: "execution" | "rule_change" | "user_action" | "system_event";
  timestamp: Date;
  title: string;
  description: string;
  user?: string;
  project?: string;
  status: "success" | "error" | "warning" | "info";
  details?: {
    duration?: number;
    files?: number;
    changes?: number;
    layer?: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter and sort types
export type ProjectFilter = "all" | "active" | "inactive" | "error";
export type LogFilter = {
  status: "all" | "success" | "error" | "warning";
  action: "all" | "analysis" | "fix" | "rollback";
  timeRange: "1h" | "24h" | "7d" | "30d";
};
export type ActivityFilter =
  | "all"
  | "execution"
  | "rule_change"
  | "user_action"
  | "system_event";
export type SortDirection = "asc" | "desc";

// Error types
export interface AdminError {
  code: string;
  message: string;
  details?: any;
}
