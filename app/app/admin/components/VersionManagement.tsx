"use client";

import React, { useState, useEffect } from "react";

interface VersionInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseNotes: string;
  updateHistory: Array<{
    version: string;
    date: Date;
    type: "major" | "minor" | "patch";
    changes: string[];
  }>;
  environments: Array<{
    name: string;
    version: string;
    status: "up-to-date" | "outdated" | "error";
    lastUpdated: Date;
  }>;
}

export default function VersionManagement() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/version");
      if (response.ok) {
        const data = await response.json();
        setVersionInfo(data);
      } else {
        setVersionInfo(null);
      }
    } catch (error) {
      console.error("Failed to load version info:", error);
      setVersionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const updateToLatest = async () => {
    if (!versionInfo) return;

    if (
      !confirm(
        `Are you sure you want to update from v${versionInfo.current} to v${versionInfo.latest}? This may require downtime.`,
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch("/api/admin/version/update", {
        method: "POST",
      });

      if (response.ok) {
        const updatedInfo = await response.json();
        setVersionInfo(updatedInfo);
      } else {
        console.error("Update failed:", response.statusText);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setUpdating(false);
    }
  };

  const rollbackToVersion = async (version: string) => {
    if (
      !confirm(
        `Are you sure you want to rollback to v${version}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch("/api/admin/version/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (response.ok) {
        const updatedInfo = await response.json();
        setVersionInfo(updatedInfo);
      } else {
        console.error("Rollback failed:", response.statusText);
      }
    } catch (error) {
      console.error("Rollback failed:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getVersionTypeIcon = (type: string) => {
    switch (type) {
      case "major":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="version-icon major"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case "minor":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="version-icon minor"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="version-icon patch"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
    }
  };

  const getEnvironmentStatusIcon = (status: string) => {
    switch (status) {
      case "up-to-date":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon success"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case "error":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon error"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon warning"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading version information...</p>
        </div>
      </div>
    );
  }

  if (!versionInfo) {
    return (
      <div className="section-container">
        <div className="error-container">
          <h2>Failed to load version information</h2>
          <button className="btn-primary" onClick={loadVersionInfo}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Version Management</h1>
          <p>Manage NeuroLint versions and updates</p>
        </div>
        <div className="section-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowReleaseNotes(true)}
          >
            View Release Notes
          </button>
          <button className="btn-primary" onClick={loadVersionInfo}>
            Check for Updates
          </button>
        </div>
      </div>

      <div className="version-overview">
        <div className="current-version-card">
          <div className="version-header">
            <h2>Current Version</h2>
            {versionInfo.hasUpdate && (
              <span className="update-badge">Update Available</span>
            )}
          </div>
          <div className="version-info">
            <span className="version-number">v{versionInfo.current}</span>
            {versionInfo.hasUpdate && (
              <div className="update-info">
                <span className="latest-version">
                  Latest: v{versionInfo.latest}
                </span>
                <button
                  className={`btn-primary ${updating ? "loading" : ""}`}
                  onClick={updateToLatest}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Now"}
                </button>
              </div>
            )}
          </div>
        </div>

        {updating && (
          <div className="update-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "45%" }} />
            </div>
            <p>Updating NeuroLint... This may take a few minutes.</p>
          </div>
        )}
      </div>

      <div className="environments-section">
        <h2>Environment Status</h2>
        <div className="environments-grid">
          {versionInfo.environments.map((env, index) => (
            <div key={index} className="environment-card">
              <div className="environment-header">
                <h3>{env.name}</h3>
                <div className="environment-status">
                  {getEnvironmentStatusIcon(env.status)}
                  <span className={`status-text ${env.status}`}>
                    {env.status.replace("-", " ")}
                  </span>
                </div>
              </div>
              <div className="environment-details">
                <div className="environment-version">
                  <span className="version-label">Version:</span>
                  <span className="version-value">v{env.version}</span>
                </div>
                <div className="environment-updated">
                  <span className="updated-label">Last Updated:</span>
                  <span className="updated-value">
                    {env.lastUpdated.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="version-history">
        <h2>Version History</h2>
        <div className="history-list">
          {versionInfo.updateHistory.map((update, index) => (
            <div key={index} className="history-item">
              <div className="history-header">
                <div className="history-info">
                  {getVersionTypeIcon(update.type)}
                  <h3>v{update.version}</h3>
                  <span className="version-type">{update.type}</span>
                </div>
                <div className="history-meta">
                  <span className="history-date">
                    {update.date.toLocaleDateString()}
                  </span>
                  <button
                    className="btn-text"
                    onClick={() => rollbackToVersion(update.version)}
                    disabled={
                      update.version === versionInfo.current || updating
                    }
                  >
                    Rollback
                  </button>
                </div>
              </div>
              <div className="history-changes">
                <ul>
                  {update.changes.map((change, changeIndex) => (
                    <li key={changeIndex}>{change}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showReleaseNotes && (
        <div
          className="modal-overlay"
          onClick={() => setShowReleaseNotes(false)}
        >
          <div
            className="modal-content release-notes-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Release Notes</h3>
              <button
                className="btn-text"
                onClick={() => setShowReleaseNotes(false)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="release-notes">
                <pre>{versionInfo.releaseNotes}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
