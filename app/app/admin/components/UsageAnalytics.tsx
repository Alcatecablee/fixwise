"use client";

import React, { useState, useEffect, useMemo } from "react";

interface AnalyticsData {
  totalLinesAnalyzed: number;
  totalLinesTransformed: number;
  totalIssuesFixed: number;
  timesSaved: number; // in hours
  topIssueTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  layerPerformance: Array<{
    layer: number;
    name: string;
    avgExecutionTime: number;
    successRate: number;
    usage: number;
  }>;
  timeRangeData: Array<{
    date: string;
    analyses: number;
    fixes: number;
    errors: number;
  }>;
}

export default function UsageAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "analyses" | "fixes" | "errors"
  >("analyses");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/analytics?timeRange=${timeRange}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  function generateTimeRangeData(range: string) {
    const days =
      range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        analyses: Math.floor(Math.random() * 50) + 10,
        fixes: Math.floor(Math.random() * 30) + 5,
        errors: Math.floor(Math.random() * 8) + 1,
      });
    }

    return data;
  }

  const chartData = useMemo(() => {
    if (!analytics) return [];

    return analytics.timeRangeData.map((item) => ({
      ...item,
      value: item[selectedMetric],
    }));
  }, [analytics, selectedMetric]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map((item) => item.value));
  }, [chartData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="section-container">
        <div className="error-container">
          <h2>Failed to load analytics</h2>
          <button className="btn-primary" onClick={loadAnalytics}>
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
          <h1>Usage Analytics</h1>
          <p>Performance metrics and system insights</p>
        </div>
        <div className="section-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="filter-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="btn-primary" onClick={loadAnalytics}>
            Refresh
          </button>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <span>Lines Analyzed</span>
            </div>
            <div className="metric-value">
              {formatNumber(analytics.totalLinesAnalyzed)}
            </div>
            <div className="metric-detail">Total code analyzed</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Lines Transformed</span>
            </div>
            <div className="metric-value">
              {formatNumber(analytics.totalLinesTransformed)}
            </div>
            <div className="metric-detail">Code automatically fixed</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Issues Fixed</span>
            </div>
            <div className="metric-value">
              {formatNumber(analytics.totalIssuesFixed)}
            </div>
            <div className="metric-detail">Problems resolved</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
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
              <span>Time Saved</span>
            </div>
            <div className="metric-value">{analytics.timesSaved}h</div>
            <div className="metric-detail">Developer hours saved</div>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        <div className="analytics-section">
          <div className="section-title">
            <h2>Activity Trends</h2>
            <div className="chart-controls">
              <div className="metric-selector">
                {["analyses", "fixes", "errors"].map((metric) => (
                  <button
                    key={metric}
                    className={`metric-btn ${selectedMetric === metric ? "active" : ""}`}
                    onClick={() =>
                      setSelectedMetric(metric as typeof selectedMetric)
                    }
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart">
              {chartData.map((item, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${(item.value / maxValue) * 100}%`,
                    }}
                  />
                  <span className="bar-label">{item.date.split("-")[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h2>Top Issue Types</h2>
          <div className="issues-list">
            {analytics.topIssueTypes.map((issue, index) => (
              <div key={index} className="issue-item">
                <div className="issue-info">
                  <span className="issue-type">{issue.type}</span>
                  <span className="issue-count">
                    {formatNumber(issue.count)} occurrences
                  </span>
                </div>
                <div className="issue-percentage">
                  <div
                    className="percentage-bar"
                    style={{ width: `${issue.percentage}%` }}
                  />
                  <span className="percentage-text">{issue.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-section">
          <h2>Layer Performance</h2>
          <div className="layers-performance">
            {analytics.layerPerformance.map((layer) => (
              <div key={layer.layer} className="layer-performance-card">
                <div className="layer-header">
                  <h3>
                    Layer {layer.layer}: {layer.name}
                  </h3>
                  <span className="usage-count">{layer.usage} runs</span>
                </div>

                <div className="performance-metrics">
                  <div className="performance-metric">
                    <span className="metric-label">Avg Execution Time</span>
                    <span className="metric-value">
                      {layer.avgExecutionTime}ms
                    </span>
                  </div>
                  <div className="performance-metric">
                    <span className="metric-label">Success Rate</span>
                    <span className="metric-value">{layer.successRate}%</span>
                  </div>
                </div>

                <div className="performance-bars">
                  <div className="performance-bar">
                    <span className="bar-label">Speed</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill speed"
                        style={{
                          width: `${Math.max(10, 100 - (layer.avgExecutionTime / 2000) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="performance-bar">
                    <span className="bar-label">Reliability</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill reliability"
                        style={{ width: `${layer.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
