"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class NextJSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: Math.random().toString(36).substr(2, 9),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    const errorContext = {
      message: error.message,
      stack: error.stack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      componentStack: errorInfo.componentStack,
      isNextJSRuntimeError: this.isNextJSRuntimeError(error),
    };

    console.error('NextJS Error Boundary caught an error:', errorContext);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Handle Next.js specific runtime errors
    if (this.isNextJSRuntimeError(error)) {
      this.handleNextJSRuntimeError(error);
    }
  }

  private isNextJSRuntimeError(error: Error): boolean {
    const nextJSErrorPatterns = [
      'app-route.runtime.dev.js',
      'Failed to fetch',
      'RSC payload',
      'Fast Refresh',
      'fetchServerResponse',
      'webpack',
      'fullstory',
    ];

    return nextJSErrorPatterns.some(pattern => 
      error.message.includes(pattern) || 
      error.stack?.includes(pattern)
    );
  }

  private handleNextJSRuntimeError(error: Error) {
    // For Next.js runtime errors, try to recover gracefully
    console.warn('Next.js runtime error detected, attempting recovery...');
    
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear service worker cache if available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Clear localStorage cache
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: Math.random().toString(36).substr(2, 9),
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleClearCache = () => {
    if (typeof window !== 'undefined') {
      // Clear browser cache and reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNextJSError = this.state.error && this.isNextJSRuntimeError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isNextJSError ? 'Development Server Error' : 'Something went wrong'}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {isNextJSError 
                  ? 'A Next.js runtime error occurred. This is likely a development server issue.'
                  : 'An unexpected error occurred in this component.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
                
                {isNextJSError && (
                  <button
                    onClick={this.handleClearCache}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                  >
                    Clear Cache & Reload
                  </button>
                )}
                
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export const useNextJSErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    console.error('NextJS Error Handler:', { error, errorInfo });
  }, []);

  return { handleError };
}; 