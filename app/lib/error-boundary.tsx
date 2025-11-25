"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error securely (remove sensitive data)
    const sanitizedError = {
      message: error.message,
      stack: error.stack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "SSR",
      url: typeof window !== "undefined" ? window.location.href : "SSR",
      componentStack: errorInfo.componentStack,
    };

    console.error("React Error Boundary caught an error:", sanitizedError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === "production") {
      this.reportError(sanitizedError);
    }
  }

  private reportError = async (errorData: any) => {
    try {
      // Send error to your logging service
      await fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="error-title">Something went wrong</h2>

            <p className="error-message">
              We encountered an unexpected error. Our team has been notified and
              is working on a fix.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {this.state.errorId && (
              <p className="error-id">
                Error ID: <code>{this.state.errorId}</code>
              </p>
            )}

            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Try Again
              </button>

              <button onClick={this.handleReload} className="btn btn-secondary">
                Reload Page
              </button>

              <a
                href="mailto:support@neurolint.pro?subject=Error Report&body=Error ID: ${this.state.errorId}"
                className="btn btn-outline"
              >
                Contact Support
              </a>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 12px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .error-content {
              text-align: center;
              max-width: 500px;
              color: white;
            }

            .error-icon {
              color: #ef4444;
              margin-bottom: 1.5rem;
            }

            .error-title {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #ffffff;
            }

            .error-message {
              font-size: 1rem;
              color: #a1a1aa;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }

            .error-details {
              margin: 1.5rem 0;
              text-align: left;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 8px;
              padding: 1rem;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 0.5rem;
              color: #f59e0b;
            }

            .error-stack {
              font-family: monospace;
              font-size: 0.875rem;
              color: #fca5a5;
              white-space: pre-wrap;
              overflow-x: auto;
              max-height: 200px;
              overflow-y: auto;
              background: rgba(0, 0, 0, 0.2);
              padding: 0.75rem;
              border-radius: 4px;
              margin-top: 0.5rem;
            }

            .error-id {
              font-size: 0.875rem;
              color: #6b7280;
              margin-bottom: 1.5rem;
            }

            .error-id code {
              background: rgba(255, 255, 255, 0.1);
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-family: monospace;
            }

            .error-actions {
              display: flex;
              gap: 0.75rem;
              justify-content: center;
              flex-wrap: wrap;
            }

            .btn {
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              font-weight: 500;
              text-decoration: none;
              border: none;
              cursor: pointer;
              font-size: 0.875rem;
              transition: all 0.2s;
            }

            .btn-primary {
              background: #3b82f6;
              color: white;
            }

            .btn-primary:hover {
              background: #2563eb;
            }

            .btn-secondary {
              background: #6b7280;
              color: white;
            }

            .btn-secondary:hover {
              background: #4b5563;
            }

            .btn-outline {
              background: transparent;
              color: #a1a1aa;
              border: 1px solid #374151;
            }

            .btn-outline:hover {
              background: rgba(255, 255, 255, 0.05);
              color: white;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for adding error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "SSR",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "SSR",
    };

    console.error("Manual error report:", errorData);

    if (process.env.NODE_ENV === "production") {
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch((reportingError) => {
        console.error("Failed to report error:", reportingError);
      });
    }
  }, []);

  return { reportError };
}
