import { NextRequest, NextResponse } from "next/server";
import { dataStore, dataUtils } from "../../../lib/data-store";
import { authenticateRequest } from "../../../lib/auth-middleware";

export const dynamic = "force-dynamic";

// Valid pricing plans that match the pricing page
const VALID_PLANS = [
  "free",
  "professional",
  "business",
  "enterprise",
] as const;

type PlanType = typeof VALID_PLANS[number];

// Plan limits configuration - all plans now have unlimited fixes
const PLAN_LIMITS: Record<PlanType, { monthlyFixes: number; overageRate: number }> = {
  free: { monthlyFixes: -1, overageRate: 0 }, // Unlimited
  professional: { monthlyFixes: -1, overageRate: 0 }, // Unlimited
  business: { monthlyFixes: -1, overageRate: 0 }, // Unlimited
  enterprise: { monthlyFixes: -1, overageRate: 0 }, // Unlimited
};

function isValidPlan(plan: string): plan is PlanType {
  return VALID_PLANS.includes(plan as PlanType);
}

function getPlanLimits(plan: string | undefined) {
  if (!plan || !isValidPlan(plan)) {
    return PLAN_LIMITS.free;
  }
  return PLAN_LIMITS[plan];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, projectId, plan, billingPeriod } = body;

    switch (action) {
      case "create_subscription":
        if (!projectId || !plan) {
          return NextResponse.json(
            { error: "projectId and plan are required" },
            { status: 400 },
          );
        }

        // Validate plan
        if (!isValidPlan(plan)) {
          return NextResponse.json(
            {
              error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}`,
            },
            { status: 400 },
          );
        }

        // Validate billing period
        const validBillingPeriods = ["monthly", "yearly"];
        if (billingPeriod && !validBillingPeriods.includes(billingPeriod)) {
          return NextResponse.json(
            { error: "Invalid billing period. Must be 'monthly' or 'yearly'" },
            { status: 400 },
          );
        }

        // Check if project exists and user has access
        const project = dataStore.projects.get(projectId);
        if (!project || project.userId !== authResult.user.id) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        // For free plan, just update directly
        if (plan === "free") {
          dataUtils.createProjectSubscription(
            projectId,
            authResult.user.id,
            plan,
            billingPeriod || "monthly",
          );

          return NextResponse.json({
            success: true,
            subscription: dataStore.projectSubscriptions.get(projectId),
            message: `Free plan activated for project ${project.name}`,
            requiresPayment: false,
          });
        }

        // For paid plans, create subscription record
        const subscription = dataUtils.createProjectSubscription(
          projectId,
          authResult.user.id,
          plan,
          billingPeriod || "monthly",
        );

        return NextResponse.json({
          success: true,
          subscription,
          message: `${plan} subscription created for project ${project.name}`,
          requiresPayment: true,
          nextStep: "payment_required",
        });

      case "get_usage":
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId is required" },
            { status: 400 },
          );
        }

        const usage = dataUtils.getProjectUsage(projectId);
        const overage = dataUtils.calculateOverage(projectId);
        const projectSubscription =
          dataStore.projectSubscriptions.get(projectId);

        // Get plan limits
        const planLimits = getPlanLimits(projectSubscription?.plan);

        return NextResponse.json({
          usage: usage || {
            projectId,
            userId: authResult.user.id,
            currentMonth: new Date().toISOString().substring(0, 7),
            monthlyFixCount: 0,
            totalFixCount: 0,
            lastFixDate: null,
          },
          overage,
          subscription: projectSubscription,
          planLimits,
          quotaUtilization: usage
            ? (usage.monthlyFixCount / planLimits.monthlyFixes) * 100
            : 0,
        });

      case "update_plan":
        if (!projectId || !plan) {
          return NextResponse.json(
            { error: "projectId and plan are required" },
            { status: 400 },
          );
        }

        if (!isValidPlan(plan)) {
          return NextResponse.json(
            {
              error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}`,
            },
            { status: 400 },
          );
        }

        // Check project access
        const projectToUpdate = dataStore.projects.get(projectId);
        if (!projectToUpdate || projectToUpdate.userId !== authResult.user.id) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        // Update subscription
        const existingSubscription =
          dataStore.projectSubscriptions.get(projectId);
        if (existingSubscription) {
          existingSubscription.plan = plan;
          existingSubscription.billingPeriod =
            billingPeriod || existingSubscription.billingPeriod;
          existingSubscription.updatedAt = new Date().toISOString();
        }

        return NextResponse.json({
          success: true,
          subscription: existingSubscription,
          message: `Plan updated to ${plan} for project ${projectToUpdate.name}`,
        });

      case "cancel_subscription":
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId is required" },
            { status: 400 },
          );
        }

        const projectToCancel = dataStore.projects.get(projectId);
        if (!projectToCancel || projectToCancel.userId !== authResult.user.id) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        // Set to free plan
        const cancelledSubscription =
          dataStore.projectSubscriptions.get(projectId);
        if (cancelledSubscription) {
          cancelledSubscription.plan = "free";
          cancelledSubscription.status = "cancelled";
          cancelledSubscription.updatedAt = new Date().toISOString();
        }

        return NextResponse.json({
          success: true,
          subscription: cancelledSubscription,
          message: `Subscription cancelled. Project ${projectToCancel.name} moved to free plan.`,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[BILLING API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (projectId) {
      // Get specific project billing info
      const usage = dataUtils.getProjectUsage(projectId);
      const overage = dataUtils.calculateOverage(projectId);
      const subscription = dataStore.projectSubscriptions.get(projectId);

      // Get plan limits
      const planLimits = getPlanLimits(subscription?.plan);

      return NextResponse.json({
        projectId,
        usage,
        overage,
        subscription,
        planLimits,
        quotaUtilization: usage
          ? (usage.monthlyFixCount / planLimits.monthlyFixes) * 100
          : 0,
      });
    } else {
      // Get all user's project billing info
      const userProjects: any[] = [];

      for (const [id, project] of dataStore.projects.entries()) {
        if (project.userId === authResult.user.id) {
          const usage = dataUtils.getProjectUsage(id);
          const overage = dataUtils.calculateOverage(id);
          const subscription = dataStore.projectSubscriptions.get(id);
          const planLimits = getPlanLimits(subscription?.plan);

          userProjects.push({
            projectId: id,
            projectName: project.name,
            usage,
            overage,
            subscription,
            planLimits,
            quotaUtilization: usage
              ? (usage.monthlyFixCount / planLimits.monthlyFixes) * 100
              : 0,
          });
        }
      }

      return NextResponse.json({
        projects: userProjects,
        totalProjects: userProjects.length,
        totalMonthlyFixes: userProjects.reduce(
          (sum, p) => sum + (p.usage?.monthlyFixCount || 0),
          0,
        ),
        totalOverageCost: userProjects.reduce(
          (sum, p) => sum + (p.overage?.overageCost || 0),
          0,
        ),
        planSummary: {
          validPlans: VALID_PLANS,
          planLimits: PLAN_LIMITS,
        },
      });
    }
  } catch (error) {
    console.error("[BILLING API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
