"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary specifically designed to handle external service errors
 * without breaking the entire application
 */
export class ExternalServiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an external service error that should be handled gracefully
    const isExternalError =
      error.message.includes("Failed to fetch") ||
      error.message.includes("fullstory") ||
      error.message.includes("webpack") ||
      error.message.includes("Network request failed") ||
      error.name === "NetworkError" ||
      error.name === "AbortError";

    if (isExternalError) {
      return {
        hasError: true,
        error,
      };
    }

    // Re-throw non-external errors to be handled by parent error boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.warn("External service error caught by boundary:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Return custom fallback UI or props.fallback
      return (
        this.props.fallback || (
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 193, 7, 0.1)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              borderRadius: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.9rem",
              margin: "1rem 0",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              ⚠️ External Service Issue
            </div>
            <div>
              Some external services are temporarily unavailable, but the main
              application continues to work normally.
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                marginTop: "0.5rem",
                padding: "0.25rem 0.5rem",
                background: "rgba(255, 193, 7, 0.2)",
                border: "1px solid rgba(255, 193, 7, 0.4)",
                borderRadius: "4px",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Dismiss
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components that might be affected by external service errors
 */
export function withExternalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WrappedComponent(props: P) {
    return (
      <ExternalServiceErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ExternalServiceErrorBoundary>
    );
  };
}

/**
 * Hook to handle external service errors in functional components
 */
export function useExternalErrorHandler() {
  const handleError = React.useCallback(
    (error: unknown, serviceName?: string) => {
      if (error instanceof Error) {
        const isExternalError =
          error.message.includes("Failed to fetch") ||
          error.message.includes("fullstory") ||
          error.message.includes("webpack") ||
          error.message.includes("Network request failed") ||
          error.name === "NetworkError" ||
          error.name === "AbortError";

        if (isExternalError) {
          console.warn(
            `External service error${serviceName ? ` in ${serviceName}` : ""}:`,
            error.message,
          );
          // Could dispatch to a global error state or show notifications here
          return true; // Indicates error was handled
        }
      }
      return false; // Indicates error should be handled elsewhere
    },
    [],
  );

  return { handleError };
}
