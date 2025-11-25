import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../../../../lib/auth-middleware";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

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

// Cancel PayPal subscription
async function cancelPayPalSubscription(accessToken: string, subscriptionId: string, reason: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'User requested cancellation'
    }),
  });

  return response.ok;
}

// Suspend PayPal subscription
async function suspendPayPalSubscription(accessToken: string, subscriptionId: string, reason: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'Temporarily suspended'
    }),
  });

  return response.ok;
}

// Reactivate PayPal subscription
async function reactivatePayPalSubscription(accessToken: string, subscriptionId: string, reason: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'Subscription reactivated'
    }),
  });

  return response.ok;
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    // Get current subscription details from PayPal for active subscriptions
    const accessToken = await getPayPalAccessToken();
    const enhancedSubscriptions = await Promise.all(
      subscriptions.map(async (sub: any) => {
        if (sub.status === 'active' && sub.paypal_subscription_id) {
          try {
            const paypalDetails = await getSubscriptionDetails(accessToken, sub.paypal_subscription_id);
            return {
              ...sub,
              paypal_status: paypalDetails.status,
              next_billing_time: paypalDetails.billing_info?.next_billing_time,
              cycles_completed: paypalDetails.billing_info?.cycle_executions?.[0]?.cycles_completed || 0,
            };
          } catch (error) {
            console.error(`Failed to get PayPal details for subscription ${sub.id}:`, error);
            return sub;
          }
        }
        return sub;
      })
    );

    return NextResponse.json({
      subscriptions: enhancedSubscriptions,
      user: authResult.user,
    });

  } catch (error) {
    console.error('Subscription management GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, subscriptionId, reason } = await request.json();

    if (!action || !subscriptionId) {
      return NextResponse.json(
        { error: 'Action and subscription ID are required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (!subscription.paypal_subscription_id) {
      return NextResponse.json(
        { error: 'PayPal subscription ID not found' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    let success = false;

    switch (action) {
      case 'cancel':
        success = await cancelPayPalSubscription(
          accessToken,
          subscription.paypal_subscription_id,
          reason || 'User requested cancellation'
        );
        if (success) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: reason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId);
        }
        break;

      case 'suspend':
        success = await suspendPayPalSubscription(
          accessToken,
          subscription.paypal_subscription_id,
          reason || 'Temporarily suspended'
        );
        if (success) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'suspended',
              suspended_at: new Date().toISOString(),
              suspension_reason: reason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId);
        }
        break;

      case 'reactivate':
        success = await reactivatePayPalSubscription(
          accessToken,
          subscription.paypal_subscription_id,
          reason || 'Subscription reactivated'
        );
        if (success) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              reactivated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} subscription with PayPal` },
        { status: 500 }
      );
    }

    // Get updated subscription details
    const paypalDetails = await getSubscriptionDetails(accessToken, subscription.paypal_subscription_id);

    return NextResponse.json({
      success: true,
      action,
      subscription: {
        id: subscription.id,
        status: paypalDetails.status?.toLowerCase() || action === 'cancel' ? 'cancelled' : subscription.status,
        paypal_status: paypalDetails.status,
        next_billing_time: paypalDetails.billing_info?.next_billing_time,
      },
    });

  } catch (error) {
    console.error('Subscription management POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
