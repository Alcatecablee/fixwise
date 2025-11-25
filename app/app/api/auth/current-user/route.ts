import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiKeyService } from "../../../../lib/api-key-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    const apiKeyHeader = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");

    // Try API key authentication first
    if (apiKeyHeader) {
      const apiKey = await apiKeyService.validate(apiKeyHeader);
      if (!apiKey) {
        return NextResponse.json(
          { error: "Invalid or expired API key" },
          { status: 401 },
        );
      }

      // Get user profile from database using service role key
      const supabaseService = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: profile, error: profileError } = await supabaseService
        .from("profiles")
        .select("first_name, last_name, plan, tier, email")
        .eq("id", apiKey.userId)
        .single();

      if (profileError) {
        // Return basic user info if profile doesn't exist
        return NextResponse.json({
          id: apiKey.userId,
          email: "user@neurolint.dev",
          firstName: "",
          lastName: "",
          plan: "free",
          tier: "free",
          emailConfirmed: true,
        });
      }

      return NextResponse.json({
        id: apiKey.userId,
        email: profile.email || "user@neurolint.dev",
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        plan: profile.plan || "free",
        tier: profile.tier || "free",
        emailConfirmed: true,
      });
    }

    // Fall back to session token authentication
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Invalid session",
          userError: userError?.message,
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata,
      },
    });
  } catch (error) {
    console.error("Current user API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
