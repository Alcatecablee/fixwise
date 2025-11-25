import { NextRequest, NextResponse } from "next/server";
import GitLabIntegration, { GitLabConfig, GitLabPipelineConfig } from "../../../../lib/gitlab-integration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      config,
      pipelineConfig,
      ref,
      variables = {},
      webhookUrl,
      events = ['push', 'merge_requests']
    } = body;

    if (!action || !config) {
      return NextResponse.json(
        { error: "Missing required fields: action and config" },
        { status: 400 }
      );
    }

    const gitlab = new GitLabIntegration(config as GitLabConfig);

    switch (action) {
      case "validate":
        const isValid = await gitlab.validateConnection();
        return NextResponse.json({ valid: isValid });

      case "create-ci-file":
        if (!pipelineConfig) {
          return NextResponse.json(
            { error: "Missing required field: pipelineConfig" },
            { status: 400 }
          );
        }
        const ciCreated = await gitlab.createCIFile(pipelineConfig as GitLabPipelineConfig);
        return NextResponse.json({ 
          success: ciCreated,
          config: pipelineConfig 
        });

      case "trigger-pipeline":
        const pipelineTriggered = await gitlab.triggerPipeline(ref, variables);
        return NextResponse.json({ 
          success: !!pipelineTriggered,
          pipeline: pipelineTriggered,
          ref,
          variables 
        });

      case "get-pipeline-status":
        const { pipelineId } = body;
        if (!pipelineId) {
          return NextResponse.json(
            { error: "Missing required field: pipelineId" },
            { status: 400 }
          );
        }
        const pipelineStatus = await gitlab.getPipelineStatus(pipelineId);
        return NextResponse.json({ pipelineStatus });

      case "get-pipeline-jobs":
        const { pipelineId: jobsPipelineId } = body;
        if (!jobsPipelineId) {
          return NextResponse.json(
            { error: "Missing required field: pipelineId" },
            { status: 400 }
          );
        }
        const pipelineJobs = await gitlab.getPipelineJobs(jobsPipelineId);
        return NextResponse.json({ pipelineJobs });

      case "get-job-logs":
        const { jobId } = body;
        if (!jobId) {
          return NextResponse.json(
            { error: "Missing required field: jobId" },
            { status: 400 }
          );
        }
        const jobLogs = await gitlab.getJobLogs(jobId);
        return NextResponse.json({ jobLogs });

      case "generate-pipeline":
        if (!pipelineConfig) {
          return NextResponse.json(
            { error: "Missing required field: pipelineConfig" },
            { status: 400 }
          );
        }
        const generatedConfig = gitlab.generatePipelineConfig(pipelineConfig as GitLabPipelineConfig);
        return NextResponse.json({ 
          pipelineConfig: generatedConfig,
          config: pipelineConfig 
        });

      case "create-webhook":
        if (!webhookUrl) {
          return NextResponse.json(
            { error: "Missing required field: webhookUrl" },
            { status: 400 }
          );
        }
        const webhookCreated = await gitlab.createWebhook(webhookUrl, events);
        return NextResponse.json({ 
          success: webhookCreated,
          webhookUrl,
          events 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: validate, create-ci-file, trigger-pipeline, get-pipeline-status, get-pipeline-jobs, get-job-logs, generate-pipeline, create-webhook" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GitLab integration error:", error);
    return NextResponse.json(
      { error: "Failed to process GitLab integration request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const configParam = searchParams.get("config");

    if (!action || !configParam) {
      return NextResponse.json(
        { error: "Missing required query parameters: action and config" },
        { status: 400 }
      );
    }

    const config = JSON.parse(decodeURIComponent(configParam));
    const gitlab = new GitLabIntegration(config as GitLabConfig);

    switch (action) {
      case "validate":
        const isValid = await gitlab.validateConnection();
        return NextResponse.json({ valid: isValid });

      case "project-info":
        const projectInfo = await gitlab.getProjectInfo();
        return NextResponse.json({
          project: projectInfo,
          type: "gitlab",
          capabilities: [
            "pipeline-generation",
            "ci-file-creation",
            "pipeline-triggering",
            "status-monitoring",
            "log-retrieval",
            "webhook-management"
          ]
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: validate, project-info" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GitLab integration GET error:", error);
    return NextResponse.json(
      { error: "Failed to process GitLab integration request" },
      { status: 500 }
    );
  }
} 