"use client";

import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import Link from "next/link";
import StructuredData from "../../components/StructuredData";

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  layers: number[];
  monthlyFixes: number;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  enterprise?: boolean;
  ctaText: string;
  badge?: string;
  safetyAddOn?: boolean;
  overageRate: number;
  isOneTime?: boolean;
}

export default function PricingPage() {
  const { user, session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loading, setLoading] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Try NeuroLint with basic modernization tools via extensions/CLIs.",
      layers: [1, 2, 3, 4],
      monthlyFixes: -1, // Unlimited
      features: [
        "Unlimited scans & dry runs",
        "Unlimited fixes for Layers 1-4",
        "Configuration modernization",
        "Content standardization",
        "Component intelligence",
        "SSR/Hydration safety",
        "GitHub repo scanning (200 files/scan)",
        "Basic reports (issue counts)",
        "Community support",
        "Access via VS Code extensions or CLI",
      ],
      ctaText: "Start Free",
      overageRate: 0,
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: 29,
      yearlyPrice: 278, // 20% discount
      description: "Full modernization for production teams with all 7 layers.",
      layers: [1, 2, 3, 4, 5, 6, 7],
      monthlyFixes: -1, // Unlimited
      popular: true,
      features: [
        "Unlimited scans & dry runs",
        "Unlimited fixes for all 7 layers",
        "Configuration modernization",
        "Content standardization",
        "Component intelligence", 
        "SSR/Hydration safety",
        "Next.js App Router optimization",
        "Testing & validation",
        "Adaptive pattern learning",
        "GitHub repo scanning (1,000 files/scan)",
        "Detailed reports (PDF/CSV)",
        "Rollback & safety suite (diffs, backups)",
        "API access",
        "CI/CD integration",
        "Team dashboards",
        "Priority email support",
        "Access via extensions, CLI, or Web App",
      ],
      ctaText: "Start Professional",
      badge: "Most Popular",
      overageRate: 0,
      safetyAddOn: true,
    },
    {
      id: "business",
      name: "Business",
      monthlyPrice: 79,
      yearlyPrice: 758, // 20% discount
      description: "Enterprise-grade modernization with advanced features and support.",
      layers: [1, 2, 3, 4, 5, 6, 7],
      monthlyFixes: -1, // Unlimited
      features: [
        "Unlimited scans & dry runs",
        "Unlimited fixes for all 7 layers",
        "All Professional features",
        "Advanced analytics",
        "Custom integrations",
        "GitHub repo scanning (2,500 files/scan)",
        "White-label reports",
        "Priority support (email + phone)",
        "Dedicated account manager",
        "Access via extensions, CLI, or Web App",
      ],
      ctaText: "Start Business",
      overageRate: 0,
      safetyAddOn: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 0, // Custom pricing
      yearlyPrice: 0, // Custom pricing
      description: "Complete modernization with custom rules and priority support.",
      layers: [1, 2, 3, 4, 5, 6, 7],
      monthlyFixes: -1, // Unlimited
      enterprise: true,
      features: [
        "Unlimited scans & dry runs",
        "Unlimited fixes for all 7 layers",
        "All Business features",
        "Custom rules engine",
        "Priority support (email + phone)",
        "Advanced analytics",
        "GitHub repo scanning (unlimited files)",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
        "Access via extensions, CLI, or Web App",
      ],
      ctaText: "Contact Sales",
      badge: "Enterprise Ready",
      overageRate: 0,
      safetyAddOn: true,
    },
  ];

  // Helper functions for pricing calculations
  const getCurrentPrice = (plan: PricingPlan) => {
    return billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getDisplayPrice = (plan: PricingPlan) => {
    const price = getCurrentPrice(plan);
    if (plan.isOneTime) {
      return "$999-$9,999";
    }
    if (billingPeriod === "yearly" && price > 0) {
      return `$${price}/year`;
    }
    return `$${price}/month`;
  };

  const getMonthlySavings = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    const yearlyMonthly = plan.yearlyPrice / 12;
    return Math.round((plan.monthlyPrice - yearlyMonthly) * 100) / 100;
  };

  const getYearlySavings = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    return plan.monthlyPrice * 12 - plan.yearlyPrice;
  };

  const getSavingsPercentage = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    const yearlyTotal = plan.monthlyPrice * 12;
    return Math.round(((yearlyTotal - plan.yearlyPrice) / yearlyTotal) * 100);
  };

  const handlePlanSelection = async (planId: string) => {
    setLoading(planId);

    try {
      if (!user) {
        localStorage.setItem(
          "intended_plan",
          JSON.stringify({ planId, billingPeriod }),
        );
        window.location.href = "/signup";
        return;
      }

      // For free plan, just update user's plan directly
      if (planId === "free") {
        window.location.href = "/dashboard?plan=free";
        return;
      }

      // For migration plan, go to quote request form
      if (planId === "migration") {
        window.location.href = "/migration-quote";
        return;
      }

      window.location.href = `/checkout?plan=${planId}&billing=${billingPeriod}`;
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlanBadge = (planId: string) => {
    if (user?.plan === planId) {
      return <span className="current-plan-badge">Current Plan</span>;
    }
    return null;
  };

  const openDashboard = () => {
    if (user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <>
    <div
      className="onboarding-section"
      style={{
        background: "transparent",
        minHeight: "100vh",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "0",
      }}
    >
      <div style={{ width: "100%", maxWidth: "none", margin: "0 auto" }}>
        <div
          style={{
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "0",
            boxShadow: "none",
            backdropFilter: "blur(5px)",
            width: "100%",
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              width: "100%",
              margin: "0 auto",
              padding: "0 2rem",
            }}
          >
            {/* Header Navigation */}
            <div
              className="hero-nav"
              style={{
                position: "relative",
                marginBottom: "2rem",
                background: "rgba(0, 0, 0, 0.1)",
                borderRadius: "50px",
                padding: "0.5rem 1.5rem",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "600px",
                margin: "0 auto 2rem auto",
              }}
            >
              <div className="nav-left">
                <Link
                  href="/"
                  className="brand-logo"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0, 0, 0, 0.1)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                    alt="NeuroLint"
                    style={{
                      width: "28px",
                      height: "28px",
                      objectFit: "contain",
                    }}
                  />
                </Link>
              </div>
              <div className="nav-center">
                <a
                  href="https://neurolint.dev"
                  className="nav-link"
                  aria-label="Go to NeuroLint homepage"
                >
                  Home
                </a>
                <a
                  href="/pricing"
                  className="nav-link"
                  aria-label="View pricing plans"
                  style={{ color: "rgba(33, 150, 243, 0.9)" }}
                >
                  Pricing
                </a>
                <a
                  href="/docs"
                  className="nav-link"
                  aria-label="View documentation"
                >
                  Docs
                </a>
              </div>
              <div className="nav-right">
                <a
                  href={user ? "/dashboard" : "/login"}
                  className="nav-link"
                  aria-label="Access NeuroLint dashboard"
                >
                  Dashboard
                </a>
              </div>
            </div>

            {/* Hero Section */}
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h1 className="onboarding-title">React & Next.js Modernization Plans</h1>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.125rem",
                  margin: "1rem 0 2rem 0",
                  lineHeight: "1.6",
                }}
              >
                Automated React/Next.js modernization, legacy code upgrades, and
                migration safety—powered by NeuroLint's 6-layer system. Scan individual files via extensions/CLI or entire GitHub repositories through our dashboard. Start free and upgrade for full modernization power.
              </p>

              {/* Billing Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  margin: "2rem 0",
                }}
              >
                <span
                  style={{
                    color:
                      billingPeriod === "monthly"
                        ? "#ffffff"
                        : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                  }}
                >
                  Monthly
                </span>
                <button
                  onClick={() =>
                    setBillingPeriod(
                      billingPeriod === "monthly" ? "yearly" : "monthly",
                    )
                  }
                  style={{
                    position: "relative",
                    width: "60px",
                    height: "30px",
                    background:
                      billingPeriod === "yearly"
                        ? "rgba(33, 150, 243, 0.3)"
                        : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "15px",
                    border:
                      billingPeriod === "yearly"
                        ? "1px solid rgba(33, 150, 243, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  aria-label="Toggle billing period"
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: billingPeriod === "yearly" ? "32px" : "2px",
                      width: "24px",
                      height: "24px",
                      background:
                        billingPeriod === "yearly"
                          ? "rgba(33, 150, 243, 0.9)"
                          : "#ffffff",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </button>
                <span
                  style={{
                    color:
                      billingPeriod === "yearly"
                        ? "#ffffff"
                        : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Yearly{" "}
                  <span
                    style={{
                      background: "rgba(33, 150, 243, 0.2)",
                      color: "rgba(33, 150, 243, 0.9)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    Save 20%
                  </span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2rem",
                marginBottom: "3rem",
                alignItems: "stretch",
              }}
            >
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: plan.popular
                      ? "linear-gradient(135deg, rgba(33, 150, 243, 0.12) 0%, rgba(33, 150, 243, 0.06) 50%, rgba(255, 255, 255, 0.02) 100%)"
                      : plan.enterprise
                        ? "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 215, 0, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
                    border: plan.popular
                      ? "1px solid rgba(33, 150, 243, 0.3)"
                      : plan.enterprise
                        ? "1px solid rgba(255, 215, 0, 0.3)"
                        : "1px solid #000000",
                    borderRadius: "20px",
                    padding: "2rem",
                    backdropFilter: "blur(25px) saturate(1.2)",
                    WebkitBackdropFilter: "blur(25px) saturate(1.2)",
                    boxShadow: plan.popular
                      ? "0 12px 40px rgba(33, 150, 243, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                      : "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100%",
                  }}
                >
                  {/* Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-0.75rem",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      alignItems: "center",
                      zIndex: 10,
                    }}
                  >
                    {plan.badge && (
                      <div
                        style={{
                          background: plan.popular
                            ? "rgba(33, 150, 243, 0.9)"
                            : plan.enterprise
                              ? "rgba(255, 215, 0, 0.9)"
                              : "rgba(255, 255, 255, 0.9)",
                          color: plan.popular
                            ? "#ffffff"
                            : plan.enterprise
                              ? "#000000"
                              : "#000000",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {plan.badge}
                      </div>
                    )}
                  </div>

                  {/* Current Plan Badge - moved to top right */}
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                    }}
                  >
                    {getCurrentPlanBadge(plan.id)}
                  </div>

                  {/* Plan Header */}
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "2rem",
                      paddingBottom: "1.5rem",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        color: "#ffffff",
                        margin: "0 0 1rem 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {plan.name}
                    </h3>

                    <div style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: "0.25rem",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: plan.isOneTime ? "1.75rem" : "2.75rem",
                              fontWeight: "700",
                              color: "#ffffff",
                              lineHeight: "1",
                            }}
                          >
                            {plan.isOneTime ? "$999-$9,999" : `$${getCurrentPrice(plan)}`}
                          </span>
                          <span
                            style={{
                              fontSize: "1rem",
                              color: "rgba(255, 255, 255, 0.7)",
                              fontWeight: "500",
                            }}
                          >
                            {plan.isOneTime
                              ? "(quote-based)"
                              : billingPeriod === "yearly" && getCurrentPrice(plan) > 0
                                ? "/year"
                                : "/month"}
                          </span>
                        </div>
                        {billingPeriod === "yearly" &&
                          getCurrentPrice(plan) > 0 &&
                          !plan.isOneTime && (
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "rgba(33, 150, 243, 0.9)",
                                fontWeight: "500",
                                background: "rgba(33, 150, 243, 0.1)",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                border: "1px solid rgba(33, 150, 243, 0.2)",
                              }}
                            >
                              ${Math.round(getCurrentPrice(plan) / 12)}/month •
                              Save ${getYearlySavings(plan)}/year
                            </div>
                          )}
                      </div>
                    </div>

                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        margin: "0",
                        lineHeight: "1.5",
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                      }}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Fix Quota */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "1rem",
                      marginBottom: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#ffffff",
                        marginBottom: "0.25rem",
                      }}
                    >
                                            {plan.monthlyFixes === 999999
                        ? "Unlimited"
                        : plan.monthlyFixes.toLocaleString()}{" "}
                      upgrades
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      included per month
                    </div>
                    {plan.overageRate > 0 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(255, 255, 255, 0.7)",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                                                ${plan.overageRate} per additional upgrade
                      </div>
                    )}
                  </div>

                  {/* Layer Access */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "1rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "rgba(255, 255, 255, 0.8)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Included Layers
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((layer) => (
                        <div
                          key={layer}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            background: plan.layers?.includes(layer)
                              ? "rgba(33, 150, 243, 0.2)"
                              : "rgba(255, 255, 255, 0.05)",
                            color: plan.layers?.includes(layer)
                              ? "rgba(33, 150, 243, 0.9)"
                              : "rgba(255, 255, 255, 0.3)",
                            border: plan.layers?.includes(layer)
                              ? "1px solid rgba(33, 150, 243, 0.3)"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {layer}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: "2rem", flex: "1" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {plan.features.map((feature, index) => (
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



                  <button
                    className="onboarding-btn primary"
                    onClick={() => handlePlanSelection(plan.id)}
                    disabled={loading === plan.id}
                    style={{
                      width: "100%",
                      opacity: loading === plan.id ? 0.7 : 1,
                      cursor: loading === plan.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading === plan.id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div className="loading-spinner" />
                        Processing...
                      </div>
                    ) : (
                      plan.ctaText
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Extensions/CLIs and Overage Pricing */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.01)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "2rem",
                marginBottom: "3rem",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0 0 1rem 0",
                }}
              >
                VS Code Extensions, CLIs & GitHub Integration
              </h2>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: "0 0 1.5rem 0",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                }}
              >
                Free extensions/CLIs for individual file analysis plus GitHub repository scanning via dashboard.
                Free plan includes 500 upgrades/month (Layer 1 only) and 200 files per GitHub scan. Premium features
                (batch upgrades, additional layers, larger repository scans) require paid plans.
              </p>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  margin: "0 auto",
                  maxWidth: "500px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Overage Pricing:
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#ffffff",
                    fontWeight: "500",
                  }}
                >
                  $0.002 per successful upgrade beyond plan limits (e.g., 5,000 extra upgrades = $10)
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div style={{ marginBottom: "3rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0 0 2rem 0",
                  textAlign: "center",
                }}
              >
                Frequently Asked Questions
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                                        What counts as an "upgrade"?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                                        An upgrade is any successful modernization transformation applied by
                    NeuroLint. Example: migrating class components to hooks, adding React 18
                    compatibility, modernizing Next.js patterns, etc.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                                        What happens if I exceed my monthly upgrades?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                                        You'll continue uninterrupted and be billed at $0.002 per
                    additional upgrade, or you can upgrade your plan.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                    Is dry-run mode free?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                    Yes! Unlimited dry runs are included in all plans.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                    How safe is NeuroLint's code transformation?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                    NeuroLint never corrupts code. Our enterprise-grade safety
                    system validates every transformation before applying it.
                    The Rollback & Safety Add-On provides visual diff previews
                    and instant rollback for user preference changes.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                    Do you offer team-wide plans?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                    Plans are billed per project. Multi-project enterprise
                    licensing is available—Contact Sales.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                    How does GitHub repository scanning work?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                    Connect your GitHub account to scan entire repositories for React/Next.js modernization opportunities. NeuroLint analyzes your code files and provides detailed reports with fix recommendations based on your plan's layer access.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      margin: "0 0 0.75rem 0",
                    }}
                  >
                    What's the difference between monthly and yearly billing?
                  </h4>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                      fontSize: "0.875rem",
                    }}
                  >
                    Yearly billing gives you 20% savings and is
                    billed once annually. Monthly billing charges you each month
                    with no commitment.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div
              style={{
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.01)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "3rem 2rem",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0 0 1rem 0",
                }}
              >
                                Ready to modernize your React and Next.js codebase?
              </h2>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: "0 0 2rem 0",
                  fontSize: "1.125rem",
                }}
              >
                                Start your first modernization scan today
              </p>
              <button
                className="onboarding-btn primary"
                onClick={openDashboard}
                style={{
                  fontSize: "1.1rem",
                  padding: "1rem 2rem",
                }}
              >
                                Start Your First Modernization Scan
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .current-plan-badge {
          background: rgba(76, 175, 80, 0.2);
          color: rgba(76, 175, 80, 0.9);
          padding: 0.3rem 0.6rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
      <StructuredData type="product" />
    </div>
    </>
  );
}
