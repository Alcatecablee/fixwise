import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  userId: string,
  plan: string,
  limits: { requestsPerHour: number; requestsPerDay: number },
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const hourKey = `${userId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `${userId}:day:${Math.floor(now / 86400000)}`;

  const hourData = rateLimitStore.get(hourKey) || {
    count: 0,
    resetTime: Math.floor(now / 3600000 + 1) * 3600000,
  };
  const dayData = rateLimitStore.get(dayKey) || {
    count: 0,
    resetTime: Math.floor(now / 86400000 + 1) * 86400000,
  };

  // Clean up expired entries
  if (now > hourData.resetTime) {
    rateLimitStore.delete(hourKey);
    hourData.count = 0;
    hourData.resetTime = Math.floor(now / 3600000 + 1) * 3600000;
  }

  if (now > dayData.resetTime) {
    rateLimitStore.delete(dayKey);
    dayData.count = 0;
    dayData.resetTime = Math.floor(now / 86400000 + 1) * 86400000;
  }

  const hourlyAllowed = hourData.count < limits.requestsPerHour;
  const dailyAllowed = dayData.count < limits.requestsPerDay;

  if (hourlyAllowed && dailyAllowed) {
    hourData.count++;
    dayData.count++;
    rateLimitStore.set(hourKey, hourData);
    rateLimitStore.set(dayKey, dayData);

    return {
      allowed: true,
      remaining: Math.min(
        limits.requestsPerHour - hourData.count,
        limits.requestsPerDay - dayData.count,
      ),
      resetTime: Math.min(hourData.resetTime, dayData.resetTime),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: !hourlyAllowed ? hourData.resetTime : dayData.resetTime,
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  tier: string;
  emailConfirmed: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "No valid authorization header provided",
      };
    }

    const token = authHeader.substring(7);

    // Basic token validation
    if (!token || token.length < 10) {
      return {
        success: false,
        error: "Invalid token format",
      };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    // Verify the token and get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Invalid or expired session token",
      };
    }

        // Get user profile for additional data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, plan, tier")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // Only log unexpected errors, not missing profile records
      if (profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError.message);
      }
    }

        return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        plan: profile?.plan || "free",
        tier: profile?.tier || profile?.plan || "free",
        emailConfirmed: user.email_confirmed_at !== null,
      },
    };
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

export function createAuthenticatedHandler<T = any>(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    ...args: any[]
  ) => Promise<NextResponse>,
  options: { requireEmailConfirmed?: boolean } = {},
) {
  return async (
    request: NextRequest,
    ...args: any[]
  ): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 },
      );
    }

    if (options.requireEmailConfirmed && !authResult.user.emailConfirmed) {
      return NextResponse.json(
        { error: "Email confirmation required" },
        { status: 403 },
      );
    }

    return handler(request, authResult.user, ...args);
  };
}

// Tier checking utility
export function checkTierAccess(
  userTier: string,
  requiredFeatures: string[]
): { hasAccess: boolean; missingFeatures: string[] } {
  const tierFeatures = {
    free: ["basic_analysis", "basic_reports", "preview_mode"],
    premium: [
      "basic_analysis", "basic_reports", "preview_mode",
      "detailed_reports", "apply_fixes", "pdf_export", "migration_plans"
    ],
    enterprise: [
      "basic_analysis", "basic_reports", "preview_mode",
      "detailed_reports", "apply_fixes", "pdf_export", "migration_plans",
      "batch_fixes", "priority_support", "custom_rules"
    ]
  };

  const availableFeatures = tierFeatures[userTier as keyof typeof tierFeatures] || tierFeatures.free;
  const missingFeatures = requiredFeatures.filter(feature => !availableFeatures.includes(feature));

  return {
    hasAccess: missingFeatures.length === 0,
    missingFeatures
  };
}

// Free tier scanning rate limits (unlimited scanning but with reasonable limits to prevent abuse)
export const FREE_TIER_LIMITS = {
  requestsPerHour: 1000, // High limit for unlimited scanning
  requestsPerDay: 5000,  // High daily limit
  maxFileSize: 500000,   // 500KB per file for free tier
  concurrentRequests: 3  // Max concurrent analysis requests
};

// Rate limiting utility for authenticated users
export function createRateLimitedHandler<T = any>(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    ...args: any[]
  ) => Promise<NextResponse>,
  options: {
    requireEmailConfirmed?: boolean;
    rateLimit?: {
      free: { requestsPerHour: number; requestsPerDay: number };
      pro: { requestsPerHour: number; requestsPerDay: number };
      enterprise: { requestsPerHour: number; requestsPerDay: number };
    };
  } = {},
) {
    const defaultRateLimit = {
    free: FREE_TIER_LIMITS,
    premium: { requestsPerHour: 500, requestsPerDay: 2000 },
    enterprise: { requestsPerHour: 2000, requestsPerDay: 10000 },
  };

  const rateLimit = options.rateLimit || defaultRateLimit;

  return createAuthenticatedHandler(
    async (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => {
            // Check rate limits based on user tier
      const userLimits =
        rateLimit[user.tier as keyof typeof rateLimit] || rateLimit.free;

      const rateLimitResult = checkRateLimit(user.id, user.plan, userLimits);

      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            remaining: 0,
            resetTime,
            limit: userLimits,
                        plan: user.tier,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": userLimits.requestsPerHour.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            },
          },
        );
      }

      // Add rate limit headers to successful responses
      const response = await handler(request, user, ...args);

      response.headers.set(
        "X-RateLimit-Limit",
        userLimits.requestsPerHour.toString(),
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.resetTime.toString(),
      );

      return response;
    },
    options,
  );
}
