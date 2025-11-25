import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthenticatedHandler } from "../../../lib/auth-middleware";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.error("Missing Supabase environment variables");
}

// Export user's complete data
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const { exportType } = await request.json();

    // Validate export type
    if (
      !exportType ||
      !["account", "billing", "projects", "complete"].includes(exportType)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid export type. Must be: account, billing, projects, or complete",
        },
        { status: 400 },
      );
    }

    const exportData: any = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      exportType,
    };

    // Export user profile data
    if (exportType === "account" || exportType === "complete") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      exportData.account = {
        id: user.id,
        email: user.email,
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        plan: profile?.plan || "free",
        emailConfirmed: user.emailConfirmed,
        profileCreatedAt: profile?.created_at,
        lastUpdated: profile?.updated_at,
      };
    }

    // Export billing and subscription data
    if (exportType === "billing" || exportType === "complete") {
      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Get payment history
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      exportData.billing = {
        subscriptions: subscriptions || [],
        payments: payments || [],
        currentPlan: user.plan,
      };
    }

    // Export projects and analysis data (from in-memory store)
    if (exportType === "projects" || exportType === "complete") {
      // Import data store
      const { dataStore } = await import("../../../lib/data-store");

      // Get user projects from in-memory store
      const userProjects = [];
      for (const [projectId, project] of dataStore.projects.entries()) {
        if (project.userId === user.id) {
          // Get project files
          const projectFiles = [];
          for (const [fileId, file] of dataStore.projectFiles.entries()) {
            if (file.projectId === projectId) {
              projectFiles.push(file);
            }
          }

          // Get project analyses
          const projectAnalyses = [];
          for (const [
            analysisId,
            analysis,
          ] of dataStore.projectAnalyses.entries()) {
            if (analysis.projectId === projectId) {
              projectAnalyses.push(analysis);
            }
          }

          userProjects.push({
            ...project,
            files: projectFiles,
            analyses: projectAnalyses,
          });
        }
      }

      exportData.projects = {
        projects: userProjects,
        totalProjects: userProjects.length,
        totalFiles: userProjects.reduce(
          (acc, p) => acc + (p.files?.length || 0),
          0,
        ),
        totalAnalyses: userProjects.reduce(
          (acc, p) => acc + (p.analyses?.length || 0),
          0,
        ),
      };
    }

    // Add usage statistics for complete export
    if (exportType === "complete") {
      // Get API usage statistics (from dashboard sessions or a usage table if it exists)
      exportData.usage = {
        exportNote:
          "Usage statistics are tracked in real-time sessions and may not be fully historical",
        currentSession: {
          plan: user.plan,
          // Add any available usage data here
        },
      };
    }

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `neurolint-${exportType}-export-${timestamp}.json`;

    return NextResponse.json({
      success: true,
      data: exportData,
      filename,
      message: `${exportType} data exported successfully`,
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// Get export information (what can be exported)
export const GET = createAuthenticatedHandler(async (request, user) => {
  try {
    // Get counts for each data type
    const [profileCount, subscriptionsCount, paymentsCount] = await Promise.all(
      [
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("id", user.id),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("payments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
      ],
    );

    // Get project counts from in-memory store
    const { dataStore } = await import("../../../lib/data-store");
    let userProjectsCount = 0;
    for (const [, project] of dataStore.projects.entries()) {
      if (project.userId === user.id) {
        userProjectsCount++;
      }
    }

    return NextResponse.json({
      availableExports: {
        account: {
          description: "Profile information and account settings",
          recordCount: profileCount.count || 0,
        },
        billing: {
          description: "Subscription history and payment records",
          recordCount:
            (subscriptionsCount.count || 0) + (paymentsCount.count || 0),
        },
        projects: {
          description: "Project data and analysis files",
          recordCount: userProjectsCount,
        },
        complete: {
          description: "All user data in a single export",
          recordCount: "all",
        },
      },
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error("Export info API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
