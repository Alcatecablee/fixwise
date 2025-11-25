import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Import from parent route
const integrations = new Map();
const integrationRuns = new Map();

// Import the neurolint engine
const getNeuroLintEngine = async () => {
  try {
    const engine = await import("../../../../../../neurolint-pro.js");
    return engine.default || engine;
  } catch (error) {
    console.error("Failed to load NeuroLint engine:", error);
    throw new Error("NeuroLint engine not available");
  }
};

interface WebhookPayload {
  event: string;
  repository: {
    name: string;
    url: string;
    branch: string;
  };
  commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
    url: string;
  };
  files?: Array<{
    filename: string;
    content: string;
    status: "added" | "modified" | "removed";
  }>;
  pullRequest?: {
    number: number;
    title: string;
    url: string;
    base: string;
    head: string;
  };
}

interface IntegrationRun {
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

const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const actualSignature = signature.replace(/^sha256=/, "");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature),
    );
  } catch {
    return false;
  }
};

const addLog = (runId: string, message: string): void => {
  const run = integrationRuns.get(runId);
  if (run) {
    run.logs.push(`${new Date().toISOString()}: ${message}`);
    integrationRuns.set(runId, run);
  }
};

const updateRunStatus = (
  runId: string,
  status: IntegrationRun["status"],
  updates: Partial<IntegrationRun> = {},
): void => {
  const run = integrationRuns.get(runId);
  if (run) {
    const updatedRun = {
      ...run,
      status,
      ...updates,
    };

    if (status === "success" || status === "failed") {
      updatedRun.completedAt = new Date().toISOString();
      updatedRun.duration =
        new Date(updatedRun.completedAt).getTime() -
        new Date(updatedRun.startedAt).getTime();
    }

    integrationRuns.set(runId, updatedRun);
  }
};

const analyzeFiles = async (
  files: Array<{ filename: string; content: string }>,
  layers: any,
  runId: string,
): Promise<any[]> => {
  const results = [];
  const engine = await getNeuroLintEngine();

  addLog(runId, `Starting analysis of ${files.length} files`);

  for (const file of files) {
    if (!file.filename.match(/\.(ts|tsx|js|jsx)$/)) {
      addLog(runId, `Skipping non-React file: ${file.filename}`);
      continue;
    }

    try {
      addLog(runId, `Analyzing ${file.filename}...`);

      const result = await engine(
        file.content,
        file.filename,
        false, // Always dry run for CI/CD
        null, // layers
        { singleFile: true },
      );

      results.push({
        filename: file.filename,
        ...result,
      });

      const issueCount = result.analysis?.detectedIssues?.length || 0;
      addLog(runId, `${file.filename}: ${issueCount} issues found`);
    } catch (error) {
      addLog(
        runId,
        `Error analyzing ${file.filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.push({
        filename: file.filename,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
};

const sendNotifications = async (
  integration: any,
  run: IntegrationRun,
): Promise<void> => {
  const { notifications } = integration.settings;

  if (notifications.slack) {
    try {
      await fetch(notifications.slack, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `NeuroLint Analysis Complete`,
          attachments: [
            {
              color: run.status === "success" ? "good" : "danger",
              fields: [
                {
                  title: "Repository",
                  value: integration.repository,
                  short: true,
                },
                { title: "Branch", value: run.branch, short: true },
                {
                  title: "Commit",
                  value: run.commit.substring(0, 8),
                  short: true,
                },
                {
                  title: "Files Analyzed",
                  value: run.filesAnalyzed.toString(),
                  short: true,
                },
                {
                  title: "Issues Found",
                  value: run.issuesFound.toString(),
                  short: true,
                },
                {
                  title: "Quality Score",
                  value: `${run.qualityScore}%`,
                  short: true,
                },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Slack notification failed:", error);
    }
  }

  if (notifications.teams) {
    try {
      await fetch(notifications.teams, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          themeColor: run.status === "success" ? "00FF00" : "FF0000",
          summary: "NeuroLint Analysis Complete",
          sections: [
            {
              activityTitle: "NeuroLint Analysis Complete",
              activitySubtitle: `${integration.repository} - ${run.branch}`,
              facts: [
                { name: "Commit", value: run.commit.substring(0, 8) },
                { name: "Files Analyzed", value: run.filesAnalyzed.toString() },
                { name: "Issues Found", value: run.issuesFound.toString() },
                { name: "Quality Score", value: `${run.qualityScore}%` },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Teams notification failed:", error);
    }
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } },
) {
  try {
    const { integrationId } = params;
    const body = await request.text();

    // Get integration
    const integration = integrations.get(integrationId);
    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: "Integration not found or inactive" },
        { status: 404 },
      );
    }

    // Verify webhook signature
    const signature =
      request.headers.get("x-hub-signature-256") ||
      request.headers.get("x-gitlab-token") ||
      request.headers.get("x-jenkins-secret") ||
      request.headers.get("x-azure-secret") ||
      request.headers.get("x-webhook-secret");

    if (
      signature &&
      !verifyWebhookSignature(body, signature, integration.webhook.secret)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Check if we should process this event
    if (!integration.webhook.events.includes(payload.event)) {
      return NextResponse.json(
        { message: "Event not configured" },
        { status: 200 },
      );
    }

    // Skip if not the configured branch
    if (payload.repository.branch !== integration.branch) {
      return NextResponse.json(
        { message: "Branch not configured" },
        { status: 200 },
      );
    }

    // Create integration run
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const run: IntegrationRun = {
      id: runId,
      integrationId,
      commit: payload.commit.id,
      branch: payload.repository.branch,
      author: payload.commit.author.name,
      status: "pending",
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: null,
      filesAnalyzed: 0,
      issuesFound: 0,
      qualityScore: 0,
      results: [],
      logs: [],
      pullRequestUrl: payload.pullRequest?.url,
    };

    integrationRuns.set(runId, run);
    addLog(runId, `Webhook received for commit ${payload.commit.id}`);

    // Update integration stats
    integration.lastRun = new Date().toISOString();
    integration.totalRuns += 1;
    integrations.set(integrationId, integration);

    // Process asynchronously
    processIntegrationRun(integration, run, payload).catch(console.error);

    return NextResponse.json({
      success: true,
      runId,
      message: "Webhook received, processing started",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

const processIntegrationRun = async (
  integration: any,
  run: IntegrationRun,
  payload: WebhookPayload,
): Promise<void> => {
  try {
    updateRunStatus(run.id, "running");
    addLog(run.id, "Starting file analysis");

    // Filter files to analyze
    const filesToAnalyze = (payload.files || []).filter(
      (file) =>
        file.status !== "removed" && file.filename.match(/\.(ts|tsx|js|jsx)$/),
    );

    if (filesToAnalyze.length === 0) {
      addLog(run.id, "No React/TypeScript files to analyze");
      updateRunStatus(run.id, "success", {
        filesAnalyzed: 0,
        issuesFound: 0,
        qualityScore: 100,
        results: [],
      });
      return;
    }

    // Analyze files
    const results = await analyzeFiles(
      filesToAnalyze,
      integration.settings.layers,
      run.id,
    );

    // Calculate metrics
    const filesAnalyzed = results.length;
    const issuesFound = results.reduce(
      (sum, result) => sum + (result.analysis?.detectedIssues?.length || 0),
      0,
    );
    const avgConfidence =
      results.reduce(
        (sum, result) => sum + (result.analysis?.confidence || 0),
        0,
      ) / filesAnalyzed;
    const qualityScore = Math.round(avgConfidence * 100);

    addLog(
      run.id,
      `Analysis complete: ${filesAnalyzed} files, ${issuesFound} issues, ${qualityScore}% quality`,
    );

    // Check if should fail build
    const shouldFail =
      integration.settings.failOnIssues &&
      issuesFound > integration.settings.maxIssues;

    const finalStatus = shouldFail ? "failed" : "success";

    updateRunStatus(run.id, finalStatus, {
      filesAnalyzed,
      issuesFound,
      qualityScore,
      results,
    });

    // Update integration success rate
    const allRuns = Array.from(integrationRuns.values()).filter(
      (r: IntegrationRun) =>
        r.integrationId === integration.id &&
        r.status !== "pending" &&
        r.status !== "running",
    );

    const successfulRuns = allRuns.filter(
      (r: IntegrationRun) => r.status === "success",
    ).length;
    integration.successRate =
      Math.round((successfulRuns / allRuns.length) * 100) || 0;
    integrations.set(integration.id, integration);

    // Send notifications
    await sendNotifications(integration, integrationRuns.get(run.id));

    if (shouldFail) {
      addLog(
        run.id,
        `Build failed: ${issuesFound} issues exceeds limit of ${integration.settings.maxIssues}`,
      );
    } else {
      addLog(run.id, "Build passed");
    }
  } catch (error) {
    console.error("Integration run processing error:", error);
    addLog(
      run.id,
      `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    updateRunStatus(run.id, "failed");
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } },
) {
  try {
    const { integrationId } = params;

    const integration = integrations.get(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      webhookUrl: `/api/integrations/cicd/${integrationId}/webhook`,
      events: integration.webhook.events,
      lastRun: integration.lastRun,
      totalRuns: integration.totalRuns,
      isActive: integration.isActive,
    });
  } catch (error) {
    console.error("Webhook info error:", error);
    return NextResponse.json(
      { error: "Failed to get webhook info" },
      { status: 500 },
    );
  }
}
