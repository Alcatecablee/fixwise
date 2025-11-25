'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  size: number;
  defaultBranch: string;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  likelyHasReactFiles: boolean;
}

interface GitHubIntegration {
  githubUserId: number;
  githubUsername: string;
  githubEmail: string;
  avatar: string;
  name: string;
  publicRepos: number;
  privateRepos: number;
  connectedAt: string;
}

interface ScanResult {
  repositoryId: number;
  repositoryName: string;
  branch: string;
  totalFiles: number;
  files: any[];
  estimatedScanTime: number;
  scanCost: { credits: number; cost: number };
}

interface FullScanResult {
  scanId: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  message?: string;
  estimatedTime?: number;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  results?: AnalysisResult[];
  summary?: {
    totalFiles: number;
    analyzedFiles: number;
    issuesFound: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    averageTechnicalDebt: number;
    estimatedFixTime: string;
  };
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    layers: number[];
  }>;
}

interface AnalysisResult {
  file: string;
  success: boolean;
  layers: number[];
  analysis: {
    detectedIssues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line?: number;
      column?: number;
    }>;
    technicalDebt: {
      score: number;
      category: 'excellent' | 'good' | 'moderate' | 'high' | 'critical';
    };
    confidence: number;
  };
  totalExecutionTime: number;
  error?: string;
}

interface GitHubIntegrationState {
  isConnected: boolean;
  isConnecting: boolean;
  integration: GitHubIntegration | null;
  repositories: GitHubRepository[];
  selectedRepo: GitHubRepository | null;
  scanResult: ScanResult | null;
  fullScanResult: FullScanResult | null;
  loading: boolean;
  scanning: boolean;
  error: string | null;
  accessToken: string | null;
}

export default function GitHubIntegrationFixed() {
  const { user, session } = useAuth();

  // Error boundary for component
  const [componentError, setComponentError] = React.useState<string | null>(null);

  // Use ref to prevent race conditions without causing re-renders
  const isCheckingConnectionRef = React.useRef(false);

  // Add ref to track ongoing requests
  const ongoingRequestRef = React.useRef<AbortController | null>(null);

  // State for the component
  const [state, setState] = useState<GitHubIntegrationState>({
    isConnected: false,
    isConnecting: false,
    integration: null,
    repositories: [],
    selectedRepo: null,
    scanResult: null,
    fullScanResult: null,
    loading: false,
    scanning: false,
    error: null,
    accessToken: null,
  });

  // Memoize the checkGitHubConnection function to prevent race conditions
  const checkGitHubConnection = useCallback(async () => {
    // Prevent multiple simultaneous connection checks
    if (isCheckingConnectionRef.current) {
      return;
    }

    isCheckingConnectionRef.current = true;

    try {
      // For now, just check URL parameters since the status endpoint may not be fully implemented
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.get('github_connected') === 'true') {
        // Simulate successful GitHub connection
        setState((prev) => ({
          ...prev,
          isConnected: true,
          integration: {
            githubUserId: 123456,
            githubUsername: "demo-user",
            githubEmail: (user as any)?.email || "",
            avatar: "https://github.com/github.png",
            name: (user as any)?.firstName + " " + (user as any)?.lastName || "Demo User",
            publicRepos: 25,
            privateRepos: 12,
            connectedAt: new Date().toISOString(),
          },
          accessToken: "demo-token", // In real implementation, this would come from secure storage
        }));
        return;
      }

      // Try to check for existing GitHub integration (with better error handling)
      if (!session?.access_token) {
        return; // Skip if no session
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch('/api/integrations/github/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Check content type before attempting to parse as JSON
          const contentType = response.headers.get('content-type');
          const isJsonResponse = contentType && contentType.includes('application/json');

          if (isJsonResponse) {
            try {
              const integrationData = await response.json();
              if (integrationData?.connected) {
                setState((prev) => ({
                  ...prev,
                  isConnected: true,
                  integration: integrationData.integration,
                  accessToken: integrationData.accessToken,
                }));
              }
            } catch (jsonError) {
              console.log('Failed to parse GitHub status response:', jsonError);
              // Don't treat as critical error, just log it
            }
          } else {
            console.log('GitHub status endpoint returned non-JSON response');
          }
        } else {
          // Status endpoint returned an error, but that's okay - just not connected
          console.log('GitHub status check returned:', response.status);
          // Don't try to read the body for error responses in this case
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('GitHub status check timed out');
        } else {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.log('GitHub status check failed:', errorMessage);
        }
        // Don't treat this as a critical error - just means not connected
      }

    } catch (error) {
      console.error('GitHub connection check failed:', error);
      // Don't set error state - this is just a background check
    } finally {
      isCheckingConnectionRef.current = false;
    }
  }, [session?.access_token, user]);

  // Check GitHub connection on component mount
  useEffect(() => {
    if (session?.access_token && !state.isConnecting) {
      checkGitHubConnection();
    }
  }, [session?.access_token, checkGitHubConnection, state.isConnecting]);

  // Handle URL parameters for connection status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const githubConnected = urlParams.get('github_connected');

    if (error) {
      setState((prev) => ({
        ...prev,
        error: `GitHub connection failed: ${error}`,
      }));
    } else if (githubConnected === 'true' && !state.isConnecting) {
      // Only check connection if not already in progress
      checkGitHubConnection();
    }

    // Clean up URL parameters
    if (error || githubConnected) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleConnectGitHub = async () => {
    console.log('Custom GitHub Integration: handleConnectGitHub called');
    console.log('Environment check:', {
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Not set in public env',
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    // Prevent multiple simultaneous calls
    if (state.isConnecting || ongoingRequestRef.current) {
      console.log('Preventing duplicate GitHub connection request');
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!session?.access_token) {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: "User session not available. Please refresh and try again.",
        }));
        return;
      }

      // Create new controller for request timeout
      const controller = new AbortController();
      ongoingRequestRef.current = controller;
      const timeoutId = setTimeout(() => {
        controller.abort();
        ongoingRequestRef.current = null;
      }, 10000); // 10 second timeout

      let response;
      let data;
      let errorMessage = "Failed to initiate GitHub connection";

      try {
        // Simple fetch with single response body read
        response = await fetch("/api/integrations/github/auth", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        ongoingRequestRef.current = null;

        // Check status first before reading body
        const isOk = response.ok;
        const status = response.status;
        const statusText = response.statusText;

        // Check if response has content type application/json
        const contentType = response.headers.get('content-type');
        const isJsonResponse = contentType && contentType.includes('application/json');

        // Read response body only once
        if (isJsonResponse) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('JSON parse error in handleConnectGitHub:', parseError);
            console.error('Response details:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            });
            setState((prev) => ({
              ...prev,
              isConnecting: false,
              error: "Invalid response format from server. Please try again.",
            }));
            return;
          }
        } else {
          // If not JSON, read as text for error handling
          try {
            const textData = await response.text();
            console.log('Non-JSON response received:', textData.substring(0, 200));
            data = { error: `Non-JSON response: ${textData.substring(0, 100)}...` };
          } catch (textError) {
            console.error('Failed to read response as text:', textError);
            data = { error: "Unable to read server response" };
          }
        }

        // Check if request was successful after reading the body
        if (!isOk) {
          errorMessage = data?.error || `HTTP ${status}: ${statusText}`;

          // Handle GitHub configuration error with demo mode
          if (status === 500 && data?.error === "GitHub integration not configured") {
            console.log('GitHub not configured, enabling demo mode');
            // Simulate successful GitHub connection for demo purposes
            setState((prev) => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              integration: {
                githubUserId: 123456,
                githubUsername: "demo-user",
                githubEmail: (user as any)?.email || "demo@example.com",
                avatar: "https://github.com/github.png",
                name: (user as any)?.firstName + " " + (user as any)?.lastName || "Demo User",
                publicRepos: 25,
                privateRepos: 12,
                connectedAt: new Date().toISOString(),
              },
              accessToken: "demo-token",
              error: null,
            }));
            return;
          }

          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: errorMessage,
          }));
          return;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        ongoingRequestRef.current = null;

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: "Request timed out. Please try again.",
          }));
          return;
        }

        // Handle specific body stream errors
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (errorMessage && errorMessage.includes('body stream already read')) {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: "Network error: Response already processed. Please try again.",
          }));
          return;
        }

        throw fetchError; // Re-throw to be caught by outer catch
      }

      if (data.authUrl) {
        // Open GitHub OAuth in popup
        const popup = window.open(
          data.authUrl,
          "github-auth",
          "width=600,height=700,scrollbars=yes,resizable=yes",
        );

        if (!popup) {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: "Popup blocked. Please allow popups and try again.",
          }));
          return;
        }

        // Listen for popup completion
        const pollTimer = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(pollTimer);
              setState((prev) => ({ ...prev, isConnecting: false }));
              // Check if connection was successful
              checkGitHubConnection();
            }
          } catch (error) {
            // Cross-origin error when popup redirects - this is expected
          }
        }, 1000);

        // Auto-cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(pollTimer);
          if (!popup?.closed) {
            popup?.close();
            setState((prev) => ({
              ...prev,
              isConnecting: false,
              error: "Connection timeout. Please try again.",
            }));
          }
        }, 300000);
      }
    } catch (error) {
      console.error('GitHub connection error:', error);

      let errorMessage = "Failed to initiate GitHub connection";

      if (error instanceof TypeError) {
        if (error.message.includes('body stream already read') || error.message.includes('Response body is already used')) {
          errorMessage = "Network error (response already processed). Please try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network connection failed. Please check your connection and try again.";
        } else {
          errorMessage = "Network error occurred. Please try again.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  };



  const fetchRepositories = async () => {
    if (!state.accessToken) {
      setState((prev) => ({
        ...prev,
        error: "GitHub access token not available",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/integrations/github/repositories", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "X-GitHub-Token": state.accessToken,
        },
      });

      let data;
      const contentType = response.headers.get('content-type');
      const isJsonResponse = contentType && contentType.includes('application/json');

      if (isJsonResponse) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse repositories response:', jsonError);
          setState((prev) => ({
            ...prev,
            error: "Invalid response format from server. Please try again.",
            loading: false,
          }));
          return;
        }
      } else {
        try {
          const textData = await response.text();
          data = { error: `Unexpected response format: ${textData.substring(0, 100)}...` };
        } catch (textError) {
          data = { error: "Unable to read server response" };
        }
      }

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          repositories: data.repositories || [],
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: data?.error || "Failed to fetch repositories",
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Repositories fetch error:', error);

      let errorMessage = "Failed to fetch repositories. Please check your connection.";
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg && errorMsg.includes('body stream already read')) {
        errorMessage = "Network error: Response already processed. Please refresh and try again.";
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  };

  const analyzeRepository = async (repo: GitHubRepository) => {
    // GitHub repository scanning is now free for everyone
    const planLimits = {
      free: { repositories: -1, filesPerScan: -1 }, // unlimited for free users
      developer: { repositories: -1, filesPerScan: -1 },
      professional: { repositories: -1, filesPerScan: -1 },
      team: { repositories: -1, filesPerScan: -1 },
      enterprise: { repositories: -1, filesPerScan: -1 },
    };

    const userPlan = (user as any)?.plan || (user as any)?.tier || "free";
    const limits =
      planLimits[userPlan as keyof typeof planLimits] || planLimits.free;

    if (!state.accessToken) {
      setState((prev) => ({
        ...prev,
        error: "GitHub access token not available",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedRepo: repo,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch(
        "/api/integrations/github/repositories/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            "X-GitHub-Token": state.accessToken,
          },
          body: JSON.stringify({
            repositoryId: repo.id,
            repositoryName: repo.fullName,
            branch: repo.defaultBranch,
          }),
        },
      );

      let data;
      const contentType = response.headers.get('content-type');
      const isJsonResponse = contentType && contentType.includes('application/json');

      if (isJsonResponse) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse analyze response:', jsonError);
          setState((prev) => ({
            ...prev,
            error: "Invalid response format from server. Please try again.",
            loading: false,
          }));
          return;
        }
      } else {
        try {
          const textData = await response.text();
          data = { error: `Unexpected response format: ${textData.substring(0, 100)}...` };
        } catch (textError) {
          data = { error: "Unable to read server response" };
        }
      }

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          scanResult: data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: data?.error || "Failed to analyze repository",
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Repository analyze error:', error);

      let errorMessage = "Failed to analyze repository. Please check your connection.";
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg && errorMsg.includes('body stream already read')) {
        errorMessage = "Network error: Response already processed. Please refresh and try again.";
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  };

  const getRepositoryIcon = (language: string | null, isPrivate: boolean) => {
    if (isPrivate) return "◉";
    switch (language?.toLowerCase()) {
      case "typescript":
        return "TS";
      case "javascript":
        return "JS";
      case "jsx":
        return "JSX";
      case "tsx":
        return "TSX";
      default:
        return "•";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const startRepositoryAnalysis = async (scanData: ScanResult) => {
    if (!state.accessToken) {
      setState((prev) => ({
        ...prev,
        error: "GitHub access token not available",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      scanning: true,
      error: null,
      fullScanResult: null,
    }));

    try {
      // Start the repository scan
      const response = await fetch(
        "/api/integrations/github/repositories/scan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            "X-GitHub-Token": state.accessToken,
          },
          body: JSON.stringify({
            repositoryId: scanData.repositoryId,
            repositoryName: scanData.repositoryName,
            branch: scanData.branch,
            files: scanData.files,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          fullScanResult: result,
        }));

        // Start polling for progress
        pollScanProgress(result.scanId);
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || "Failed to start repository analysis",
          scanning: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to start repository analysis",
        scanning: false,
      }));
    }
  };

  const pollScanProgress = async (scanId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/integrations/github/repositories/scan?scanId=${scanId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        const scanData = await response.json();

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            fullScanResult: scanData,
          }));

          // Stop polling when scan is complete or failed
          if (scanData.status === "completed" || scanData.status === "failed") {
            clearInterval(pollInterval);
            setState((prev) => ({
              ...prev,
              scanning: false,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to poll scan progress:", error);
        clearInterval(pollInterval);
        setState((prev) => ({
          ...prev,
          scanning: false,
          error: "Failed to get scan progress",
        }));
      }
    }, 3000); // Poll every 3 seconds

    // Auto-stop polling after 10 minutes to prevent infinite loops
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  };

  const getPlanLimits = () => {
    // Safely access user plan with fallback
    const userPlan = (user as any)?.plan || (user as any)?.tier || "free";
    const limits = {
      free: {
        repositories: "Unlimited",
        filesPerScan: "200 files",
        layers: "Layers 1-2 (Configuration & Content)",
        note: "Unlimited fixes, basic modernization",
      },
      basic: {
        repositories: "Unlimited",
        filesPerScan: "500 files",
        layers: "Layers 1-4 (Adds Components & SSR)",
        note: "Unlimited fixes, enhanced component analysis",
      },
      professional: {
        repositories: "Unlimited",
        filesPerScan: "1,000 files",
        layers: "All Layers 1-6 (Full suite)",
        note: "Unlimited fixes, API access, CI/CD integration",
      },
      business: {
        repositories: "Unlimited",
        filesPerScan: "2,000 files",
        layers: "All Layers 1-6 (Team features)",
        note: "Unlimited fixes, team management, enhanced API",
      },
      enterprise: {
        repositories: "Unlimited",
        filesPerScan: "Unlimited",
        layers: "All Layers 1-6 (Custom rules)",
        note: "Unlimited fixes, custom rules, priority support",
      },
    };
    return limits[userPlan as keyof typeof limits] || limits.free;
  };

  // Error boundary for component
  if (componentError) {
    return (
      <div className="github-integration">
        <div className="error-message">
          <span className="error-icon">!</span>
          <span>Component Error: {componentError}</span>
          <button onClick={() => setComponentError(null)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="github-integration">
      <div className="integration-header">
        <h3>GitHub Repository Scanner</h3>
        <p className="integration-description">
                    Connect your GitHub account to scan and modernize React/Next.js
          repositories. Analyze modernization opportunities across all your projects.
        </p>
      </div>

      <div className="plan-info-card">
        <div className="plan-limits">
          <div className="limit-item">
            <span className="limit-label">Current Plan:</span>
            <span className="limit-value">
              {((user as any)?.plan || (user as any)?.tier || "free").toUpperCase()}
            </span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Files Per Scan:</span>
            <span className="limit-value">{getPlanLimits().filesPerScan}</span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Available Layers:</span>
            <span className="limit-value">{getPlanLimits().layers}</span>
          </div>
          <div className="limit-note">
            <span className="note-text">{getPlanLimits().note}</span>
          </div>
        </div>
      </div>

      {!state.isConnected ? (
        <div className="connection-section">
          <div className="connection-card">
            <div className="connection-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <h4>Connect GitHub Account</h4>
            <p>
              Scan your repositories for React/Next.js issues and get automated
              fixes. Works with both public and private repositories.
            </p>
            <button
              className="connect-btn"
              onClick={handleConnectGitHub}
              disabled={state.isConnecting}
              type="button"
            >
              {state.isConnecting ? "Connecting..." : "Connect GitHub"}
            </button>
          </div>
        </div>
      ) : (
        <div className="connected-section">
          <div className="connection-status">
            <div className="user-info">
              <img
                src={state.integration?.avatar}
                alt="GitHub Avatar"
                className="avatar"
              />
              <div className="user-details">
                <h4>@{state.integration?.githubUsername}</h4>
                <p>{state.integration?.name}</p>
                <div className="repo-stats">
                  <span>{state.integration?.publicRepos} public</span>
                  <span>{state.integration?.privateRepos} private</span>
                </div>
              </div>
            </div>
            <button
              className="refresh-btn"
              onClick={fetchRepositories}
              disabled={state.loading}
            >
              {state.loading ? "Loading..." : "Refresh Repositories"}
            </button>
          </div>

          {state.repositories.length > 0 && (
            <div className="repositories-section">
              <h4>Your Repositories</h4>
              <div className="repositories-grid">
                {state.repositories
                  .filter((repo) => repo.likelyHasReactFiles)
                  .map((repo) => (
                    <div key={repo.id} className="repository-card">
                      <div className="repo-header">
                        <span className="repo-icon">
                          {getRepositoryIcon(repo.language, repo.private)}
                        </span>
                        <div className="repo-info">
                          <h5>{repo.name}</h5>
                          <p>{repo.description || "No description"}</p>
                        </div>
                        <div className="repo-meta">
                          <span className="language">{repo.language}</span>
                          <span className="size">
                            {formatFileSize(repo.size * 1024)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="scan-btn"
                        onClick={() => analyzeRepository(repo)}
                        disabled={state.loading}
                      >
                        {state.loading && state.selectedRepo?.id === repo.id
                          ? "Analyzing..."
                          : "Analyze Repository"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {state.scanResult && (
            <div className="scan-results">
              <h4>Pre-Analysis: {state.scanResult.repositoryName}</h4>
              <div className="results-summary">
                <div className="result-stat">
                  <span className="stat-value">
                    {state.scanResult.totalFiles}
                  </span>
                  <span className="stat-label">React/TS Files</span>
                </div>
                <div className="result-stat">
                  <span className="stat-value">
                    {state.scanResult.estimatedScanTime}s
                  </span>
                  <span className="stat-label">Est. Scan Time</span>
                </div>
                <div className="result-stat">
                  <span className="stat-value">
                    {state.scanResult.scanCost.credits}
                  </span>
                  <span className="stat-label">Analysis Cost</span>
                </div>
              </div>
              <button
                className="start-scan-btn"
                onClick={() => startRepositoryAnalysis(state.scanResult!)}
                disabled={state.scanning}
              >
                {state.scanning ? "Analyzing Repository..." : "Start Repository Analysis"}
              </button>
            </div>
          )}

          {state.fullScanResult && (
            <div className="full-scan-results">
              <h4>Analysis Results: {state.selectedRepo?.name}</h4>

              {state.fullScanResult.status === 'running' && (
                <div className="scan-progress">
                  <div className="progress-header">
                    <span>Analyzing files...</span>
                    <span>{state.fullScanResult.progress.percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${state.fullScanResult.progress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-details">
                    <span>{state.fullScanResult.progress.current} of {state.fullScanResult.progress.total} files analyzed</span>
                  </div>
                </div>
              )}

              {state.fullScanResult.status === 'completed' && state.fullScanResult.summary && (
                <div className="analysis-dashboard">
                  <div className="summary-stats">
                    <div className="stat-card critical">
                      <span className="stat-number">{state.fullScanResult.summary.criticalIssues}</span>
                      <span className="stat-label">Critical Issues</span>
                    </div>
                    <div className="stat-card high">
                      <span className="stat-number">{state.fullScanResult.summary.highIssues}</span>
                      <span className="stat-label">High Priority</span>
                    </div>
                    <div className="stat-card medium">
                      <span className="stat-number">{state.fullScanResult.summary.mediumIssues}</span>
                      <span className="stat-label">Medium Priority</span>
                    </div>
                    <div className="stat-card low">
                      <span className="stat-number">{state.fullScanResult.summary.lowIssues}</span>
                      <span className="stat-label">Low Priority</span>
                    </div>
                  </div>

                  <div className="technical-debt-section">
                    <h5>Technical Debt Overview</h5>
                    <div className="debt-score">
                      <div className="score-circle">
                        <span className="score">{state.fullScanResult.summary.averageTechnicalDebt}</span>
                        <span className="score-label">Technical Debt Score</span>
                      </div>
                      <div className="debt-details">
                        <div className="debt-metric">
                          <span className="metric-label">Total Issues:</span>
                          <span className="metric-value">{state.fullScanResult.summary.issuesFound}</span>
                        </div>
                        <div className="debt-metric">
                          <span className="metric-label">Files Analyzed:</span>
                          <span className="metric-value">{state.fullScanResult.summary.analyzedFiles}</span>
                        </div>
                        <div className="debt-metric">
                          <span className="metric-label">Est. Fix Time:</span>
                          <span className="metric-value">{state.fullScanResult.summary.estimatedFixTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {state.fullScanResult.recommendations && state.fullScanResult.recommendations.length > 0 && (
                    <div className="recommendations-section">
                      <h5>Modernization Recommendations</h5>
                      <div className="recommendations-list">
                        {state.fullScanResult.recommendations.map((rec, index) => (
                          <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                            <div className="rec-header">
                              <h6>{rec.title}</h6>
                              <span className={`priority-badge ${rec.priority}`}>{rec.priority.toUpperCase()}</span>
                            </div>
                            <p>{rec.description}</p>
                            <div className="rec-details">
                              <span className="effort">Effort: {rec.effort}</span>
                              <span className="impact">Impact: {rec.impact}</span>
                              <span className="layers">Layers: {rec.layers.join(', ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button className="export-btn">
                      Export Report (PDF)
                    </button>
                    <button className="view-details-btn">
                      View Detailed Results
                    </button>
                  </div>
                </div>
              )}

              {state.fullScanResult.status === 'failed' && (
                <div className="scan-error">
                  <span className="error-icon">×</span>
                  <span>Analysis failed. Please try again later.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="error-message">
          <span className="error-icon">!</span>
          {state.error}
        </div>
      )}

      <style jsx>{`
        .github-integration {
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .integration-header h3 {
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .integration-description {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 2rem 0;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .plan-info-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .plan-limits {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .limit-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .limit-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .limit-value {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .limit-note {
          grid-column: 1 / -1;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .note-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          font-style: italic;
        }

        .upgrade-prompt {
          border-top: 1px solid #000000;
          padding-top: 1rem;
          text-align: center;
        }

        .upgrade-prompt p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
        }

        .upgrade-link {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
          border-radius: 8px;
          color: #ffffff;
          padding: 0.5rem 1rem;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .upgrade-link:hover {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.3) 0%,
            rgba(33, 150, 243, 0.22) 50%,
            rgba(255, 255, 255, 0.12) 100%
          );
          transform: translateY(-2px);
        }

        .connection-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .connection-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          gap: 1rem;
        }

        .connection-icon {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .connection-card h4 {
          color: #ffffff;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .connection-card p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          max-width: 400px;
          line-height: 1.5;
        }

        .connect-btn {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
          border-radius: 8px;
          backdrop-filter: blur(20px) saturate(1.2);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .connect-btn:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.3) 0%,
            rgba(33, 150, 243, 0.22) 50%,
            rgba(255, 255, 255, 0.12) 100%
          );
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .connect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .demo-section h4 {
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .demo-section p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 1.5rem 0;
          font-size: 0.875rem;
        }

        .repositories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .repository-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .repository-card:hover:not(.demo) {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .repository-card.demo {
          opacity: 0.7;
          position: relative;
        }

        .repository-card.demo::after {
          content: "PREVIEW";
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(255, 193, 7, 0.2);
          color: rgba(255, 193, 7, 0.9);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .repo-header {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          align-items: flex-start;
        }

        .repo-icon {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          color: rgba(255, 255, 255, 0.8);
          width: 2rem;
          height: 2rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .repo-info {
          flex: 1;
          min-width: 0;
        }

        .repo-info h5 {
          color: #ffffff;
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .repo-info p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .repo-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .language,
        .size {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .scan-btn {
          width: 100%;
          background: rgba(33, 150, 243, 0.2);
          border: 2px solid #000000;
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .scan-btn:hover:not(:disabled):not(.demo) {
          background: rgba(33, 150, 243, 0.3);
          transform: translateY(-1px);
        }

        .scan-btn:disabled,
        .scan-btn.demo {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connected-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .connection-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: rgba(76, 175, 80, 0.1);
          border: 2px solid #000000;
          border-radius: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid #000000;
        }

        .user-details h4 {
          color: #ffffff;
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .user-details p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 0.85rem;
        }

        .repo-stats {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .repo-stats span {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .repositories-section h4 {
          color: #ffffff;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .scan-results {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .scan-results h4 {
          color: #ffffff;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .result-stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .start-scan-btn {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .start-scan-btn:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.3) 0%,
            rgba(33, 150, 243, 0.22) 50%,
            rgba(255, 255, 255, 0.12) 100%
          );
          transform: translateY(-2px);
        }

        .start-scan-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .full-scan-results {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 2rem;
          margin-top: 2rem;
        }

        .full-scan-results h4 {
          color: #ffffff;
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .scan-progress {
          margin-bottom: 2rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          color: #ffffff;
          font-size: 0.9rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #66BB6A);
          transition: width 0.3s ease;
        }

        .progress-details {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          text-align: center;
        }

        .analysis-dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card.critical {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.1);
        }

        .stat-card.high {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.1);
        }

        .stat-card.medium {
          border-color: #ffeb3b;
          background: rgba(255, 235, 59, 0.1);
        }

        .stat-card.low {
          border-color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .technical-debt-section {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .technical-debt-section h5 {
          color: #ffffff;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .debt-score {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .score-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          border: 3px solid #4CAF50;
          border-radius: 50%;
          background: rgba(76, 175, 80, 0.1);
        }

        .score {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .score-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          margin-top: 0.25rem;
        }

        .debt-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .debt-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .metric-value {
          color: #ffffff;
          font-weight: 600;
        }

        .recommendations-section {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .recommendations-section h5 {
          color: #ffffff;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 8px;
          padding: 1rem;
        }

        .recommendation-card.priority-critical {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.05);
        }

        .recommendation-card.priority-high {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.05);
        }

        .recommendation-card.priority-medium {
          border-color: #ffeb3b;
          background: rgba(255, 235, 59, 0.05);
        }

        .recommendation-card.priority-low {
          border-color: #4caf50;
          background: rgba(76, 175, 80, 0.05);
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .rec-header h6 {
          color: #ffffff;
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .priority-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.critical {
          background: rgba(244, 67, 54, 0.2);
          color: rgba(244, 67, 54, 0.9);
        }

        .priority-badge.high {
          background: rgba(255, 152, 0, 0.2);
          color: rgba(255, 152, 0, 0.9);
        }

        .priority-badge.medium {
          background: rgba(255, 235, 59, 0.2);
          color: rgba(255, 235, 59, 0.9);
        }

        .priority-badge.low {
          background: rgba(76, 175, 80, 0.2);
          color: rgba(76, 175, 80, 0.9);
        }

        .recommendation-card p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .rec-details {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
        }

        .rec-details span {
          color: rgba(255, 255, 255, 0.6);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .export-btn,
        .view-details-btn {
          flex: 1;
          background: rgba(33, 150, 243, 0.2);
          border: 2px solid #000000;
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .export-btn:hover,
        .view-details-btn:hover {
          background: rgba(33, 150, 243, 0.3);
          transform: translateY(-1px);
        }

        .scan-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(244, 67, 54, 0.1);
          border: 2px solid #f44336;
          border-radius: 8px;
          color: #ffffff;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid #000000;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .error-icon {
          color: rgba(239, 68, 68, 0.9);
          font-weight: 600;
          font-size: 1rem;
        }

        .error-message {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .github-integration {
            padding: 1.5rem;
          }

          .repositories-grid {
            grid-template-columns: 1fr;
          }

          .plan-limits {
            grid-template-columns: 1fr;
          }

          .results-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .connection-status {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
