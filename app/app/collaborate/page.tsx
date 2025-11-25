"use client";

// Disable static generation
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../lib/auth-context";

// Types
interface Session {
  id: string;
  name: string;
  document_content: string;
  document_filename: string;
  document_language: string;
  host_user_id: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  is_locked: boolean;
  max_participants: number;
  expires_at: string;
  participants: Participant[];
}

interface Participant {
  user_id: string;
  user_name: string;
  user_color: string;
  user_avatar?: string;
  joined_at: string;
  is_active: boolean;
  is_host: boolean;
}

interface AnalysisResult {
  id: string;
  success: boolean;
  dryRun: boolean;
  layers: number[];
  originalCode: string;
  transformed: string;
  totalExecutionTime: number;
  successfulLayers: number;
  analysis: {
    recommendedLayers: number[];
    detectedIssues: any[];
    confidence: number;
    estimatedImpact: {
      level: string;
      description: string;
      estimatedFixTime: string;
    };
  };
  triggeredBy: string;
  triggeredByName?: string;
  timestamp: string;
  error?: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  line_number: number;
  is_resolved: boolean;
  comment_type: "comment" | "chat" | "system";
  created_at: string;
}

// Real-time updates will be handled via polling for now
// In production, you'd implement WebSocket connections or Server-Sent Events

export default function CollaboratePage() {
  const { showToast } = useToast();
  const { session } = useAuth();
  // User state
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userSetup, setUserSetup] = useState(false);

  // Session state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");

  // Editor state
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("example.tsx");
  const [language, setLanguage] = useState("typescript");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([]);
  const [dryRun, setDryRun] = useState(true);

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(
    null,
  );

  // Chat state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showChat, setShowChat] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Layer information
  const layerInfo = {
    1: {
      name: "Configuration",
      color: "#2196f3",
      description: "TypeScript/Next.js config modernization",
    },
    2: {
      name: "Patterns",
      color: "#ff9800",
      description: "HTML entities, imports, console cleanup",
    },
    3: {
      name: "Components",
      color: "#4caf50",
      description: "Missing keys, React imports, accessibility",
    },
    4: {
      name: "Hydration",
      color: "#e91e63",
      description: "SSR safety guards, localStorage protection",
    },
    5: {
      name: "Next.js",
      color: "#9c27b0",
      description: "App Router compliance, use client directives",
    },
    6: {
      name: "Testing",
      color: "#00bcd4",
      description: "TypeScript props, error handling, exports",
    },
  };

  // Initialize user
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get("session");

    if (sessionFromUrl) {
      setJoinSessionId(sessionFromUrl);
      setIsJoiningSession(true);
    }

    // Generate user ID if not exists
    let storedUserId = localStorage.getItem("neurolint-user-id");
    if (!storedUserId) {
      storedUserId =
        "user_" +
        Math.random().toString(36).substr(2, 9) +
        Date.now().toString(36);
      localStorage.setItem("neurolint-user-id", storedUserId);
    }
    setUserId(storedUserId);

    const storedUserName = localStorage.getItem("neurolint-user-name");
    if (storedUserName) {
      setUserName(storedUserName);
      setUserSetup(true);
    }
  }, []);

  // Auto-join session when user setup is complete and session ID is available
  useEffect(() => {
    if (isJoiningSession && joinSessionId && userSetup && !currentSession && userName) {
      // Use setTimeout to ensure this runs after the component is fully initialized
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Trigger the join session manually by calling the join function
          const joinSessionFunction = async () => {
            if (!joinSessionId.trim()) {
              setError("Please enter a session ID");
              return;
            }

            setLoading(true);
            setError("");

            try {
              const response = await fetch("/api/collaboration/join", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": userId,
                  "x-user-name": userName,
                },
                body: JSON.stringify({
                  sessionId: joinSessionId,
                  userName: userName,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Network error" }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }

              const { session } = await response.json();
              if (!session) {
                throw new Error("No session data received from server");
              }

              setCurrentSession(session);
              setCode(session.document_content);
              setFilename(session.document_filename);
              setLanguage(session.document_language);
              setIsJoiningSession(false);

              // Setup real-time subscriptions (with delay to allow session creation to complete)
              setTimeout(() => {
                setupRealtimeSubscriptions(session.id);
              }, 1000);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to join session");
            } finally {
              setLoading(false);
            }
          };

          joinSessionFunction();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isJoiningSession, joinSessionId, userSetup, currentSession, userName, userId]);



  // Save user name
  const handleUserSetup = useCallback(() => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    localStorage.setItem("neurolint-user-name", userName);
    setUserSetup(true);
    setError("");
  }, [userName]);

  // API call helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      // Attach Supabase Bearer token when available (from context if available) 
      let accessToken: string | null = session?.access_token || null;
      if (!accessToken) {
        try {
          const savedSession = localStorage.getItem("neurolint-supabase-auth") || localStorage.getItem("supabase_session");
          if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            accessToken = sessionData?.access_token || null;
          }
        } catch {}
      }

      const response = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          "x-user-id": userId,
          "x-user-name": userName,
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        // Clone response to avoid "body stream already read" error
        const responseClone = response.clone();
        const errorData = await responseClone
          .json()
          .catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    [userId, userName]
  );

  // Create session
  const createSession = useCallback(async () => {
    if (!sessionName.trim()) {
      setError("Please enter a session name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { session } = await apiCall("/api/collaboration/sessions", {
        method: "POST",
        body: JSON.stringify({
          name: sessionName,
          description:
            code ||
            `// Welcome to NeuroLint Collaboration!\n// Start typing your React/TypeScript code here...`,
        }),
      });

      setCurrentSession(session);
      setCode(session.document_content);
      setIsCreatingSession(false);

      // Copy session link
      const sessionLink = `${window.location.origin}/collaborate?session=${session.id}`;
      try {
        await navigator.clipboard.writeText(sessionLink);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Session link copied to clipboard!',
        });
      } catch {
        showToast({
          type: 'info',
          title: 'Copy Session Link',
          message: `Please copy this session link: ${sessionLink}`,
        });
      }

      // Setup real-time subscriptions (with delay to allow session creation to complete)
      setTimeout(() => {
        setupRealtimeSubscriptions(session.id);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  }, [sessionName, filename, language, code, apiCall]);

  // Join session
  const joinSession = useCallback(async () => {
    if (!joinSessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiCall("/api/collaboration/join", {
        method: "POST",
        body: JSON.stringify({
          sessionId: joinSessionId,
          userName: userName,
        }),
      });

      const { session } = response;
      if (!session) {
        throw new Error("No session data received from server");
      }

      setCurrentSession(session);
      setCode(session.document_content);
      setFilename(session.document_filename);
      setLanguage(session.document_language);
      setIsJoiningSession(false);

      // Setup real-time subscriptions (with delay to allow session creation to complete)
      setTimeout(() => {
        setupRealtimeSubscriptions(session.id);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join session");
    } finally {
      setLoading(false);
    }
  }, [joinSessionId, userName, apiCall]);

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      await apiCall(`/api/collaboration/join?sessionId=${currentSession.id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error leaving session:", err);
    }

    // Cleanup subscriptions
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    setCurrentSession(null);
    setCode("");
    setAnalysisResults([]);
    setSelectedResult(null);
    setComments([]);
  }, [currentSession, apiCall]);

  // Setup polling for real-time updates
  const setupRealtimeSubscriptions = useCallback(
    (sessionId: string) => {
      // Poll for updates every 3 seconds (reduced frequency to avoid overwhelming)
      const pollInterval = setInterval(async () => {
        try {
          // Get updated session data
          try {
            const { session } = await apiCall(
              `/api/collaboration/sessions/${sessionId}`,
            );

            if (session) {
              setCurrentSession((prev) => {
                if (!prev) return session;

                // Only update if content changed
                if (prev.document_content !== session.document_content) {
                  setCode(session.document_content);
                }

                return session;
              });
            }
          } catch (sessionError) {
            const errorMessage = sessionError instanceof Error ? sessionError.message : String(sessionError);
            console.warn("Session polling error:", errorMessage);
            // If session is lost, try to recreate our participant entry
            if (errorMessage.includes("Session not found")) {
              console.log("Session lost, attempting to rejoin...");
              try {
                await apiCall("/api/collaboration/join", {
                  method: "POST",
                  body: JSON.stringify({
                    sessionId: sessionId,
                    userName: userName,
                  }),
                });
              } catch (rejoinError) {
                console.error("Failed to rejoin session:", rejoinError);
              }
            }
          }

          // Get comments
          try {
            const { comments: newComments } = await apiCall(
              `/api/collaboration/sessions/${sessionId}/comments`,
            );
            if (newComments && Array.isArray(newComments)) {
              setComments(newComments);
            }
          } catch (commentsError) {
            const errorMessage = commentsError instanceof Error ? commentsError.message : String(commentsError);
            console.warn("Comments polling error:", errorMessage);
          }

          // Get analysis results
          try {
            const { analyses } = await apiCall(
              `/api/collaboration/analyze?sessionId=${sessionId}`,
            );
            if (analyses && Array.isArray(analyses)) {
              const formattedAnalyses = analyses.map((analysis: any) => ({
                id: analysis.id,
                success: analysis.success,
                dryRun: analysis.dry_run,
                layers: analysis.layers_executed,
                originalCode: analysis.input_code,
                transformed: analysis.output_code,
                totalExecutionTime: analysis.execution_time,
                successfulLayers: analysis.layers_executed.length,
                analysis: analysis.analysis_results,
                triggeredBy: analysis.triggered_by,
                triggeredByName: analysis.triggered_by_name,
                timestamp: analysis.created_at,
                error: analysis.error_message,
              }));

              setAnalysisResults(formattedAnalyses);

              // Auto-select the latest result if none is selected
              if (formattedAnalyses.length > 0 && !selectedResult) {
                setSelectedResult(formattedAnalyses[0]);
              }
            }
          } catch (analysisError) {
            const errorMessage = analysisError instanceof Error ? analysisError.message : String(analysisError);
            console.warn("Analysis polling error:", errorMessage);
          }
        } catch (error) {
          console.error("General polling error:", error);
        }
      }, 3000);

      subscriptionRef.current = {
        unsubscribe: () => clearInterval(pollInterval),
      };
    },
    [apiCall],
  );

  // Run analysis
  const runAnalysis = useCallback(
    async (customLayers?: number[], customDryRun?: boolean) => {
      console.log("[RUN ANALYSIS] Starting analysis...");
      console.log("[RUN ANALYSIS] Current session:", currentSession?.id);
      console.log("[RUN ANALYSIS] Code length:", code.length);

      if (!currentSession || !code.trim()) {
        console.log("[RUN ANALYSIS] Missing session or code");
        setError("No code to analyze");
        return;
      }

      const layers =
        customLayers || selectedLayers.length > 0 ? selectedLayers : undefined;
      const isDryRun = customDryRun !== undefined ? customDryRun : dryRun;

      setIsAnalyzing(true);
      setError("");

      try {
        const { result } = await apiCall("/api/collaboration/analyze", {
          method: "POST",
          body: JSON.stringify({
            sessionId: currentSession.id,
            layers,
            dryRun: isDryRun,
          }),
        });

        console.log("[RUN ANALYSIS] Got result:", result);

        // Create formatted result for immediate display
        if (result) {
          const formattedResult: AnalysisResult = {
            id: result.analysisId || `analysis_${Date.now()}`,
            success: result.success || false,
            dryRun: isDryRun,
            layers: layers || result.analysis?.recommendedLayers || [],
            originalCode: code,
            transformed: result.transformed || code,
            totalExecutionTime: result.totalExecutionTime || 0,
            successfulLayers: (
              layers ||
              result.analysis?.recommendedLayers ||
              []
            ).length,
            analysis: result.analysis || {
              recommendedLayers: [],
              detectedIssues: [],
              confidence: 0,
              estimatedImpact: {
                level: "unknown",
                description: "No analysis available",
                estimatedFixTime: "unknown",
              },
            },
            triggeredBy: userId,
            triggeredByName: userName,
            timestamp: new Date().toISOString(),
            error: result.error || undefined,
          };

          // Immediately show the result
          setSelectedResult(formattedResult);
          console.log("[RUN ANALYSIS] Set selected result:", formattedResult);
        }

        // Result will also be received via real-time subscription
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        console.error("[RUN ANALYSIS] Error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [currentSession, code, selectedLayers, dryRun, apiCall],
  );

  // Quick analysis presets
  const quickAnalysis = {
    "Quick Scan": () => runAnalysis([1, 2, 3], true),
    "Full Analysis": () => runAnalysis([1, 2, 3, 4, 5, 6], true),
    "Component Focus": () => runAnalysis([3, 6], true),
    "Next.js Focus": () => runAnalysis([4, 5], true),
    "Auto-Detect": () => runAnalysis(undefined, true),
  };

  // Handle code changes
  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCode(newCode);

      // TODO: Implement real-time operational transforms here
      // For now, we'll just update locally
    },
    [],
  );

  // Add comment/chat
  const addComment = useCallback(async () => {
    if (!newComment.trim() || !currentSession) return;

    try {
      await apiCall(`/api/collaboration/sessions/${currentSession.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment,
          lineNumber: 0,
        }),
      });

      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    }
  }, [newComment, currentSession, apiCall]);

  // User setup screen
  if (!userSetup) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <h1 className="onboarding-title">NeuroLint Collaborate</h1>

              <p
                style={{
                  fontSize: "1.1rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  marginBottom: "2rem",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Real-time collaborative code editing with live NeuroLint
                analysis
              </p>

              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(33, 150, 243, 0.4)";
                    e.target.style.boxShadow =
                      "0 0 12px rgba(33, 150, 243, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userName.trim()) {
                      handleUserSetup();
                    }
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(229, 62, 62, 0.12)",
                    border: "1px solid rgba(229, 62, 62, 0.4)",
                    borderRadius: "6px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    color: "#e53e3e",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleUserSetup}
                disabled={!userName.trim() || loading}
                className="onboarding-btn primary"
                style={{
                  width: "100%",
                  padding: "1rem 2rem",
                  background:
                    userName.trim() && !loading
                      ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
                      : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${userName.trim() && !loading ? "rgba(33, 150, 243, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                  borderRadius: "8px",
                  color:
                    userName.trim() && !loading
                      ? "#2196f3"
                      : "rgba(255, 255, 255, 0.5)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor:
                    userName.trim() && !loading ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  boxShadow:
                    userName.trim() && !loading
                      ? "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 12px rgba(33, 150, 243, 0.2)"
                      : "none",
                }}
              >
                {loading ? "Setting up..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session lobby screen
  if (!currentSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            NeuroLint Collaborate
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Welcome, <strong>{userName}</strong>! Start a new collaboration
            session or join an existing one.
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div
            style={{
              maxWidth: "800px",
              margin: "1rem auto",
              padding: "0 2rem",
            }}
          >
            <div
              style={{
                background: "rgba(229, 62, 62, 0.12)",
                border: "1px solid rgba(229, 62, 62, 0.4)",
                borderRadius: "8px",
                padding: "1rem",
                color: "#e53e3e",
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "3rem 2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
        >
          {/* Create Session */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              padding: "2rem",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(33, 150, 243, 0.12)",
                border: "1px solid rgba(33, 150, 243, 0.3)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              +
            </div>

            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "#ffffff",
              }}
            >
              Create Session
            </h3>

            <p
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Start a new collaborative coding session. You'll get a shareable
              link to invite others.
            </p>

            {isCreatingSession ? (
              <div>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Session name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    marginBottom: "1rem",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Filename (e.g., component.tsx)"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    marginBottom: "1rem",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={createSession}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: loading
                        ? "rgba(255, 255, 255, 0.05)"
                        : "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
                      border: `1px solid ${loading ? "rgba(255, 255, 255, 0.15)" : "rgba(33, 150, 243, 0.4)"}`,
                      borderRadius: "6px",
                      color: loading ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => setIsCreatingSession(false)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "rgba(255, 255, 255, 0.7)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingSession(true)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: loading
                    ? "rgba(255, 255, 255, 0.05)"
                    : "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
                  border: `1px solid ${loading ? "rgba(255, 255, 255, 0.15)" : "rgba(33, 150, 243, 0.4)"}`,
                  borderRadius: "8px",
                  color: loading ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading
                    ? "none"
                    : "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 12px rgba(33, 150, 243, 0.2)",
                }}
              >
                Start New Session
              </button>
            )}
          </div>

          {/* Join Session */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              padding: "2rem",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(76, 175, 80, 0.12)",
                border: "1px solid rgba(76, 175, 80, 0.3)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              →
            </div>

            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "#ffffff",
              }}
            >
              Join Session
            </h3>

            <p
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Join an existing collaboration session using a session ID or
              invite link.
            </p>

            {isJoiningSession ? (
              <div>
                <input
                  type="text"
                  value={joinSessionId}
                  onChange={(e) => setJoinSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    marginBottom: "1rem",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={joinSession}
                    disabled={!joinSessionId.trim() || loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background:
                        joinSessionId.trim() && !loading
                          ? "rgba(76, 175, 80, 0.12)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${joinSessionId.trim() && !loading ? "rgba(76, 175, 80, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                      borderRadius: "6px",
                      color:
                        joinSessionId.trim() && !loading
                          ? "#4caf50"
                          : "rgba(255, 255, 255, 0.5)",
                      fontWeight: 600,
                      cursor:
                        joinSessionId.trim() && !loading
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    {loading ? "Joining..." : "Join"}
                  </button>
                  <button
                    onClick={() => {
                      setIsJoiningSession(false);
                      setJoinSessionId("");
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "rgba(255, 255, 255, 0.7)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsJoiningSession(true)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: loading
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(76, 175, 80, 0.12)",
                  border: `1px solid ${loading ? "rgba(255, 255, 255, 0.15)" : "rgba(76, 175, 80, 0.4)"}`,
                  borderRadius: "8px",
                  color: loading ? "rgba(255, 255, 255, 0.5)" : "#4caf50",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Join Existing Session
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main collaboration interface
  return (
    <div
      style={{
        background: "#000000",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1rem 2rem",
          background: "rgba(255, 255, 255, 0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {currentSession.name}
          </h1>

          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {currentSession.document_filename}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              background: "rgba(76, 175, 80, 0.12)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              fontSize: "0.75rem",
              color: "#4caf50",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#4caf50",
              }}
            />
            {currentSession.participants?.filter((p) => p.is_active).length ||
              0}{" "}
            online
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => runAnalysis([1, 2, 3], true)}
            disabled={isAnalyzing || !code.trim()}
            style={{
              padding: "0.5rem 1rem",
              background:
                isAnalyzing || !code.trim()
                  ? "rgba(255, 255, 255, 0.05)"
                  : "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
              border: `1px solid ${isAnalyzing || !code.trim() ? "rgba(255, 255, 255, 0.15)" : "rgba(33, 150, 243, 0.4)"}`,
              borderRadius: "6px",
              color:
                isAnalyzing || !code.trim()
                  ? "rgba(255, 255, 255, 0.5)"
                  : "#ffffff",
              fontSize: "0.875rem",
              cursor: isAnalyzing || !code.trim() ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isAnalyzing ? "Analyzing..." : "Quick Analyze"}
          </button>

          <button
            onClick={leaveSession}
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(229, 62, 62, 0.12)",
              border: "1px solid rgba(229, 62, 62, 0.4)",
              borderRadius: "6px",
              color: "#e53e3e",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea
            ref={editorRef}
            value={code}
            onChange={handleCodeChange}
            placeholder="Start typing your React/TypeScript code..."
            style={{
              flex: 1,
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "1.5rem",
              fontSize: "14px",
              lineHeight: "1.6",
              fontFamily: "JetBrains Mono, Consolas, monospace",
              color: "#ffffff",
            }}
          />

          {/* Analysis Results */}
          {selectedResult && (
            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "1.5rem",
                background: selectedResult.success
                  ? "rgba(76, 175, 80, 0.08)"
                  : selectedResult.error
                    ? "rgba(229, 62, 62, 0.08)"
                    : "rgba(255, 255, 255, 0.02)",
                minHeight: "120px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  Latest Analysis Results
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {new Date(selectedResult.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "6px",
                  border: `1px solid ${
                    selectedResult.success
                      ? "rgba(76, 175, 80, 0.3)"
                      : selectedResult.error
                        ? "rgba(229, 62, 62, 0.3)"
                        : "rgba(255, 255, 255, 0.15)"
                  }`,
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Triggered by:</strong>{" "}
                  {selectedResult.triggeredByName || "Unknown"}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Status:</strong>{" "}
                  {selectedResult.error
                    ? `❌ Error: ${selectedResult.error}`
                    : selectedResult.success
                      ? `✅ Success (${selectedResult.analysis?.detectedIssues?.length || 0} issues found)`
                      : "⏳ Processing"}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Layers:</strong>{" "}
                  {selectedResult.layers?.join(", ") || "Auto-detect"}
                </div>
                <div>
                  <strong>Mode:</strong>{" "}
                  {selectedResult.dryRun
                    ? "🔍 Analysis Only"
                    : "🔧 Apply Changes"}
                </div>
              </div>

              {selectedResult.analysis?.detectedIssues &&
              selectedResult.analysis.detectedIssues.length > 0 ? (
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: "#ffffff",
                    }}
                  >
                    Detected Issues:
                  </div>
                  {selectedResult.analysis.detectedIssues.map(
                    (issue: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: "0.75rem",
                          marginBottom: "0.5rem",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 193, 7, 0.3)",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            color: "#ffc107",
                            fontWeight: 500,
                            marginBottom: "0.25rem",
                          }}
                        >
                          {issue.type || "Issue"} ({issue.severity || "medium"})
                        </div>
                        <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                          {issue.description ||
                            "Issue description not available"}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.875rem",
                    fontStyle: "italic",
                  }}
                >
                  {selectedResult.error
                    ? "Analysis failed"
                    : "✅ No issues detected"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div
            style={{
              width: "350px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: "1rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Team Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  padding: "0.5rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "4px",
                  color: "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "1rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {comments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    fontStyle: "italic",
                    marginTop: "2rem",
                  }}
                >
                  No messages yet. Start the conversation!
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background:
                        comment.comment_type === "system"
                          ? "rgba(255, 193, 7, 0.12)"
                          : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${
                        comment.comment_type === "system"
                          ? "rgba(255, 193, 7, 0.3)"
                          : "rgba(255, 255, 255, 0.1)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color:
                          comment.comment_type === "system"
                            ? "#ffc107"
                            : "#ffffff",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {comment.author_name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "rgba(255, 255, 255, 0.9)",
                        lineHeight: 1.4,
                      }}
                    >
                      {comment.content}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {new Date(comment.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                style={{
                  padding: "0.75rem",
                  background: newComment.trim()
                    ? "rgba(33, 150, 243, 0.12)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${newComment.trim() ? "rgba(33, 150, 243, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                  borderRadius: "6px",
                  color: newComment.trim()
                    ? "#2196f3"
                    : "rgba(255, 255, 255, 0.5)",
                  cursor: newComment.trim() ? "pointer" : "not-allowed",
                  fontSize: "0.875rem",
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
