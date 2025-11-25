import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Get subscription details from PayPal
async function getSubscriptionDetails(accessToken: string, subscriptionId: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, userId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get subscription details from PayPal
    const subscriptionDetails = await getSubscriptionDetails(accessToken, subscriptionId);

    if (!subscriptionDetails.id) {
      return NextResponse.json(
        { error: 'Invalid subscription', details: subscriptionDetails },
        { status: 400 }
      );
    }

    // Update subscription in database
    if (supabase) {
      try {
        // Update subscription status
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscriptionDetails.status?.toLowerCase() || 'active',
            paypal_payer_id: subscriptionDetails.subscriber?.payer_id,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            paypal_subscription_data: subscriptionDetails,
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Failed to update subscription:', updateError);
        }

        // If user ID is provided, update user's plan
        if (userId && subscriptionDetails.status === 'ACTIVE') {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('paypal_subscription_id', subscriptionId)
            .single();

          if (subscription?.plan) {
            await supabase
              .from('profiles')
              .update({
                plan: subscription.plan,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          }
        }

      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Don't fail the request if database update fails
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionDetails.id,
        status: subscriptionDetails.status,
        plan_id: subscriptionDetails.plan_id,
        start_time: subscriptionDetails.start_time,
        subscriber: subscriptionDetails.subscriber,
      },
    });

  } catch (error) {
    console.error('PayPal subscription approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
