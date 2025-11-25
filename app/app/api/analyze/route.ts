import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dataStore, dataUtils } from "../../../lib/data-store";
import { authenticateRequest, checkTierAccess, FREE_TIER_LIMITS } from "../../../lib/auth-middleware";
import { apiKeyService } from "../../../lib/api-key-utils";
import { ReportGenerator } from "../../../lib/report-generator";
import { checkMigrationAccess, validateMigrationRequest, getMigrationTierInfo } from "../../../lib/migration-tier-system";
import type { AnalysisResult } from "../../../lib/types";
const { runOriginalNeuroLint } = require("../../../lib/original-neurolint");

export const dynamic = "force-dynamic";



export async function POST(request: NextRequest) {
  const requestId = randomUUID().substring(0, 8);
  const startTime = Date.now();
  let authenticatedUser: any = null;

  try {
    // Early check for build-time environment
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json(
        { error: "Service not available during build" },
        { status: 503 },
      );
    }
    // Check for authentication - either API key or session token
    const apiKeyHeader = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");

    let rateLimitInfo = null;

    // Try API key authentication first
    if (apiKeyHeader) {
      // Use database-based API key validation instead of in-memory store
      const apiKey = await apiKeyService.validate(apiKeyHeader);
      if (!apiKey) {
        return NextResponse.json(
          { error: "Invalid or expired API key" },
          { status: 401 },
        );
      }

      // Check permissions
      if (
        !apiKey.permissions.includes("analyze") &&
        !apiKey.permissions.includes("*")
      ) {
        return NextResponse.json(
          { error: "Insufficient permissions for analysis" },
          { status: 403 },
        );
      }

      // For database-based API keys, we'll use a simplified rate limit check
      // since the database validation already updates last_used
      authenticatedUser = {
        id: apiKey.userId,
        keyId: apiKey.id,
        permissions: apiKey.permissions,
      };

      rateLimitInfo = {
        remaining: apiKey.rateLimit.requestsPerHour, // Simplified for now
        hourlyLimit: apiKey.rateLimit.requestsPerHour,
        dailyLimit: apiKey.rateLimit.requestsPerDay,
      };
    } else if (
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      !apiKeyHeader
    ) {
      // Try session authentication if no API key provided
      const authResult = await authenticateRequest(request);

      if (authResult.success && authResult.user) {
        authenticatedUser = {
          userId: authResult.user.id,
          authType: "session",
          email: authResult.user.email,
          plan: authResult.user.plan,
          permissions: ["analyze", "projects"], // Default permissions for authenticated users
        };

                // Set rate limits based on user tier (free tier gets unlimited scanning)
        const tierLimits = {
          free: FREE_TIER_LIMITS,
          premium: { requestsPerHour: 500, requestsPerDay: 2000 },
          enterprise: { requestsPerHour: 2000, requestsPerDay: 10000 },
        };

        const limits =
          tierLimits[authResult.user.tier as keyof typeof tierLimits] ||
          tierLimits.free;

        rateLimitInfo = {
          remaining: limits.requestsPerHour, // Simplified for demo
          hourlyLimit: limits.requestsPerHour,
          dailyLimit: limits.requestsPerDay,
          plan: authResult.user.plan,
        };
      }
    }

    const body = await request.json();
    const {
      code,
      filename,
      layers = "auto",
      applyFixes = false,
      projectId,
      metadata = {},
      migration = false, // DEPRECATED: Use proper tier system instead
    } = body;

    // Check if this is a migration service request (replaces migration flag)
    const isMigrationService = metadata.migrationService === true ||
                              request.headers.get("x-migration-service") === "true" ||
                              migration; // Backward compatibility

    console.log(`[ANALYZE API ${requestId}] Request:`, {
      filename,
      codeLength: code?.length,
      layers,
      applyFixes,
      projectId,
      migration,
      authenticated: !!authenticatedUser,
    });

    // Validate input
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required and must be a string" },
        { status: 400 },
      );
    }

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 },
      );
    }

        // File size limit based on tier
    let maxSize = 200000; // 200KB for anonymous
    if (authenticatedUser) {
      const tierLimits = {
        free: FREE_TIER_LIMITS.maxFileSize,
        premium: 2000000, // 2MB for premium
        enterprise: 5000000, // 5MB for enterprise
      };
      maxSize = tierLimits[authenticatedUser.tier as keyof typeof tierLimits] || FREE_TIER_LIMITS.maxFileSize;
    }
    if (code.length > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1000}KB` },
        { status: 413 },
      );
    }

    // Validate file extension
    if (!filename.match(/\.(ts|tsx|js|jsx)$/i)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload .ts, .tsx, .js, or .jsx files",
        },
        { status: 400 },
      );
    }

    // Check project access if projectId provided
    let project = null;
    if (projectId) {
      project = dataStore.projects.get(projectId);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

            if (authenticatedUser && project.userId !== authenticatedUser.id) {
        return NextResponse.json(
          { error: "Access denied to project" },
          { status: 403 },
        );
      }
    }

    console.log(`[ANALYZE API ${requestId}] Loading NeuroLint engine...`);

    // Use the original NeuroLint system
    console.log(`[ANALYZE API ${requestId}] Using original fix-master.js layer system`);

        // Parse layers parameter - allow all layers for scanning
    let layersToUse: number[] | null = null;
    let requestedLayers: number[] = [];
    let restrictedByTier = false;

    if (layers === "auto") {
      // Auto-detect layers - all users can scan with auto-detection
      layersToUse = null;
    } else if (layers === "all") {
      requestedLayers = [1, 2, 3, 4, 5, 6];
    } else if (Array.isArray(layers)) {
      requestedLayers = layers.filter(
        (l) => typeof l === "number" && l >= 1 && l <= 6,
      );
    }

        // Check migration service access using proper tier system
    let migrationAccess = { hasAccess: false, tier: 'free' };
    if (isMigrationService) {
      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Migration service requires authentication" },
          { status: 401 },
        );
      }

      // Use proper migration tier system
      migrationAccess = checkMigrationAccess(
        authenticatedUser.tier || authenticatedUser.plan,
        authenticatedUser.migration_quote_approved,
        authenticatedUser.migration_expires_at ? new Date(authenticatedUser.migration_expires_at) : undefined
      );

      if (!migrationAccess.hasAccess) {
        return NextResponse.json(
          {
            error: "Migration service access required",
            message: (migrationAccess as any).reason || "Migration service requires enterprise access or approved quote",
            contact: "migration@neurolint.dev",
            upgradeUrl: (migrationAccess as any).upgradeUrl || "https://app.neurolint.dev/migration-request",
            tier: migrationAccess.tier,
          },
          { status: 403 },
        );
      }

      // Validate migration request limits
      if ((migrationAccess as any).config) {
        const fileSizeBytes = Buffer.byteLength(code, 'utf8');
        const validation = validateMigrationRequest(
          (migrationAccess as any).config,
          1, // single file for this request
          fileSizeBytes
        );

        if (!validation.valid) {
          return NextResponse.json(
            {
              error: "Migration limits exceeded",
              message: validation.errors.join(', '),
              limits: getMigrationTierInfo(migrationAccess.tier, (migrationAccess as any).config)
            },
            { status: 413 }
          );
        }
      }
    }

    // Check tier access for fix application (not scanning) - bypass for migration service
    if (authenticatedUser && applyFixes && !isMigrationService) {
      const effectiveTier = (authenticatedUser.tier || authenticatedUser.plan || 'free');
      const tierAccess = checkTierAccess(effectiveTier, ["apply_fixes"]);
      if (!tierAccess.hasAccess) {
        return NextResponse.json(
          {
            error: "Fix application requires premium tier. Upgrade to apply fixes automatically.",
            tier: effectiveTier,
            missingFeatures: tierAccess.missingFeatures,
            upgradeRequired: true,
            scanningAllowed: true, // Scanning is always allowed
          },
          { status: 403 },
        );
      }
    }

    // For free tier, allow all layers for scanning but show preview only
    if (requestedLayers.length > 0) {
      const effectiveTier = (authenticatedUser?.tier || authenticatedUser?.plan || 'free');
      if (authenticatedUser && !isMigrationService && effectiveTier === "free" && applyFixes) {
        // Free tier can scan all layers but cannot apply fixes (unless migration service)
        restrictedByTier = true;
      }
      layersToUse = requestedLayers; // Allow all requested layers for scanning
    }

    console.log(`[ANALYZE API ${requestId}] Running analysis...`);

        // Run the original NeuroLint analysis
    const effectiveTier = (authenticatedUser?.tier || authenticatedUser?.plan || 'free');
    const shouldApplyFixes = applyFixes && (isMigrationService || !authenticatedUser || effectiveTier !== "free");
    const result = await runOriginalNeuroLint(
      code,
      filename,
      !shouldApplyFixes, // dryRun = true when fixes shouldn't be applied
      layersToUse,
      {
        verbose: isMigrationService || metadata.verbose,
        requestId,
        projectId,
        userId: authenticatedUser?.id,
        userTier: isMigrationService ? migrationAccess.tier : effectiveTier || 'anonymous',
        migrationService: isMigrationService,
        ...metadata,
      },
    );

    if (!result) {
      return NextResponse.json(
        { error: "Analysis engine not available during build time" },
        { status: 503 },
      );
    }

    const processingTime = Date.now() - startTime;

    console.log(`[ANALYZE API ${requestId}] Analysis complete:`, {
      processingTime,
      issuesFound: result?.analysis?.detectedIssues?.length || 0,
      migrationService: isMigrationService,
      migrationTier: isMigrationService ? migrationAccess.tier : undefined,
    });

    // Track successful fixes for billing
    if (projectId && result && applyFixes && authenticatedUser) {
      const fixCount =
        result.layers?.reduce((total: number, layer: any) => {
          return total + (layer.changeCount || 0);
        }, 0) || 0;

      // Track each layer's fixes
      if (result.layers) {
        result.layers.forEach((layer: any) => {
          if (layer.success && layer.changeCount > 0) {
            for (let i = 0; i < layer.changeCount; i++) {
                            dataUtils.trackFix(
                projectId,
                authenticatedUser.id,
                layer.layerId,
                "code_transformation",
                true,
              );
            }
          }
        });
      }

      console.log(
        `[BILLING] Tracked ${fixCount} fixes for project ${projectId}`,
      );
    }

    // Save analysis to project if specified
    if (projectId && result) {
      const analyses = dataStore.projectAnalyses.get(projectId) || [];
      const analysisRecord = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        filename,
        timestamp: new Date().toISOString(),
        result,
        layers: layersToUse || result.analysis?.recommendedLayers || [],
        executionTime: processingTime,
                userId: authenticatedUser?.id || "anonymous",
        metadata,
      };

      analyses.push(analysisRecord);
      dataStore.projectAnalyses.set(projectId, analyses.slice(-100)); // Keep last 100 analyses

      // Update project stats
      if (project) {
        const totalIssues = analyses.reduce(
          (sum: number, analysis: any) =>
            sum + (analysis.result.analysis?.detectedIssues?.length || 0),
          0,
        );
        const avgConfidence =
          analyses.reduce(
            (sum: number, analysis: any) =>
              sum + (analysis.result.analysis?.confidence || 0),
            0,
          ) / analyses.length;

        project.stats.totalIssues = totalIssues;
        project.stats.lastAnalyzed = new Date().toISOString();
        project.stats.qualityScore = Math.round(avgConfidence * 100);
        project.updatedAt = new Date().toISOString();
        dataStore.projects.set(projectId, project);
      }
    }

    // Trigger webhooks for authenticated users
    if (authenticatedUser) {
      try {
                await dataUtils.triggerWebhook(
          authenticatedUser.id,
          "analysis.completed",
          {
            filename,
            projectId,
            issuesFound: result.analysis?.detectedIssues?.length || 0,
            qualityScore: Math.round((result.analysis?.confidence || 0) * 100),
            processingTime,
          },
        );
      } catch (webhookError) {
        console.error("Webhook trigger failed:", webhookError);
        // Don't fail the analysis if webhook fails
      }
    }

            // Generate tier-appropriate report
    let generatedReport = null;
    if (authenticatedUser && result) {
      try {
        const effectiveTier = isMigrationService ? migrationAccess.tier : (authenticatedUser.tier || authenticatedUser.plan);
        generatedReport = ReportGenerator.generateReport({
          userTier: effectiveTier,
          analysisResult: result,
          filename,
          projectName: projectId ? `Project: ${projectId}` : undefined,
        });
      } catch (reportError) {
        console.error('Report generation failed:', reportError);
        // Continue without report if generation fails
      }
    }

    // Build response with tier and access information
    const response: any = {
      ...result,
      report: generatedReport,
      metadata: {
        requestId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        version: "api-1.0.0",
        authenticated: !!authenticatedUser,
        projectId: projectId || null,
        userTier: isMigrationService ? migrationAccess.tier : (authenticatedUser?.tier || authenticatedUser?.plan || "anonymous"),
        previewMode: !isMigrationService && (authenticatedUser?.tier || authenticatedUser?.plan) === "free" && applyFixes,
        fixesApplied: shouldApplyFixes,
        reportGenerated: !!generatedReport,
        migrationService: isMigrationService,
        migrationTier: isMigrationService ? migrationAccess.tier : undefined,
        // REMOVED: migration bypass flags
      },
      tierInfo: {
        current: isMigrationService ? migrationAccess.tier : (authenticatedUser?.tier || authenticatedUser?.plan || "anonymous"),
        canApplyFixes: isMigrationService || !authenticatedUser || (authenticatedUser.tier || authenticatedUser.plan) !== "free" || !applyFixes,
        scanningUnlimited: true,
        reportLevel: generatedReport?.level || "none",
        migrationTierInfo: isMigrationService && (migrationAccess as any).config ? getMigrationTierInfo(migrationAccess.tier, (migrationAccess as any).config) : undefined,
        upgradeMessage: !isMigrationService && (authenticatedUser?.tier || authenticatedUser?.plan) === "free" && applyFixes
          ? "Upgrade to premium to apply fixes automatically. Scanning remains unlimited."
          : null,
        availableFeatures: authenticatedUser ? dataUtils.checkTierLimits(authenticatedUser.tier || authenticatedUser.plan).featuresIncluded : [],
        migrationMode: migration,
      },
    };

    // Add billing information for authenticated users with projects
    if (projectId && authenticatedUser) {
      const usage = dataUtils.getProjectUsage(projectId);
      const overage = dataUtils.calculateOverage(projectId);

      if (usage) {
        response.billing = {
          currentMonth: usage.currentMonth,
          monthlyFixCount: usage.monthlyFixCount,
          totalFixCount: usage.totalFixCount,
          overageFixes: overage.overageFixes,
          overageCost: overage.overageCost,
          plan: overage.plan,
          lastFixDate: usage.lastFixDate,
        };
      }
    }

    // Add rate limit info for authenticated users
    if (rateLimitInfo) {
      (response as any).rateLimitInfo = rateLimitInfo;
    }

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[ANALYZE API ${requestId}] Error:`, error);

    // Trigger error webhook for authenticated users
    if (authenticatedUser) {
      try {
                await dataUtils.triggerWebhook(
          authenticatedUser.id,
          "analysis.failed",
          {
            filename: "unknown",
            error: error instanceof Error ? error.message : "Unknown error",
            processingTime,
          },
        );
      } catch (webhookError) {
        console.error("Error webhook trigger failed:", webhookError);
      }
    }

    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          requestId,
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Check for build-time environment
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)
  ) {
    return NextResponse.json({
      status: "building",
      service: "NeuroLint Analysis API",
      message: "Service not available during build",
    });
  }

  // API health check and documentation link
  return NextResponse.json({
    status: "healthy",
    service: "NeuroLint Analysis API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api/docs",
    endpoints: {
      analyze: {
        method: "POST",
        path: "/api/analyze",
        description: "Analyze React/Next.js code",
        authentication: "Optional (X-API-Key header)",
      },
      projects: {
        method: "GET/POST/PUT/DELETE",
        path: "/api/projects",
        description: "Manage projects",
        authentication: "Required",
      },
      webhooks: {
        method: "GET/POST/PUT/DELETE",
        path: "/api/webhooks",
        description: "Manage webhooks",
        authentication: "Required",
      },
      teams: {
        method: "GET/POST/PUT/DELETE",
        path: "/api/teams",
        description: "Team collaboration",
        authentication: "Required",
      },
    },
    features: [
      "Real-time code analysis",
      "Project management",
      "Team collaboration",
      "Webhook notifications",
      "CI/CD integrations",
      "API key management",
      "Rate limiting",
      "Comprehensive documentation",
    ],
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
