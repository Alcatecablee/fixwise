'use client';

import React, { useMemo, useState } from "react";

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

interface AnalyticsDashboardProps {
  analysisHistory: AnalysisHistoryItem[];
}

export default function AnalyticsDashboard({
  analysisHistory,
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<"week" | "month" | "quarter">("week");

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    if (selectedTimeRange === "week") {
      filterDate.setDate(now.getDate() - 7);
    } else if (selectedTimeRange === "month") {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (selectedTimeRange === "quarter") {
      filterDate.setMonth(now.getMonth() - 3);
    }

    return analysisHistory.filter(
      (item) => new Date(item.timestamp) >= filterDate,
    );
  }, [analysisHistory, selectedTimeRange]);

  const analytics = useMemo(() => {
    const totalAnalyses = filteredHistory.length;
    const successfulAnalyses = filteredHistory.filter(item => item.result.success).length;
    const avgExecutionTime = totalAnalyses > 0 
      ? filteredHistory.reduce((sum, item) => sum + item.executionTime, 0) / totalAnalyses 
      : 0;

    const issueTypes = filteredHistory.reduce((acc, item) => {
      if (item.result.analysis?.detectedIssues) {
        item.result.analysis.detectedIssues.forEach(issue => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAnalyses,
      successfulAnalyses,
      successRate: totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0,
      avgExecutionTime,
      issueTypes,
    };
  }, [filteredHistory]);

  return (
    <div className="tab-content">
      <div className="overview-header">
        <div className="header-content">
          <h2>Analytics Dashboard</h2>
          <p>Performance metrics and usage insights</p>
        </div>
        <div className="time-filter">
          <button
            className={`filter-btn ${selectedTimeRange === "week" ? "active" : ""}`}
            onClick={() => setSelectedTimeRange("week")}
          >
            Week
          </button>
          <button
            className={`filter-btn ${selectedTimeRange === "month" ? "active" : ""}`}
            onClick={() => setSelectedTimeRange("month")}
          >
            Month
          </button>
          <button
            className={`filter-btn ${selectedTimeRange === "quarter" ? "active" : ""}`}
            onClick={() => setSelectedTimeRange("quarter")}
          >
            Quarter
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Total Analyses</h3>
            <p className="metric-value">{analytics.totalAnalyses}</p>
            <span className="metric-label">in selected period</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Success Rate</h3>
            <p className="metric-value">{analytics.successRate.toFixed(1)}%</p>
            <span className="metric-label">{analytics.successfulAnalyses} successful</span>
          </div>
        </div>

        <div className="metric-card performance">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Avg. Execution Time</h3>
            <p className="metric-value">{analytics.avgExecutionTime.toFixed(0)}ms</p>
            <span className="metric-label">per analysis</span>
          </div>
        </div>
      </div>

      {Object.keys(analytics.issueTypes).length > 0 && (
        <div className="analysis-section">
          <h3>Issue Types Detected</h3>
          <div className="issue-breakdown">
            {Object.entries(analytics.issueTypes)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([type, count]) => (
                <div key={type} className="issue-stat">
                  <span className="issue-type">{type.replace(/-/g, ' ')}</span>
                  <span className="issue-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {filteredHistory.length > 0 && (
        <div className="analysis-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {filteredHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <span className="activity-filename">{item.filename}</span>
                  <span className="activity-timestamp">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="activity-status">
                  {item.result.success ? (
                    <span className="status-success">Success</span>
                  ) : (
                    <span className="status-error">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
