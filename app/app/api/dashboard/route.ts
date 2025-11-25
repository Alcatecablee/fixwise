import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logMessage } from "../../../lib/log-message";
import { dataStore, dataUtils } from "../../../lib/data-store";

const RATE_LIMITS = {
  free: { maxAnalyses: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  professional: { maxAnalyses: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  enterprise: { maxAnalyses: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
};

function checkRateLimit(session: any): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const limits =
    RATE_LIMITS[session.plan as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = Date.now();
  const windowStart = now - limits.windowMs;

  // Reset count if window has passed
  if (session.lastUsed < windowStart) {
    session.analysisCount = 0;
  }

  const remaining = Math.max(0, limits.maxAnalyses - session.analysisCount);
  const allowed = session.analysisCount < limits.maxAnalyses;
  const resetTime = session.lastUsed + limits.windowMs;

  return { allowed, remaining, resetTime };
}

export async function POST(req: Request) {
  const requestId = randomUUID().substring(0, 8);
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      code,
      filename,
      layers = "auto",
      applyFixes = false,
      sessionId,
    } = body;

    logMessage('info', `Dashboard API request`, {
      requestId,
      filename,
      codeLength: code?.length,
      layers,
      applyFixes,
      hasSession: !!sessionId,
    });

    // Validate session and get/create session
    const { sessionId: validSessionId, session } =
      dataUtils.validateSession(sessionId);

    // Check rate limits
    const rateLimit = checkRateLimit(session);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          rateLimitInfo: {
            plan: session.plan,
            remaining: rateLimit.remaining,
            resetTime: rateLimit.resetTime,
          },
          sessionId: validSessionId,
        },
        { status: 429 },
      );
    }

    // Validate input
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          error: "Code is required and must be a string",
          sessionId: validSessionId,
        },
        { status: 400 },
      );
    }

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        {
          error: "Filename is required",
          sessionId: validSessionId,
        },
        { status: 400 },
      );
    }

    // File size limit (200KB for dashboard)
    if (code.length > 200000) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 200KB for dashboard analysis",
          sessionId: validSessionId,
        },
        { status: 413 },
      );
    }

    // Validate file extension
    if (!filename.match(/\.(ts|tsx|js|jsx)$/i)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload .ts, .tsx, .js, or .jsx files",
          sessionId: validSessionId,
        },
        { status: 400 },
      );
    }

    logMessage('info', `Dashboard API importing NeuroLint engine`, { requestId });

    // Import the real NeuroLint engine
    let NeuroLintPro;
    try {
      NeuroLintPro = await import("../../../neurolint-pro.js");
    } catch (importError) {
      logMessage('error', `Dashboard API engine import failed`, {
        requestId,
        error: importError instanceof Error ? importError.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          error: "Analysis engine unavailable",
          sessionId: validSessionId,
        },
        { status: 500 },
      );
    }

    const engine = NeuroLintPro.default || NeuroLintPro;
    if (!engine || typeof engine !== "function") {
      return NextResponse.json(
        {
          error: "Analysis engine misconfigured",
          sessionId: validSessionId,
        },
        { status: 500 },
      );
    }

    // Parse layers parameter
    let layersToUse: null = null;
    if (layers === "auto") {
      layersToUse = null; // Let engine auto-detect
    } else if (layers === "all") {
      // For now, let the engine handle "all" as null
      layersToUse = null;
    } else if (Array.isArray(layers)) {
      // For now, let the engine handle arrays as null
      layersToUse = null;
    }

    logMessage('info', `Dashboard API running analysis`, { requestId });

    // Run the analysis
    const result = await engine(
      code,
      filename,
      !applyFixes, // dryRun = true when applyFixes = false
      layersToUse,
      {
        isDashboard: true,
        singleFile: true,
        verbose: false,
        requestId,
      },
    );

    // Increment analysis count
    session.analysisCount++;

    const processingTime = Date.now() - startTime;
    const newRateLimit = checkRateLimit(session);

    logMessage('info', `Dashboard API analysis complete`, {
      requestId,
      processingTime,
      remaining: newRateLimit.remaining,
    });

    // Return enhanced result with session info
    const enhancedResult = {
      ...result,
      sessionInfo: {
        sessionId: validSessionId,
        plan: session.plan,
        analysisCount: session.analysisCount,
        rateLimitInfo: {
          remaining: newRateLimit.remaining,
          resetTime: newRateLimit.resetTime,
          plan: session.plan,
        },
      },
      metadata: {
        requestId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        version: "dashboard-1.0.0",
      },
    };

    return NextResponse.json(enhancedResult);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[DASHBOARD API ${requestId}] Error:`, error);

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

// Health check and session info endpoint
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    // Return session info
    const session = dataStore.dashboardSessions.get(sessionId);
    if (session) {
      const rateLimit = checkRateLimit(session);
      return NextResponse.json({
        sessionId,
        plan: session.plan,
        analysisCount: session.analysisCount,
        rateLimitInfo: {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
          plan: session.plan,
        },
        created: new Date(session.created).toISOString(),
        lastUsed: new Date(session.lastUsed).toISOString(),
      });
    }
  }

  // General health check
  return NextResponse.json({
    status: "healthy",
    service: "NeuroLint Dashboard API",
    timestamp: new Date().toISOString(),
    activeSessions: dataStore.dashboardSessions.size,
    plans: Object.keys(RATE_LIMITS),
  });
}

// Clean up old sessions every hour
setInterval(
  () => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    for (const [sessionId, session] of dataStore.dashboardSessions.entries()) {
      if (now - session.lastUsed > TWENTY_FOUR_HOURS) {
        dataStore.dashboardSessions.delete(sessionId);
      }
    }
  },
  60 * 60 * 1000,
);
