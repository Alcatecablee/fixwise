"use client";

import React, { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  project: string;
  layer: number;
  action: "analysis" | "fix" | "rollback";
  status: "success" | "error" | "warning";
  duration: number;
  errors: Array<{
    type: string;
    message: string;
    file?: string;
    line?: number;
  }>;
  details: {
    filesProcessed: number;
    changesApplied: number;
    issuesFixed: number;
  };
}

export default function ExecutionLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: "all" | "success" | "error" | "warning";
    action: "all" | "analysis" | "fix" | "rollback";
    timeRange: "1h" | "24h" | "7d" | "30d";
  }>({
    status: "all",
    action: "all",
    timeRange: "24h",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange: filter.timeRange,
        status: filter.status,
        action: filter.action,
      });

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = (format: "csv" | "json") => {
    const filteredLogs = getFilteredLogs();

    if (format === "json") {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `execution-logs-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
    } else {
      const csvContent = convertToCSV(filteredLogs);
      const dataBlob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `execution-logs-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }
  };

  const convertToCSV = (logs: LogEntry[]) => {
    const headers = [
      "Timestamp",
      "Project",
      "Layer",
      "Action",
      "Status",
      "Duration",
      "Files Processed",
      "Changes Applied",
      "Issues Fixed",
    ];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.project,
      log.layer.toString(),
      log.action,
      log.status,
      log.duration.toString(),
      log.details.filesProcessed.toString(),
      log.details.changesApplied.toString(),
      log.details.issuesFixed.toString(),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    // Filter by time range
    const now = new Date();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = new Date(now.getTime() - timeRangeMs[filter.timeRange]);
    filtered = filtered.filter((log) => log.timestamp >= cutoff);

    // Filter by status
    if (filter.status !== "all") {
      filtered = filtered.filter((log) => log.status === filter.status);
    }

    // Filter by action
    if (filter.action !== "all") {
      filtered = filtered.filter((log) => log.action === filter.action);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.errors.some(
            (error) =>
              error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
              error.file?.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon status-success"
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
            className="status-icon status-error"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "warning":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon status-warning"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const filteredLogs = getFilteredLogs();

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading execution logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Execution Logs</h1>
          <p>Detailed logs and reports for all layer executions</p>
        </div>
        <div className="section-actions">
          <button className="btn-text" onClick={() => exportLogs("csv")}>
            Export CSV
          </button>
          <button className="btn-text" onClick={() => exportLogs("json")}>
            Export JSON
          </button>
          <button className="btn-primary" onClick={loadLogs}>
            Refresh
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select
            value={filter.timeRange}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                timeRange: e.target.value as typeof filter.timeRange,
              }))
            }
            className="filter-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                status: e.target.value as typeof filter.status,
              }))
            }
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Action:</label>
          <select
            value={filter.action}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                action: e.target.value as typeof filter.action,
              }))
            }
            className="filter-select"
          >
            <option value="all">All Actions</option>
            <option value="analysis">Analysis</option>
            <option value="fix">Fix</option>
            <option value="rollback">Rollback</option>
          </select>
        </div>
      </div>

      <div className="logs-list">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="log-entry"
            onClick={() => setSelectedLog(log)}
          >
            <div className="log-header">
              <div className="log-basic-info">
                {getStatusIcon(log.status)}
                <div className="log-meta">
                  <span className="log-project">{log.project}</span>
                  <span className="log-layer">Layer {log.layer}</span>
                  <span className="log-action">{log.action}</span>
                </div>
              </div>
              <div className="log-timing">
                <span className="log-timestamp">
                  {log.timestamp.toLocaleString()}
                </span>
                <span className="log-duration">
                  {formatDuration(log.duration)}
                </span>
              </div>
            </div>

            <div className="log-details">
              <div className="log-stats">
                <span className="stat">
                  <strong>{log.details.filesProcessed}</strong> files processed
                </span>
                <span className="stat">
                  <strong>{log.details.changesApplied}</strong> changes applied
                </span>
                <span className="stat">
                  <strong>{log.details.issuesFixed}</strong> issues fixed
                </span>
              </div>

              {log.errors.length > 0 && (
                <div className="log-errors">
                  {log.errors.slice(0, 2).map((error, index) => (
                    <div key={index} className="error-preview">
                      <span className="error-type">{error.type}:</span>
                      <span className="error-message">{error.message}</span>
                      {error.file && (
                        <span className="error-location">
                          {error.file}:{error.line}
                        </span>
                      )}
                    </div>
                  ))}
                  {log.errors.length > 2 && (
                    <span className="error-count">
                      +{log.errors.length - 2} more errors
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="empty-state">
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          <h3>No logs found</h3>
          <p>No execution logs match the current filter criteria.</p>
        </div>
      )}

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Details</h3>
              <button className="btn-text" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="log-detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Project:</span>
                    <span className="detail-value">{selectedLog.project}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Layer:</span>
                    <span className="detail-value">{selectedLog.layer}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Action:</span>
                    <span className="detail-value">{selectedLog.action}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedLog.status}</span>
                  </div>
                </div>
              </div>

              {selectedLog.errors.length > 0 && (
                <div className="log-detail-section">
                  <h4>Errors ({selectedLog.errors.length})</h4>
                  <div className="errors-list">
                    {selectedLog.errors.map((error, index) => (
                      <div key={index} className="error-detail">
                        <div className="error-header">
                          <span className="error-type">{error.type}</span>
                          {error.file && (
                            <span className="error-location">
                              {error.file}:{error.line}
                            </span>
                          )}
                        </div>
                        <div className="error-message">{error.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
