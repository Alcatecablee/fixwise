"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { user, signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError(
        "Password must contain uppercase, lowercase, and numeric characters",
      );
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
      );

      if (user) {
        // Check for intended plan from pricing page
        const intendedPlan = localStorage.getItem("intended_plan");
        if (intendedPlan) {
          localStorage.removeItem("intended_plan");
          const { planId, billingPeriod } = JSON.parse(intendedPlan);
          router.push(`/checkout?plan=${planId}&billing=${billingPeriod}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        // Show success message for email confirmation
        setSuccess(
          (result as any)?.message ||
            "Account created! Please check your email to confirm your account.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Don't render if user is already logged in
  if (user) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "2px solid rgba(0, 0, 0, 0.8)",
                  borderTop: "2px solid #ffffff",
                  borderRadius: "50%",
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <p className="onboarding-subtitle">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="onboarding-section">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <div className="onboarding-card">
            <div className="onboarding-logo">
              <Link
                href="/"
                className="modal-logo-bee"
                style={{ marginBottom: "1.5rem" }}
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                  alt="NeuroLint"
                />
              </Link>
            </div>
            <h1 className="onboarding-title">Create your account</h1>

            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                    color: "#fca5a5",
                    fontSize: "0.875rem",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    borderRadius: "8px",
                    color: "#86efac",
                    fontSize: "0.875rem",
                    textAlign: "center",
                  }}
                >
                  {success}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(0, 0, 0, 0.8)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "1rem",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    placeholder="John"
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.8)";
                      e.target.style.boxShadow =
                        "0 0 12px rgba(33, 150, 243, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.8)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(0, 0, 0, 0.8)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "1rem",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    placeholder="Doe"
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.8)";
                      e.target.style.boxShadow =
                        "0 0 12px rgba(33, 150, 243, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.8)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  placeholder="john@example.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(33, 150, 243, 0.4)";
                    e.target.style.boxShadow =
                      "0 0 12px rgba(33, 150, 243, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  placeholder="Enter Password"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(33, 150, 243, 0.4)";
                    e.target.style.boxShadow =
                      "0 0 12px rgba(33, 150, 243, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  placeholder="Confirm your password"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(33, 150, 243, 0.4)";
                    e.target.style.boxShadow =
                      "0 0 12px rgba(33, 150, 243, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "2rem",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  style={{
                    width: "16px",
                    height: "16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                    accentColor: "rgba(33, 150, 243, 0.9)",
                    marginTop: "2px",
                  }}
                />
                <label
                  htmlFor="acceptTerms"
                  style={{
                    marginLeft: "0.5rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: "1.5",
                  }}
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    style={{
                      color: "rgba(33, 150, 243, 0.9)",
                      textDecoration: "none",
                    }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    style={{
                      color: "rgba(33, 150, 243, 0.9)",
                      textDecoration: "none",
                    }}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="onboarding-btn primary"
                style={{
                  width: "100%",
                  marginBottom: "1.5rem",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid rgba(0, 0, 0, 0.8)",
                        borderTop: "2px solid #ffffff",
                        borderRadius: "50%",
                        marginRight: "0.75rem",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    Creating account...
                  </div>
                ) : (
                  "Create account"
                )}
              </button>

              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    style={{
                      color: "rgba(33, 150, 243, 0.9)",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
