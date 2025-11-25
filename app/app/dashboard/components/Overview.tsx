'use client';

import React, { useMemo, useState } from "react";
import WelcomeBanner from "./WelcomeBanner";

interface AnalysisHistoryItem {
  id: string;
  filename: string;
  timestamp: Date;
  result: {
    analysis?: {
      detectedIssues: { type: string; severity: string }[];
      confidence: number;
      estimatedImpact?: {
        level: string;
        description: string;
      };
    };
    success?: boolean;
    layers?: Array<{
      layerId: number;
      success: boolean;
      changeCount?: number;
    }>;
  };
  executionTime: number;
}

interface OverviewProps {
  analysisHistory: AnalysisHistoryItem[];
}

export default function Overview({ analysisHistory }: OverviewProps) {
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("all");
  const [showQuickActions, setShowQuickActions] = useState(true);

  const filteredHistory = useMemo(() => {
    if (timeFilter === "all") return analysisHistory;

    const now = new Date();
    const filterDate = new Date();

    if (timeFilter === "week") {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeFilter === "month") {
      filterDate.setMonth(now.getMonth() - 1);
    }

    return analysisHistory.filter(
      (item) => new Date(item.timestamp) >= filterDate,
    );
  }, [analysisHistory, timeFilter]);

  const metrics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalScans: 0,
        legacyPatterns: 0,
        modernizationScore: 0,
        upgradeReadiness: 0,
        modernizationsApplied: 0,
        avgExecutionTime: 0,
        techDebtBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
        modernizationOpportunities: [],
        upgradeImpact: "stable",
      };
    }

    const totalScans = filteredHistory.length;
    const successful = filteredHistory.filter((h) => h.result.success).length;
    const upgradeReadiness = totalScans > 0 ? (successful / totalScans) * 100 : 0;

    const legacyPatterns = filteredHistory.reduce(
      (sum, h) => sum + (h.result.analysis?.detectedIssues?.length || 0),
      0,
    );

    const modernizationsApplied = filteredHistory.reduce(
      (sum, h) =>
        sum +
        (h.result.layers?.reduce(
          (layerSum, layer) => layerSum + (layer.changeCount || 0),
          0,
        ) || 0),
      0,
    );

    const modernizationScore = totalScans > 0
      ? filteredHistory.reduce(
          (s, h) => s + (h.result.analysis?.confidence || 0),
          0,
        ) / totalScans
      : 0;

    const avgExecutionTime = totalScans > 0
      ? filteredHistory.reduce((s, h) => s + (h.executionTime || 0), 0) / totalScans
      : 0;

    // Tech debt severity breakdown
    const techDebtBreakdown = filteredHistory.reduce(
      (acc, h) => {
        h.result.analysis?.detectedIssues?.forEach((issue) => {
          // Add null check for severity
          if (issue.severity && typeof issue.severity === 'string') {
            const severity = issue.severity.toLowerCase();
            if (severity in acc) {
              acc[severity as keyof typeof acc]++;
            }
          }
        });
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    // Modernization opportunities
    const modernizationOpportunities = filteredHistory
      .flatMap((h) => h.result.analysis?.detectedIssues || [])
      .filter((issue) => issue && issue.type && issue.severity) // Filter out invalid issues
      .slice(0, 5)
      .map((issue) => ({
        type: issue.type || 'unknown',
        severity: issue.severity || 'unknown',
        count: 1,
      }));

    // Determine upgrade impact based on metrics
    let upgradeImpact = "stable";
    if (modernizationsApplied > 10) upgradeImpact = "improving";
    if (legacyPatterns > 20) upgradeImpact = "needs-attention";

    return {
      totalScans,
      legacyPatterns,
      modernizationScore,
      upgradeReadiness,
      modernizationsApplied,
      avgExecutionTime,
      techDebtBreakdown,
      modernizationOpportunities,
      upgradeImpact,
    };
  }, [filteredHistory]);

  const formatExecutionTime = (ms: number) => {
    if (!ms || isNaN(ms) || ms < 0) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="18,15 12,9 6,15" />
          </svg>
        );
      case "needs-attention":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6,9 12,15 18,9" />
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
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
    }
  };

  // Show empty state if no analysis history
  if (analysisHistory.length === 0) {
    return (
      <div className="overview-root">
        <div className="overview-header">
          <div className="header-title">
            <h2>Modernization Dashboard</h2>
            <p>React & Next.js modernization insights and upgrade metrics</p>
          </div>
        </div>

        <WelcomeBanner />

        <div className="empty-state-container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                viewBox="0 0 24 24"
                width="64"
                height="64"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <h3>No Analysis Data Yet</h3>
            <p>
              Start by analyzing your code to see modernization insights and metrics.
              Your dashboard will populate with valuable data about your codebase.
            </p>
            <div className="empty-state-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Navigate to code analysis tab
                  const event = new CustomEvent('navigateToTab', { detail: 'editor' });
                  window.dispatchEvent(event);
                }}
              >
                Start Your First Analysis
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // Navigate to samples tab
                  const event = new CustomEvent('navigateToTab', { detail: 'samples' });
                  window.dispatchEvent(event);
                }}
              >
                Try Sample Files
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-root">
      {/* Header with filters */}
      <div className="overview-header">
        <div className="header-title">
          <h2>Modernization Dashboard</h2>
          <p>React & Next.js modernization insights and upgrade metrics</p>
        </div>

        <div className="time-filters">
          {(["all", "week", "month"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`filter-btn ${timeFilter === filter ? "active" : ""}`}
            >
              {filter === "all"
                ? "All Time"
                : filter === "week"
                  ? "Last Week"
                  : "Last Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalScans}</div>
            <div className="metric-label">Legacy Code Scans</div>
            <div className="metric-change">
              <span className="trend-indicator success">
                ↗ {Math.round(metrics.upgradeReadiness)}% Upgrade Readiness
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.legacyPatterns}</div>
            <div className="metric-label">Modernization Opportunities</div>
            <div className="metric-breakdown">
              <span className="critical">Critical: {metrics.techDebtBreakdown.critical}</span>
              <span className="high">High: {metrics.techDebtBreakdown.high}</span>
              <span className="medium">
                Med: {metrics.techDebtBreakdown.medium}
              </span>
              <span className="low">Low: {metrics.techDebtBreakdown.low}</span>
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {(metrics.modernizationScore * 100).toFixed(0)}%
            </div>
            <div className="metric-label">Modernization Score</div>
            <div className="metric-change">
              <span className="fixes-applied">
                {metrics.modernizationsApplied} upgrades applied
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card performance">
          <div className="metric-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {formatExecutionTime(metrics.avgExecutionTime)}
            </div>
            <div className="metric-label">Avg Scan Time</div>
            <div className="metric-trend">
              <span className={`trend-icon ${metrics.upgradeImpact}`}>
                {getPerformanceIcon(metrics.upgradeImpact)}
              </span>
              <span className="trend-text">{metrics.upgradeImpact}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Debt Heatmap */}
      <div className="tech-debt-section">
        <div className="section-header">
          <h3>Tech Debt Heatmap</h3>
          <p>Visual representation of modernization priorities across your codebase</p>
        </div>
        <div className="heatmap-container">
          <div className="heatmap-grid">
            {/* React 18 Compatibility */}
            <div className="heatmap-item severity-high">
              <div className="heatmap-label">React 18 Compatibility</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.high * 0.4)}</div>
              <div className="heatmap-description">Missing key props, deprecated patterns</div>
            </div>

            {/* Next.js App Router */}
            <div className="heatmap-item severity-medium">
              <div className="heatmap-label">Next.js App Router</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.medium * 0.6)}</div>
              <div className="heatmap-description">Pages Router patterns, SSR issues</div>
            </div>

            {/* TypeScript Modernization */}
            <div className="heatmap-item severity-low">
              <div className="heatmap-label">TypeScript Config</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.low * 0.3)}</div>
              <div className="heatmap-description">Outdated tsconfig, type patterns</div>
            </div>

            {/* Component Patterns */}
            <div className="heatmap-item severity-critical">
              <div className="heatmap-label">Component Patterns</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.critical * 0.8)}</div>
              <div className="heatmap-description">Class components, legacy hooks</div>
            </div>

            {/* Import/Export Patterns */}
            <div className="heatmap-item severity-medium">
              <div className="heatmap-label">Import/Export</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.medium * 0.4)}</div>
              <div className="heatmap-description">ES module issues, broken imports</div>
            </div>

            {/* Performance Issues */}
            <div className="heatmap-item severity-low">
              <div className="heatmap-label">Performance</div>
              <div className="heatmap-value">{Math.round(metrics.techDebtBreakdown.low * 0.2)}</div>
              <div className="heatmap-description">Memory leaks, inefficient patterns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {filteredHistory.length > 0 && (
        <div className="recent-activity-section">
          <div className="section-header">
            <h3>Recent Analysis Activity</h3>
            <p>Your latest code modernization scans and results</p>
          </div>
          <div className="activity-list">
            {filteredHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div className="activity-content">
                  <div className="activity-title">{item.filename}</div>
                  <div className="activity-meta">
                    <span className="activity-time">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <span className="activity-issues">
                      {item.result.analysis?.detectedIssues?.length || 0} issues found
                    </span>
                    <span className="activity-time-taken">
                      {formatExecutionTime(item.executionTime)}
                    </span>
                  </div>
                </div>
                <div className="activity-status">
                  <span className={`status-badge ${item.result.success ? 'success' : 'error'}`}>
                    {item.result.success ? 'Success' : 'Error'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .overview-root {
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .header-title h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .header-title p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 1rem;
        }

        .time-filters {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 4px;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .filter-btn.active {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          color: #ffffff;
          border: 2px solid #000000;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(25px) saturate(1.2);
          -webkit-backdrop-filter: blur(25px) saturate(1.2);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .metric-card.primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .metric-card.warning {
          background: linear-gradient(
            135deg,
            rgba(255, 152, 0, 0.2) 0%,
            rgba(255, 152, 0, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .metric-card.success {
          background: linear-gradient(
            135deg,
            rgba(76, 175, 80, 0.2) 0%,
            rgba(76, 175, 80, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .metric-card.performance {
          background: linear-gradient(
            135deg,
            rgba(156, 39, 176, 0.2) 0%,
            rgba(156, 39, 176, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          border-radius: 12px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
          min-width: 0;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .metric-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trend-indicator {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .trend-indicator.success {
          color: #4caf50;
        }

        .metric-breakdown {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .metric-breakdown .critical {
          color: #f44336;
          font-weight: 600;
        }

        .metric-breakdown .high {
          color: #e53e3e;
        }

        .metric-breakdown .medium {
          color: #ff9800;
        }

        .metric-breakdown .low {
          color: #4caf50;
        }

        .fixes-applied {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trend-icon {
          display: flex;
          align-items: center;
        }

        .trend-icon.improving {
          color: #4caf50;
        }

        .trend-icon.declining {
          color: #e53e3e;
        }

        .trend-icon.stable {
          color: rgba(255, 255, 255, 0.6);
        }

        .trend-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: capitalize;
        }

        .quick-actions-section {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .action-card:hover {
          transform: translateY(-2px);
        }

        .action-card.primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .action-card.secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
        }

        .action-card.warning {
          background: linear-gradient(
            135deg,
            rgba(255, 152, 0, 0.2) 0%,
            rgba(255, 152, 0, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .action-card.danger {
          background: linear-gradient(
            135deg,
            rgba(229, 62, 62, 0.2) 0%,
            rgba(229, 62, 62, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          border-radius: 8px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .action-content h4 {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .action-content p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          margin: 0;
        }

        .insights-section {
          margin-top: 1rem;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .insight-card h4 {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .opportunities-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .opportunity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
        }

        .opportunity-type {
          color: #ffffff;
          font-weight: 500;
          text-transform: capitalize;
        }

        .opportunity-count {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
          padding: 0.25rem 0.5rem;
          border: 1px solid #000000;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* Tech Debt Heatmap Styles */
        .tech-debt-section {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .tech-debt-section .section-header h3 {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .tech-debt-section .section-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 1.5rem 0;
          font-size: 0.9rem;
        }

        .heatmap-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .heatmap-item {
          padding: 1rem;
          border-radius: 12px;
          border: 2px solid #000000;
          position: relative;
          overflow: hidden;
        }

        .heatmap-item.severity-critical {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.05) 100%);
          border-color: #000000;
        }

        .heatmap-item.severity-high {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%);
          border-color: #000000;
        }

        .heatmap-item.severity-medium {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.05) 100%);
          border-color: #000000;
        }

        .heatmap-item.severity-low {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
          border-color: #000000;
        }

        .heatmap-label {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .heatmap-value {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .heatmap-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          line-height: 1.3;
        }

        .heatmap-legend {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 12px;
          padding: 1rem;
        }

        .heatmap-legend h4 {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #000000;
        }

        .legend-color.severity-critical {
          background: rgba(244, 67, 54, 0.8);
        }

        .legend-color.severity-high {
          background: rgba(255, 152, 0, 0.8);
        }

        .legend-color.severity-medium {
          background: rgba(255, 193, 7, 0.8);
        }

        .legend-color.severity-low {
          background: rgba(76, 175, 80, 0.8);
        }

        .legend-item span {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
        }

        .activity-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          border-radius: 6px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-title {
          color: #ffffff;
          font-weight: 500;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .activity-meta {
          display: flex;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
        }

        .activity-time {
          font-weight: 400;
        }

        .activity-issues {
          font-weight: 500;
        }

        .activity-time-taken {
          font-weight: 400;
        }

        .activity-status {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.8rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.success {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border: 1px solid #000000;
        }

        .status-badge.error {
          background: rgba(229, 62, 62, 0.2);
          color: #e53e3e;
          border: 1px solid #000000;
        }

        .no-data {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          text-align: center;
          margin: 1rem 0;
        }

        .empty-state-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 0;
        }

        .empty-state {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .empty-state-icon {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin-bottom: 1.5rem;
        }

        .empty-state-actions {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          color: #2196f3;
          border: 2px solid #000000;
        }

        .btn-primary:hover {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.3) 0%,
            rgba(33, 150, 243, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          color: #ffffff;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 2px solid #000000;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .overview-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .heatmap-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .heatmap-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

