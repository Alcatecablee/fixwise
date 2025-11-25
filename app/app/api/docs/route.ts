import { NextRequest, NextResponse } from "next/server";

const API_DOCUMENTATION = {
  openapi: "3.0.0",
  info: {
    title: "NeuroLint API",
    version: "1.0.0",
    description:
      "Comprehensive API for NeuroLint - Advanced React/Next.js Code Analysis Platform",
    contact: {
      name: "NeuroLint Support",
      email: "support@neurolint.pro",
      url: "https://neurolint.pro/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Development server",
    },
  ],
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication",
      },
    },
    schemas: {
      AnalysisRequest: {
        type: "object",
        required: ["code", "filename"],
        properties: {
          code: {
            type: "string",
            description: "The source code to analyze",
          },
          filename: {
            type: "string",
            description: "Name of the file being analyzed",
          },
          layers: {
            oneOf: [
              {
                type: "array",
                items: { type: "integer", minimum: 1, maximum: 6 },
              },
              { type: "string", enum: ["auto", "all"] },
            ],
            description:
              "Layers to apply (1-6), 'auto' for automatic selection, or 'all' for all layers",
          },
          applyFixes: {
            type: "boolean",
            default: false,
            description:
              "Whether to apply fixes (true) or just analyze (false)",
          },
        },
      },
      AnalysisResult: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          dryRun: { type: "boolean" },
          analysis: {
            type: "object",
            properties: {
              recommendedLayers: {
                type: "array",
                items: { type: "integer" },
              },
              detectedIssues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"],
                    },
                    description: { type: "string" },
                    fixedByLayer: { type: "integer" },
                    pattern: { type: "string" },
                    count: { type: "integer" },
                  },
                },
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              estimatedImpact: {
                type: "object",
                properties: {
                  level: { type: "string" },
                  description: { type: "string" },
                  estimatedFixTime: { type: "string" },
                },
              },
            },
          },
          transformed: { type: "string" },
          originalCode: { type: "string" },
          layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                layerId: { type: "integer" },
                success: { type: "boolean" },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                },
                executionTime: { type: "number" },
                changeCount: { type: "integer" },
                revertReason: { type: "string" },
              },
            },
          },
          totalExecutionTime: { type: "number" },
          successfulLayers: { type: "integer" },
          metadata: {
            type: "object",
            properties: {
              requestId: { type: "string" },
              processingTimeMs: { type: "number" },
              timestamp: { type: "string" },
              version: { type: "string" },
            },
          },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          gitUrl: { type: "string" },
          framework: {
            type: "string",
            enum: ["react", "nextjs", "vue", "angular"],
          },
          userId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          files: {
            type: "array",
            items: { type: "string" },
          },
          settings: {
            type: "object",
            properties: {
              defaultLayers: {
                type: "array",
                items: { type: "integer" },
              },
              autoAnalyze: { type: "boolean" },
              notifications: { type: "boolean" },
            },
          },
          stats: {
            type: "object",
            properties: {
              totalFiles: { type: "integer" },
              totalIssues: { type: "integer" },
              lastAnalyzed: { type: "string", format: "date-time" },
              qualityScore: { type: "number", minimum: 0, maximum: 100 },
            },
          },
        },
      },
      ApiKey: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          permissions: {
            type: "array",
            items: { type: "string" },
          },
          createdAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
          usageCount: { type: "integer" },
          rateLimit: {
            type: "object",
            properties: {
              requestsPerHour: { type: "integer" },
              requestsPerDay: { type: "integer" },
            },
          },
        },
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string", format: "uri" },
          name: { type: "string" },
          events: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "analysis.completed",
                "analysis.failed",
                "project.created",
                "project.updated",
                "project.deleted",
                "file.uploaded",
                "file.analyzed",
                "bulk.completed",
              ],
            },
          },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          lastTriggered: { type: "string", format: "date-time" },
          totalCalls: { type: "integer" },
          failureCount: { type: "integer" },
        },
      },
      Team: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          ownerId: { type: "string" },
          plan: { type: "string", enum: ["free", "pro", "enterprise"] },
          createdAt: { type: "string", format: "date-time" },
          settings: {
            type: "object",
            properties: {
              allowMemberInvites: { type: "boolean" },
              requireApproval: { type: "boolean" },
              defaultRole: {
                type: "string",
                enum: ["viewer", "member", "admin"],
              },
            },
          },
          stats: {
            type: "object",
            properties: {
              memberCount: { type: "integer" },
              projectCount: { type: "integer" },
              totalAnalyses: { type: "integer" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          code: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/analyze": {
      post: {
        summary: "Analyze Code",
        description: "Analyze React/Next.js code using NeuroLint engine",
        tags: ["Analysis"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AnalysisRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Analysis completed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalysisResult" },
              },
            },
          },
          400: {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          429: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/projects": {
      get: {
        summary: "List Projects",
        description: "Get all projects for the authenticated user",
        tags: ["Projects"],
        parameters: [
          {
            name: "userId",
            in: "query",
            description: "User ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Projects retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Project",
        description: "Create a new project",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  gitUrl: { type: "string" },
                  framework: {
                    type: "string",
                    enum: ["react", "nextjs", "vue", "angular"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/projects/{projectId}/files": {
      get: {
        summary: "List Project Files",
        description: "Get all files in a project",
        tags: ["Projects"],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Files retrieved successfully",
          },
        },
      },
      post: {
        summary: "Upload Files",
        description: "Upload files to a project",
        tags: ["Projects"],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        filename: { type: "string" },
                        content: { type: "string" },
                        path: { type: "string" },
                      },
                    },
                  },
                  analyze: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Files uploaded successfully",
          },
        },
      },
    },
    "/auth/api-keys": {
      get: {
        summary: "List API Keys",
        description: "Get all API keys for the authenticated user",
        tags: ["Authentication"],
        responses: {
          200: {
            description: "API keys retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKeys: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApiKey" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create API Key",
        description: "Create a new API key",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  permissions: {
                    type: "array",
                    items: { type: "string" },
                  },
                  expiresInDays: { type: "integer" },
                  rateLimit: {
                    type: "object",
                    properties: {
                      requestsPerHour: { type: "integer" },
                      requestsPerDay: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "API key created successfully",
          },
        },
      },
    },
    "/webhooks": {
      get: {
        summary: "List Webhooks",
        description: "Get all webhooks for the authenticated user",
        tags: ["Webhooks"],
        responses: {
          200: {
            description: "Webhooks retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    webhooks: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Webhook" },
                    },
                    total: { type: "integer" },
                    availableEvents: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Webhook",
        description: "Create a new webhook",
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "name"],
                properties: {
                  url: { type: "string", format: "uri" },
                  name: { type: "string" },
                  events: {
                    type: "array",
                    items: { type: "string" },
                  },
                  headers: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Webhook created successfully",
          },
        },
      },
    },
    "/teams": {
      get: {
        summary: "List Teams",
        description: "Get all teams for the authenticated user",
        tags: ["Teams"],
        responses: {
          200: {
            description: "Teams retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    teams: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Team" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Team",
        description: "Create a new team",
        tags: ["Teams"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  plan: { type: "string", enum: ["free", "pro", "enterprise"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Team created successfully",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Analysis",
      description: "Code analysis operations",
    },
    {
      name: "Projects",
      description: "Project management operations",
    },
    {
      name: "Authentication",
      description: "API key management",
    },
    {
      name: "Webhooks",
      description: "Webhook management",
    },
    {
      name: "Teams",
      description: "Team collaboration features",
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    if (format === "html") {
      // Return HTML documentation page
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NeuroLint API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css">
          <style>
            body { margin: 0; padding: 0; background: #1a1a1a; }
            .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .swagger-ui .topbar { background: #000; border-bottom: 1px solid #333; }
            .swagger-ui .topbar .download-url-wrapper { display: none; }
            .swagger-ui .info .title { color: #fff; }
            .swagger-ui .info .description { color: rgba(255,255,255,.8); }
            .swagger-ui .scheme-container { background: #000; }
            .swagger-ui .scheme-container .schemes-title { color: #fff; }
            .swagger-ui .opblock-tag { color: #fff; }
            .swagger-ui .opblock .opblock-summary-description { color: rgba(255,255,255,.8); }
            .swagger-ui .opblock .opblock-summary-path { color: #fff; }
            .swagger-ui .opblock .opblock-summary-method { color: #fff; }
            .swagger-ui .model { color: #fff; }
            .swagger-ui .model-title { color: #fff; }
            .swagger-ui .model-box { background: rgba(255,255,255,.05); border: 1px solid #333; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
          <script>
            window.addEventListener('load', function() {
              if (typeof SwaggerUIBundle !== 'undefined') {
                SwaggerUIBundle({
                  url: '/api/docs?format=json',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.presets.standalone
                  ],
                  plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                  ],
                  layout: "StandaloneLayout",
                  theme: "dark"
                });
              } else {
                console.error('SwaggerUIBundle not loaded');
                document.getElementById('swagger-ui').innerHTML = '<div style="color: #fff; padding: 2rem; text-align: center;"><h1>NeuroLint API Documentation</h1><p>Swagger UI failed to load. Please check your internet connection and try again.</p><p><a href="/api/docs?format=json" style="color: #2196f3;">View JSON Documentation</a></p></div>';
              }
            });
          </script>
        </body>
        </html>
      `;

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Return JSON documentation
    return NextResponse.json(API_DOCUMENTATION, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-API-Key",
      },
    });
  } catch (error) {
    console.error("API docs error:", error);
    return NextResponse.json(
      { error: "Failed to load API documentation" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
