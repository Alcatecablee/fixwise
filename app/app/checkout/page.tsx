"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

interface CheckoutPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  monthlyFixes: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const billing = searchParams.get("billing") || "monthly";
  const cancelled = searchParams.get("cancelled");

  const [loading, setLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    company: "",
    fullName: "",
    agreeToTerms: false,
  });

  // Handle PayPal cancellation
  useEffect(() => {
    if (cancelled === 'true') {
      setError('Payment was cancelled. You can try again or choose a different plan.');
    }
  }, [cancelled]);

  const plans: Record<string, CheckoutPlan> = {
    free: {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      monthlyFixes: -1, // Unlimited
      features: [
        "Layers 1-4 (Configuration, Patterns, Components, Hydration)",
        "Unlimited fixes",
        "Unlimited dry runs",
        "Basic validation",
        "Community support",
      ],
    },
    professional: {
      id: "professional",
      name: "Professional",
      monthlyPrice: 29,
      yearlyPrice: 278,
      monthlyFixes: -1, // Unlimited
      features: [
        "All 7 layers (adds Next.js, Testing, Adaptive Learning)",
        "Unlimited fixes",
        "Unlimited dry runs",
        "API access & CI/CD integration",
        "Priority support",
      ],
    },
    business: {
      id: "business",
      name: "Business",
      monthlyPrice: 79,
      yearlyPrice: 758,
      monthlyFixes: -1, // Unlimited
      features: [
        "All 7 layers with advanced features",
        "Unlimited fixes",
        "Advanced analytics",
        "Custom integrations",
        "Dedicated account manager",
      ],
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 0, // Custom pricing
      yearlyPrice: 0, // Custom pricing
      monthlyFixes: -1, // Unlimited
      features: [
        "All 7 layers with custom rules",
        "Unlimited fixes",
        "Custom rules engine",
        "SLA guarantees",
        "Priority support (email + phone)",
      ],
    },
  };

  const selectedPlan = planId ? plans[planId] : null;

  const getCurrentPrice = () => {
    if (!selectedPlan) return 0;
    return billing === "yearly"
      ? selectedPlan.yearlyPrice
      : selectedPlan.monthlyPrice;
  };

  const getSavings = () => {
    if (
      !selectedPlan ||
      billing === "monthly" ||
      selectedPlan.monthlyPrice === 0
    )
      return 0;
    return selectedPlan.monthlyPrice * 12 - selectedPlan.yearlyPrice;
  };

  const createPayPalSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billing,
          userInfo: {
            email: formData.email,
            fullName: formData.fullName,
            company: formData.company,
            firstName: formData.fullName.split(' ')[0] || '',
            lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          },
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        console.error('PayPal API non-JSON error:', { status: response.status, error: errorText });
        throw new Error(`Server error: ${response.status}. Please try again.`);
      }

      if (!response.ok) {
        console.error('PayPal API error:', { status: response.status, error: data });
        throw new Error(`Server error: ${response.status}. Please try again.`);
      }

      if (data.success && data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else {
        console.error('PayPal subscription creation failed:', data);
        throw new Error(data.error || 'Failed to create subscription. Please check your details and try again.');
      }
    } catch (error) {
      console.error('PayPal subscription creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';

      // Provide more helpful error messages
      if (errorMessage.includes('500')) {
        setError('PayPal service is temporarily unavailable. Please try again in a few minutes.');
      } else if (errorMessage.includes('authentication')) {
        setError('Payment service configuration error. Please contact support.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.agreeToTerms) {
      setError('Please fill in all required fields and agree to the terms.');
      return;
    }

    if (selectedPlan?.monthlyPrice === 0) {
      // Handle free plan
      window.location.href = "/dashboard?plan=free";
      return;
    }

    // Create PayPal subscription for paid plans
    await createPayPalSubscription();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (!selectedPlan) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div className="onboarding-logo">
                <Link href="/" className="modal-logo-bee">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                    alt="NeuroLint"
                  />
                </Link>
              </div>

              <h2 className="onboarding-title">Plan Not Found</h2>
              <p className="onboarding-subtitle">
                The selected plan could not be found. Please return to pricing
                to select a valid plan.
              </p>

              <Link href="/pricing" className="onboarding-btn primary">
                ← Back to Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-section">
      <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="onboarding-content">
          {/* Header Navigation */}
          <div
            className="hero-nav"
            style={{ position: "relative", marginBottom: "2rem" }}
          >
            <div className="nav-left">
              <Link href="/" className="brand-logo">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                  alt="NeuroLint"
                />
              </Link>
            </div>
            <div className="nav-center">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/pricing" className="nav-link">
                Pricing
              </Link>
              <Link href="/api-docs" className="nav-link">
                API Docs
              </Link>
            </div>
            <div className="nav-right">
              <Link href="/dashboard" className="nav-link dashboard-btn">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              alignItems: "start",
            }}
            className="grid-responsive"
          >
            {/* Order Summary */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.4) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow:
                  "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(25px) saturate(1.2)",
                WebkitBackdropFilter: "blur(25px) saturate(1.2)",
              }}
            >
              <h2
                className="onboarding-title"
                style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}
              >
                Order Summary
              </h2>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  {selectedPlan.name} Plan
                </h3>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    margin: "0 0 1rem 0",
                    fontSize: "0.9rem",
                  }}
                >
                  Billed {billing}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "1rem",
                  }}
                >
                  <span>Total</span>
                  <span>${getCurrentPrice()}</span>
                </div>

                {billing === "yearly" && getSavings() > 0 && (
                  <div
                    style={{
                      background: "rgba(33, 150, 243, 0.15)",
                      color: "rgba(33, 150, 243, 0.9)",
                      border: "1px solid rgba(33, 150, 243, 0.3)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    🎉 You save ${getSavings()} per year!
                  </div>
                )}
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: "0 0 1rem 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  What's included:
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {selectedPlan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          background: "rgba(33, 150, 243, 0.2)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(33, 150, 243, 0.9)",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                          }}
                        >
                          ✓
                        </span>
                      </div>
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.875rem",
                          fontWeight: "400",
                          lineHeight: "1.4",
                        }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.4) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow:
                  "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(25px) saturate(1.2)",
                WebkitBackdropFilter: "blur(25px) saturate(1.2)",
              }}
            >
              <h2
                className="onboarding-title"
                style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}
              >
                Complete Your Order
              </h2>

              {error && (
                <div
                  style={{
                    background: "rgba(244, 67, 54, 0.1)",
                    border: "1px solid rgba(244, 67, 54, 0.3)",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    color: "rgba(244, 67, 54, 0.9)",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="onboarding-input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="onboarding-input"
                    placeholder="Enter your email address"
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="onboarding-input"
                    placeholder="Enter your company name"
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      color: "rgba(255, 255, 255, 0.9)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      required
                      style={{
                        cursor: "pointer",
                        accentColor: "var(--onboarding-accent)",
                      }}
                    />
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      style={{
                        color: "var(--onboarding-accent)",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      style={{
                        color: "var(--onboarding-accent)",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms || !formData.fullName || !formData.email}
                  className={`onboarding-btn primary ${loading || !formData.agreeToTerms || !formData.fullName || !formData.email ? "disabled" : ""}`}
                  style={{
                    width: "100%",
                    opacity: loading || !formData.agreeToTerms || !formData.fullName || !formData.email ? 0.6 : 1,
                    cursor:
                      loading || !formData.agreeToTerms || !formData.fullName || !formData.email
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" />
                      {getCurrentPrice() === 0 ? "Activating..." : "Creating subscription..."}
                    </>
                  ) : (
                    getCurrentPrice() === 0
                      ? "Activate Free Plan"
                      : `Subscribe with PayPal - $${getCurrentPrice()}`
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "rgba(255, 255, 255, 0.7)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>🔒</span>
                  <span>
                    Secure checkout powered by PayPal
                  </span>
                </div>
                <div>You can cancel anytime from your dashboard</div>
                {getCurrentPrice() > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                    After clicking "Subscribe", you'll be redirected to PayPal to complete payment
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <>
      {paypalClientId ? (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&vault=true&intent=subscription`}
          strategy="lazyOnload"
          onLoad={() => {
            console.log('PayPal SDK loaded successfully');
            console.log('PayPal object available:', typeof (window as any).paypal !== 'undefined');
          }}
          onError={(e) => {
            console.error('PayPal SDK failed to load:', e);
          }}
        />
      ) : (
        <script
          dangerouslySetInnerHTML={{
            __html: `console.warn('PayPal Client ID not found in environment variables');`
          }}
        />
      )}
      <Suspense
        fallback={
          <div className="onboarding-section">
            <div className="onboarding-container">
              <div className="onboarding-content">
                <div className="onboarding-card">
                  <div
                    className="loading-spinner"
                    style={{ margin: "2rem auto" }}
                  />
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      textAlign: "center",
                    }}
                  >
                    Loading checkout...
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </>
  );
}
