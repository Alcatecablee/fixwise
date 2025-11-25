"use client";

import React, { useState, useEffect, useMemo } from "react";
import adminApi from "../../../lib/admin-api-client";

interface Project {
  id: string;
  name: string;
  lastAnalysis: Date | null;
  lastFix: Date | null;
  layersExecuted: number[];
  executionTime: number;
  successRate: number;
  errorTrends: Array<{
    type: string;
    count: number;
    trend: "up" | "down" | "stable";
  }>;
  status: "active" | "inactive" | "error";
}

export default function ProjectMonitoring() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "error">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"name" | "lastAnalysis" | "successRate">(
    "name",
  );

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.get<{ projects: Project[] }>("/api/projects");
      setProjects(data.projects || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load projects";
      console.error("Failed to load projects:", err);
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (filter !== "all") {
      filtered = filtered.filter((project) => project.status === filter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "lastAnalysis":
          const aTime = a.lastAnalysis?.getTime() || 0;
          const bTime = b.lastAnalysis?.getTime() || 0;
          return bTime - aTime;
        case "successRate":
          return b.successRate - a.successRate;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [projects, filter, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon status-active"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
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
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="status-icon status-inactive"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        );
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="trend-up"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case "down":
        return (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="trend-down"
          >
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
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
            className="trend-stable"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-container">
        <div className="error-container">
          <h2>Failed to Load Projects</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadProjects}>
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
          <h1>Project Monitoring</h1>
          <p>Monitor all connected projects using NeuroLint</p>
        </div>
        <div className="section-actions">
          <button className="btn-secondary" onClick={loadProjects}>
            Refresh
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="filter-select"
          >
            <option value="name">Name</option>
            <option value="lastAnalysis">Last Analysis</option>
            <option value="successRate">Success Rate</option>
          </select>
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card">
            <div className="card-header">
              <div className="project-info">
                {getStatusIcon(project.status)}
                <h3>{project.name}</h3>
              </div>
              <div className="success-rate">
                <span className="rate-label">Success Rate</span>
                <span className="rate-value">
                  {project.successRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="project-metrics">
                <div className="metric">
                  <span className="metric-label">Last Analysis</span>
                  <span className="metric-value">
                    {formatTimeAgo(project.lastAnalysis)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Last Fix</span>
                  <span className="metric-value">
                    {formatTimeAgo(project.lastFix)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Execution Time</span>
                  <span className="metric-value">
                    {project.executionTime}ms
                  </span>
                </div>
              </div>

              {project.layersExecuted.length > 0 && (
                <div className="layers-info">
                  <span className="layers-label">Layers:</span>
                  <div className="layers-badges">
                    {project.layersExecuted.map((layer) => (
                      <span key={layer} className="layer-badge">
                        L{layer}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.errorTrends.length > 0 && (
                <div className="error-trends">
                  <span className="trends-label">Error Trends:</span>
                  <div className="trends-list">
                    {project.errorTrends.map((trend, index) => (
                      <div key={index} className="trend-item">
                        <span className="trend-type">{trend.type}</span>
                        <div className="trend-info">
                          <span className="trend-count">{trend.count}</span>
                          {getTrendIcon(trend.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="empty-state">
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 5-9 13-9 13s-9-8-9-13a9 9 0 0 1 18 0z" />
          </svg>
          <h3>No projects found</h3>
          <p>No projects match the current filter criteria.</p>
        </div>
      )}
    </div>
  );
}
