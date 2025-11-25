"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

interface DebugResult {
  id: string;
  triggeredBy: string;
  timestamp: string;
  success: boolean;
  dryRun: boolean;
  layers: number[];
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
    confidence: number;
    estimatedImpact: {
      level: string;
      description: string;
      estimatedFixTime: string;
    };
  };
  originalCode: string;
  transformed: string;
  totalExecutionTime: number;
  successfulLayers: number;
  error?: string;
}

interface CollaborativeDebuggerProps {
  sessionId: string;
  websocket: WebSocket | null;
  isConnected: boolean;
  userName: string;
  isHost: boolean;
}

const formatProcessingTime = (ms: number) => {
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 100) return `${ms.toFixed(0)}ms`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export default function CollaborativeDebugger({
  sessionId,
  websocket,
  isConnected,
  userName,
  isHost,
}: CollaborativeDebuggerProps) {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<DebugResult | null>(
    null,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([]);
  const [dryRun, setDryRun] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const layerInfo = useMemo(
    () => ({
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
    }),
    [],
  );

  /**
   * Handle WebSocket messages for debugging results
   */
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "neurolint-result") {
          const result: DebugResult = {
            id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...message.data,
          };

          setDebugResults((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 results
          setIsRunning(false);

          // Auto-select the new result
          setSelectedResult(result);
        }

        if (message.type === "debug-started") {
          setIsRunning(true);
        }
      } catch (error) {
        console.error("[DEBUGGER] Failed to parse message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => websocket.removeEventListener("message", handleMessage);
  }, [websocket]);

  /**
   * Run NeuroLint Pro analysis
   */
  const runAnalysis = useCallback(
    (customLayers?: number[], customDryRun?: boolean) => {
      if (!websocket || !isConnected || isRunning) return;

      const layers =
        customLayers || selectedLayers.length > 0 ? selectedLayers : undefined;
      const isDryRun = customDryRun !== undefined ? customDryRun : dryRun;

      setIsRunning(true);

      websocket.send(
        JSON.stringify({
          type: "run-neurolint",
          data: {
            dryRun: isDryRun,
            layers,
          },
        }),
      );
    },
    [websocket, isConnected, isRunning, selectedLayers, dryRun],
  );

  /**
   * Quick analysis presets
   */
  const quickAnalysis = {
    "Quick Scan": () => runAnalysis([1, 2, 3], true),
    "Full Analysis": () => runAnalysis([1, 2, 3, 4, 5, 6], true),
    "Component Focus": () => runAnalysis([3, 6], true),
    "Next.js Focus": () => runAnalysis([4, 5], true),
    "Auto-Detect": () => runAnalysis(undefined, true),
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "#e53e3e";
      case "high":
        return "#ff5722";
      case "medium":
        return "#ff9800";
      case "low":
        return "#ffd700";
      default:
        return "#666666";
    }
  };

  /**
   * Get impact level color
   */
  const getImpactColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "#e53e3e";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#666666";
    }
  };

  return (
    <div
      style={{
        background: "#000000",
        color: "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1rem 1.5rem",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          Collaborative Debugger
          {isRunning && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(33, 150, 243, 0.3)",
                borderTop: "2px solid #2196f3",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginTop: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {/* Connection Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: isConnected ? "#4caf50" : "#e53e3e",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isConnected ? "#4caf50" : "#e53e3e",
              }}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </div>

          {/* Mode Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                style={{
                  accentColor: "#2196f3",
                }}
              />
              Dry-run mode
            </label>
          </div>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: "0.25rem 0.5rem",
              background: showAdvanced
                ? "rgba(33, 150, 243, 0.12)"
                : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${showAdvanced ? "rgba(33, 150, 243, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "4px",
              color: showAdvanced ? "#2196f3" : "rgba(255, 255, 255, 0.7)",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.01)",
        }}
      >
        {/* Quick Analysis Buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: showAdvanced ? "1rem" : "0",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(quickAnalysis).map(([name, action]) => (
            <button
              key={name}
              onClick={action}
              disabled={!isConnected || isRunning}
              style={{
                padding: "0.5rem 0.75rem",
                background:
                  !isConnected || isRunning
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(33, 150, 243, 0.12)",
                border: `1px solid ${!isConnected || isRunning ? "rgba(255, 255, 255, 0.1)" : "rgba(33, 150, 243, 0.4)"}`,
                borderRadius: "6px",
                color:
                  !isConnected || isRunning
                    ? "rgba(255, 255, 255, 0.5)"
                    : "#2196f3",
                fontSize: "0.875rem",
                cursor: !isConnected || isRunning ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <h4
              style={{
                margin: "0 0 0.75rem 0",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Layer Selection
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              {Object.entries(layerInfo).map(([layerId, info]) => (
                <label
                  key={layerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    background: selectedLayers.includes(Number(layerId))
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${selectedLayers.includes(Number(layerId)) ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedLayers.includes(Number(layerId))}
                    onChange={(e) => {
                      const layer = Number(layerId);
                      if (e.target.checked) {
                        setSelectedLayers((prev) => [...prev, layer].sort());
                      } else {
                        setSelectedLayers((prev) =>
                          prev.filter((l) => l !== layer),
                        );
                      }
                    }}
                    style={{ accentColor: info.color }}
                  />
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: info.color,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "#ffffff",
                      }}
                    >
                      Layer {layerId}: {info.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "rgba(255, 255, 255, 0.6)",
                        lineHeight: 1.3,
                      }}
                    >
                      {info.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setSelectedLayers([1, 2, 3, 4, 5, 6])}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "4px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedLayers([])}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "4px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
              <button
                onClick={() => runAnalysis()}
                disabled={!isConnected || isRunning}
                style={{
                  padding: "0.5rem 1rem",
                  background:
                    !isConnected || isRunning
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(76, 175, 80, 0.12)",
                  border: `1px solid ${!isConnected || isRunning ? "rgba(255, 255, 255, 0.15)" : "rgba(76, 175, 80, 0.4)"}`,
                  borderRadius: "4px",
                  color:
                    !isConnected || isRunning
                      ? "rgba(255, 255, 255, 0.5)"
                      : "#4caf50",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: !isConnected || isRunning ? "not-allowed" : "pointer",
                  marginLeft: "auto",
                }}
              >
                {isRunning ? "Running..." : "Run Custom Analysis"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="results-container">
        {/* Results List */}
        <div className="results-list">
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            Analysis History ({debugResults.length})
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {debugResults.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  marginTop: "2rem",
                }}
              >
                No analysis results yet
              </div>
            ) : (
              debugResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  style={{
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    borderRadius: "6px",
                    background:
                      selectedResult?.id === result.id
                        ? "rgba(33, 150, 243, 0.12)"
                        : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${selectedResult?.id === result.id ? "rgba(33, 150, 243, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: result.success ? "#4caf50" : "#e53e3e",
                        fontWeight: 500,
                      }}
                    >
                      {result.success ? "✅ Success" : "❌ Failed"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    By: {result.triggeredBy}
                  </div>

                  {result.analysis && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.125rem 0.375rem",
                          borderRadius: "4px",
                          background:
                            getImpactColor(
                              result.analysis.estimatedImpact.level,
                            ) + "20",
                          color: getImpactColor(
                            result.analysis.estimatedImpact.level,
                          ),
                        }}
                      >
                        {result.analysis.estimatedImpact.level.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        {result.analysis.detectedIssues.length} issues
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {formatProcessingTime(result.totalExecutionTime)} • Layers:{" "}
                    {result.layers?.join(", ") || "Auto"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Result Details */}
        <div className="results-details">
          {selectedResult ? (
            <div style={{ padding: "1.5rem" }}>
              {/* Result Header */}
              <div
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingBottom: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="result-header-flex">
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: selectedResult.success ? "#4caf50" : "#e53e3e",
                    }}
                  >
                    {selectedResult.success
                      ? "✅ Analysis Complete"
                      : "❌ Analysis Failed"}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {new Date(selectedResult.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="result-info-flex">
                  <span>
                    Triggered by: <strong>{selectedResult.triggeredBy}</strong>
                  </span>
                  <span>
                    Mode:{" "}
                    <strong>
                      {selectedResult.dryRun ? "Dry-run" : "Apply Fixes"}
                    </strong>
                  </span>
                  <span>
                    Duration:{" "}
                    <strong>
                      {formatProcessingTime(selectedResult.totalExecutionTime)}
                    </strong>
                  </span>
                </div>
              </div>

              {selectedResult.error ? (
                <div
                  style={{
                    background: "rgba(229, 62, 62, 0.12)",
                    border: "1px solid rgba(229, 62, 62, 0.3)",
                    borderRadius: "8px",
                    padding: "1rem",
                    color: "#e53e3e",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                    Error
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>
                    {selectedResult.error}
                  </p>
                </div>
              ) : selectedResult.analysis ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  {/* Analysis Summary */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 1rem 0",
                        fontSize: "1rem",
                        fontWeight: 600,
                      }}
                    >
                      Analysis Summary
                    </h4>

                    <div className="analysis-summary-grid">
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                          }}
                        >
                          Confidence Score
                        </div>
                        <div
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            color: "#4caf50",
                          }}
                        >
                          {(selectedResult.analysis.confidence * 100).toFixed(
                            1,
                          )}
                          %
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                          }}
                        >
                          Impact Level
                        </div>
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: getImpactColor(
                              selectedResult.analysis.estimatedImpact.level,
                            ),
                          }}
                        >
                          {selectedResult.analysis.estimatedImpact.level.toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                          }}
                        >
                          Issues Found
                        </div>
                        <div
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            color: "#ffffff",
                          }}
                        >
                          {selectedResult.analysis.detectedIssues.length}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                          }}
                        >
                          Estimated Fix Time
                        </div>
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#ffffff",
                          }}
                        >
                          {
                            selectedResult.analysis.estimatedImpact
                              .estimatedFixTime
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detected Issues */}
                  {selectedResult.analysis.detectedIssues.length > 0 && (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          fontSize: "1rem",
                          fontWeight: 600,
                        }}
                      >
                        Detected Issues (
                        {selectedResult.analysis.detectedIssues.length})
                      </h4>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                        }}
                      >
                        {selectedResult.analysis.detectedIssues.map(
                          (issue, index) => (
                            <div
                              key={index}
                              style={{
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                padding: "0.75rem",
                              }}
                            >
                              <div className="issue-header-flex">
                                <div className="issue-tags">
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      padding: "0.125rem 0.375rem",
                                      borderRadius: "4px",
                                      background:
                                        getSeverityColor(issue.severity) + "20",
                                      color: getSeverityColor(issue.severity),
                                      fontWeight: 600,
                                    }}
                                  >
                                    {issue.severity.toUpperCase()}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      padding: "0.125rem 0.375rem",
                                      borderRadius: "4px",
                                      background:
                                        layerInfo[
                                          issue.fixedByLayer as keyof typeof layerInfo
                                        ]?.color + "20",
                                      color:
                                        layerInfo[
                                          issue.fixedByLayer as keyof typeof layerInfo
                                        ]?.color,
                                    }}
                                  >
                                    Layer {issue.fixedByLayer}
                                  </div>
                                </div>
                                {issue.count && (
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "rgba(255, 255, 255, 0.6)",
                                    }}
                                  >
                                    {issue.count} occurrences
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#ffffff",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {issue.description}
                              </div>

                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "rgba(255, 255, 255, 0.6)",
                                }}
                              >
                                Pattern: {issue.pattern}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Code Changes */}
                  {selectedResult.originalCode !==
                    selectedResult.transformed && (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          fontSize: "1rem",
                          fontWeight: 600,
                        }}
                      >
                        {selectedResult.dryRun
                          ? "Proposed Changes"
                          : "Applied Changes"}
                      </h4>

                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "rgba(255, 255, 255, 0.8)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {selectedResult.dryRun
                          ? "Preview of changes that would be applied:"
                          : "Changes that were applied to the code:"}
                      </div>

                      <div
                        className="code-text"
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "4px",
                          padding: "0.75rem",
                          fontSize: "0.75rem",
                          fontFamily: "JetBrains Mono, monospace",
                          color: "#4caf50",
                        }}
                      >
                        Code transformation applied successfully
                        <br />
                        {selectedResult.originalCode.length} →{" "}
                        {selectedResult.transformed.length} characters
                        <br />
                        {selectedResult.originalCode.split("\n").length} →{" "}
                        {selectedResult.transformed.split("\n").length} lines
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "1rem",
                fontStyle: "italic",
              }}
            >
              Select an analysis result to view details
            </div>
          )}
        </div>
      </div>

      {/* CSS for spinner animation and responsive layout */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .results-container {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .results-list {
          width: 300px;
          min-width: 250px;
          max-width: 400px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.01);
          display: flex;
          flex-direction: column;
        }

        .results-details {
          flex: 1;
          overflow-y: auto;
          min-width: 0;
        }

        .analysis-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .result-header-flex {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .result-info-flex {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          flex-wrap: wrap;
        }

        .issue-header-flex {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .code-text {
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }

        .issue-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .results-container {
            flex-direction: column;
          }

          .results-list {
            width: 100%;
            max-width: none;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 200px;
          }

          .results-details {
            flex: none;
            height: auto;
          }

          .analysis-summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .analysis-summary-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .result-header-flex {
            flex-direction: column;
            align-items: flex-start;
          }

          .result-info-flex {
            flex-direction: column;
            gap: 0.5rem;
          }

          .issue-header-flex {
            flex-direction: column;
            align-items: flex-start;
          }

          .results-details {
            padding: 1rem !important;
          }

          .results-list {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
