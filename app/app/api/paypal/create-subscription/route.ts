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
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'production';
const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'production'
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
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal authentication failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      baseUrl: PAYPAL_BASE_URL,
      environment: PAYPAL_ENVIRONMENT
    });
    throw new Error(`PayPal authentication failed: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('PayPal access token not received');
  }

  return data.access_token;
}

// Create PayPal product (if not exists)
async function createPayPalProduct(accessToken: string, planId: string, planName: string) {
  const productData = {
    id: `neurolint-${planId}-${Date.now()}`, // Add timestamp to make unique
    name: `NeuroLint ${planName} Plan`,
    description: `React & Next.js modernization platform - ${planName} tier`,
    type: 'SERVICE',
    category: 'SOFTWARE',
    image_url: 'https://app.neurolint.dev/apple-touch-icon.png',
    home_url: 'https://app.neurolint.dev',
  };

  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal product creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(`PayPal product creation failed: ${result.message || result.error || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('Error creating PayPal product:', error);
    throw error;
  }
}

// Create PayPal billing plan
async function createPayPalBillingPlan(
  accessToken: string,
  productId: string,
  planId: string,
  planName: string,
  price: number,
  billing: string
) {
  const planData = {
    product_id: productId,
    name: `NeuroLint ${planName} Plan - ${billing}`,
    description: `React & Next.js modernization platform - ${planName} tier (${billing} billing)`,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: billing === 'yearly' ? 'YEAR' : 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: price.toString(),
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
    taxes: {
      percentage: '0',
      inclusive: false,
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(planData),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('PayPal billing plan creation failed:', {
      status: response.status,
      statusText: response.statusText,
      error: result,
      planData
    });
    throw new Error(`PayPal billing plan creation failed: ${result.message || result.error || 'Unknown error'}`);
  }

  return result;
}

// Create PayPal subscription
async function createPayPalSubscription(accessToken: string, planId: string, subscriberInfo: any) {
  const subscriptionData = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
    quantity: '1',
    subscriber: {
      name: {
        given_name: subscriberInfo.firstName || subscriberInfo.fullName?.split(' ')[0] || 'User',
        surname: subscriberInfo.lastName || subscriberInfo.fullName?.split(' ').slice(1).join(' ') || 'Name',
      },
      email_address: subscriberInfo.email,
    },
    application_context: {
      brand_name: 'NeuroLint',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.neurolint.dev'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.neurolint.dev'}/checkout?cancelled=true`,
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('PayPal subscription creation failed:', {
      status: response.status,
      statusText: response.statusText,
      error: result,
      subscriptionData
    });
    throw new Error(`PayPal subscription creation failed: ${result.message || result.error || 'Unknown error'}`);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Check PayPal credentials first
    console.log('PayPal Environment Check:', {
      hasClientId: !!PAYPAL_CLIENT_ID,
      hasClientSecret: !!PAYPAL_CLIENT_SECRET,
      environment: PAYPAL_ENVIRONMENT,
      baseUrl: PAYPAL_BASE_URL
    });

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials not configured:', {
        clientIdExists: !!PAYPAL_CLIENT_ID,
        clientSecretExists: !!PAYPAL_CLIENT_SECRET
      });
      return NextResponse.json(
        { error: 'PayPal configuration error' },
        { status: 500 }
      );
    }

    const { planId, billing, userInfo } = await request.json();

    if (!planId || !billing || !userInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, billing, or userInfo' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Plan configuration
    const plans: Record<string, { name: string; monthlyPrice: number; yearlyPrice: number; custom?: boolean }> = {
      professional: { name: 'Professional', monthlyPrice: 29, yearlyPrice: 278 },
      business: { name: 'Business', monthlyPrice: 79, yearlyPrice: 758 },
      enterprise: { name: 'Enterprise', monthlyPrice: 0, yearlyPrice: 0, custom: true },
    };

    const selectedPlan = plans[planId as keyof typeof plans];
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Handle Enterprise custom pricing
    if (selectedPlan.custom) {
      return NextResponse.json(
        { error: 'Enterprise plan requires custom pricing. Please contact sales.' },
        { status: 400 }
      );
    }

    const price = billing === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

    // Get PayPal access token
    console.log('Getting PayPal access token...');
    const accessToken = await getPayPalAccessToken();
    console.log('Access token obtained successfully');

    // Create or get product
    console.log('Creating/getting PayPal product...');
    const product = await createPayPalProduct(accessToken, planId, selectedPlan.name);
    console.log('Product created/retrieved:', product.id);

    // Create billing plan
    console.log('Creating billing plan...');
    const billingPlan = await createPayPalBillingPlan(
      accessToken,
      product.id,
      planId,
      selectedPlan.name,
      price,
      billing
    );
    console.log('Billing plan created:', billingPlan.id);

    // Create subscription
    console.log('Creating subscription...');
    console.log('Subscription data will include:', {
      planId: billingPlan.id,
      userEmail: userInfo.email,
      userName: userInfo.fullName
    });
    const subscription = await createPayPalSubscription(
      accessToken,
      billingPlan.id,
      userInfo
    );
    console.log('Subscription response:', subscription);

    if (subscription.id) {
      // Store subscription info in database
      if (supabase) {
        try {
          const subscriptionRecord = {
            paypal_subscription_id: subscription.id,
            paypal_plan_id: billingPlan.id,
            plan: planId,
            billing_period: billing,
            status: 'pending',
            amount: price,
            currency: 'USD',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            user_email: userInfo.email,
            user_name: userInfo.fullName,
            user_id: userInfo.userId || null,
            company: userInfo.company || null,
            paypal_subscription_data: subscription,
            trial_start: null,
            trial_end: null,
            cancel_at: null,
            cancelled_at: null,
          };

          const { data: insertedSubscription, error: insertError } = await supabase
            .from('subscriptions')
            .insert(subscriptionRecord)
            .select()
            .single();

          if (insertError) {
            console.error('Failed to store subscription in database:', insertError);
            // Don't fail the request, but log the error
          } else {
            console.log('Subscription stored successfully:', insertedSubscription?.id);
          }
        } catch (dbError) {
          console.warn('Failed to store subscription in database:', dbError);
        }
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        approvalUrl: subscription.links?.find((link: any) => link.rel === 'approve')?.href,
        billingPlanId: billingPlan.id,
      });
    } else {
      console.error('PayPal subscription creation failed:', subscription);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: subscription },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
