import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// PayPal webhook verification
function verifyPayPalWebhook(body: string, paypalSignature: string, webhookId: string): boolean {
  if (!process.env.PAYPAL_WEBHOOK_SECRET) {
    console.warn('PayPal webhook secret not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYPAL_WEBHOOK_SECRET)
      .update(body)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(paypalSignature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

// Handle different PayPal webhook events
async function handleWebhookEvent(event: any) {
  const eventType = event.event_type;
  const resource = event.resource;

  console.log(`Processing PayPal webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(resource);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource);
        break;

      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await handleSubscriptionReactivated(resource);
        break;

      default:
        console.log(`Unhandled PayPal webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling PayPal webhook ${eventType}:`, error);
    throw error;
  }
}

async function handleSubscriptionActivated(subscription: any) {
  if (!supabase) return;

  try {
    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paypal_subscription_data: subscription,
      })
      .eq('paypal_subscription_id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription on activation:', updateError);
      return;
    }

    // Get subscription details to update user profile
    const { data: subscriptionData, error: selectError } = await supabase
      .from('subscriptions')
      .select('plan, user_id, user_email')
      .eq('paypal_subscription_id', subscription.id)
      .single();

    if (selectError || !subscriptionData) {
      console.error('Failed to get subscription data:', selectError);
      return;
    }

    // Update user profile with new plan
    if (subscriptionData.user_id) {
      await supabase
        .from('profiles')
        .update({
          plan: subscriptionData.plan,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.user_id);
    } else if (subscriptionData.user_email) {
      // Try to find user by email if user_id not set
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', subscriptionData.user_email)
        .single();

      if (userData) {
        await supabase
          .from('profiles')
          .update({
            plan: subscriptionData.plan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.id);

        // Link the subscription to the user
        await supabase
          .from('subscriptions')
          .update({ user_id: userData.id })
          .eq('paypal_subscription_id', subscription.id);
      }
    }

    console.log(`Subscription activated: ${subscription.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionActivated:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  if (!supabase) return;

  try {
    const cancellationTime = new Date().toISOString();

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: cancellationTime,
        updated_at: cancellationTime,
        paypal_subscription_data: subscription,
      })
      .eq('paypal_subscription_id', subscription.id);

    // Get subscription to find user
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('paypal_subscription_id', subscription.id)
      .single();

    // Update user profile to free plan (after current period ends)
    if (subscriptionData?.user_id) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          plan_expires_at: subscription.billing_info?.next_billing_time || 
                           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: cancellationTime,
        })
        .eq('id', subscriptionData.user_id);
    }

    console.log(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

async function handleSubscriptionSuspended(subscription: any) {
  if (!supabase) return;

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
        paypal_subscription_data: subscription,
      })
      .eq('paypal_subscription_id', subscription.id);

    // Update user profile
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscription.id)
      .single();

    if (subscriptionData?.user_id) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.user_id);
    }

    console.log(`Subscription suspended: ${subscription.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionSuspended:', error);
    throw error;
  }
}

async function handlePaymentFailed(payment: any) {
  if (!supabase) return;

  try {
    // Log payment failure
    await supabase
      .from('payment_logs')
      .insert({
        subscription_id: payment.billing_agreement_id,
        type: 'payment_failed',
        amount: payment.amount?.total,
        currency: payment.amount?.currency,
        paypal_payment_id: payment.id,
        reason: payment.reason_code,
        created_at: new Date().toISOString(),
        paypal_data: payment,
      });

    // Update subscription with payment failure info
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id, plan')
      .eq('paypal_subscription_id', payment.billing_agreement_id)
      .single();

    if (subscriptionData?.user_id) {
      // Notify user of payment failure
      // Could integrate with email service here
      console.log(`Payment failed for user ${subscriptionData.user_id}`);
    }

    console.log(`Payment failed: ${payment.id}`);
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
    throw error;
  }
}

async function handlePaymentCompleted(payment: any) {
  if (!supabase) return;

  try {
    // Log successful payment
    await supabase
      .from('payment_logs')
      .insert({
        subscription_id: payment.billing_agreement_id,
        type: 'payment_completed',
        amount: payment.amount?.total,
        currency: payment.amount?.currency,
        paypal_payment_id: payment.id,
        created_at: new Date().toISOString(),
        paypal_data: payment,
      });

    // Update subscription's last payment date
    await supabase
      .from('subscriptions')
      .update({
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', payment.billing_agreement_id);

    console.log(`Payment completed: ${payment.id}`);
  } catch (error) {
    console.error('Error in handlePaymentCompleted:', error);
    throw error;
  }
}

async function handleSubscriptionExpired(subscription: any) {
  if (!supabase) return;

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paypal_subscription_data: subscription,
      })
      .eq('paypal_subscription_id', subscription.id);

    // Get subscription to find user
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscription.id)
      .single();

    // Update user profile to free plan
    if (subscriptionData?.user_id) {
      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.user_id);
    }

    console.log(`Subscription expired: ${subscription.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error);
    throw error;
  }
}

async function handleSubscriptionReactivated(subscription: any) {
  if (!supabase) return;

  try {
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        reactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paypal_subscription_data: subscription,
      })
      .eq('paypal_subscription_id', subscription.id);

    // Get subscription details
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('plan, user_id')
      .eq('paypal_subscription_id', subscription.id)
      .single();

    // Update user profile
    if (subscriptionData?.user_id) {
      await supabase
        .from('profiles')
        .update({
          plan: subscriptionData.plan,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.user_id);
    }

    console.log(`Subscription reactivated: ${subscription.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionReactivated:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // Get PayPal signature from headers
    const paypalSignature = request.headers.get('paypal-signature') || 
                           request.headers.get('paypal-cert-id') || '';
    
    // Verify webhook (in production)
    if (process.env.NODE_ENV === 'production' && process.env.PAYPAL_WEBHOOK_SECRET) {
      const isValid = verifyPayPalWebhook(body, paypalSignature, event.id);
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Process the webhook event
    await handleWebhookEvent(event);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification during setup
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  
  return NextResponse.json({ status: 'PayPal webhook endpoint' });
}
