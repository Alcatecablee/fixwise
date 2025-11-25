import crypto from "crypto";

// In-memory storage for demo purposes
export const integrations = new Map();
export const userIntegrations = new Map();
export const integrationRuns = new Map();

export interface CICDIntegration {
  id: string;
  name: string;
  type: "github" | "gitlab" | "jenkins" | "azure" | "custom";
  userId: string;
  repository: string;
  branch: string;
  webhook: {
    url: string;
    secret: string;
    events: string[];
  };
  settings: {
    autoAnalyze: boolean;
    failOnIssues: boolean;
    maxIssues: number;
    layers: number[] | "auto" | "all";
    notifications: {
      slack?: string;
      email?: string[];
      teams?: string;
    };
  };
  isActive: boolean;
  createdAt: string;
  lastRun: string | null;
  totalRuns: number;
  successRate: number;
}

export interface IntegrationRun {
  id: string;
  integrationId: string;
  commit: string;
  branch: string;
  author: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  filesAnalyzed: number;
  issuesFound: number;
  qualityScore: number;
  results: any[];
  logs: string[];
  pullRequestUrl?: string;
}

export const generateWebhookSecret = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateWebhookUrl = (integrationId: string): string => {
  return `/api/integrations/cicd/${integrationId}/webhook`;
};
