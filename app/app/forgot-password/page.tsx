"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
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
    const email = formData.email.trim();

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Call password reset API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset email");
      }

      setSuccess(
        "Password reset instructions have been sent to your email address. Please check your inbox and follow the link to reset your password."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    setFormData({
      ...formData,
      [name]: value,
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
            <h1 className="onboarding-title">Reset your password</h1>
            <p className="onboarding-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>

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

              <div style={{ marginBottom: "2rem" }}>
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
                    border: "1px solid rgba(0, 0, 0, 0.8)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  placeholder="Enter your email address"
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
                    Sending instructions...
                  </div>
                ) : (
                  "Send reset instructions"
                )}
              </button>

              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Remember your password?{" "}
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
