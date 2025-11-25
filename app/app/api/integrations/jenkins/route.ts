import { NextRequest, NextResponse } from "next/server";
import JenkinsIntegration, { JenkinsConfig, JenkinsPipelineConfig } from "../../../../lib/jenkins-integration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      config,
      pipelineConfig,
      jobName,
      parameters = {}
    } = body;

    if (!action || !config) {
      return NextResponse.json(
        { error: "Missing required fields: action and config" },
        { status: 400 }
      );
    }

    const jenkins = new JenkinsIntegration(config as JenkinsConfig);

    switch (action) {
      case "validate":
        const isValid = await jenkins.validateConnection();
        return NextResponse.json({ valid: isValid });

      case "create-job":
        if (!pipelineConfig || !jobName) {
          return NextResponse.json(
            { error: "Missing required fields: pipelineConfig and jobName" },
            { status: 400 }
          );
        }
        const pipelineScript = jenkins.generatePipelineScript(pipelineConfig as JenkinsPipelineConfig);
        const jobCreated = await jenkins.createJob(jobName, pipelineScript);
        return NextResponse.json({ 
          success: jobCreated,
          pipelineScript,
          jobName 
        });

      case "trigger-build":
        if (!jobName) {
          return NextResponse.json(
            { error: "Missing required field: jobName" },
            { status: 400 }
          );
        }
        const buildTriggered = await jenkins.triggerBuild(jobName, parameters);
        return NextResponse.json({ 
          success: buildTriggered,
          jobName,
          parameters 
        });

      case "get-build-status":
        const { buildNumber } = body;
        if (!jobName || !buildNumber) {
          return NextResponse.json(
            { error: "Missing required fields: jobName and buildNumber" },
            { status: 400 }
          );
        }
        const buildStatus = await jenkins.getBuildStatus(jobName, buildNumber);
        return NextResponse.json({ buildStatus });

      case "get-build-logs":
        const { buildNumber: logBuildNumber } = body;
        if (!jobName || !logBuildNumber) {
          return NextResponse.json(
            { error: "Missing required fields: jobName and buildNumber" },
            { status: 400 }
          );
        }
        const buildLogs = await jenkins.getBuildLogs(jobName, logBuildNumber);
        return NextResponse.json({ buildLogs });

      case "generate-pipeline":
        if (!pipelineConfig) {
          return NextResponse.json(
            { error: "Missing required field: pipelineConfig" },
            { status: 400 }
          );
        }
        const generatedScript = jenkins.generatePipelineScript(pipelineConfig as JenkinsPipelineConfig);
        return NextResponse.json({ 
          pipelineScript: generatedScript,
          config: pipelineConfig 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: validate, create-job, trigger-build, get-build-status, get-build-logs, generate-pipeline" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Jenkins integration error:", error);
    return NextResponse.json(
      { error: "Failed to process Jenkins integration request" },
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
    const jenkins = new JenkinsIntegration(config as JenkinsConfig);

    switch (action) {
      case "validate":
        const isValid = await jenkins.validateConnection();
        return NextResponse.json({ valid: isValid });

      case "project-info":
        // For Jenkins, we'll return basic info since it doesn't have project concept like GitLab
        return NextResponse.json({
          name: "Jenkins Server",
          url: config.jenkinsUrl,
          type: "jenkins",
          capabilities: [
            "pipeline-generation",
            "build-triggering",
            "status-monitoring",
            "log-retrieval"
          ]
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: validate, project-info" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Jenkins integration GET error:", error);
    return NextResponse.json(
      { error: "Failed to process Jenkins integration request" },
      { status: 500 }
    );
  }
} 