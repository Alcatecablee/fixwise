import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.error("Missing Supabase environment variables");
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { planId, fullName, email, company } = await request.json();

    // Validate input
    if (!planId || !["developer", "professional"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Check if user has already used trial
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("trial_used, trial_end_date")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Error checking trial eligibility" },
        { status: 500 },
      );
    }

    if (profile.trial_used) {
      return NextResponse.json(
        { error: "Trial already used" },
        { status: 400 },
      );
    }

    // Start the trial using database function
    const { data: trialResult, error: trialError } = await supabase.rpc(
      "start_trial",
      {
        user_uuid: user.id,
        plan_name: planId,
      },
    );

    if (trialError || !trialResult) {
      console.error("Error starting trial:", trialError);
      return NextResponse.json(
        { error: "Failed to start trial" },
        { status: 500 },
      );
    }

    // Update user profile with additional info if provided
    const updateData: any = {};
    if (fullName) {
      const [firstName, ...lastNameParts] = fullName.split(" ");
      updateData.first_name = firstName;
      updateData.last_name = lastNameParts.join(" ");
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from("profiles").update(updateData).eq("id", user.id);
    }

    // Get updated user data with trial info
    const { data: updatedProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated profile:", fetchError);
    }

    // Calculate trial days remaining
    const trialEndDate = new Date(updatedProfile.trial_end_date);
    const now = new Date();
    const trialDaysRemaining = Math.max(
      0,
      Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const userData = {
      id: user.id,
      email: user.email,
      firstName: updatedProfile.first_name || "",
      lastName: updatedProfile.last_name || "",
      plan: updatedProfile.plan,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at,
      trialPlan: updatedProfile.trial_plan,
      trialStartDate: updatedProfile.trial_start_date,
      trialEndDate: updatedProfile.trial_end_date,
      trialUsed: updatedProfile.trial_used,
      isOnTrial: trialDaysRemaining > 0,
      trialDaysRemaining,
    };

    return NextResponse.json({
      success: true,
      message: "Trial started successfully",
      user: userData,
      trialDaysRemaining,
    });
  } catch (error) {
    console.error("Trial start error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
