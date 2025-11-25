// Shared in-memory data store
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)

// Global data stores - shared across all API routes
// Use globalThis to persist across hot reloads in development
const initDataStore = () => ({
  // Authentication & API Keys
  apiKeys: new Map(),
  userApiKeys: new Map(),

  // Projects & Files
  projects: new Map(),
  projectFiles: new Map(),
  projectAnalyses: new Map(),

  // Teams & Collaboration
  teams: new Map(),
  teamMembers: new Map(),
  teamProjects: new Map(),
  invitations: new Map(),

  // Webhooks & Notifications
  webhooks: new Map(),
  userWebhooks: new Map(),
  webhookEvents: new Map(),

  // CI/CD Integrations
  integrations: new Map(),
  userIntegrations: new Map(),
  integrationRuns: new Map(),

  // Dashboard Sessions
  dashboardSessions: new Map(),

  // Collaboration System
  collaborationSessions: new Map(),
  collaborationParticipants: new Map(),
  collaborationComments: new Map(),
  collaborationAnalysis: new Map(),
  collaborationPresence: new Map(),
  collaborationActivity: new Map(),

  // Demo rate limiting
  requestCounts: new Map(),

    // Pay-per-fix billing system
  projectSubscriptions: new Map(), // Project-based subscriptions
  projectUsage: new Map(), // Fix usage tracking per project
  fixHistory: new Map(), // Detailed fix history
  billingCycles: new Map(), // Monthly billing cycles

    // Modernization analysis system
  modernizationAssessments: new Map(), // User modernization assessments
  migrationPlans: new Map(), // Generated migration plans
  userReports: new Map(), // Generated user reports
});

export const dataStore =
  (globalThis as any).dataStore ||
  ((globalThis as any).dataStore = (() => {
    console.log("[DATA STORE] Initializing new data store");
    return initDataStore();
  })());

// Log current state for debugging
console.log(
  "[DATA STORE] Current sessions:",
  dataStore.collaborationSessions.size,
);

// Utility functions for data operations
export const dataUtils = {
  // API Key utilities
  validateApiKey: (key: string): any => {
    for (const apiKey of dataStore.apiKeys.values()) {
      if (apiKey.key === key && apiKey.isActive) {
        // Check expiration
        if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
          return null;
        }
        return apiKey;
      }
    }
    return null;
  },

  // Rate limiting utilities
  checkApiRateLimit: (apiKey: any): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000;
    const dayWindow = 24 * 60 * 60 * 1000;

    // Reset counters if needed
    if (now - (apiKey.lastHourReset || 0) > hourWindow) {
      apiKey.hourlyUsage = 0;
      apiKey.lastHourReset = now;
    }

    if (now - (apiKey.lastDayReset || 0) > dayWindow) {
      apiKey.dailyUsage = 0;
      apiKey.lastDayReset = now;
    }

    const hourlyAllowed =
      (apiKey.hourlyUsage || 0) < apiKey.rateLimit.requestsPerHour;
    const dailyAllowed =
      (apiKey.dailyUsage || 0) < apiKey.rateLimit.requestsPerDay;

    return {
      allowed: hourlyAllowed && dailyAllowed,
      remaining: Math.min(
        apiKey.rateLimit.requestsPerHour - (apiKey.hourlyUsage || 0),
        apiKey.rateLimit.requestsPerDay - (apiKey.dailyUsage || 0),
      ),
    };
  },

  // Webhook trigger utility
  triggerWebhook: async (
    userId: string,
    event: string,
    payload: any,
  ): Promise<void> => {
    try {
      const userHooks = dataStore.userWebhooks.get(userId) || [];

      for (const hookId of userHooks) {
        const webhook = dataStore.webhooks.get(hookId);
        if (!webhook || !webhook.isActive || !webhook.events.includes(event)) {
          continue;
        }

        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const webhookEvent = {
          id: eventId,
          webhookId: hookId,
          event,
          payload,
          timestamp: new Date().toISOString(),
          status: "pending",
          retryCount: 0,
        };

        dataStore.webhookEvents.set(eventId, webhookEvent);

        // Trigger webhook call asynchronously
        triggerWebhookCall(webhook, webhookEvent).catch(console.error);
      }
    } catch (error) {
      console.error("Webhook trigger error:", error);
    }
  },

  // Pay-per-fix billing utilities
  trackFix: (
    projectId: string,
    userId: string,
    layerId: number,
    fixType: string,
    successful: boolean,
  ): void => {
    if (!successful) return; // Only count successful fixes

    const now = new Date();
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    // Get or create project usage
    let usage = dataStore.projectUsage.get(projectId);
    if (!usage) {
      usage = {
        projectId,
        userId,
        currentMonth: month,
        monthlyFixCount: 0,
        totalFixCount: 0,
        lastFixDate: now.toISOString(),
      };
      dataStore.projectUsage.set(projectId, usage);
    }

    // Reset monthly count if new month
    if (usage.currentMonth !== month) {
      usage.currentMonth = month;
      usage.monthlyFixCount = 0;
    }

    // Increment counters
    usage.monthlyFixCount++;
    usage.totalFixCount++;
    usage.lastFixDate = now.toISOString();

    // Record fix in history
    const fixId = `fix_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    dataStore.fixHistory.set(fixId, {
      id: fixId,
      projectId,
      userId,
      layerId,
      fixType,
      timestamp: now.toISOString(),
      successful: true,
      month,
    });

    console.log(
      `[BILLING] Tracked fix for project ${projectId}: ${usage.monthlyFixCount} fixes this month`,
    );
  },

  getProjectUsage: (projectId: string) => {
    return dataStore.projectUsage.get(projectId);
  },

  calculateOverage: (
    projectId: string,
  ): {
    overageFixes: number;
    overageCost: number;
    plan: string;
    billingPeriod: string;
  } => {
    const usage = dataStore.projectUsage.get(projectId);
    const subscription = dataStore.projectSubscriptions.get(projectId);

    if (!usage || !subscription) {
      return {
        overageFixes: 0,
        overageCost: 0,
        plan: "none",
        billingPeriod: "monthly",
      };
    }

    const planLimits = {
      free: 500,
      starter: 2000,
      professional: 10000,
      business: 25000,
      enterprise: 50000,
      premium: 999999, // Unlimited
    };

    const monthlyLimit =
      planLimits[subscription.plan as keyof typeof planLimits] || 0;
    const overageFixes = Math.max(0, usage.monthlyFixCount - monthlyLimit);
    const overageRates = {
      free: 0.002,
      starter: 0.002,
      professional: 0.002,
      business: 0.002,
      enterprise: 0.002,
      premium: 0, // No overage for premium
    };
    const overageRate =
      overageRates[subscription.plan as keyof typeof overageRates] || 0.002;
    const overageCost = overageFixes * overageRate;

    return {
      overageFixes,
      overageCost,
      plan: subscription.plan,
      billingPeriod: subscription.billingPeriod || "monthly",
    };
  },

  checkLayerAccess: (projectId: string, layerId: number): boolean => {
    const subscription = dataStore.projectSubscriptions.get(projectId);
    if (!subscription) return false;

    const layerAccess = {
      free: [1],
      starter: [1, 2],
      professional: [1, 2, 3, 4],
      business: [1, 2, 3, 4, 5],
      enterprise: [1, 2, 3, 4, 5, 6],
      premium: [1, 2, 3, 4, 5, 6],
    };

    const allowedLayers =
      layerAccess[subscription.plan as keyof typeof layerAccess] || [];
    return allowedLayers.includes(layerId);
  },

  createProjectSubscription: (
    projectId: string,
    userId: string,
    plan: string,
    billingPeriod: "monthly" | "yearly" = "monthly",
  ): void => {
    const billingDays = billingPeriod === "yearly" ? 365 : 30;
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      projectId,
      userId,
      plan,
      billingPeriod,
      createdAt: new Date().toISOString(),
      status: "active",
      nextBillingDate: new Date(
        Date.now() + billingDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };

    dataStore.projectSubscriptions.set(projectId, subscription);
    console.log(
      `[BILLING] Created ${plan} ${billingPeriod} subscription for project ${projectId}`,
    );
  },

      // Import tier utilities from auth-middleware to avoid duplication
  checkTierLimits: (tier: string) => {
    // Import checkTierAccess from auth-middleware for consistency
    const { checkTierAccess } = require('./auth-middleware');

    const tierConfig = {
      free: {
        scanningUnlimited: true,
        canApplyFixes: false,
        maxFileSize: 500000, // 500KB
        featuresIncluded: ["basic_analysis", "basic_reports", "preview_mode"],
      },
      premium: {
        scanningUnlimited: true,
        canApplyFixes: true,
        maxFileSize: 2000000, // 2MB
        featuresIncluded: [
          "basic_analysis", "basic_reports", "preview_mode",
          "detailed_reports", "apply_fixes", "pdf_export", "migration_plans"
        ],
      },
      enterprise: {
        scanningUnlimited: true,
        canApplyFixes: true,
        maxFileSize: 5000000, // 5MB
        featuresIncluded: [
          "basic_analysis", "basic_reports", "preview_mode",
          "detailed_reports", "apply_fixes", "pdf_export", "migration_plans",
          "batch_fixes", "priority_support", "custom_rules"
        ],
      },
    };

    return tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
  },

  hasFeatureAccess: (tier: string, feature: string): boolean => {
    const limits = dataUtils.checkTierLimits(tier);
    return limits.featuresIncluded.includes(feature);
  },

  // Session utilities for dashboard
  validateSession: (sessionId?: string) => {
    if (!sessionId) {
      // Create a new free session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      dataStore.dashboardSessions.set(newSessionId, {
        created: Date.now(),
        lastUsed: Date.now(),
        analysisCount: 0,
        plan: "free",
      });
      return {
        sessionId: newSessionId,
        session: dataStore.dashboardSessions.get(newSessionId)!,
      };
    }

    const session = dataStore.dashboardSessions.get(sessionId);
    if (!session) {
      // Session expired or invalid, create new one
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      dataStore.dashboardSessions.set(newSessionId, {
        created: Date.now(),
        lastUsed: Date.now(),
        analysisCount: 0,
        plan: "free",
      });
      return {
        sessionId: newSessionId,
        session: dataStore.dashboardSessions.get(newSessionId)!,
      };
    }

    // Update last used
    session.lastUsed = Date.now();
    return { sessionId, session };
  },
};

// Helper function for webhook calls (internal)
const triggerWebhookCall = async (webhook: any, event: any): Promise<void> => {
  try {
    const payload = JSON.stringify({
      event: event.event,
      timestamp: event.timestamp,
      data: event.payload,
    });

    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(payload)
      .digest("hex");

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NeuroLint-Signature": `sha256=${signature}`,
        "X-NeuroLint-Event": event.event,
        "X-NeuroLint-Delivery": event.id,
        ...webhook.headers,
      },
      body: payload,
    });

    const updatedEvent = {
      ...event,
      status: response.ok ? "success" : "failed",
      response: await response.text(),
    };

    dataStore.webhookEvents.set(event.id, updatedEvent);

    // Update webhook stats
    const updatedWebhook = {
      ...webhook,
      lastTriggered: new Date().toISOString(),
      totalCalls: (webhook.totalCalls || 0) + 1,
      failureCount: response.ok
        ? webhook.failureCount || 0
        : (webhook.failureCount || 0) + 1,
    };

    dataStore.webhooks.set(webhook.id, updatedWebhook);
  } catch (error) {
    console.error("Webhook call error:", error);

    const updatedEvent = {
      ...event,
      status: "failed" as const,
      response: error instanceof Error ? error.message : "Unknown error",
    };

    dataStore.webhookEvents.set(event.id, updatedEvent);

    // Update failure count
    const updatedWebhook = {
      ...webhook,
      failureCount: (webhook.failureCount || 0) + 1,
    };

    dataStore.webhooks.set(webhook.id, updatedWebhook);
  }
};

// Export individual stores for backward compatibility
export const {
  apiKeys,
  userApiKeys,
  projects,
  projectFiles,
  projectAnalyses,
  teams,
  teamMembers,
  teamProjects,
  invitations,
  webhooks,
  userWebhooks,
  webhookEvents,
  integrations,
  userIntegrations,
  integrationRuns,
  dashboardSessions,
  requestCounts,
} = dataStore;
