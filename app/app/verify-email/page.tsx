"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [token, setToken] = useState("");

  // Get token from URL
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    } else {
      setError("Invalid or missing verification token.");
      setLoading(false);
    }
  }, [searchParams]);

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && user.emailConfirmed) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify email");
      }

      setSuccess(
        "Your email has been successfully verified! You can now access all features of your account."
      );

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      setError("No email address found. Please sign up again.");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend verification email");
      }

      setSuccess(
        "Verification email sent! Please check your inbox and follow the link to verify your email address."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="onboarding-section">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <div className="onboarding-card">
            <div className="onboarding-logo">
              <Link
                href="/"
                className="modal-logo-bee ds-mb-6"
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                  alt="NeuroLint"
                />
              </Link>
            </div>

            {loading ? (
              <>
                <h1 className="onboarding-title">Verifying your email</h1>
                <div className="ds-loading-spinner ds-mx-auto ds-my-8"></div>
                <p className="onboarding-subtitle">
                  Please wait while we verify your email address...
                </p>
              </>
            ) : success ? (
              <>
                <h1 className="onboarding-title">Email verified!</h1>
                <div className="ds-alert ds-alert-success ds-mb-6 ds-text-center">
                  {success}
                </div>
                <p className="onboarding-subtitle">
                  You will be redirected to your dashboard shortly...
                </p>
              </>
            ) : (
              <>
                <h1 className="onboarding-title">Email verification</h1>
                
                {error && (
                  <div className="ds-alert ds-alert-error ds-mb-6 ds-text-center">
                    {error}
                  </div>
                )}

                {!token ? (
                  <>
                    <p className="onboarding-subtitle">
                      Please check your email and click the verification link, or request a new verification email below.
                    </p>

                    {user?.email && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className={`onboarding-btn primary ds-w-full ds-mb-6 ${resendLoading ? 'ds-opacity-70 ds-cursor-not-allowed' : 'ds-cursor-pointer'}`}
                      >
                        {resendLoading ? (
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
                                border: "2px solid rgba(255, 255, 255, 0.3)",
                                borderTop: "2px solid #ffffff",
                                borderRadius: "50%",
                                marginRight: "0.75rem",
                                animation: "spin 1s linear infinite",
                              }}
                            ></div>
                            Sending verification email...
                          </div>
                        ) : (
                          "Resend verification email"
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="onboarding-subtitle">
                    There was an issue verifying your email. The verification link may have expired or been used already.
                  </p>
                )}

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    Already verified?{" "}
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

                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    Need help?{" "}
                    <Link
                      href="/dashboard"
                      style={{
                        color: "rgba(33, 150, 243, 0.9)",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Contact support
                    </Link>
                  </p>
                </div>
              </>
            )}
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
