import * as vscode from "vscode";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ConfigurationManager } from "./ConfigurationManager";

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

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  plan: "free" | "professional" | "business" | "enterprise";
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

export class ApiClient {
  private client: AxiosInstance;
  private secrets: vscode.SecretStorage;
  private static readonly API_KEY_SECRET = 'neurolint.apiKey';

  constructor(
    private configManager: ConfigurationManager,
    secrets: vscode.SecretStorage,
  ) {
    this.secrets = secrets;
    this.client = this.createAxiosInstance();
  }

  public async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      // Check usage limits for fix operations
      if (request.metadata?.applyFixes && this.isAuthenticated()) {
        const usageCheck = await this.checkUsageLimit();
        if (!usageCheck.canUse) {
          throw new Error(`Usage limit exceeded. Current: ${usageCheck.usage.current}/${usageCheck.usage.limit}. Upgrade your plan at https://neurolint.dev/pricing`);
        }
      }

      // Transform request to match root project API structure
      const response = await this.client.post("/analyze", {
        code: request.code,
        filename: request.filename || "untitled.tsx",
        layers: Array.isArray(request.layers)
          ? request.layers.length === 1
            ? request.layers[0]?.toString() || "1"
            : request.layers.join(",")
          : "auto",
        applyFixes: request.metadata?.applyFixes || false,
        dryRun: !request.metadata?.applyFixes, // Follow roadmap pattern: dryRun for analysis, false for fixes
        metadata: {
          ...request.metadata,
          source: "vscode-extension",
          version: "1.0.11",
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async analyzeWorkspace(
    files: Array<{
      filename: string;
      code: string;
    }>,
  ): Promise<AnalysisResult> {
    try {
      // Root project doesn't have workspace endpoint, process files individually
      const response = await this.client.post("/analyze", {
        files,
        layers: this.configManager.getEnabledLayers(),
        metadata: {
          source: "vscode-extension",
          version: "1.0.9",
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async authenticate(apiKey: string): Promise<UserInfo> {
    try {
      const tempClient = axios.create({
        baseURL: this.configManager.getApiUrl(),
        timeout: this.configManager.getTimeout(),
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      // Test the API key by making a simple validation request
      const response = await tempClient.post("/analyze", {
        code: "const test = 'validation';",
        filename: "test.ts",
        layers: [1],
        applyFixes: false,
        metadata: { source: "vscode-extension", validation: true },
      });

      // If we get here, the API key worked
      // Get actual user info
      try {
        const userResponse = await tempClient.get("/auth/current-user");
        const userData = userResponse.data;
        return {
          id: userData.id || "authenticated-user",
          email: userData.email || "authenticated@neurolint.dev",
          name: userData.firstName + " " + userData.lastName || "Authenticated User",
          plan: userData.plan || "free",
          usage: { current: 0, limit: 1000 },
          features: this.mapPlanToFeatures(userData.plan || "free"),
        };
      } catch (userError) {
        // Fallback if user endpoint fails
        return {
          id: "authenticated-user",
          email: "authenticated@neurolint.dev",
          name: "Authenticated User",
          plan: "free",
          usage: { current: 0, limit: 1000 },
          features: this.mapPlanToFeatures("free"),
        };
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private mapPlanToFeatures(plan: string) {
    const tierAccess = {
      free: { 
        premiumAnalysis: false,
        bulkProcessing: false,
        realTimeLinting: false,
        advancedRefactoring: false,
        teamCollaboration: false
      },
      professional: { 
        premiumAnalysis: true,
        bulkProcessing: true,
        realTimeLinting: true,
        advancedRefactoring: true,
        teamCollaboration: true
      },
      business: { 
        premiumAnalysis: true,
        bulkProcessing: true,
        realTimeLinting: true,
        advancedRefactoring: true,
        teamCollaboration: true
      },
      enterprise: { 
        premiumAnalysis: true,
        bulkProcessing: true,
        realTimeLinting: true,
        advancedRefactoring: true,
        teamCollaboration: true
      }
    };
    
    const access = tierAccess[plan as keyof typeof tierAccess] || tierAccess.free;
    return access;
  }

  public async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await this.client.get("/auth/current-user");
      const plan = response.data.plan || "free";
      const features = this.mapPlanToFeatures(plan);

      return {
        ...response.data,
        features,
      };
    } catch (error) {
      return null;
    }
  }

  public async canUseFeature(
    feature: keyof UserInfo["features"],
  ): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    const userInfo = await this.getUserInfo();
    if (!userInfo) return false;
    return userInfo.features[feature];
  }

  public async canUseLayers(layers: number[]): Promise<{
    allowed: boolean;
    restrictedLayers: number[];
    tier: string;
  }> {
    try {
      if (!this.isAuthenticated()) {
        return {
          allowed: false,
          restrictedLayers: layers,
          tier: 'free'
        };
      }

      const usageCheck = await this.checkUsageLimit();
      const tier = usageCheck.tier || 'free';

      // Define tier access
      const tierAccess: Record<string, number[]> = {
        free: [1, 2, 3, 4],
        professional: [1, 2, 3, 4, 5, 6, 7],
        business: [1, 2, 3, 4, 5, 6, 7],
        enterprise: [1, 2, 3, 4, 5, 6, 7]
      };

      const allowedLayers = tierAccess[tier] || [];
      const restrictedLayers = layers.filter(layer => !allowedLayers.includes(layer));

      return {
        allowed: restrictedLayers.length === 0,
        restrictedLayers,
        tier
      };
    } catch (error) {
      return {
        allowed: false,
        restrictedLayers: layers,
        tier: 'free'
      };
    }
  }

  public async checkUsageLimit(): Promise<{
    canUse: boolean;
    usage: { current: number; limit: number };
    tier?: string;
  }> {
    try {
      if (!this.isAuthenticated()) {
        // Unauthenticated users can analyze but not fix
        return { canUse: false, usage: { current: 0, limit: 0 }, tier: 'free' };
      }

      // Check usage via the CLI usage endpoint
      const response = await this.client.get("/cli/usage");
      const data = response.data;

      const canUse = data.canUseFixes || data.limits.maxFixes === -1;
      const current = data.usage?.usedFixes || 0;
      const limit = data.limits?.maxFixes || 0;

      return {
        canUse,
        usage: { current, limit },
        tier: data.tier
      };
    } catch (error) {
      // Default to allowing basic usage for analysis
      return { canUse: false, usage: { current: 0, limit: 0 }, tier: 'free' };
    }
  }

  public isAuthenticated(): boolean {
    return !!this.configManager.getApiKey();
  }

  public async setApiKey(apiKey: string): Promise<void> {
    await this.secrets.store(ApiClient.API_KEY_SECRET, apiKey);
    // Also update config manager for immediate use
    await this.configManager.setApiKey(apiKey);
  }

  private async getStoredApiKey(): Promise<string | undefined> {
    const stored = await this.secrets.get(ApiClient.API_KEY_SECRET);
    return stored || this.configManager.getApiKey();
  }

  public async validateApiKey(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch {
      return false;
    }
  }

  public async getUsageStats(): Promise<any> {
    try {
      const response = await this.client.get("/cli/usage");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.configManager.getApiUrl(),
      timeout: this.configManager.getTimeout(),
    });

    // Request interceptor
    instance.interceptors.request.use((config: any) => {
      // Use synchronous API key retrieval to avoid async issues
      const apiKey = this.configManager.getApiKey();

      if (apiKey) {
        config.headers = config.headers || {};
        config.headers["X-API-Key"] = apiKey;
      }

      config.baseURL = this.configManager.getApiUrl();
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
      config.headers["User-Agent"] = "NeuroLint-VSCode/1.0.10";

      return config;
    });

    // Response interceptor
    instance.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401) {
          vscode.window.showErrorMessage(
            "NeuroLint: Authentication failed. Please check your API key.",
          );
        } else if (error.response?.status === 429) {
          vscode.window.showWarningMessage(
            "NeuroLint: Rate limit exceeded. Please try again later.",
          );
        } else if (error.response?.status >= 500) {
          vscode.window.showErrorMessage(
            "NeuroLint: Server error. Please try again later.",
          );
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }

  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Invalid request: ${message}`);
        case 401:
          return new Error("Authentication failed. Please check your API key.");
        case 403:
          return new Error("Access forbidden. Please check your permissions.");
        case 404:
          return new Error("API endpoint not found.");
        case 429:
          return new Error("Rate limit exceeded. Please try again later.");
        case 500:
          return new Error("Server error. Please try again later.");
        default:
          return new Error(`HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      return new Error("Network error. Please check your internet connection.");
    } else {
      return new Error(error.message || "Unknown error occurred");
    }
  }
}
