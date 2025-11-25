"use client";

import React, { useState, useEffect, useCallback } from "react";

interface RollbackPoint {
  id: string;
  project: string;
  timestamp: Date;
  version: string;
  changes: Array<{
    file: string;
    type: "added" | "modified" | "deleted";
    linesChanged: number;
  }>;
  reason: string;
  canRollback: boolean;
}

interface DiffItem {
  file: string;
  beforeContent: string;
  afterContent: string;
  timestamp: Date;
}

export default function SafetyControls() {
  const [rollbackPoints, setRollbackPoints] = useState<RollbackPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [systemLocked, setSystemLocked] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<DiffItem | null>(null);
  const [showDryRunHistory, setShowDryRunHistory] = useState(false);

  const loadRollbackPointsCallback = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject !== "all") {
        params.set("project", selectedProject);
      }

      const response = await fetch(`/api/admin/rollback-points?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRollbackPoints(data.rollbackPoints || []);
      } else {
        setRollbackPoints([]);
      }
    } catch (error) {
      console.error("Failed to load rollback points:", error);
      setRollbackPoints([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadRollbackPointsCallback();
    checkSystemStatus();
  }, [loadRollbackPointsCallback]);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch("/api/admin/system-status");
      if (response.ok) {
        const data = await response.json();
        setSystemLocked(data.locked || false);
      }
    } catch (error) {
      console.error("Failed to check system status:", error);
    }
  };

  const performRollback = async (rollbackId: string) => {
    if (
      !confirm(
        "Are you sure you want to rollback to this version? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rollback/${rollbackId}`, {
        method: "POST",
      });

      if (response.ok) {
        // Update the UI to show rollback completed
        setRollbackPoints((prev) =>
          prev.map((point) =>
            point.id === rollbackId ? { ...point, canRollback: false } : point,
          ),
        );
      } else {
        console.error("Rollback failed:", response.statusText);
      }
    } catch (error) {
      console.error("Rollback failed:", error);
    }
  };

  const toggleSystemLock = async () => {
    try {
      const response = await fetch("/api/admin/system-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !systemLocked }),
      });

      if (response.ok) {
        setSystemLocked(!systemLocked);
      } else {
        console.error("Failed to toggle system lock:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to toggle system lock:", error);
    }
  };

  const viewDiff = (rollbackPoint: RollbackPoint) => {
    // Simulate loading diff data
    const mockDiff: DiffItem = {
      file: rollbackPoint.changes[0].file,
      beforeContent: `// Original content before changes
function processData(input) {
  return input.map(item => ({
    id: item.id,
    name: item.name
  }));
}`,
      afterContent: `// Updated content after NeuroLint fixes
function processData(input) {
  return input.map((item, index) => ({
    id: item.id,
    name: item.name,
    key: \`item-\${index}\` // Added missing key
  }));
}`,
      timestamp: rollbackPoint.timestamp,
    };
    setSelectedDiff(mockDiff);
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "added":
        return (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="change-icon change-added"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
      case "deleted":
        return (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="change-icon change-deleted"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="change-icon change-modified"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="14" x2="16" y2="10" />
          </svg>
        );
    }
  };

  const filteredRollbackPoints =
    selectedProject === "all"
      ? rollbackPoints
      : rollbackPoints.filter((point) => point.project === selectedProject);

  const projects = Array.from(
    new Set(rollbackPoints.map((point) => point.project)),
  );

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading safety controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Safety Controls</h1>
          <p>Rollback management and diff viewer</p>
        </div>
        <div className="section-actions">
          <button
            className={`btn-toggle ${systemLocked ? "locked" : "unlocked"}`}
            onClick={toggleSystemLock}
          >
            {systemLocked ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <circle cx="12" cy="16" r="1" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                System Locked
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
                System Active
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowDryRunHistory(!showDryRunHistory)}
          >
            {showDryRunHistory ? "Hide" : "Show"} Dry Run History
          </button>
        </div>
      </div>

      <div className="system-status">
        <div className={`status-card ${systemLocked ? "locked" : "active"}`}>
          <div className="status-info">
            <h3>System Status</h3>
            <p>
              {systemLocked
                ? "NeuroLint transformations are currently disabled. No automatic fixes will be applied."
                : "NeuroLint is active and processing transformations normally."}
            </p>
          </div>
          <div className="status-indicator">
            <div className={`indicator ${systemLocked ? "red" : "green"}`} />
            <span>{systemLocked ? "Locked" : "Active"}</span>
          </div>
        </div>
      </div>

      <div className="rollback-section">
        <div className="section-controls">
          <h2>Rollback Points</h2>
          <div className="filter-group">
            <label>Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rollback-list">
          {filteredRollbackPoints.map((point) => (
            <div key={point.id} className="rollback-card">
              <div className="rollback-header">
                <div className="rollback-info">
                  <h3>{point.project}</h3>
                  <span className="version">v{point.version}</span>
                  <span className="timestamp">
                    {point.timestamp.toLocaleString()}
                  </span>
                </div>
                <div className="rollback-actions">
                  <button className="btn-text" onClick={() => viewDiff(point)}>
                    View Diff
                  </button>
                  <button
                    className={`btn-secondary ${!point.canRollback ? "disabled" : ""}`}
                    onClick={() => performRollback(point.id)}
                    disabled={!point.canRollback}
                  >
                    Rollback
                  </button>
                </div>
              </div>

              <div className="rollback-details">
                <p className="rollback-reason">{point.reason}</p>

                <div className="changes-list">
                  <span className="changes-label">Changes:</span>
                  <div className="changes-items">
                    {point.changes.map((change, index) => (
                      <div key={index} className="change-item">
                        {getChangeTypeIcon(change.type)}
                        <span className="change-file">{change.file}</span>
                        {change.linesChanged > 0 && (
                          <span className="change-lines">
                            {change.linesChanged} lines
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!point.canRollback && (
                <div className="rollback-warning">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Rollback not available for this version</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRollbackPoints.length === 0 && (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3>No rollback points found</h3>
            <p>No rollback points available for the selected project.</p>
          </div>
        )}
      </div>

      {selectedDiff && (
        <div className="modal-overlay" onClick={() => setSelectedDiff(null)}>
          <div
            className="modal-content diff-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Diff Viewer: {selectedDiff.file}</h3>
              <button
                className="btn-text"
                onClick={() => setSelectedDiff(null)}
              >
                Close
              </button>
            </div>
            <div className="diff-container">
              <div className="diff-panel">
                <h4>Before</h4>
                <pre className="diff-content before">
                  {selectedDiff.beforeContent}
                </pre>
              </div>
              <div className="diff-panel">
                <h4>After</h4>
                <pre className="diff-content after">
                  {selectedDiff.afterContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
