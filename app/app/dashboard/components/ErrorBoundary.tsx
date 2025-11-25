"use client";

import { Button } from "@/components/ui/button";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // [NeuroLint] Removed console.error: 
      "Dashboard Error Boundary caught an error:",
      error,
      errorInfo
    

    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">!</div>
            <h3>Something went wrong</h3>
            <p>An unexpected error occurred in this component.</p>

            {process.env.NODE_ENV === "development" && this.state.error &&
            <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            }

            <div className="error-actions">
              <Button className="btn btn-primary" onClick={this.handleReset} >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                aria-label="Reload Page" 
                variant="default"
                className="btn btn-secondary">
                Reload Page
              </Button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              padding: 40px 20px;
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid #000000;
              border-radius: 12px;
              margin: 20px 0;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
              color: #ffffff;
            }

            .error-icon {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              background: rgba(255, 152, 0, 0.2);
              border: 1px solid #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2rem;
              font-weight: 700;
              color: #ff9800;
              margin: 0 auto 16px;
            }

            .error-content h3 {
              color: #ffffff;
              margin: 0 0 12px 0;
              font-size: 1.5rem;
              font-weight: 600;
            }

            .error-content p {
              color: rgba(255, 255, 255, 0.8);
              margin: 0 0 24px 0;
              font-size: 1rem;
              line-height: 1.5;
            }

            .error-details {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid #000000;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              text-align: left;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 12px;
              color: rgba(255, 255, 255, 0.9);
            }

            .error-stack {
              font-family: monospace;
              font-size: 0.85rem;
              color: rgba(255, 255, 255, 0.7);
              white-space: pre-wrap;
              word-break: break-word;
              margin: 0;
              overflow-x: auto;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }

            .btn {
              padding: 10px 20px;
              border-radius: 6px;
              border: none;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              font-size: 0.9rem;
            }

            .btn-primary {
              background: linear-gradient(
                135deg,
                rgba(33, 150, 243, 0.2) 0%,
                rgba(33, 150, 243, 0.15) 50%,
                rgba(255, 255, 255, 0.1) 100%
              );
              border: 1px solid #000000;
              backdrop-filter: blur(20px) saturate(1.2);
              -webkit-backdrop-filter: blur(20px) saturate(1.2);
              color: white;
            }

            .btn-primary:hover {
              background: linear-gradient(
                135deg,
                rgba(33, 150, 243, 0.3) 0%,
                rgba(33, 150, 243, 0.22) 50%,
                rgba(255, 255, 255, 0.12) 100%
              );
              transform: translateY(-2px);
            }

            .btn-secondary {
              background: rgba(255, 255, 255, 0.1);
              color: #ffffff;
              border: 1px solid #000000;
            }

            .btn-secondary:hover {
              background: rgba(255, 255, 255, 0.15);
              transform: translateY(-1px);
            }

            @media (max-width: 768px) {
              .error-boundary {
                min-height: 250px;
                padding: 30px 15px;
              }

              .error-actions {
                flex-direction: column;
                align-items: stretch;
              }

              .btn {
                width: 100%;
                justify-content: center;
              }
            }
          `}</style>
        </div>);

    }

    return this.props.children;
  }
}

// Convenience wrapper for functional components
export function withErrorBoundary<P extends object>(
Component: React.ComponentType<P>,
fallback?: ReactNode,
onError?: (error: Error, errorInfo: ErrorInfo) => void)
{
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>);

  };
}