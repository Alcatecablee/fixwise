import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateSupabaseConfig } from "../../../../lib/demo-mode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    if (!validateSupabaseConfig()) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // Only log unexpected errors, not missing profile records
      if (profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }
      // Return basic user data if profile doesn't exist
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: "",
          lastName: "",
          plan: "free",
          emailConfirmed: user.email_confirmed_at !== null,
          createdAt: user.created_at,
        },
      });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    let isOnTrial = false;
    if (profile.trial_end_date) {
      const trialEndDate = new Date(profile.trial_end_date);
      const now = new Date();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      isOnTrial = trialDaysRemaining > 0;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        plan: profile.plan || "free",
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        profileCreatedAt: profile.created_at,
        lastUpdated: profile.updated_at,
        trialPlan: profile.trial_plan,
        trialStartDate: profile.trial_start_date,
        trialEndDate: profile.trial_end_date,
        trialUsed: profile.trial_used || false,
        isOnTrial,
        trialDaysRemaining,
      },
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const { firstName, lastName } = await request.json();
    if (!validateSupabaseConfig()) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || "",
        last_name: lastName || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    let isOnTrial = false;
    if (profile.trial_end_date) {
      const trialEndDate = new Date(profile.trial_end_date);
      const now = new Date();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      isOnTrial = trialDaysRemaining > 0;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        plan: profile.plan || "free",
        emailConfirmed: user.email_confirmed_at !== null,
        lastUpdated: profile.updated_at,
        trialPlan: profile.trial_plan,
        trialStartDate: profile.trial_start_date,
        trialEndDate: profile.trial_end_date,
        trialUsed: profile.trial_used || false,
        isOnTrial,
        trialDaysRemaining,
      },
    });
  } catch (error) {
    console.error("Profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
