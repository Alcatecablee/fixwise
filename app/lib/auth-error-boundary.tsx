"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's an auth-related error
    const isAuthError =
      error.message.includes("Invalid Refresh Token") ||
      error.message.includes("Already Used") ||
      error.message.includes("AuthApiError") ||
      error.name === "AuthApiError";

    if (isAuthError) {
      console.warn("Auth error caught by boundary:", error.message);

      // Clear invalid auth data
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase_session");
          localStorage.removeItem("user_data");
        }
      } catch (e) {
        console.error("Error clearing auth storage:", e);
      }

      return {
        hasError: true,
        errorMessage:
          "Authentication session expired. Please refresh the page.",
      };
    }

    // Re-throw non-auth errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
              <p className="text-gray-300 mb-6">{this.state.errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
