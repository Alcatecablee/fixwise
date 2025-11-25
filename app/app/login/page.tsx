"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [waitTime, setWaitTime] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Handle OAuth callback from URL fragments
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
          setLoading(true);

          // Parse the URL fragment
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            // Decode JWT token to get user data
            let tokenPayload;
            try {
              const tokenParts = accessToken.split('.');
              if (tokenParts.length !== 3) {
                throw new Error('Invalid JWT token format');
              }
              const base64Payload = tokenParts[1];
              // Add padding if needed
              const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
              const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
              tokenPayload = JSON.parse(decodedPayload);
            } catch (error) {
              console.error('Failed to decode JWT token:', error);
              setError('Invalid authentication token. Please try logging in again.');
              setLoading(false);
              return;
            }

            // Create session object
            const session = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: parseInt(params.get('expires_at') || '0'),
              expires_in: parseInt(params.get('expires_in') || '3600'),
              token_type: params.get('token_type') || 'bearer'
            };

            // Create user object from token
            const user = {
              id: tokenPayload.sub,
              email: tokenPayload.email,
              firstName: tokenPayload.user_metadata?.full_name?.split(' ')[0] || tokenPayload.user_metadata?.name?.split(' ')[0] || '',
              lastName: tokenPayload.user_metadata?.full_name?.split(' ').slice(1).join(' ') || tokenPayload.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
              plan: 'free',
              emailConfirmed: tokenPayload.user_metadata?.email_verified || false,
              createdAt: new Date().toISOString()
            };

            // Store session and user data
            localStorage.setItem('neurolint-supabase-auth', JSON.stringify(session));
            localStorage.setItem('user_data', JSON.stringify(user));

            // Clear the URL fragment
            window.history.replaceState({}, document.title, window.location.pathname);

            // Force page reload to trigger auth context refresh
            window.location.href = '/dashboard';
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError('Failed to complete Google login. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [router]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          redirectTo: '/dashboard'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to initiate ${provider} login`);
      }

      if (data.url) {
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL returned');
      }

    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      setError(error instanceof Error ? error.message : `Failed to login with ${provider}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please fill in all fields");
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

    // Rate limiting on client side
    if (attempts >= 5) {
      setError("Too many failed attempts. Please wait before trying again.");
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password, formData.rememberMe);

      // Check for intended plan from pricing page
      const intendedPlan = localStorage.getItem("intended_plan");
      if (intendedPlan) {
        localStorage.removeItem("intended_plan");
        const { planId, billingPeriod } = JSON.parse(intendedPlan);
        router.push(`/checkout?plan=${planId}&billing=${billingPeriod}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setAttempts((prev) => prev + 1);

      // Handle rate limiting specifically
      if (err instanceof Error && err.message.includes("Too many")) {
        const waitMatch = err.message.match(/(\d+)\s+minutes?/);
        if (waitMatch) {
          const minutes = parseInt(waitMatch[1]);
          setWaitTime(minutes * 60);
          // Start countdown timer
          const timer = setInterval(() => {
            setWaitTime((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }

      setError(err instanceof Error ? err.message : "Login failed");
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
            <h1 className="onboarding-title">Welcome back</h1>

            <form onSubmit={handleSubmit} role="form" aria-label="Sign in form">
              {error && (
                <div className="error-message" id="login-error" role="alert">
                  {error}
                  {waitTime > 0 && (
                    <div className="wait-timer">
                      Please wait {Math.floor(waitTime / 60)}:{(waitTime % 60).toString().padStart(2, '0')} before trying again
                    </div>
                  )}
                </div>
              )}

              <div className="form-field">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  aria-describedby={error ? "login-error" : undefined}
                  autoComplete="email"
                />
              </div>

              <div className="form-field">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  aria-describedby={error ? "login-error" : undefined}
                  autoComplete="current-password"
                />
              </div>

              <div className="form-options">
                <div className="remember-me-container">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <label htmlFor="remember-me" className="checkbox-label">
                    Remember me for 30 days
                  </label>
                </div>

                <Link href="/forgot-password" className="forgot-password-link">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || waitTime > 0}
                className={`onboarding-btn primary ${loading ? 'loading' : ''} ${waitTime > 0 ? 'disabled' : ''}`}
                style={{
                  width: "100%",
                  marginBottom: "1.5rem",
                }}
                aria-describedby={loading ? "loading-message" : undefined}
              >
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner" aria-hidden="true"></div>
                    <span id="loading-message">Signing in...</span>
                  </div>
                ) : waitTime > 0 ? (
                  `Wait ${Math.floor(waitTime / 60)}:${(waitTime % 60).toString().padStart(2, '0')}`
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="oauth-divider">
                <span className="divider-line"></span>
                <span className="divider-text">or continue with</span>
                <span className="divider-line"></span>
              </div>

              <div className="oauth-buttons">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="oauth-btn google-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="oauth-btn github-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="signup-link-container">
                <p className="signup-text">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="signup-link">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-field {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: rgba(0, 0, 0, 0.8);
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }

        .remember-me-container {
          display: flex;
          align-items: center;
        }

        .form-checkbox {
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          accent-color: rgba(33, 150, 243, 0.9);
        }

        .checkbox-label {
          margin-left: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
        }

        .forgot-password-link {
          color: rgba(33, 150, 243, 0.9);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-password-link:hover {
          color: rgba(33, 150, 243, 1);
        }

        .error-message {
          padding: 1rem;
          margin-bottom: 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 0.875rem;
          text-align: center;
        }

        .wait-timer {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .onboarding-btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .onboarding-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          margin-right: 0.75rem;
          animation: spin 1s linear infinite;
        }

        .signup-link-container {
          text-align: center;
          margin-bottom: 2rem;
        }

        .signup-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .signup-link {
          color: rgba(33, 150, 243, 0.9);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .signup-link:hover {
          color: rgba(33, 150, 243, 1);
        }

        .oauth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          gap: 1rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .divider-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .oauth-buttons {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .oauth-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .oauth-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .oauth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-btn:hover:not(:disabled) {
          background: rgba(66, 133, 244, 0.1);
          border-color: rgba(66, 133, 244, 0.3);
        }

        .github-btn:hover:not(:disabled) {
          background: rgba(51, 51, 51, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

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
