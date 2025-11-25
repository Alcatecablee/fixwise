import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.error("Missing Supabase environment variables for subscriptions API");
}

interface Subscription {
  id: string;
  userId: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "cancelled" | "expired" | "pending";
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

// Get user's subscriptions
export const GET = createAuthenticatedHandler(async (request, user) => {
  try {
    // Get subscriptions from Supabase
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Subscription fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
      currentPlan: user.plan,
    });
  } catch (error) {
    console.error("Subscriptions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// Create new subscription or upgrade plan
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const { plan, paypalSubscriptionId, paypalPayerId } = await request.json();

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 },
      );
    }

    // Verify PayPal subscription if provided
    let verified = false;
    if (paypalSubscriptionId) {
      // TODO: Verify with PayPal API
      // For now, assume verification passes
      verified = true;
    }

    const subscriptionData = {
      user_id: user.id,
      plan,
      status: verified ? "active" : "pending",
      paypal_subscription_id: paypalSubscriptionId || null,
      paypal_payer_id: paypalPayerId || null,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    // Update user's plan in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the request, subscription is created
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: `Successfully ${verified ? "activated" : "created"} ${plan} subscription`,
    });
  } catch (error) {
    console.error("Subscription creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// Update subscription (cancel, reactivate, etc.)
export const PUT = createAuthenticatedHandler(async (request, user) => {
  try {
    const { subscriptionId, status, paypalData } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 },
      );
    }

    // Get existing subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (paypalData) {
      updateData.paypal_subscription_id = paypalData.subscriptionId;
      updateData.paypal_payer_id = paypalData.payerId;
    }

    // Update subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Subscription update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 },
      );
    }

    // Update user plan if subscription is cancelled
    if (status === "cancelled" || status === "expired") {
      await supabase
        .from("profiles")
        .update({
          plan: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Subscription update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
