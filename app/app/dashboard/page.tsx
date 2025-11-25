"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ui/Toast";
import { delay } from "../../lib/async-utils";
import logger from "../../lib/client-logger";
import Link from "next/link";
import { productionDb, DatabaseError, ValidationError } from "../../lib/supabase-production-service";
import { useModal, ModalProvider } from "../../components/ui/ProductionModal";
import { LoadingButton, SectionLoader, InlineLoader } from "../../components/ui/LoadingSpinner";
import "./dashboard.css";
import "./integrations.css";
import "./collaboration-styles.css";
import "./collaboration-enhanced.css";
import "./mobile.css";
import "./analytics.css";
import GitHubIntegrationFixed from "./components/GitHubIntegrationFixed";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AdvancedAnalyticsDashboard from "./components/AdvancedAnalyticsDashboard";
import ApiKeysManager from "./components/ApiKeysManager";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";
import Overview from "./components/Overview";
import CodeAnalysis from "./components/CodeAnalysis";
import CollaborationDashboard from "./components/CollaborationDashboard";
import OnboardingWelcome from "./components/OnboardingWelcome";
import TeamDashboard from "../../components/TeamDashboard";

// Import the same result interfaces from the demo
interface DemoResult {
  success?: boolean;
  dryRun?: boolean;
  analysis?: {
    recommendedLayers: number[];
    detectedIssues: Array<{
      type: string;
      severity: string;
      description: string;
      fixedByLayer: number;
      pattern: string;
      count?: number;
    }>;
    reasoning?: string[];
    confidence: number;
    estimatedImpact: {
      level: string;
      description: string;
      estimatedFixTime: string;
    };
  };
  transformed?: string;
  originalCode?: string;
  layers?: Array<{
    layerId: number;
    success: boolean;
    improvements?: string[];
    executionTime: number;
    changeCount?: number;
    revertReason?: string;
  }>;
  states?: string[];
  totalExecutionTime?: number;
  successfulLayers?: number;
  error?: string;
  metadata?: {
    requestId: string;
    processingTimeMs: number;
    timestamp: string;
    version: string;
  };
}

interface AnalysisHistory {
  id: string;
  filename: string;
  timestamp: Date;
  result: DemoResult;
  layers: number[];
  executionTime: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  files: string[];
  createdAt: Date;
  lastAnalyzed?: Date;
}

interface UserSettings {
  defaultLayers: number[];
  autoSave: boolean;
  notifications: boolean;
  theme: "dark" | "light";
  apiKey?: string;
}

interface SubscriptionData {
  subscriptions: any[];
  currentPlan: string;
  loading: boolean;
  error: string | null;
}

interface CollaborationTeam {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "member";
    avatar?: string;
    status: "online" | "offline" | "away";
    lastSeen: Date;
  }>;
  settings: {
    defaultPermissions: "read" | "write" | "admin";
    allowInvites: boolean;
    requireApproval: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CollaborationActivity {
  id: string;
  type:
    | "session_created"
    | "session_joined"
    | "session_left"
    | "document_edited"
    | "comment_added"
    | "analysis_run"
    | "member_invited"
    | "member_joined";
  sessionId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  details: any;
}

interface DashboardState {
  isLoading: boolean;
  currentFile: string | null;
  result: DemoResult | null;
  showResults: boolean;
  selectedLayers: number[];
  applyFixes: boolean;
  sidebarCollapsed: boolean;
  activeSection: string;
  analysisHistory: AnalysisHistory[];
  projects: Project[];
  settings: UserSettings;
  progressStatus: string;
  uploadProgress: number;
  subscriptionData: SubscriptionData;
  collaborationSessions: any[];
  loadingSessions: boolean;
  collaborationTeams: CollaborationTeam[];
  collaborationActivity: CollaborationActivity[];
  loadingTeams: boolean;
  loadingActivity: boolean;
}

const sampleFiles = {
  "component-issues": {
    filename: "ProductCard.tsx",
    code: `import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const handleClick = () => {
    onAddToCart(product);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button type="button">Add to Cart</button>
    </div>
  );
}`,
  },
  "ssr-hydration": {
    filename: "UserProfile.tsx",
    code: `import React, { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  if (!isClient) return null;

  return (
    <div className="user-profile">
      <h1>Welcome {user?.name}!</h1>
      <p>Email: {user?.email}</p>
      <div className="user-avatar">
        {user?.avatar && <img src={user.avatar} alt="User avatar" />}
      </div>
      {window.innerWidth > 768 && (
        <div className="desktop-only">
          <p>Screen width: {window.innerWidth}px</p>
        </div>
      )}
    </div>
  );
}`,
  },
  "nextjs-patterns": {
    filename: "BlogPost.tsx",
    code: `import React from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function BlogPost({ post }) {
  const router = useRouter();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href
      });
    }
  };

  return (
    <article className="blog-post">
      <header>
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>By {post.author}</span>
          <time>{post.publishedAt}</time>
        </div>
      </header>
      
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      
      <footer>
        <button onClick={handleShare}>Share</button>
        <Link href="/blog">
          <a>← Back to Blog</a>
        </Link>
      </footer>
    </article>
  );
}`,
  },
};

export default function Dashboard() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { showError, showSuccess, showWarning, showConfirm } = useModal();
  const { showToast } = useToast();
  const [forceBypassLoading, setForceBypassLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integrationSuccess, setIntegrationSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Initialize hydration and bypass loading
  useEffect(() => {
    setIsHydrated(true);
    // Immediate bypass for dashboard
    setForceBypassLoading(true);

    // Check for GitHub integration errors in URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const details = urlParams.get('details');

      if (error) {
        let errorMessage = '';
        switch (error) {
          case 'database_error':
            errorMessage = 'Database connection failed while connecting GitHub. Please try again or contact support.';
            break;
          case 'table_not_found':
            errorMessage = 'GitHub integrations table not found. Please contact support for database setup.';
            break;
          case 'duplicate_integration':
            errorMessage = 'GitHub account is already connected to this user.';
            break;
          case 'permission_denied':
            errorMessage = 'Permission denied. Please check your account permissions.';
            break;
          case 'callback_error':
            errorMessage = 'GitHub OAuth callback failed. Please try again.';
            break;
          case 'github_user_fetch_failed':
            errorMessage = 'Failed to fetch GitHub user information. Please check your GitHub permissions.';
            break;
          case 'missing_code_or_state':
            errorMessage = 'Invalid GitHub OAuth response. Please try again.';
            break;
          case 'invalid_state':
            errorMessage = 'Invalid OAuth state. Please try connecting again.';
            break;
          default:
            errorMessage = `GitHub integration failed: ${error}`;
        }

        if (details) {
          errorMessage += ` Details: ${decodeURIComponent(details)}`;
        }

        setIntegrationError(errorMessage);
        // [NeuroLint] Removed console.error: 'GitHub integration error:', { error, details, errorMessage }

        // Clear error from URL after showing it
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      // Check for success message
      const githubConnected = urlParams.get('github_connected');
      if (githubConnected === 'true') {
        // Show success message
        setIntegrationSuccess('GitHub account successfully connected! You can now scan your repositories.');

        // Clear success from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Handle GitHub integration success navigation
  useEffect(() => {
    if (integrationSuccess) {
      // Automatically navigate to GitHub integration tab
      setDashboardState((prev) => ({
        ...prev,
        activeSection: 'bulk' // GitHub integration tab
      }));
    }
  }, [integrationSuccess]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Check for first-time user onboarding
  useEffect(() => {
    if (user && !authLoading) {
      const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
      const isFirstLogin = !localStorage.getItem("user_login_count");

      if (!hasCompletedOnboarding && (isFirstLogin || user.emailConfirmed)) {
        // Set login count for tracking
        localStorage.setItem("user_login_count", "1");
        router.push("/onboarding");
      } else if (!hasCompletedOnboarding) {
        // Increment login count
        const currentCount = parseInt(localStorage.getItem("user_login_count") || "0") + 1;
        localStorage.setItem("user_login_count", currentCount.toString());

        // Show onboarding after 2nd login if still not completed
        if (currentCount >= 2) {
          router.push("/onboarding");
        }
      }
    }
  }, [user, authLoading, router]);

  // Handle PayPal subscription approval
  useEffect(() => {
    const handlePayPalReturn = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const subscriptionId = urlParams.get('subscription_id');
      const paypalToken = urlParams.get('token'); // PayPal uses 'token' parameter
      const checkoutSuccess = urlParams.get('checkout');

      // PayPal returns with either subscription_id or token parameter
      const paypalSubscriptionId = subscriptionId || paypalToken;

      if (paypalSubscriptionId && checkoutSuccess === 'success' && user?.id) {
        try {
          const response = await fetch('/api/paypal/approve-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriptionId: paypalSubscriptionId,
              userId: user.id,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Clear URL parameters and show success message
            window.history.replaceState({}, '', '/dashboard');

            // Show success notification

            // Refresh user data to get updated plan
            await delay(1000);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          } else {
            // [NeuroLint] Removed console.error: 'Failed to approve subscription:', result.error
          }
        } catch (error) {
          // [NeuroLint] Removed console.error: 'Error processing PayPal return:', error
        }
      }
    };

    if (user && !authLoading) {
      handlePayPalReturn();
    }
  }, [user, authLoading]);

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: false,
    currentFile: null,
    result: null,
    showResults: false,
    selectedLayers: [],
    applyFixes: false,
    sidebarCollapsed: false,
    activeSection: "overview",
    analysisHistory: [],
    projects: [],
    settings: {
      defaultLayers: [],
      autoSave: true,
      notifications: true,
      theme: "dark",
    },
    progressStatus: "",
    uploadProgress: 0,
    subscriptionData: {
      subscriptions: [],
      currentPlan: user?.plan || "free",
      loading: false,
      error: null,
    },
    collaborationSessions: [],
    loadingSessions: false,
    collaborationTeams: [],
    collaborationActivity: [],
    loadingTeams: false,
    loadingActivity: false,
  });

  // Search & filter for analysis history
  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory = React.useMemo(
    () =>
      dashboardState.analysisHistory.filter((item) =>
                (item.filename || '').toLowerCase().includes(historySearch.toLowerCase()),
      ),
    [dashboardState.analysisHistory, historySearch],
  );

  // Robust copy function with fallbacks
  const copyToClipboard = async (text: string, type: string) => {
    try {
      // First try the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(text);
      return;
      }
    } catch (err) {
      // [NeuroLint] Removed console.warn: "Clipboard API failed, trying fallback:", err
    }

    // Optimized fallback method using textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Use efficient CSS to avoid layout calculations
      textArea.style.cssText =
        "position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";

      // Use requestAnimationFrame to avoid forced reflow
      let successful = false;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          document.body.appendChild(textArea);
          textArea.select();
          successful = document.execCommand("copy");

          // Cleanup in next frame
          requestAnimationFrame(() => {
            if (textArea.parentNode) {
              document.body.removeChild(textArea);
            }
            resolve();
          });
        });
      });

      if (successful) {
        // Code copied successfully
      } else {
        throw new Error("execCommand failed");
      }
    } catch (fallbackErr) {
      // [NeuroLint] Removed console.error: "All copy methods failed:", fallbackErr
      // Show user a manual copy option - optimized to prevent reflows
      requestAnimationFrame(() => {
        const modal = document.createElement("div");
        modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #000000;
          z-index: 10000;
          max-width: 90vw;
          max-height: 80vh;
          overflow: auto;
          backdrop-filter: blur(10px);
          opacity: 0;
          transition: opacity 0.2s ease;
        `;

        const content = document.createElement("div");
        content.innerHTML = `
                <h3 style="margin-top: 0; color: rgba(33, 150, 243, 0.9);">Copy Code Manually</h3>
        <p style="color: rgba(255, 255, 255, 0.8);">Please copy the code below manually:</p>
        <textarea readonly style="
          width: 100%;
          height: 200px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          color: white;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          resize: vertical;
        ">${text}</textarea>
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-top: 10px;
          padding: 8px 16px;
          background: rgba(33, 150, 243, 0.2);
          border: 1px solid #000000;
                    color: rgba(33, 150, 243, 0.9);
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        ">Close</button>
      `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Auto-select the text in the textarea
        const textarea = modal.querySelector("textarea") as HTMLTextAreaElement;
        if (textarea) {
          textarea.select();
          textarea.focus();
        }

        // Fade in the modal
        requestAnimationFrame(() => {
          modal.style.opacity = "1";
        });
      });
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getBusinessImpact = (issueType: string, severity: string) => {
    const impacts: Record<string, Record<string, string>> = {
      "missing-key": {
        high: "Poor user experience, React warnings in console, potential performance issues during updates",
        medium:
          "Console warnings, slight performance degradation in list rendering",
        low: "Minor console warnings with minimal impact",
      },
      "html-entities": {
        high: "Broken text display, poor SEO, accessibility issues for screen readers",
        medium: "Text display issues, potential SEO impact",
        low: "Minor text encoding issues",
      },
      "ssr-hydration": {
        critical:
          "App crashes, hydration mismatches, poor Core Web Vitals, SEO penalties",
        high: "Hydration warnings, potential layout shifts, poor user experience",
        medium: "Minor hydration issues, slight performance impact",
      },
      accessibility: {
        high: "Legal compliance risk, excludes users with disabilities, poor lighthouse scores",
        medium: "Reduced accessibility, potential compliance issues",
        low: "Minor accessibility improvements needed",
      },
    };

    return (
      impacts[issueType]?.[severity] ||
      "Improves code standards and maintainability"
    );
  };

  const getSolutionDescription = (issueType: string) => {
    const solutions: Record<string, string> = {
      "missing-key":
        "Add unique key props to list items for optimal React reconciliation and performance",
      "html-entities":
        "Convert HTML entities to proper Unicode characters for correct text display",
      "ssr-hydration":
        "Add client-side guards and useEffect hooks to prevent server/client mismatches",
      accessibility:
        "Add ARIA labels, alt attributes, and semantic HTML for screen reader compatibility",
      "console-usage":
        "Remove or guard console statements for production optimization",
      "error-handling":
        "Add try-catch blocks and error boundaries for robust error handling",
    };

    return (
      solutions[issueType] ||
      "Apply established coding standards and performance optimizations"
    );
  };

  const formatProcessingTime = (ms: number) => {
    if (!ms || isNaN(ms) || ms < 0) return '0ms';
    if (ms < 10) return `${ms.toFixed(1)}ms`;
    if (ms < 100) return `${ms.toFixed(0)}ms`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
  const [userExpandedSidebar, setUserExpandedSidebar] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(false);

  // Refs for scrolling
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const pasteSectionRef = useRef<HTMLDivElement>(null);
  const githubSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Save analysis to history
  const saveToHistory = useCallback(
    async (
      filename: string,
      result: DemoResult,
      layers: number[],
      executionTime: number,
    ) => {
      if (!user?.id) return;

      try {
        await productionDb.saveAnalysisHistory(user.id, {
          filename,
          result,
          layers,
          execution_time: executionTime,
        });

        // Update local state
        const historyItem: AnalysisHistory = {
          id: Date.now().toString(),
          filename,
          timestamp: new Date(),
          result,
          layers,
          executionTime,
        };

        setDashboardState((prev) => {
          const newHistory = [historyItem, ...prev.analysisHistory].slice(0, 50);
          return { ...prev, analysisHistory: newHistory };
        });
      } catch (error) {
        // Analysis history is not critical, silently fail
      }
    },
    [user?.id],
  );

  // Auto-scroll utility function
  const scrollToSection = useCallback(
    (sectionRef: React.RefObject<HTMLDivElement>) => {
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    },
    [],
  );

  const analyzecode = useCallback(
    async (
      code: string,
      filename: string,
      layers: number[] | "auto" | "all",
      applyFixes: boolean,
    ) => {
      // Validate and sanitize filename
      let safeFilename = filename;
      if (filename === "fix-master.js" || filename === "fix-master") {
        safeFilename = "analyzed-code.tsx";
      } else if (!filename.match(/\.(ts|tsx|js|jsx)$/i)) {
        safeFilename = filename.endsWith('.') ? `${filename}tsx` : `${filename}.tsx`;
      }

      const startTime = Date.now();
      setDashboardState((prev) => ({
        ...prev,
        isLoading: true,
        result: null,
        progressStatus: "Initializing analysis...",
        uploadProgress: 0,
      }));

      try {
        setDashboardState((prev) => ({
          ...prev,
          progressStatus: "Sending request...",
          uploadProgress: 25,
        }));

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token && {
              Authorization: `Bearer ${session.access_token}`,
            }),
          },
          body: JSON.stringify({
            code,
            filename: safeFilename,
            layers,
            applyFixes,
            enhanced: useEnhanced,
          }),
        });

        setDashboardState((prev) => ({
          ...prev,
          progressStatus: "Processing response...",
          uploadProgress: 75,
        }));

        if (!response.ok) {
          let errorMessage = "Analysis failed";
          try {
            // Clone response to avoid "body stream already read" error
            const responseClone = response.clone();
            const errorResult = await responseClone.json();
            errorMessage = errorResult.error || errorMessage;
          } catch (jsonError) {
            // If response isn't JSON, use status text or default message
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        const normalizedResult = {
          ...result,
          success: result?.dryRun ? true : result?.success,
        };

        const executionTime = Date.now() - startTime;

        // Update session info if provided
        if (result.sessionInfo) {
          setSessionId(result.sessionInfo.sessionId);
          setRateLimitInfo(result.sessionInfo.rateLimitInfo);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "neurolint-session-id",
              result.sessionInfo.sessionId,
            );
          }
        }

        // Save to history if settings allow
        if (dashboardState.settings.autoSave && normalizedResult.success) {
          saveToHistory(
            filename,
            normalizedResult,
            Array.isArray(layers) ? layers : [],
            executionTime,
          );
        }

        setDashboardState((prev) => ({
          ...prev,
          result: normalizedResult,
          showResults: true,
          isLoading: false,
          progressStatus: "Analysis complete",
          uploadProgress: 100,
        }));

        // Auto-scroll to results after analysis completes
        requestAnimationFrame(() => {
          scrollToSection(resultsSectionRef);
        });
      } catch (error) {
        console.error("[DASHBOARD] Analysis failed:", error);
        setDashboardState((prev) => ({
          ...prev,
          result: {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error occurred during analysis",
          },
          showResults: true,
          isLoading: false,
          progressStatus: "Analysis failed",
          uploadProgress: 0,
        }));

        // Auto-scroll to results even on error
        requestAnimationFrame(() => {
          scrollToSection(resultsSectionRef);
        });
      }
    },
    [
      dashboardState.settings.autoSave,
      saveToHistory,
      session?.access_token,
      scrollToSection,
      resultsSectionRef,
      useEnhanced,
    ],
  );

  const loadSampleFile = useCallback(
    (sampleKey: string) => {
      const sample = sampleFiles[sampleKey as keyof typeof sampleFiles];
      if (!sample) return;

      setDashboardState((prev) => ({ ...prev, currentFile: sample.filename }));

      const layers =
        dashboardState.selectedLayers.length > 0
          ? dashboardState.selectedLayers
          : "auto";
      analyzecode(
        sample.code,
        sample.filename,
        layers,
        dashboardState.applyFixes,
      );

      // Auto-scroll to sample section area (we'll scroll to results after analysis completes)
      // This gives immediate feedback that the sample is being processed
    },
    [dashboardState.selectedLayers, dashboardState.applyFixes, analyzecode],
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Enhanced file validation
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const allowedExtensions = /\.(ts|tsx|js|jsx)$/i;
      
      // Check file size
      if (file.size > maxSize) {
        showToast({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB. Please choose a smaller file.',
        });
        return;
      }

      // Check file extension
      if (!allowedExtensions.test(file.name)) {
        showToast({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please upload a TypeScript or JavaScript file (.ts, .tsx, .js, .jsx)',
        });
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        showToast({
          type: 'error',
          title: 'Empty File',
          message: 'The selected file is empty. Please choose a file with content.',
        });
        return;
      }

      try {
        const code = await file.text();
        
        // Validate code content
        if (!code || code.trim().length === 0) {
          showToast({
            type: 'error',
            title: 'Empty File Content',
            message: 'The file contains no code. Please choose a file with valid code.',
          });
          return;
        }

        // Check for minimum code length
        if (code.trim().length < 10) {
          showToast({
            type: 'warning',
            title: 'Very Short Code',
            message: 'The file contains very little code. Analysis may not be meaningful.',
          });
        }

        // Validate and sanitize filename
        let safeFilename = file.name;
        if (file.name === "fix-master.js" || file.name === "fix-master") {
          safeFilename = "uploaded-code.tsx";
        } else if (!file.name.match(/\.(ts|tsx|js|jsx)$/i)) {
          safeFilename = file.name.endsWith('.') ? `${file.name}tsx` : `${file.name}.tsx`;
        }

        setDashboardState((prev) => ({ ...prev, currentFile: safeFilename }));

        const layers =
          dashboardState.selectedLayers.length > 0
            ? dashboardState.selectedLayers
            : "auto";
        analyzecode(code, safeFilename, layers, dashboardState.applyFixes);

        // Auto-scroll to upload section
        requestAnimationFrame(() => {
          scrollToSection(uploadSectionRef);
        });
      } catch (error) {
        // [NeuroLint] Removed console.error: "[DASHBOARD] File upload failed:", error
        showToast({
          type: 'error',
          title: 'File Upload Failed',
          message: 'Failed to read the file. Please check if the file is corrupted or try again.',
        });
      }
    },
    [
      dashboardState.selectedLayers,
      dashboardState.applyFixes,
      analyzecode,
      scrollToSection,
    ],
  );

  const toggleLayerSelection = useCallback((layerId: number) => {
    setDashboardState((prev) => ({
      ...prev,
      selectedLayers: prev.selectedLayers.includes(layerId)
        ? prev.selectedLayers.filter((id) => id !== layerId)
        : [...prev.selectedLayers, layerId].sort(),
    }));
  }, []);

  // Helper function to show project name dialog
  const showProjectNameDialog = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create a simple form dialog
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
      
      dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Project</h3>
          <input 
            type="text" 
            id="project-name-input"
            placeholder="Enter project name"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            maxlength="100"
            pattern="[a-zA-Z0-9\\s\\-_]+"
          />
          <div class="flex gap-3 mt-4">
            <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
            <button id="create-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Create</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const input = dialog.querySelector('#project-name-input') as HTMLInputElement;
      const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement;
      const createBtn = dialog.querySelector('#create-btn') as HTMLButtonElement;
      
      input.focus();
      
      const cleanup = () => {
        document.body.removeChild(dialog);
      };
      
      const handleCreate = () => {
        const name = input.value.trim();
        if (name.length >= 3 && name.length <= 100 && /^[a-zA-Z0-9\s\-_]+$/.test(name)) {
          cleanup();
          resolve(name);
        } else {
          input.setCustomValidity('Project name must be 3-100 characters and contain only letters, numbers, spaces, hyphens, and underscores');
          input.reportValidity();
        }
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };
      
      cancelBtn.addEventListener('click', handleCancel);
      createBtn.addEventListener('click', handleCreate);
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleCreate();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      });
      
      input.addEventListener('input', () => {
        input.setCustomValidity('');
      });
    });
  }, []);

  // Load subscription data from API
  const loadSubscriptionData = useCallback(async () => {
    if (!session?.access_token) return;

    setDashboardState((prev) => ({
      ...prev,
      subscriptionData: {
        ...prev.subscriptionData,
        loading: true,
        error: null,
      },
    }));

    try {
      const response = await fetch("/api/subscriptions", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();

      setDashboardState((prev) => ({
        ...prev,
        subscriptionData: {
          subscriptions: data.subscriptions || [],
          currentPlan: data.currentPlan || user?.plan || "free",
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      // [NeuroLint] Removed console.error: "Failed to load subscription data:", error
      setDashboardState((prev) => ({
        ...prev,
        subscriptionData: {
          ...prev.subscriptionData,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  }, [session?.access_token, user?.plan]);

  // Load saved data and session on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setIsLoading(prev => ({ ...prev, dashboardData: true }));

      try {
        // Load data in parallel for better performance
        const [analysisHistory, projects, userSettings] = await Promise.all([
          productionDb.getAnalysisHistory(user.id, 50),
          productionDb.getProjects(user.id),
          productionDb.getUserSettings(user.id),
        ]);

        // Format analysis history
        const formattedHistory = analysisHistory.map((item) => ({
          id: item.id,
          filename: item.filename,
          timestamp: new Date(item.timestamp),
          result: item.result as any,
          layers: item.layers,
          executionTime: item.execution_time,
        }));

        // Format projects
        const formattedProjects = projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          files: p.files || [],
          createdAt: new Date(p.created_at),
          lastAnalyzed: p.last_analyzed ? new Date(p.last_analyzed) : undefined,
        }));

        // Format settings
        const formattedSettings = {
          defaultLayers: userSettings.default_layers,
          autoSave: userSettings.auto_save,
          notifications: userSettings.notifications,
          theme: userSettings.theme as "dark" | "light",
        };

        setDashboardState((prev) => ({
          ...prev,
          analysisHistory: formattedHistory,
          projects: formattedProjects,
          settings: formattedSettings,
        }));

      } catch (error) {
        // Handle database connection errors gracefully
        if (error instanceof DatabaseError) {
          // [NeuroLint] Removed console.warn: "Database connection issue:", error.message
          // Set empty data instead of showing error
          setDashboardState((prev) => ({
            ...prev,
            analysisHistory: [],
            projects: [],
            settings: {
              defaultLayers: [1, 2, 3],
              autoSave: true,
              notifications: true,
              theme: "dark" as const,
            },
          }));
        } else if (error instanceof ValidationError) {
          // [NeuroLint] Removed console.warn: "Validation error:", error.message
          // Continue with empty data
          setDashboardState((prev) => ({
            ...prev,
            analysisHistory: [],
            projects: [],
            settings: {
              defaultLayers: [1, 2, 3],
              autoSave: true,
              notifications: true,
              theme: "dark" as const,
            },
          }));
        } else {
          // [NeuroLint] Removed console.warn: "Failed to load dashboard data:", error
          // Set default data
          setDashboardState((prev) => ({
            ...prev,
            analysisHistory: [],
            projects: [],
            settings: {
              defaultLayers: [1, 2, 3],
              autoSave: true,
              notifications: true,
              theme: "dark" as const,
            },
          }));
        }
      } finally {
        setIsLoading(prev => ({ ...prev, dashboardData: false }));
      }

      // Load session info (optional, non-critical)
      try {
        const savedSessionId = typeof window !== "undefined" 
          ? localStorage.getItem("neurolint-session-id") 
          : null;
        
        if (savedSessionId) {
          setSessionId(savedSessionId);
          fetch(`/api/dashboard?sessionId=${savedSessionId}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.rateLimitInfo) {
                setRateLimitInfo(data.rateLimitInfo);
              }
            })
            .catch(() => {
              // Session info is not critical, silently fail
            });
        }
      } catch {
        // Session loading is not critical
      }
    };

    if (isHydrated) {
      loadDashboardData();
    }
  }, [user?.id, isHydrated]);

  // Handle navigation events from child components
  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const tabName = event.detail;
      setDashboardState((prev) => ({
        ...prev,
        activeSection: tabName,
      }));
    };

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    
    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
    };
  }, []);

  // Load subscription data when account section is opened
  useEffect(() => {
    if (
      dashboardState.activeSection === "account" &&
      user &&
      session?.access_token
    ) {
      loadSubscriptionData();
    }
  }, [
    dashboardState.activeSection,
    user,
    session?.access_token,
    loadSubscriptionData,
  ]);

  // Load collaboration sessions when collaborate section is opened
  useEffect(() => {
    if (dashboardState.activeSection === "collaborate" && user?.id) {
      const loadSessions = async () => {
        setDashboardState((prev) => ({ ...prev, loadingSessions: true }));
        try {
          const response = await fetch("/api/collaboration/sessions", {
            headers: {
              "x-user-id": user.id,
              "x-user-name": user.firstName || user.email || "Anonymous",
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
          });
          if (response.ok) {
            const data = await response.json();
            setDashboardState((prev) => ({
              ...prev,
              collaborationSessions: data.sessions || [],
              loadingSessions: false,
            }));
          } else {
            setDashboardState((prev) => ({ ...prev, loadingSessions: false }));
          }
        } catch (error) {
          // [NeuroLint] Removed console.error: "Failed to load collaboration sessions:", error
          setDashboardState((prev) => ({ ...prev, loadingSessions: false }));
        }
      };
      loadSessions();
    }
  }, [dashboardState.activeSection, user, session?.access_token]);

  // Show loading screen while checking authentication (bypassed for dashboard)
  if (!isHydrated && !forceBypassLoading && false) {
    // Disabled loading condition
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div className="loading-spinner-large"></div>
              <p className="onboarding-subtitle">Loading dashboard...</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary refresh-btn"
                aria-label="Refresh dashboard page"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // [NeuroLint] Replace mock data with API fetch:
const sidebarItems = [
    {
      id: "overview",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3h18v4H3z" />
          <path d="M3 10h18v4H3z" />
          <path d="M3 17h18v4H3z" />
        </svg>
      ),
      label: "Overview",
      description: "Summary & recent activity",
    },
    {
      id: "editor",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="16,18 22,12 16,6" />
          <polyline points="8,6 2,12 8,18" />
        </svg>
      ),
      label: "Code Analysis",
      description: "Upload and analyze files",
    },
    {
      id: "bulk",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      label: "GitHub Integration",
      description: "Connect & scan repositories",
    },
    {
      id: "migration",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          <path d="M12 11v6"/>
          <path d="M15 14l-3-3-3 3"/>
        </svg>
      ),
      label: "One-Time Migration",
      description: "Enterprise migration service",
    },
    {
      id: "analytics",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      ),
      label: "Analytics",
      description: "View insights & trends",
    },
    {
      id: "api-keys",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      label: "API Keys",
      description: "Manage API access",
    },
    {
      id: "collaborate",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      label: "Collaborate",
      description: "Real-time code editing",
    },
    {
      id: "integrations",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="7.5,4.21 12,6.81 16.5,4.21" />
          <polyline points="7.5,19.79 7.5,14.6 3,12" />
          <polyline points="21,12 16.5,14.6 16.5,19.79" />
          <polyline points="12,22.08 12,17" />
        </svg>
      ),
      label: "Integrations",
      description: "CI/CD & webhooks",
    },
    {
      id: "projects",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      ),
      label: "Projects",
      description: "Organize your work",
    },
    {
      id: "history",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      ),
      label: "Analysis History",
      description: "Previous analyses",
    },
    {
      id: "samples",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      ),
      label: "Sample Files",
      description: "Test with examples",
    },
    
    {
      id: "account",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: "User Account",
      description: "Profile & billing",
    },
    {
      id: "docs",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      ),
      label: "Documentation",
      description: "Guides & API reference",
      isExternal: true,
      href: "/docs",
    },
    {
      id: "settings",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
      label: "Settings",
      description: "Configure preferences",
    },
  ];

  return (
    <ModalProvider>
      <div className="dashboard-container">
      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${dashboardState.sidebarCollapsed ? "collapsed" : ""} ${userExpandedSidebar ? "user-expanded" : ""}`}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="sidebar-header">
          <div className="brand">
            <a
              href="/"
              className="brand-logo"
              aria-label="NeuroLint Logo - Go to homepage"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fbcdfdb608d38407b88c1584fe3705961%2F1b38a4a385ed4a0bb404148fae0ce80e?format=webp&width=800"
                alt="NeuroLint"
                width="32"
                height="32"
              />
            </a>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => {
              const newCollapsed = !dashboardState.sidebarCollapsed;
              setDashboardState((prev) => ({
                ...prev,
                sidebarCollapsed: newCollapsed,
              }));
              setUserExpandedSidebar(!newCollapsed);
            }}
            aria-label={
              dashboardState.sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-expanded={!dashboardState.sidebarCollapsed}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              {dashboardState.sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav" role="menu">
          {sidebarItems.map((item, index) => {
            if (item.isExternal) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="nav-item"
                  role="menuitem"
                  aria-label={`${item.label}: ${item.description}`}
                  tabIndex={0}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!dashboardState.sidebarCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">
                        {item.description}
                      </span>
                    </div>
                  )}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                className={`nav-item nav-item-animated ${dashboardState.activeSection === item.id ? "active" : ""}`}
                onClick={() =>
                  setDashboardState((prev) => ({
                    ...prev,
                    activeSection: item.id,
                    // Auto-hide results when switching tabs
                    showResults:
                      item.id === "editor" || item.id === "samples"
                        ? prev.showResults
                        : false,
                  }))
                }
                role="menuitem"
                aria-current={
                  dashboardState.activeSection === item.id ? "page" : undefined
                }
                aria-label={`${item.label}: ${item.description}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDashboardState((prev) => ({
                      ...prev,
                      activeSection: item.id,
                      // Auto-hide results when switching tabs via keyboard
                      showResults:
                        item.id === "editor" || item.id === "samples"
                          ? prev.showResults
                          : false,
                    }));
                  }
                }}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {!dashboardState.sidebarCollapsed && (
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className={`sidebar-footer ${dashboardState.sidebarCollapsed ? "collapsed" : ""}`}
        >
          <div className="user-section">
            <div className="user-avatar" aria-label="User profile">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            {!dashboardState.sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </span>
                <span className="user-plan">
                  {user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1) ||
                    "Free"}{" "}
                  Plan
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Link
                    href="/profile"
                    className="text-xs text-gray-400 hover:text-white"
                    title="Profile settings"
                  >
                    Profile
                  </Link>
                  <span className="text-gray-600">•</span>
                  <button
                    onClick={signOut}
                    className="text-xs text-gray-400 hover:text-white"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-title-container">
          <h1>NeuroLint Dashboard</h1>
        </div>

        {/* Integration Error Display */}
        {integrationError && (
          <div className="integration-error-banner">
            <div className="integration-banner-content">
              <svg className="integration-banner-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{integrationError}</span>
            </div>
            <button
              className="integration-banner-dismiss"
              onClick={() => setIntegrationError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Integration Success Display */}
        {integrationSuccess && (
          <div className="integration-success-banner">
            <div className="integration-banner-content">
              <svg className="integration-banner-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{integrationSuccess}</span>
            </div>
            <button
              className="integration-banner-dismiss"
              onClick={() => setIntegrationSuccess(null)}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        <div className="dashboard-content">
          {/* Enhanced Analysis Configuration */}
          {(dashboardState.activeSection === "editor" ||
            dashboardState.activeSection === "samples") && (
            <div
              className="analysis-configuration"
              role="region"
              aria-labelledby="config-title"
            >
              <div className="config-header">
                <div className="config-title">
                  <h2 id="config-title">Analysis Configuration</h2>
                  <p>
                    Configure analysis mode, engine type, and layer selection
                  </p>
                </div>
              </div>

                                          <div className="config-layout">
                <div className="config-top-row">
                  <fieldset className="control-group">
                    <legend className="control-label">MODE</legend>
                    <div
                      className="control-options"
                      role="radiogroup"
                      aria-labelledby="mode-legend"
                    >
                      <button
                        className={`control-btn ${!dashboardState.applyFixes ? "active" : ""}`}
                        onClick={() =>
                          setDashboardState((prev) => ({
                            ...prev,
                            applyFixes: false,
                          }))
                        }
                        role="radio"
                        aria-checked={!dashboardState.applyFixes}
                        aria-describedby="dry-run-description"
                      >
                        Dry Run (Analysis Only)
                      </button>
                      <button
                        className={`control-btn ${dashboardState.applyFixes ? "active" : ""}`}
                        onClick={() =>
                          setDashboardState((prev) => ({
                            ...prev,
                            applyFixes: true,
                          }))
                        }
                        role="radio"
                        aria-checked={dashboardState.applyFixes}
                        aria-describedby="apply-fixes-description"
                      >
                        Apply Fixes
                      </button>
                    </div>
                    <div id="dry-run-description" className="sr-only">
                      Analyze code without making changes
                    </div>
                    <div id="apply-fixes-description" className="sr-only">
                      Analyze and modify your code files
                    </div>
                  </fieldset>

                  <fieldset className="control-group">
                    <legend className="control-label">ENGINE TYPE</legend>
                    <div
                      className="control-options"
                      role="radiogroup"
                      aria-labelledby="engine-legend"
                    >
                      <button
                        className={`control-btn ${!useEnhanced ? "active" : ""}`}
                        onClick={() => setUseEnhanced(false)}
                        role="radio"
                        aria-checked={!useEnhanced}
                        aria-describedby="standard-engine-description"
                      >
                        Standard Engine
                      </button>
                      <button
                        className={`control-btn ${useEnhanced ? "active" : ""}`}
                        onClick={() => setUseEnhanced(true)}
                        role="radio"
                        aria-checked={useEnhanced}
                        aria-describedby="enhanced-engine-description"
                      >
                        Enhanced AST Engine
                      </button>
                    </div>
                    <div id="standard-engine-description" className="sr-only">
                      Standard regex-based pattern matching engine
                    </div>
                    <div id="enhanced-engine-description" className="sr-only">
                      Advanced AST analysis with semantic understanding
                    </div>
                  </fieldset>
                </div>

                <fieldset className="control-group layer-selection-full">
                  <legend className="control-label">LAYER SELECTION</legend>
                  <div
                    className="layer-controls"
                    role="group"
                    aria-labelledby="layer-presets"
                  >
                    <span id="layer-presets" className="sr-only">
                      Layer presets
                    </span>
                    <button
                      className={`control-btn ${dashboardState.selectedLayers.length === 0 ? "active" : ""}`}
                      onClick={() =>
                        setDashboardState((prev) => ({
                          ...prev,
                          selectedLayers: [],
                        }))
                      }
                      aria-pressed={dashboardState.selectedLayers.length === 0}
                      aria-describedby="auto-detect-description"
                    >
                      Auto-Detect
                    </button>
                    <button
                      className={`control-btn ${dashboardState.selectedLayers.length === 6 ? "active" : ""}`}
                      onClick={() =>
                        setDashboardState((prev) => ({
                          ...prev,
                          selectedLayers: [1, 2, 3, 4, 5, 6],
                        }))
                      }
                      aria-pressed={dashboardState.selectedLayers.length === 6}
                      aria-describedby="all-layers-description"
                    >
                      All Layers
                    </button>
                  </div>
                  <div id="auto-detect-description" className="sr-only">
                    Let NeuroLint automatically select appropriate layers
                  </div>
                  <div id="all-layers-description" className="sr-only">
                    Run all 6 layers of analysis and fixes
                  </div>
                                    <div
                    className="layer-checkboxes"
                    role="group"
                    aria-labelledby="individual-layers"
                  >
                    <span id="individual-layers" className="sr-only">
                      Individual layer selection
                    </span>
                                                                                                                        {[1, 2, 3, 4].map((layerId) => (
                      <label key={layerId} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked={dashboardState.selectedLayers.includes(
                            layerId,
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: [
                                  ...prev.selectedLayers,
                                  layerId,
                                ].sort(),
                              }));
                            } else {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: prev.selectedLayers.filter(
                                  (id) => id !== layerId,
                                ),
                              }));
                            }
                          }}
                          disabled={dashboardState.isLoading}
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer {layerId}:
                          </span>
                          <span className="layer-description">
                            {layerId === 1 && "Configuration fixes"}
                            {layerId === 2 && "Pattern corrections"}
                            {layerId === 3 && "Component improvements"}
                            {layerId === 4 && "Hydration safety"}
                          </span>
                        </span>
                      </label>
                                        ))}
                    <label key={5} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked={dashboardState.selectedLayers.includes(5)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: [
                                  ...prev.selectedLayers,
                                  5,
                                ].sort(),
                              }));
                            } else {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: prev.selectedLayers.filter(
                                  (id) => id !== 5,
                                ),
                              }));
                            }
                          }}
                          disabled={dashboardState.isLoading}
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer 5:
                          </span>
                          <span className="layer-description">
                            Next.js optimizations
                            <span className="layer-difficulty intermediate">INTERMEDIATE+</span>
                          </span>
                                                </span>
                      </label>
                    <label key={6} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked={dashboardState.selectedLayers.includes(6)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: [
                                  ...prev.selectedLayers,
                                  6,
                                ].sort(),
                              }));
                            } else {
                              setDashboardState((prev) => ({
                                ...prev,
                                selectedLayers: prev.selectedLayers.filter(
                                  (id) => id !== 6,
                                ),
                              }));
                            }
                          }}
                          disabled={dashboardState.isLoading}
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer 6:
                          </span>
                          <span className="layer-description">
                            Testing enhancements
                            <span className="layer-difficulty advanced">ADVANCED</span>
                          </span>
                                                                                                </span>
                      </label>
                  </div>
                </fieldset>
              </div>
            </div>
          )}

          {/* Demo Settings Status */}
          {(dashboardState.activeSection === "editor" ||
            dashboardState.activeSection === "samples") && (
            <div className="analysis-overview">
              <h3>Current Configuration</h3>
              <div className="overview-stats">
                <div
                  className={`stat ${dashboardState.applyFixes ? "apply-mode" : "dry-run-mode"}`}
                >
                  <span className="stat-value">
                    {dashboardState.applyFixes ? "FIX" : "DRY"}
                  </span>
                  <span className="stat-label">
                    {dashboardState.applyFixes
                      ? "Apply Fixes Mode"
                      : "Dry Run Mode"}
                  </span>
                </div>
                <div className="stat layers-stat">
                  <span className="stat-value">
                    {dashboardState.selectedLayers.length === 0
                      ? "AUTO"
                      : dashboardState.selectedLayers.length === 6
                        ? "ALL 6"
                        : dashboardState.selectedLayers.length.toString()}
                  </span>
                  <span className="stat-label">
                    {dashboardState.selectedLayers.length === 0
                      ? "Auto-Detect Layers"
                      : dashboardState.selectedLayers.length === 6
                        ? "All Layers Active"
                        : `Custom Layers [${dashboardState.selectedLayers.join(",")}]`}
                  </span>
                </div>
                <div
                  className={`stat ${useEnhanced ? "enhanced-stat" : "standard-stat"}`}
                >
                  <span className="stat-value">
                    {useEnhanced ? "AST+" : "STD"}
                  </span>
                  <span className="stat-label">
                    {useEnhanced ? "Enhanced AST Engine" : "Standard Engine"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {dashboardState.isLoading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${dashboardState.uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={dashboardState.uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                ></div>
              </div>
              <p className="progress-status">{dashboardState.progressStatus}</p>
            </div>
          )}

          {/* GitHub Integration Tab */}
          {dashboardState.activeSection === "bulk" && (
            <div className="tab-content">
              <ErrorBoundary>
                <GitHubIntegrationFixed />
              </ErrorBoundary>
            </div>
          )}

          {/* Migration Tab */}
          {dashboardState.activeSection === "migration" && (
            <div className="tab-content">
              <div
                className="analysis-configuration"
                role="region"
                aria-labelledby="migration-title"
              >
                <div className="config-header">
                  <div className="config-title">
                    <h2 id="migration-title">One-Time Migration Service</h2>
                    <p>
                      Professional legacy codebase modernization with enterprise-grade safety
                    </p>
                  </div>
                </div>

                <div className="config-layout">
                  <div className="config-top-row">
                    <fieldset className="control-group">
                      <legend className="control-label">MIGRATION TIER</legend>
                      <div
                        className="control-options"
                        role="radiogroup"
                        aria-labelledby="tier-legend"
                      >
                        <button
                          className="control-btn active"
                          role="radio"
                          aria-checked="true"
                          aria-describedby="migration-tier-description"
                        >
                          Migration Service
                        </button>
                        <button
                          className="control-btn"
                          role="radio"
                          aria-checked="false"
                          aria-describedby="enterprise-tier-description"
                        >
                          Enterprise
                        </button>
                      </div>
                      <div id="migration-tier-description" className="sr-only">
                        Quote-based pricing with all 7 layers
                      </div>
                      <div id="enterprise-tier-description" className="sr-only">
                        Custom pricing with unlimited access
                      </div>
                    </fieldset>

                    <fieldset className="control-group">
                      <legend className="control-label">MIGRATION SCOPE</legend>
                      <div
                        className="control-options"
                        role="radiogroup"
                        aria-labelledby="scope-legend"
                      >
                        <button
                          className="control-btn active"
                          role="radio"
                          aria-checked="true"
                          aria-describedby="full-scope-description"
                        >
                          Full Codebase
                        </button>
                        <button
                          className="control-btn"
                          role="radio"
                          aria-checked="false"
                          aria-describedby="incremental-scope-description"
                        >
                          Incremental
                        </button>
                      </div>
                      <div id="full-scope-description" className="sr-only">
                        Migrate entire codebase with unlimited files
                      </div>
                      <div id="incremental-scope-description" className="sr-only">
                        Migrate only changed files
                      </div>
                    </fieldset>
                  </div>

                  <fieldset className="control-group layer-selection-full">
                    <legend className="control-label">MIGRATION LAYERS</legend>
                    <div
                      className="layer-controls"
                      role="group"
                      aria-labelledby="migration-layer-presets"
                    >
                      <span id="migration-layer-presets" className="sr-only">
                        Migration layer presets
                      </span>
                      <button
                        className="control-btn active"
                        aria-pressed="true"
                        aria-describedby="all-layers-migration-description"
                      >
                        All 7 Layers
                      </button>
                    </div>
                    <div id="all-layers-migration-description" className="sr-only">
                      Run all 7 layers of migration and modernization
                    </div>
                    <div
                      className="layer-checkboxes"
                      role="group"
                      aria-labelledby="migration-individual-layers"
                    >
                      <span id="migration-individual-layers" className="sr-only">
                        Individual migration layer selection
                      </span>
                      {[1, 2, 3, 4].map((layerId) => (
                        <label key={layerId} className="layer-checkbox">
                          <input
                            type="checkbox"
                            checked
                          />
                          <span className="checkmark"></span>
                          <span className="layer-info">
                            <span className="layer-name">
                              Layer {layerId}:
                            </span>
                            <span className="layer-description">
                              {layerId === 1 && "Configuration fixes"}
                              {layerId === 2 && "Pattern corrections"}
                              {layerId === 3 && "Component improvements"}
                              {layerId === 4 && "Hydration safety"}
                            </span>
                          </span>
                        </label>
                      ))}
                      <label key={5} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer 5:
                          </span>
                          <span className="layer-description">
                            Next.js optimizations
                            <span style={{
                              fontSize: "0.7rem",
                              color: "rgba(255, 152, 0, 0.8)",
                              marginLeft: "0.5rem",
                              fontWeight: "500"
                            }}>INTERMEDIATE+</span>
                          </span>
                        </span>
                      </label>
                      <label key={6} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer 6:
                          </span>
                          <span className="layer-description">
                            Testing enhancements
                            <span style={{
                              fontSize: "0.7rem",
                              color: "rgba(156, 39, 176, 0.8)",
                              marginLeft: "0.5rem",
                              fontWeight: "500"
                            }}>ADVANCED</span>
                          </span>
                        </span>
                      </label>
                      <label key={7} className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked
                        />
                        <span className="checkmark"></span>
                        <span className="layer-info">
                          <span className="layer-name">
                            Layer 7:
                          </span>
                          <span className="layer-description">
                            Adaptive pattern learning
                            <span style={{
                              fontSize: "0.7rem",
                              color: "rgba(255, 193, 7, 0.8)",
                              marginLeft: "0.5rem",
                              fontWeight: "500"
                            }}>AI LEARNING</span>
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>

              {/* Migration Status */}
              {dashboardState.activeSection === "migration" && (
                <div className="analysis-overview">
                  <h3>Migration Configuration</h3>
                  <div className="overview-stats">
                    <div className="stat migration-mode">
                      <span className="stat-value">MIGRATION</span>
                      <span className="stat-label">Service Mode</span>
                    </div>
                    <div className="stat layers-stat">
                      <span className="stat-value">ALL 7</span>
                      <span className="stat-label">
                        Migration Layers
                      </span>
                    </div>
                    <div className="stat scope-stat">
                      <span className="stat-value">FULL</span>
                      <span className="stat-label">Codebase Scope</span>
                    </div>
                    <div className="stat support-stat">
                      <span className="stat-value">30 DAYS</span>
                      <span className="stat-label">Priority Support</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="migration-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => window.open('/migration-request', '_blank')}
                >
                  Request Custom Quote
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => window.open('mailto:migration@neurolint.dev', '_blank')}
                >
                  Contact Migration Team
                </button>
              </div>

              <div className="migration-cli-info">
                <h3>CLI Migration Command</h3>
                <p>For existing enterprise clients, use the CLI migration command:</p>
                <div className="code-block">
                  <code>neurolint migrate /path/to/project --layers=1,2,3,4,5,6,7 --dry-run</code>
                </div>
                <p className="cli-note">
                  <strong>Note:</strong> Migration command requires enterprise authentication and quote approval.
                </p>
              </div>
            </div>
          )}

                    {/* Overview Tab */}
          {dashboardState.activeSection === "overview" && (
            <div className="tab-content">
              <ErrorBoundary>
                <OnboardingWelcome />
                <Overview analysisHistory={dashboardState.analysisHistory} />
              </ErrorBoundary>
            </div>
          )}

                    

          

                              {/* Analytics Tab */}
          {dashboardState.activeSection === "analytics" && (
            <div className="tab-content">
              <ErrorBoundary>
                <AdvancedAnalyticsDashboard />
              </ErrorBoundary>
            </div>
          )}

          {/* API Keys Tab */}
          {dashboardState.activeSection === "api-keys" && (
            <div className="tab-content">
              <ErrorBoundary>
                                <ApiKeysManager />
              </ErrorBoundary>
            </div>
          )}

          {/* Collaborate Tab */}
          {dashboardState.activeSection === "collaborate" && (
            <div className="tab-content">
              <ErrorBoundary>
                <CollaborationDashboard />
                <div className="mt-8">
                  <TeamDashboard />
                </div>
              </ErrorBoundary>
            </div>
          )}

          {/* Integrations Tab */}
          {dashboardState.activeSection === "integrations" && (
            <div className="tab-content">
              <div className="integrations-overview">
                <h3>Integrations & Automations</h3>
                <p className="tab-description">
                  Connect NeuroLint with your development workflow.
                </p>

                <div className="integration-categories">
                  <div className="integration-category">
                    <div className="category-header">
                      <h4>CI/CD Pipelines</h4>
                      <span
                        className="category-status"
                        data-status="coming-soon"
                      >
                        Coming Soon
                      </span>
                    </div>
                    <p>
                      Automatically analyze code in your CI/CD pipeline with
                      GitHub Actions, GitLab CI, Jenkins, and more.
                    </p>
                    <div className="supported-platforms">
                      <span className="platform-badge">GitHub Actions</span>
                      <span className="platform-badge">GitLab CI</span>
                      <span className="platform-badge">Jenkins</span>
                      <span className="platform-badge">Azure DevOps</span>
                    </div>
                  </div>

                  <div className="integration-category">
                    <div className="category-header">
                      <h4>Webhooks</h4>
                      <span className="category-status" data-status="available">
                        Available
                      </span>
                    </div>
                    <p>
                      Receive real-time notifications when analyses complete or
                      issues are detected.
                    </p>
                    <div className="webhook-features">
                      <div className="feature-item">
                        Analysis completion notifications
                      </div>
                      <div className="feature-item">Error alerts</div>
                      <div className="feature-item">
                        Custom payload formatting
                      </div>
                      <div className="feature-item">Retry mechanisms</div>
                    </div>
                  </div>

                  <div className="integration-category">
                    <div className="category-header">
                      <h4>Team Notifications</h4>
                      <span className="category-status" data-status="available">
                        Available
                      </span>
                    </div>
                    <p>
                      Keep your team informed with Slack and Microsoft Teams
                      integrations.
                    </p>
                    <div className="notification-channels">
                      <div className="channel-item">
                        <span>Slack Channels</span>
                      </div>
                      <div className="channel-item">
                        <span>Email Notifications</span>
                      </div>
                      <div className="channel-item">
                        <span>Microsoft Teams</span>
                      </div>
                    </div>
                  </div>

                  <div className="integration-category">
                    <div className="category-header">
                      <h4>API Access</h4>
                      <span className="category-status" data-status="available">
                        Available
                      </span>
                    </div>
                    <p>
                      Programmatic access to NeuroLint analysis engine with
                      comprehensive REST API.
                    </p>
                    <div className="api-features">
                      <div className="feature-item">API key authentication</div>
                      <div className="feature-item">Rate limiting</div>
                      <div className="feature-item">OpenAPI documentation</div>
                      <div className="feature-item">SDKs coming soon</div>
                    </div>
                    <div className="api-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          window.open("/api/docs?format=html", "_blank")
                        }
                        aria-label="Open API documentation in new tab"
                      >
                        View API Docs
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setDashboardState((prev) => ({
                            ...prev,
                            activeSection: "api-keys",
                          }))
                        }
                        aria-label="Navigate to API keys management section"
                      >
                        Manage API Keys
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Analysis Tab */}
          {dashboardState.activeSection === "editor" && (
            <div className="tab-content">
              <ErrorBoundary>
                <CodeAnalysis
                  onAnalyzeCode={(code, filename) => {
                    setDashboardState((prev) => ({
                      ...prev,
                      currentFile: filename,
                    }));

                    const layers =
                      dashboardState.selectedLayers.length > 0
                        ? dashboardState.selectedLayers
                        : "auto";
                    analyzecode(
                      code,
                      filename,
                      layers,
                      dashboardState.applyFixes,
                    );

                    // Auto-scroll to paste section when analyzing pasted code
                    requestAnimationFrame(() => {
                      scrollToSection(pasteSectionRef);
                    });
                  }}
                  onFileUpload={handleFileUpload}
                  isLoading={dashboardState.isLoading}
                  currentFile={dashboardState.currentFile}
                  fileInputRef={fileInputRef}
                  uploadSectionRef={uploadSectionRef}
                  pasteSectionRef={pasteSectionRef}
                  githubSectionRef={githubSectionRef}
                  onModeChange={(mode) => {
                    // Auto-scroll to appropriate section when mode changes
                    requestAnimationFrame(() => {
                      if (mode === "upload") {
                        scrollToSection(uploadSectionRef);
                      } else if (mode === "paste") {
                        scrollToSection(pasteSectionRef);
                      } else if (mode === "github") {
                        scrollToSection(githubSectionRef);
                      }
                    });
                  }}
                  onNavigateToGitHub={() => {
                    // Navigate to GitHub integration section
                    setDashboardState((prev) => ({
                      ...prev,
                      activeSection: "bulk",
                    }));
                  }}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Projects Tab */}
          {dashboardState.activeSection === "projects" && (
            <div className="tab-content">
              <div className="projects-header">
                <h3>Your Projects</h3>
                <LoadingButton
                  isLoading={isLoading.createProject}
                  variant="primary"
                  onClick={async () => {
                    const projectName = await showProjectNameDialog();
                    if (!projectName) return;

                    if (!user?.id) {
                      showError("You must be logged in to create projects");
                      return;
                    }

                    setIsLoading(prev => ({ ...prev, createProject: true }));

                    try {
                      const savedProject = await productionDb.createProject(user.id, {
                        name: projectName,
                        description: "",
                        files: []
                      });

                      const newProject: Project = {
                        id: savedProject.id,
                        name: savedProject.name,
                        description: savedProject.description || "",
                        files: savedProject.files || [],
                        createdAt: new Date(savedProject.created_at),
                        lastAnalyzed: savedProject.last_analyzed ? new Date(savedProject.last_analyzed) : undefined,
                      };

                      setDashboardState((prev) => ({
                        ...prev,
                        projects: [...prev.projects, newProject],
                      }));

                      showSuccess(`Project "${projectName}" created successfully!`);
                    } catch (error) {
                      if (error instanceof ValidationError) {
                        showError(`Invalid project name: ${error.message}`);
                      } else if (error instanceof DatabaseError) {
                        showError(`Database error: ${error.message}`);
                      } else {
                        showError("Failed to create project. Please try again.");
                      }
                    } finally {
                      setIsLoading(prev => ({ ...prev, createProject: false }));
                    }
                  }}
                >
                  New Project
                </LoadingButton>
              </div>

              {isLoading.dashboardData ? (
                <SectionLoader message="Loading your projects..." />
              ) : dashboardState.projects.length === 0 ? (
                <div className="empty-state">
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v2M7 13h10l-4-8H7l-4 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first project to organize your code analysis and track improvements over time.
                    </p>
                    <LoadingButton
                      isLoading={isLoading.createProject}
                      variant="primary"
                      onClick={async () => {
                        const projectName = await showProjectNameDialog();
                        if (!projectName) return;

                        if (!user?.id) {
                          showError("You must be logged in to create projects");
                          return;
                        }

                        setIsLoading(prev => ({ ...prev, createProject: true }));

                        try {
                          const savedProject = await productionDb.createProject(user.id, {
                            name: projectName,
                            description: "",
                            files: []
                          });

                          const newProject: Project = {
                            id: savedProject.id,
                            name: savedProject.name,
                            description: savedProject.description || "",
                            files: savedProject.files || [],
                            createdAt: new Date(savedProject.created_at),
                            lastAnalyzed: savedProject.last_analyzed ? new Date(savedProject.last_analyzed) : undefined,
                          };

                          setDashboardState((prev) => ({
                            ...prev,
                            projects: [...prev.projects, newProject],
                          }));

                          showSuccess(`Project "${projectName}" created successfully!`);
                        } catch (error) {
                          if (error instanceof ValidationError) {
                            showError(`Invalid project name: ${error.message}`);
                          } else if (error instanceof DatabaseError) {
                            showError(`Database error: ${error.message}`);
                          } else {
                            showError("Failed to create project. Please try again.");
                          }
                        } finally {
                          setIsLoading(prev => ({ ...prev, createProject: false }));
                        }
                      }}
                    >
                      Create Your First Project
                    </LoadingButton>
                  </div>
                </div>
              ) : (
                <div className="projects-grid">
                  {dashboardState.projects.map((project) => (
                    <div key={project.id} className="project-card">
                      <h4>{project.name}</h4>
                      <p className="project-meta">
                        Created {project.createdAt.toLocaleDateString()}
                      </p>
                      <p className="project-stats">
                        {project.files.length} files
                      </p>
                      <div className="project-actions">
                        <button className="btn btn-sm">Open</button>
                        <LoadingButton
                          isLoading={isLoading[`deleteProject_${project.id}`]}
                          variant="danger"
                          className="btn-sm"
                          onClick={() => {
                            showConfirm(
                              `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
                              async () => {
                                if (!user?.id) {
                                  showError("You must be logged in to delete projects");
                                  return;
                                }

                                setIsLoading(prev => ({ ...prev, [`deleteProject_${project.id}`]: true }));

                                try {
                                  await productionDb.deleteProject(user.id, project.id);
                                  
                                  setDashboardState((prev) => ({
                                    ...prev,
                                    projects: prev.projects.filter((p) => p.id !== project.id),
                                  }));

                                  showSuccess(`Project "${project.name}" deleted successfully`);
                                } catch (error) {
                                  if (error instanceof DatabaseError) {
                                    showError(`Failed to delete project: ${error.message}`);
                                  } else {
                                    showError("Failed to delete project. Please try again.");
                                  }
                                } finally {
                                  setIsLoading(prev => ({ ...prev, [`deleteProject_${project.id}`]: false }));
                                }
                              },
                              "Delete Project"
                            );
                          }}
                                                  >
                            Delete
                          </LoadingButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis History Tab */}
          {dashboardState.activeSection === "history" && (
            <div className="tab-content">
              <div className="history-header ds-flex ds-items-center ds-gap-3">
                <h3 className="ds-m-0">Analysis History</h3>
                <input
                  type="text"
                  className="history-search-input"
                  placeholder="Search filename..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid #000000",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    flex: "0 0 220px",
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                                      showConfirm(
                    "Are you sure you want to clear all analysis history? This action cannot be undone.",
                    async () => {
                      if (!user?.id) {
                        showError("You must be logged in to clear history");
                        return;
                      }

                      try {
                        await productionDb.clearAnalysisHistory(user.id);
                        setDashboardState((prev) => ({
                          ...prev,
                          analysisHistory: [],
                        }));
                        showSuccess("Analysis history cleared successfully");
                      } catch (error) {
                        if (error instanceof DatabaseError) {
                          showError(`Failed to clear history: ${error.message}`);
                        } else {
                          showError("Failed to clear history. Please try again.");
                        }
                      }
                    },
                    "Clear Analysis History"
                  );
                  }}
                >
                  Clear History
                </button>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No analysis history yet. Your completed analyses will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="history-list">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-main">
                        <h4>{item.filename}</h4>
                        <div className="history-meta">
                          <span className="timestamp">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <span className="execution-time">
                            {formatProcessingTime(item.executionTime)}
                          </span>
                          <span
                            className={`status ${item.result.success ? "success" : "error"}`}
                          >
                            {item.result.success ? "Success" : "Failed"}
                          </span>
                        </div>
                      </div>
                      <div className="history-summary">
                        {item.result.analysis && (
                          <>
                            <span className="issues-count">
                              {item.result.analysis.detectedIssues?.length || 0}{" "}
                              issues
                            </span>
                            <span className="confidence">
                              {(
                                (item.result.analysis.confidence || 0) * 100
                              ).toFixed(0)}
                              % confidence
                            </span>
                            <span className="layers">
                              Layers:{" "}
                              {item.layers.length
                                ? item.layers.join(", ")
                                : "Auto"}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setDashboardState((prev) => ({
                            ...prev,
                            result: item.result,
                            showResults: true,
                            currentFile: item.filename,
                          }));

                          // Auto-scroll to results when viewing details
                          // Use requestAnimationFrame for better performance
                          requestAnimationFrame(() => {
                            scrollToSection(resultsSectionRef);
                          });
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sample Files Tab */}
          {dashboardState.activeSection === "samples" && (
            <div className="tab-content">
              <h3>Sample Code Files</h3>
              <p className="tab-description">
                Test NeuroLint with these curated examples showcasing
                different types of issues.
              </p>

              <div className="samples-grid">
                {Object.entries(sampleFiles).map(([key, sample]) => (
                  <div key={key} className="sample-card">
                    <div className="sample-header">
                      <h4>{sample.filename}</h4>
                      <span className="sample-type">
                        {key === "component-issues" && "React Components"}
                        {key === "ssr-hydration" && "SSR/Hydration"}
                        {key === "nextjs-patterns" && "Next.js Patterns"}
                      </span>
                    </div>
                    <p className="sample-description">
                      {key === "component-issues" &&
                        "Missing key props, type issues"}
                      {key === "ssr-hydration" && "localStorage and SSR safety"}
                      {key === "nextjs-patterns" &&
                        "Next.js specific optimizations"}
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => loadSampleFile(key)}
                      disabled={dashboardState.isLoading}
                    >
                      {dashboardState.isLoading
                        ? "Analyzing..."
                        : "Analyze Sample"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          

          {/* User Account Tab */}
          {dashboardState.activeSection === "account" && (
            <div className="tab-content">
              <h3>User Account</h3>

              <div className="account-sections">
                <div className="account-section">
                  <h4>Profile Information</h4>
                  <div className="profile-info">
                    <div className="profile-row">
                      <label>Name</label>
                      <div className="profile-value">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "Not set"}
                      </div>
                    </div>
                    <div className="profile-row">
                      <label>Email</label>
                      <div className="profile-value">{user?.email}</div>
                    </div>
                    <div className="profile-row">
                      <label>Plan</label>
                      <div className="profile-value">
                        <span className="plan-badge">
                          {user?.plan?.charAt(0).toUpperCase() +
                            user?.plan?.slice(1) || "Free"}
                        </span>
                      </div>
                    </div>
                    <div className="profile-row">
                      <label>Member Since</label>
                      <div className="profile-value">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "Recently"}
                      </div>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <Link href="/profile" className="btn btn-primary">
                      Edit Profile
                    </Link>
                  </div>
                </div>

                <div className="account-section">
                  <h4>Usage & Billing</h4>
                  {dashboardState.subscriptionData.loading ? (
                    <div
                      className="loading-state"
                      style={{ padding: "20px", textAlign: "center" }}
                    >
                      <div
                        className="loading-spinner"
                        style={{ width: "24px", height: "24px" }}
                      ></div>
                      <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>
                        Loading billing information...
                      </p>
                    </div>
                  ) : dashboardState.subscriptionData.error ? (
                    <div
                      className="error-state"
                      style={{ padding: "16px", fontSize: "14px" }}
                    >
                      <p>
                        Failed to load billing information:{" "}
                        {dashboardState.subscriptionData.error}
                      </p>
                      <button
                        className="btn btn-sm"
                        onClick={loadSubscriptionData}
                        style={{ marginTop: "8px" }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="usage-info">
                        <div className="usage-row">
                          <label>Current Plan</label>
                          <div className="usage-value">
                            <span className="plan-badge">
                              {dashboardState.subscriptionData.currentPlan.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {rateLimitInfo && (
                          <>
                            <div className="usage-row">
                              <label>Analyses Used</label>
                              <div className="usage-value">
                                {rateLimitInfo.used || 0} /{" "}
                                {rateLimitInfo.limit || "∞"}
                              </div>
                            </div>
                            <div className="usage-row">
                              <label>Remaining</label>
                              <div className="usage-value">
                                {rateLimitInfo.remaining} analyses
                              </div>
                            </div>
                            <div className="usage-row">
                              <label>Resets</label>
                              <div className="usage-value">
                                {new Date(
                                  rateLimitInfo.resetTime,
                                ).toLocaleString()}
                              </div>
                            </div>
                          </>
                        )}
                        {dashboardState.subscriptionData.subscriptions.length >
                          0 && (
                          <div className="usage-row">
                            <label>Active Subscriptions</label>
                            <div className="usage-value">
                              {
                                dashboardState.subscriptionData.subscriptions.filter(
                                  (s) => s.status === "active",
                                ).length
                              }
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="billing-actions">
                        <Link href="/pricing" className="btn btn-primary">
                          Upgrade Plan
                        </Link>
                        <button
                          className="btn btn-secondary"
                          onClick={async () => {
                            try {
                              if (
                                dashboardState.subscriptionData.subscriptions
                                  .length > 0
                              ) {
                                // Export billing history from state
                                const historyData = {
                                  subscriptions:
                                    dashboardState.subscriptionData
                                      .subscriptions,
                                  currentPlan:
                                    dashboardState.subscriptionData.currentPlan,
                                  exportedAt: new Date().toISOString(),
                                };

                                const blob = new Blob(
                                  [JSON.stringify(historyData, null, 2)],
                                  {
                                    type: "application/json",
                                  },
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `billing-history-${new Date().toISOString().split("T")[0]}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } else {
                                showToast({
                                  type: 'info',
                                  title: 'No Billing History',
                                  message: "No billing history found. You're on the free plan.",
                                });
                              }
                            } catch (error) {
                              // [NeuroLint] Removed console.error: 
                                "Failed to export billing history:",
                                error,
                              
                              showToast({
                                type: 'error',
                                title: 'Export Failed',
                                message: 'Failed to export billing history. Please try again.',
                              });
                            }
                          }}
                        >
                          Export Billing History
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="account-section">
                  <h4>Account Actions</h4>
                  <div className="account-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/exports", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...(session?.access_token && {
                                Authorization: `Bearer ${session.access_token}`,
                              }),
                            },
                            body: JSON.stringify({ exportType: "complete" }),
                          });

                          if (!response.ok) {
                            let errorMessage = "Export failed";
                            try {
                              // Clone response to avoid "body stream already read" error
                              const responseClone = response.clone();
                              const errorResult = await responseClone.json();
                              errorMessage = errorResult.error || errorMessage;
                            } catch (jsonError) {
                              errorMessage =
                                response.statusText || errorMessage;
                            }
                            throw new Error(errorMessage);
                          }

                          const result = await response.json();

                          if (result.success) {
                            const blob = new Blob(
                              [JSON.stringify(result.data, null, 2)],
                              {
                                type: "application/json",
                              },
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = result.filename;
                            a.click();
                            URL.revokeObjectURL(url);
                            showToast({
                              type: 'success',
                              title: 'Export Successful',
                              message: 'Account data exported successfully!',
                            });
                          } else {
                            throw new Error(result.error || "Export failed");
                          }
                        } catch (error) {
                          // [NeuroLint] Removed console.error: "Export failed:", error
                          showToast({
                            type: 'error',
                            title: 'Export Failed',
                            message: 'Failed to export account data. Please try again.',
                          });
                        }
                      }}
                    >
                      Export Account Data
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        if (confirm("Are you sure you want to sign out?")) {
                          signOut();
                        }
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {dashboardState.activeSection === "settings" && (
                        <div className="tab-content">
              <h3>Settings</h3>

              {/* <ExperienceLevelSelector /> */}

              <div className="settings-sections">
                <div className="settings-section">
                  <h4>Analysis Defaults</h4>
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={dashboardState.settings.autoSave}
                        onChange={(e) => {
                          const newSettings = {
                            ...dashboardState.settings,
                            autoSave: e.target.checked,
                          };
                          localStorage.setItem(
                            "neurolint-settings",
                            JSON.stringify(newSettings),
                          );
                          setDashboardState((prev) => ({
                            ...prev,
                            settings: newSettings,
                          }));
                        }}
                      />
                      Auto-save analysis results to history
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={dashboardState.settings.notifications}
                        onChange={(e) => {
                          const newSettings = {
                            ...dashboardState.settings,
                            notifications: e.target.checked,
                          };
                          localStorage.setItem(
                            "neurolint-settings",
                            JSON.stringify(newSettings),
                          );
                          setDashboardState((prev) => ({
                            ...prev,
                            settings: newSettings,
                          }));
                        }}
                      />
                      Show notifications for completed analyses
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>API Configuration</h4>
                  <div className="setting-item">
                    <label>API Endpoint</label>
                    <input
                      type="text"
                      className="form-input"
                      value="/api/demo"
                      disabled
                      placeholder="Default API endpoint"
                    />
                  </div>
                  <div className="setting-item">
                    <label>Request Timeout</label>
                    <input
                      type="number"
                      className="form-input"
                      defaultValue={30000}
                      placeholder="Timeout in milliseconds"
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Data Management</h4>
                  <div className="setting-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const data = {
                          history: dashboardState.analysisHistory,
                          projects: dashboardState.projects,
                          settings: dashboardState.settings,
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "neurolint-data.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export Data
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (
                          confirm("This will clear all your data. Are you sure?")
                        ) {
                          localStorage.removeItem("neurolint-history");
                          localStorage.removeItem("neurolint-projects");
                          localStorage.removeItem("neurolint-settings");

                          setDashboardState((prev) => ({
                            ...prev,
                            analysisHistory: [],
                            projects: [],
                            settings: {
                              defaultLayers: [],
                              autoSave: true,
                              notifications: true,
                              theme: "dark",
                            },
                          }));
                        }
                      }}
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section - Inline Display */}
          {dashboardState.showResults && (
            <div className="results-inline-section" ref={resultsSectionRef}>
              <div className="results-inline-container">
                <div className="results-inline-header">
                  <h2>Analysis Results - {dashboardState.currentFile}</h2>
                  <div className="results-inline-actions">
                    <button
                      className="control-btn"
                      onClick={() =>
                        setDashboardState((prev) => ({
                          ...prev,
                          showResults: false,
                          result: null,
                          currentFile: null,
                          isLoading: false,
                          progressStatus: "",
                          uploadProgress: 0,
                        }))
                      }
                      aria-label="Clear analysis results and start over"
                    >
                      Clear Results
                    </button>
                    <button
                      className="results-close"
                      onClick={() => {
                        setDashboardState((prev) => ({
                          ...prev,
                          showResults: false,
                        }));
                      }}
                      aria-label="Close results"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="results-inline-content">
                  {dashboardState.isLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Analyzing code with NeuroLint...</p>
                    </div>
                  ) : dashboardState.result?.error ? (
                    <div className="error-state">
                      <h3>Analysis Failed</h3>
                      <p>{dashboardState.result.error}</p>
                    </div>
                  ) : (
                    dashboardState.result && (
                      <div className="analysis-results">
                    {/* Premium Business Insights */}
                    {dashboardState.result.analysis && (
                      <div className="business-insights">
                        <h3>Technical Impact Analysis</h3>
                        <div className="insights-grid">
                          <div className="insight-card">
                            <div className="insight-label">
                              Potential Savings
                            </div>
                            <div className="insight-value">
                              ~
                              {Math.round(
                                dashboardState.result.analysis.detectedIssues
                                  .length * 2.5,
                              )}{" "}
                              hours dev time
                            </div>
                          </div>
                          <div className="insight-card">
                            <div className="insight-label">
                              Performance Gain
                            </div>
                            <div className="insight-value">
                              {dashboardState.result.analysis.estimatedImpact
                                .level === "high"
                                ? "15-25%"
                                : "5-15%"}{" "}
                              faster
                            </div>
                          </div>
                          <div className="insight-card">
                            <div className="insight-label">Risk Reduction</div>
                            <div className="insight-value">
                              {
                                dashboardState.result.analysis.detectedIssues.filter(
                                  (i) =>
                                    i.severity === "high" ||
                                    i.severity === "critical",
                                ).length
                              }{" "}
                              critical issues
                            </div>
                          </div>
                          <div className="insight-card">
                            <div className="insight-label">
                              Standards Compliance
                            </div>
                            <div className="insight-value">
                              {Math.round(
                                dashboardState.result.analysis.confidence * 100,
                              )}
                              % best practices
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analysis Overview */}
                    {dashboardState.result.analysis && (
                      <div className="analysis-overview">
                        <h3>Analysis Overview</h3>
                        <div className="overview-stats">
                          <div className="stat">
                            <span className="stat-value">
                              {
                                dashboardState.result.analysis.detectedIssues
                                  .length
                              }
                            </span>
                            <span className="stat-label">Issues Found</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">
                              {dashboardState.result.analysis.confidence}%
                            </span>
                            <span className="stat-label">Analysis Score</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">
                              {
                                dashboardState.result.analysis.estimatedImpact
                                  .level
                              }
                            </span>
                            <span className="stat-label">Impact Level</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">
                              {formatProcessingTime(
                                dashboardState.result.metadata
                                  ?.processingTimeMs || 0,
                              )}
                            </span>
                            <span className="stat-label">Processing Time</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Before/After Code Comparison */}
                    {dashboardState.result.originalCode &&
                      dashboardState.result.transformed && (
                        <div className="code-comparison">
                          <h3>
                            {dashboardState.result.dryRun
                              ? "Code Preview (Dry Run)"
                              : "Applied Changes"}
                          </h3>

                          {dashboardState.result.originalCode ===
                          dashboardState.result.transformed ? (
                            <div className="no-changes">
                              <p>
                                No changes needed - your code is already
                                optimized!
                              </p>
                            </div>
                          ) : (
                            <div className="comparison-grid">
                              <div className="code-panel">
                                <div className="code-panel-header">
                                  <h4>Original Code</h4>
                                  <div className="code-actions">
                                    <button
                                      className="code-action-btn"
                                      onClick={() =>
                                        copyToClipboard(
                                          dashboardState.result?.originalCode ||
                                            "",
                                          "Original",
                                        )
                                      }
                                      title="Copy original code"
                                      aria-label="Copy original code to clipboard"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <rect
                                          x="9"
                                          y="9"
                                          width="13"
                                          height="13"
                                          rx="2"
                                          ry="2"
                                        ></rect>
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                                      </svg>
                                    </button>
                                    <button
                                      className="code-action-btn"
                                      onClick={() =>
                                        downloadCode(
                                          dashboardState.result?.originalCode ||
                                            "",
                                          `${dashboardState.currentFile || "original-code"}.backup.tsx`,
                                        )
                                      }
                                      title="Download original code"
                                      aria-label="Download original code as file"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                                        <polyline points="7,10 12,15 17,10"></polyline>
                                        <line
                                          x1="12"
                                          y1="15"
                                          x2="12"
                                          y2="3"
                                        ></line>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <pre className="code-block">
                                  <code>
                                    {dashboardState.result.originalCode}
                                  </code>
                                </pre>
                              </div>
                              <div className="code-panel">
                                <div className="code-panel-header">
                                  <h4>
                                    {dashboardState.result.dryRun
                                      ? "Preview Changes"
                                      : "Fixed Code"}
                                  </h4>
                                  <div className="code-actions">
                                    <button
                                      className="code-action-btn"
                                      onClick={() =>
                                        copyToClipboard(
                                          dashboardState.result?.transformed ||
                                            "",
                                          "Fixed",
                                        )
                                      }
                                      title="Copy fixed code"
                                      aria-label="Copy fixed code to clipboard"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <rect
                                          x="9"
                                          y="9"
                                          width="13"
                                          height="13"
                                          rx="2"
                                          ry="2"
                                        ></rect>
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                                      </svg>
                                    </button>
                                    <button
                                      className="code-action-btn"
                                      onClick={() =>
                                        downloadCode(
                                          dashboardState.result?.transformed ||
                                            "",
                                          `${dashboardState.currentFile || "fixed-code"}.tsx`,
                                        )
                                      }
                                      title="Download fixed code"
                                      aria-label="Download fixed code as file"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                                        <polyline points="7,10 12,15 17,10"></polyline>
                                        <line
                                          x1="12"
                                          y1="15"
                                          x2="12"
                                          y2="3"
                                        ></line>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <pre className="code-block">
                                  <code>
                                    {dashboardState.result.transformed}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Issues Details */}
                    {dashboardState.result.analysis?.detectedIssues &&
                      dashboardState.result.analysis.detectedIssues.length >
                        0 && (
                        <div className="issues-section">
                          <h3>Detected Issues</h3>
                          <div className="issues-list">
                            {dashboardState.result.analysis.detectedIssues.map(
                              (issue, index) => (
                                <div
                                  key={`layer-${issue.layer || index}-${index}`}
                                  className="issue-item severity-medium"
                                >
                                  <div className="issue-header">
                                    <span className="issue-type">Layer {issue.layer} Issue</span>
                                    <span className="issue-severity">medium</span>
                                  </div>
                                  <p className="issue-description">{issue.reason || issue.description || "No description available"}</p>
                                  <div className="issue-meta">
                                    <span>
                                      Fixed by Layer {issue.layer}
                                    </span>
                                    {issue.count && (
                                      <span>{issue.count} occurrences</span>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Layer Execution Details */}
                    {dashboardState.result.layerResults && (
                      <div className="layers-section">
                        <h3>Layer Execution</h3>
                        <div className="layers-list">
                          {dashboardState.result.layerResults.map((layer, layerIndex) => {
                            // Determine layer status based on execution results
                            const getLayerStatus = (layer) => {
                              if (layer.success && (layer.changeCount > 0 || layer.improvements?.length > 0)) {
                                return { className: "success", text: "Success" };
                              } else if (!layer.success && layer.error === "No changes were made") {
                                return { className: "no-changes", text: "No changes needed" };
                              } else if (!layer.success && layer.error) {
                                return { className: "failed", text: "Failed" };
                              } else if (layer.success && layer.changeCount === 0) {
                                return { className: "no-changes", text: "No changes needed" };
                              } else {
                                return { className: "skipped", text: "Skipped" };
                              }
                            };
                            
                            const status = getLayerStatus(layer);
                            
                            return (
                            <div
                              key={`layer-${layer.layerId || `index-${layerIndex}`}`}
                              className={`layer-item ${status.className}`}
                            >
                              <div className="layer-header">
                                <span className="layer-id">
                                  Layer {layer.layerId}
                                </span>
                                <span className="layer-time">
                                  {formatProcessingTime(layer.executionTime || Math.round((dashboardState.result.executionTime || 2000) / (dashboardState.result.layerResults?.length || 1)))}
                                </span>
                                <span
                                  className={`layer-status ${status.className}`}
                                >
                                  {status.text}
                                </span>
                              </div>
                              {layer.improvements && (
                                <ul className="layer-improvements">
                                  {layer.improvements.map(
                                    (improvement, idx) => (
                                      <li key={`layer-${layer.layerId || `index-${layerIndex}`}-improvement-${idx}`}>{improvement}</li>
                                    ),
                                  )}
                                </ul>
                              )}
                              {layer.error && layer.error !== "No changes were made" && (
                                <p className="layer-error">
                                  Error: {layer.error}
                                </p>
                              )}
                              {layer.revertReason && (
                                <p className="layer-revert">
                                  Reverted: {layer.revertReason}
                                </p>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  </ModalProvider>
  );
}











