import { NextRequest, NextResponse } from "next/server";
import {
  integrations,
  userIntegrations,
  integrationRuns,
  generateWebhookSecret,
  generateWebhookUrl,
  type CICDIntegration,
  type IntegrationRun,
} from "../../../../lib/cicd-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";
    const integrationId = searchParams.get("integrationId");

    if (integrationId) {
      // Get specific integration
      const integration = integrations.get(integrationId);
      if (!integration || integration.userId !== userId) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 },
        );
      }

      // Get recent runs for this integration
      const runs = Array.from(integrationRuns.values())
        .filter((run: IntegrationRun) => run.integrationId === integrationId)
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        )
        .slice(0, 20);

      return NextResponse.json({
        integration,
        runs,
        webhookUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${generateWebhookUrl(integrationId)}`,
      });
    }

    // Get all integrations for user
    const userIntegrationsList = userIntegrations.get(userId) || [];
    const integrationsData = userIntegrationsList
      .map((intId: string) => {
        const integration = integrations.get(intId);
        if (!integration) return null;

        const recentRuns = Array.from(integrationRuns.values())
          .filter((run: IntegrationRun) => run.integrationId === intId)
          .sort(
            (a, b) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
          )
          .slice(0, 5);

        return {
          ...integration,
          recentRuns,
          webhookUrl: generateWebhookUrl(intId),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      integrations: integrationsData,
      total: integrationsData.length,
      supportedTypes: ["github", "gitlab", "jenkins", "azure", "custom"],
    });
  } catch (error) {
    console.error("CI/CD integrations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      repository,
      branch = "main",
      settings = {
        autoAnalyze: true,
        failOnIssues: false,
        maxIssues: 10,
        layers: "auto",
        notifications: {},
      },
      userId = "demo-user",
    } = body;

    if (!name || !type || !repository) {
      return NextResponse.json(
        { error: "Name, type, and repository are required" },
        { status: 400 },
      );
    }

    if (!["github", "gitlab", "jenkins", "azure", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid integration type" },
        { status: 400 },
      );
    }

    const integrationId = `cicd_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const webhookSecret = generateWebhookSecret();

    const integration: CICDIntegration = {
      id: integrationId,
      name,
      type,
      userId,
      repository,
      branch,
      webhook: {
        url: generateWebhookUrl(integrationId),
        secret: webhookSecret,
        events: ["push", "pull_request"],
      },
      settings,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastRun: null,
      totalRuns: 0,
      successRate: 0,
    };

    integrations.set(integrationId, integration);

    // Add to user's integrations list
    const userIntegrationsList = userIntegrations.get(userId) || [];
    userIntegrationsList.push(integrationId);
    userIntegrations.set(userId, userIntegrationsList);

    return NextResponse.json(
      {
        integration,
        webhookUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${generateWebhookUrl(integrationId)}`,
        webhookSecret,
        setupInstructions: getSetupInstructions(type, integration),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CI/CD integrations POST error:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, updates, userId = "demo-user" } = body;

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 },
      );
    }

    const integration = integrations.get(integrationId);
    if (!integration || integration.userId !== userId) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    const updatedIntegration = {
      ...integration,
      ...updates,
      // Prevent updating sensitive fields
      id: integration.id,
      userId: integration.userId,
      webhook: integration.webhook,
      createdAt: integration.createdAt,
    };

    integrations.set(integrationId, updatedIntegration);

    return NextResponse.json({ integration: updatedIntegration });
  } catch (error) {
    console.error("CI/CD integrations PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integrationId");
    const userId = searchParams.get("userId") || "demo-user";

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 },
      );
    }

    const integration = integrations.get(integrationId);
    if (!integration || integration.userId !== userId) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    integrations.delete(integrationId);

    // Remove from user's integrations list
    const userIntegrationsList = userIntegrations.get(userId) || [];
    const updatedList = userIntegrationsList.filter(
      (id: string) => id !== integrationId,
    );
    userIntegrations.set(userId, updatedList);

    // Delete associated runs
    for (const [runId, run] of integrationRuns.entries()) {
      if ((run as IntegrationRun).integrationId === integrationId) {
        integrationRuns.delete(runId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CI/CD integrations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 },
    );
  }
}

// Utility function to get setup instructions
const getSetupInstructions = (type: string, integration: CICDIntegration) => {
  const webhookUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${integration.webhook.url}`;

  switch (type) {
    case "github":
      return {
        title: "GitHub Setup Instructions",
        steps: [
          "Go to your repository settings",
          "Click on 'Webhooks' in the left sidebar",
          "Click 'Add webhook'",
          `Set Payload URL to: ${webhookUrl}`,
          "Set Content type to 'application/json'",
          `Set Secret to: ${integration.webhook.secret}`,
          "Select 'Just the push event' or customize events",
          "Click 'Add webhook'",
        ],
        documentation:
          "https://docs.github.com/en/developers/webhooks-and-events/webhooks",
      };

    case "gitlab":
      return {
        title: "GitLab Setup Instructions",
        steps: [
          "Go to your project settings",
          "Click on 'Webhooks' in the left sidebar",
          `Set URL to: ${webhookUrl}`,
          `Set Secret Token to: ${integration.webhook.secret}`,
          "Select 'Push events' and 'Merge request events'",
          "Click 'Add webhook'",
        ],
        documentation:
          "https://docs.gitlab.com/ee/user/project/integrations/webhooks.html",
      };

    case "jenkins":
      return {
        title: "Jenkins Setup Instructions",
        steps: [
          "Install the 'HTTP Request Plugin' if not already installed",
          "Create a new build step 'HTTP Request'",
          `Set URL to: ${webhookUrl}`,
          "Set HTTP Method to 'POST'",
          "Add custom headers: 'X-Jenkins-Secret: " +
            integration.webhook.secret +
            "'",
          "Configure the build to trigger on SCM changes",
        ],
        documentation: "https://plugins.jenkins.io/http_request/",
      };

    case "azure":
      return {
        title: "Azure DevOps Setup Instructions",
        steps: [
          "Go to your project settings",
          "Click on 'Service hooks'",
          "Click 'Create subscription'",
          "Select 'Web Hooks' as service",
          `Set URL to: ${webhookUrl}`,
          "Select 'Code pushed' event",
          "Add HTTP header: 'X-Azure-Secret: " +
            integration.webhook.secret +
            "'",
          "Test and finish the subscription",
        ],
        documentation:
          "https://docs.microsoft.com/en-us/azure/devops/service-hooks/",
      };

    default:
      return {
        title: "Custom Integration Setup",
        steps: [
          `Send POST requests to: ${webhookUrl}`,
          `Include header: 'X-Webhook-Secret: ${integration.webhook.secret}'`,
          "Send JSON payload with repository and commit information",
          "Include 'event' field to specify the trigger type",
        ],
        documentation: "/api/docs#tag/Integrations",
      };
  }
};
