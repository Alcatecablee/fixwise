import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authenticateRequest, checkTierAccess } from "../../../../lib/auth-middleware";
import { dataStore, dataUtils } from "../../../../lib/data-store";

export const dynamic = "force-dynamic";

// Import the neurolint engine
const getNeuroLintEngine = async () => {
  if (
    typeof window === "undefined" &&
    (process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NODE_ENV === "test")
  ) {
    console.log("Skipping engine import during build/test time");
    return null;
  }

  try {
    const engine = require("../../../../neurolint-pro.js");
    return engine;
  } catch (error) {
    console.error("Failed to load NeuroLint engine:", error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  const requestId = randomUUID().substring(0, 8);
  const startTime = Date.now();

  try {
    // Check for build-time environment
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json(
        { error: "Service not available during build" },
        { status: 503 },
      );
    }

    // Authenticate user (required for modernization analysis)
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required for modernization analysis" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      code,
      filename,
      projectName,
      frameworks = {},
      analysisType = "comprehensive", // "quick", "comprehensive", "migration"
      targetFramework = null, // For migration analysis
    } = body;

    console.log(`[MODERNIZATION API ${requestId}] Request:`, {
      filename,
      projectName,
      analysisType,
      targetFramework,
      userTier: authResult.user.tier,
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

    // Check tier-specific file size limits
    const tierLimits = dataUtils.checkTierLimits(authResult.user.tier);
    if (code.length > tierLimits.maxFileSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size for ${authResult.user.tier} tier is ${tierLimits.maxFileSize / 1000}KB`,
          tierLimits 
        },
        { status: 413 },
      );
    }

    // Validate file extension
    if (!filename.match(/\.(ts|tsx|js|jsx|json)$/i)) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload .ts, .tsx, .js, .jsx, or .json files",
        },
        { status: 400 },
      );
    }

    // Get the analysis engine
    const engine = await getNeuroLintEngine();
    if (!engine) {
      return NextResponse.json(
        { error: "Analysis engine not available during build time" },
        { status: 503 },
      );
    }

    // Configure analysis based on type and tier
    let layersToUse: number[] = [1, 2, 3, 4, 5, 6]; // All layers for modernization
    let analysisOptions = {
      isApi: true,
      singleFile: true,
      verbose: false,
      requestId,
      userId: authResult.user.id,
      modernizationFocus: true,
      analysisType,
      targetFramework,
      frameworks,
      projectName,
    };

    // Run the analysis (always in preview mode for free tier)
    const isPreviewMode = authResult.user.tier === "free";
    const result = await engine(
      code,
      filename,
      true, // Always dry run for modernization analysis
      layersToUse,
      analysisOptions,
    );

    const processingTime = Date.now() - startTime;

    // Create modernization assessment record
    const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const modernizationAssessment = {
      id: assessmentId,
      userId: authResult.user.id,
      projectName: projectName || filename,
      filename,
      frameworkVersions: frameworks,
      legacyPatterns: result?.analysis?.legacyPatterns || [],
      readinessScore: calculateReadinessScore(result),
      analysisType,
      targetFramework,
      result,
      createdAt: new Date().toISOString(),
      processingTime,
    };

    // Store in memory (in production, save to database)
    const userAssessments = dataStore.modernizationAssessments?.get(authResult.user.id) || [];
    userAssessments.push(modernizationAssessment);
    if (!dataStore.modernizationAssessments) {
      dataStore.modernizationAssessments = new Map();
    }
    dataStore.modernizationAssessments.set(authResult.user.id, userAssessments.slice(-10)); // Keep last 10

    // Generate tier-appropriate report
    const report = generateModernizationReport(result, authResult.user.tier, isPreviewMode);

    console.log(`[MODERNIZATION API ${requestId}] Analysis complete:`, {
      processingTime,
      readinessScore: modernizationAssessment.readinessScore,
      legacyPatternCount: modernizationAssessment.legacyPatterns.length,
    });

    // Build response
    const response = {
      assessmentId,
      analysis: {
        ...result?.analysis,
        modernizationFocus: true,
        readinessScore: modernizationAssessment.readinessScore,
        legacyPatterns: modernizationAssessment.legacyPatterns,
        frameworks: frameworks,
      },
      report,
      metadata: {
        requestId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        version: "modernization-1.0.0",
        userTier: authResult.user.tier,
        previewMode: isPreviewMode,
        analysisType,
      },
      tierInfo: {
        current: authResult.user.tier,
        scanningUnlimited: true,
        reportLevel: authResult.user.tier === "free" ? "basic" : "detailed",
        upgradeMessage: isPreviewMode
          ? "Upgrade to premium for detailed reports, migration plans, and fix application"
          : null,
        availableFeatures: tierLimits.featuresIncluded,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[MODERNIZATION API ${requestId}] Error:`, error);

    return NextResponse.json(
      {
        error: "Modernization analysis failed",
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
  // Get user's modernization assessment history
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userAssessments = dataStore.modernizationAssessments?.get(authResult.user.id) || [];
  
  return NextResponse.json({
    assessments: userAssessments.map((assessment: any) => ({
      id: assessment.id,
      projectName: assessment.projectName,
      filename: assessment.filename,
      readinessScore: assessment.readinessScore,
      analysisType: assessment.analysisType,
      createdAt: assessment.createdAt,
      processingTime: assessment.processingTime,
    })),
    totalAssessments: userAssessments.length,
    userTier: authResult.user.tier,
    tierLimits: dataUtils.checkTierLimits(authResult.user.tier),
  });
}

// Helper function to calculate modernization readiness score
function calculateReadinessScore(result: any): number {
  if (!result?.analysis) return 0;

  const factors = {
    lowIssueCount: Math.max(0, 100 - (result.analysis.detectedIssues?.length || 0) * 2),
    highConfidence: (result.analysis.confidence || 0) * 100,
    modernPatterns: (result.analysis.modernPatterns?.length || 0) * 5,
    legacyPatterns: Math.max(0, 100 - (result.analysis.legacyPatterns?.length || 0) * 10),
  };

  const weights = { lowIssueCount: 0.3, highConfidence: 0.3, modernPatterns: 0.2, legacyPatterns: 0.2 };
  
  const score = Object.entries(factors).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights]);
  }, 0);

  return Math.round(Math.max(0, Math.min(100, score)));
}

// Helper function to generate tier-appropriate reports
function generateModernizationReport(result: any, tier: string, isPreviewMode: boolean) {
  const baseReport = {
    summary: {
      issueCount: result?.analysis?.detectedIssues?.length || 0,
      confidence: Math.round((result?.analysis?.confidence || 0) * 100),
      recommendedLayers: result?.analysis?.recommendedLayers || [],
    },
  };

  if (tier === "free") {
    return {
      ...baseReport,
      level: "basic",
      upgradePrompt: "Upgrade to premium for detailed analysis, migration plans, and code fixes",
      availableInPremium: [
        "Detailed issue analysis with solutions",
        "Step-by-step migration plans", 
        "Automated fix application",
        "PDF report export",
        "Framework upgrade recommendations"
      ],
    };
  }

  // Premium/Enterprise detailed report
  return {
    ...baseReport,
    level: "detailed",
    detailedAnalysis: result?.analysis || {},
    migrationSteps: generateMigrationSteps(result),
    recommendations: generateRecommendations(result),
    codeExamples: result?.examples || [],
  };
}

function generateMigrationSteps(result: any): any[] {
  // Generate step-by-step migration guidance based on analysis
  const steps = [];
  
  if (result?.analysis?.legacyPatterns?.length > 0) {
    steps.push({
      step: 1,
      title: "Modernize Legacy Patterns",
      description: "Update outdated React patterns to modern equivalents",
      patterns: result.analysis.legacyPatterns,
    });
  }

  if (result?.analysis?.recommendedLayers?.includes(1)) {
    steps.push({
      step: steps.length + 1,
      title: "Update Configuration",
      description: "Modernize TypeScript and build configuration",
    });
  }

  return steps;
}

function generateRecommendations(result: any): any[] {
  const recommendations = [];
  
  if (result?.analysis?.detectedIssues) {
    recommendations.push({
      category: "Code Quality",
      priority: "high",
      description: `Fix ${result.analysis.detectedIssues.length} detected issues`,
      impact: "Improves maintainability and reduces technical debt",
    });
  }

  return recommendations;
}
