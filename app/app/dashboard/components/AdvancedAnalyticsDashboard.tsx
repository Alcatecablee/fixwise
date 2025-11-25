'use client';

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../../lib/auth-context";
import dynamic from 'next/dynamic';

// Chart.js registration - must be done before dynamic imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dynamic imports for advanced visualizations
const Chart = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Chart })), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })), { ssr: false });

interface AnalyticsData {
  overview: {
    totalAnalyses: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    successRate: number;
    avgExecutionTime: number;
    maxExecutionTime: number;
    minExecutionTime: number;
  };
  issueAnalysis: {
    issueTypes: Record<string, number>;
    severityDistribution: Record<string, number>;
    totalIssuesFound: number;
  };
  layerPerformance: Array<{
    layerId: number;
    layerName: string;
    total: number;
    successful: number;
    successRate: number;
    avgTime: number;
    issues: number;
  }>;
  usagePatterns: {
    usageByHour: Array<{ hour: number; count: number }>;
    usageByDay: Array<{ day: string; count: number }>;
    apiEndpointUsage: Record<string, number>;
  };
  fileAnalysis: {
    fileTypes: Record<string, number>;
    projectStats: Record<string, any>;
  };
  performanceTrends?: Record<string, any>;
  codeQualityMetrics?: {
    totalIssues: number;
    qualityScore: number;
    technicalDebt: Record<string, number>;
    improvementRate: number;
    maintainabilityIndex: number;
  };
  recommendations?: string[];
  predictiveAnalytics?: {
    trendPrediction: Array<{ date: string; predictedValue: number; confidence: number }>;
    anomalyDetection: Array<{ date: string; metric: string; severity: string; description: string }>;
    optimizationSuggestions: Array<{ category: string; suggestion: string; impact: string }>;
  };
}

interface AdvancedAnalyticsDashboardProps {
  teamId?: string;
}

export default function AdvancedAnalyticsDashboard({
  teamId
}: AdvancedAnalyticsDashboardProps) {
  const { user, session } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"day" | "week" | "month" | "quarter" | "year">("week");
  const [selectedView, setSelectedView] = useState<"overview" | "performance" | "quality" | "usage" | "predictive">("overview");
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customLayout, setCustomLayout] = useState(false);
  const [widgetLayout, setWidgetLayout] = useState<string[]>(['overview', 'performance', 'quality', 'usage']);
  
  const realTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<Date>(new Date());
  
  // Chart key for forcing recreation when data changes
  const chartKey = useMemo(() => Date.now(), [analyticsData]);

  // Real-time updates
  useEffect(() => {
    if (realTimeEnabled) {
      realTimeInterval.current = setInterval(() => {
        fetchAnalytics();
      }, 30000); // Update every 30 seconds

      return () => {
        if (realTimeInterval.current) {
          clearInterval(realTimeInterval.current);
        }
      };
    } else {
      if (realTimeInterval.current) {
        clearInterval(realTimeInterval.current);
      }
    }
  }, [realTimeEnabled]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!user?.id) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: user.id,
        timeRange: selectedTimeRange,
        detailed: showDetailedMetrics.toString(),
        includePredictive: 'true'
      });

      if (teamId) {
        params.append('teamId', teamId);
      }

      const response = await fetch(`/api/analytics?${params}`, {
        headers: {
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch analytics data: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      setAnalyticsData(result.analytics);
      lastUpdateTime.current = new Date();
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, selectedTimeRange, showDetailedMetrics, teamId, session?.access_token]);

  // Export functionality
  const exportData = async (format: 'csv' | 'pdf' | 'json') => {
    if (!analyticsData) return;

    setExporting(true);
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          format,
          data: analyticsData,
          timeRange: selectedTimeRange,
          userId: user?.id,
          teamId
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  // Memoized calculations
  const chartData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      issueTypesChart: Object.entries(analyticsData.issueAnalysis.issueTypes)
        .slice(0, 8)
        .map(([type, count]) => ({
          name: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          percentage: ((count / analyticsData.issueAnalysis.totalIssuesFound) * 100).toFixed(1)
        })),
      
      severityChart: Object.entries(analyticsData.issueAnalysis.severityDistribution)
        .map(([severity, count]) => ({
          severity: severity.charAt(0).toUpperCase() + severity.slice(1),
          count,
          color: getSeverityColor(severity)
        })),

      hourlyUsage: analyticsData.usagePatterns.usageByHour
        .sort((a, b) => a.hour - b.hour)
        .map(({ hour, count }) => ({
          hour: `${hour}:00`,
          count
        })),

      layerPerformanceChart: analyticsData.layerPerformance
        .sort((a, b) => a.layerId - b.layerId)
        .map(layer => ({
          ...layer,
          efficiency: layer.total > 0 ? (layer.successful / layer.total * 100).toFixed(1) : '0'
        })),

      // Chart.js data
      lineChartData: {
        labels: analyticsData.usagePatterns.usageByDay.map(d => d.day),
        datasets: [{
          label: 'Daily Usage',
          data: analyticsData.usagePatterns.usageByDay.map(d => d.count),
          borderColor: 'var(--primary-600)',
          backgroundColor: 'var(--primary-100)',
          tension: 0.4
        }]
      },

      barChartData: {
        labels: analyticsData.layerPerformance.map(l => l.layerName),
        datasets: [{
          label: 'Success Rate (%)',
          data: analyticsData.layerPerformance.map(l => l.successRate),
          backgroundColor: analyticsData.layerPerformance.map(l => 
            l.successRate > 80 ? 'var(--success-600)' : l.successRate > 60 ? 'var(--warning-600)' : 'var(--error-600)'
          ),
          borderColor: 'var(--dark-border)',
          borderWidth: 1
        }]
      },

      doughnutData: {
        labels: Object.keys(analyticsData.issueAnalysis.severityDistribution),
        datasets: [{
          data: Object.values(analyticsData.issueAnalysis.severityDistribution),
          backgroundColor: Object.keys(analyticsData.issueAnalysis.severityDistribution).map(getSeverityColor),
          borderColor: 'var(--dark-border)',
          borderWidth: 2
        }]
      }
    };
  }, [analyticsData]);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <div className="error-icon"></div>
        <h3>Failed to load analytics</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-empty">
        <div className="empty-icon"></div>
        <h3>No analytics data available</h3>
        <p>Start analyzing your code to see detailed insights here.</p>
      </div>
    );
  }

  return (
    <div className="advanced-analytics-dashboard">
      {/* Header Controls */}
      <div className="analytics-header">
        <div className="header-title">
          <h2>Advanced Analytics {teamId && <span className="team-badge">Team</span>}</h2>
          <p>Detailed insights and performance metrics</p>
          {realTimeEnabled && (
            <div className="real-time-indicator">
              <span className="pulse-dot"></span>
              Real-time updates enabled
              <span className="last-update">
                Last update: {lastUpdateTime.current.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        
        <div className="header-controls">
          <div className="time-range-selector">
            {(["day", "week", "month", "quarter", "year"] as const).map((range) => (
              <button
                key={range}
                className={`time-btn ${selectedTimeRange === range ? "active" : ""}`}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="view-selector">
            {(["overview", "performance", "quality", "usage", "predictive"] as const).map((view) => (
              <button
                key={view}
                className={`view-btn ${selectedView === view ? "active" : ""}`}
                onClick={() => setSelectedView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          <button
            className={`detail-toggle ${showDetailedMetrics ? "active" : ""}`}
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            title="Toggle detailed metrics"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Detailed
          </button>

          <button
            className={`real-time-toggle ${realTimeEnabled ? "active" : ""}`}
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            title="Toggle real-time updates"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Real-time
          </button>

          <div className="export-controls">
            <button
              className="export-btn"
              onClick={() => exportData('csv')}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              className="export-btn"
              onClick={() => exportData('pdf')}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>

          <button
            className={`layout-toggle ${customLayout ? "active" : ""}`}
            onClick={() => setCustomLayout(!customLayout)}
            title="Toggle custom layout"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            Custom Layout
          </button>
        </div>
      </div>

      {/* Custom Layout Mode */}
      {customLayout && (
        <div className="custom-layout-controls">
          <h3>Customize Dashboard Layout</h3>
          <div className="widget-selector">
            {['overview', 'performance', 'quality', 'usage', 'predictive'].map(widget => (
              <label key={widget} className="widget-checkbox">
                <input
                  type="checkbox"
                  checked={widgetLayout.includes(widget)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWidgetLayout([...widgetLayout, widget]);
                    } else {
                      setWidgetLayout(widgetLayout.filter(w => w !== widget));
                    }
                  }}
                />
                {widget.charAt(0).toUpperCase() + widget.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Overview View */}
      {(selectedView === "overview" || (customLayout && widgetLayout.includes('overview'))) && (
        <div className="analytics-overview">
          {/* Key Metrics */}
          <div className="metrics-grid-advanced">
            <div className="metric-card primary">
              <div className="metric-header">
                <h3>Total Analyses</h3>
                <div className="metric-trend">
                  <span className="trend-icon"></span>
                </div>
              </div>
              <div className="metric-value">{analyticsData.overview.totalAnalyses.toLocaleString()}</div>
              <div className="metric-details">
                <span className="detail-success">PASS {analyticsData.overview.successfulAnalyses} successful</span>
                <span className="detail-failed">FAIL {analyticsData.overview.failedAnalyses} failed</span>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-header">
                <h3>Success Rate</h3>
                <div className={`metric-indicator ${analyticsData.overview.successRate >= 90 ? 'excellent' :
                  analyticsData.overview.successRate >= 75 ? 'good' : 'needs-improvement'}`}>
                  <span className="status-indicator"></span>
                </div>
              </div>
              <div className="metric-value">{analyticsData.overview.successRate.toFixed(1)}%</div>
              <div className="metric-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${analyticsData.overview.successRate}%` }}
                ></div>
              </div>
            </div>

            <div className="metric-card performance">
              <div className="metric-header">
                <h3>Avg. Execution Time</h3>
                <div className="metric-range">
                  <span>Range: {analyticsData.overview.minExecutionTime}ms - {analyticsData.overview.maxExecutionTime}ms</span>
                </div>
              </div>
              <div className="metric-value">{analyticsData.overview.avgExecutionTime.toFixed(0)}ms</div>
              <div className="performance-indicator">
                <div className={`perf-badge ${analyticsData.overview.avgExecutionTime < 1000 ? 'fast' : 
                  analyticsData.overview.avgExecutionTime < 3000 ? 'moderate' : 'slow'}`}>
                  {analyticsData.overview.avgExecutionTime < 1000 ? 'Fast' : 
                   analyticsData.overview.avgExecutionTime < 3000 ? 'Moderate' : 'Slow'}
                </div>
              </div>
            </div>

            <div className="metric-card quality">
              <div className="metric-header">
                <h3>Issues Found</h3>
                <div className="metric-breakdown">
                  <span>across all analyses</span>
                </div>
              </div>
              <div className="metric-value">{analyticsData.issueAnalysis.totalIssuesFound.toLocaleString()}</div>
              <div className="issue-severity-mini">
                {Object.entries(analyticsData.issueAnalysis.severityDistribution).map(([severity, count]) => (
                  <span key={severity} className={`severity-badge ${severity}`}>
                    {severity}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Charts */}
          {chartData && (
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Daily Usage Trends</h3>
                <div className="chart-container">
                  <Line 
                    key={`line-${chartKey}`}
                    data={chartData.lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: 'var(--dark-text-primary)' }
                        }
                      },
                      scales: {
                        x: { 
                          type: 'category',
                          ticks: { color: 'var(--dark-text-primary)' } 
                        },
                        y: { 
                          type: 'linear',
                          ticks: { color: 'var(--dark-text-primary)' } 
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Layer Performance</h3>
                <div className="chart-container">
                  <Bar 
                    key={`bar-${chartKey}`}
                    data={chartData.barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: 'var(--dark-text-primary)' }
                        }
                      },
                      scales: {
                        x: { 
                          type: 'category',
                          ticks: { color: 'var(--dark-text-primary)' } 
                        },
                        y: { 
                          type: 'linear',
                          ticks: { color: 'var(--dark-text-primary)' },
                          max: 100
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Code Quality Score */}
          {showDetailedMetrics && analyticsData.codeQualityMetrics && (
            <div className="quality-score-section">
              <div className="quality-card">
                <h3>Code Quality Score</h3>
                <div className="quality-score-display">
                  <div className="score-circle">
                    <svg viewBox="0 0 100 100" width="120" height="120">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getQualityScoreColor(analyticsData.codeQualityMetrics.qualityScore)}
                        strokeWidth="8"
                        strokeDasharray={`${analyticsData.codeQualityMetrics.qualityScore * 2.83} 283`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-number">{analyticsData.codeQualityMetrics.qualityScore.toFixed(0)}</span>
                      <span className="score-label">Quality Score</span>
                    </div>
                  </div>
                </div>
                <div className="quality-metrics">
                  <div className="quality-metric">
                    <span className="metric-label">Improvement Rate</span>
                    <span className={`metric-value ${analyticsData.codeQualityMetrics.improvementRate > 0 ? 'positive' : 'negative'}`}>
                      {analyticsData.codeQualityMetrics.improvementRate > 0 ? '+' : ''}{analyticsData.codeQualityMetrics.improvementRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="quality-metric">
                    <span className="metric-label">Maintainability Index</span>
                    <span className="metric-value">{analyticsData.codeQualityMetrics.maintainabilityIndex.toFixed(0)}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance View */}
      {(selectedView === "performance" || (customLayout && widgetLayout.includes('performance'))) && chartData && (
        <div className="analytics-performance">
          <div className="performance-sections">
            {/* Layer Performance */}
            <div className="performance-section">
              <h3>Layer Performance Analysis</h3>
              <div className="layer-performance-grid">
                {chartData.layerPerformanceChart.map((layer) => (
                  <div key={layer.layerId} className="layer-card">
                    <div className="layer-header">
                      <h4>Layer {layer.layerId}</h4>
                      <span className="layer-name">{layer.layerName}</span>
                    </div>
                    <div className="layer-stats">
                      <div className="stat">
                        <span className="stat-label">Processed</span>
                        <span className="stat-value">{layer.total}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Success Rate</span>
                        <span className="stat-value">{layer.efficiency}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Avg Time</span>
                        <span className="stat-value">{layer.avgTime.toFixed(0)}ms</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Issues</span>
                        <span className="stat-value">{layer.issues}</span>
                      </div>
                    </div>
                    <div className="layer-efficiency-bar">
                      <div 
                        className="efficiency-fill" 
                        style={{ width: `${layer.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Time Trends */}
            {showDetailedMetrics && analyticsData.performanceTrends && (
              <div className="performance-section">
                <h3>Performance Trends</h3>
                <div className="trends-chart">
                  {Object.entries(analyticsData.performanceTrends).map(([date, metrics]: [string, any]) => (
                    <div key={date} className="trend-day">
                      <div className="trend-date">{new Date(date).toLocaleDateString()}</div>
                      <div className="trend-metrics">
                        <div className="trend-metric">
                          <span>Analyses: {metrics.analyses}</span>
                        </div>
                        <div className="trend-metric">
                          <span>Avg Time: {metrics.avgTime.toFixed(0)}ms</span>
                        </div>
                        <div className="trend-metric">
                          <span>Success: {metrics.successRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quality View */}
      {(selectedView === "quality" || (customLayout && widgetLayout.includes('quality'))) && chartData && (
        <div className="analytics-quality">
          <div className="quality-sections">
            {/* Issue Types Distribution */}
            <div className="quality-section">
              <h3>Issue Types Distribution</h3>
              <div className="issue-types-chart">
                {chartData.issueTypesChart.map((issue, index) => (
                  <div key={issue.name} className="issue-type-bar">
                    <div className="issue-info">
                      <span className="issue-name">{issue.name}</span>
                      <span className="issue-stats">{issue.count} ({issue.percentage}%)</span>
                    </div>
                    <div className="issue-bar">
                      <div 
                        className="issue-fill" 
                        style={{ 
                          width: `${issue.percentage}%`,
                          backgroundColor: getIssueTypeColor(index)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Breakdown with Chart.js */}
            <div className="quality-section">
              <h3>Severity Breakdown</h3>
              <div className="severity-chart-container">
                <Doughnut 
                  key={`doughnut-${chartKey}`}
                  data={chartData.doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: 'var(--dark-text-primary)' }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>

            {/* File Types Analysis */}
            <div className="quality-section">
              <h3>File Types Analysis</h3>
              <div className="file-types-grid">
                {Object.entries(analyticsData.fileAnalysis.fileTypes)
                  .slice(0, 8)
                  .map(([fileType, count]) => (
                    <div key={fileType} className="file-type-card">
                      <div className="file-type-icon">{getFileTypeIcon(fileType)}</div>
                      <div className="file-type-info">
                        <span className="file-type-name">.{fileType}</span>
                        <span className="file-type-count">{count} files</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage View */}
      {(selectedView === "usage" || (customLayout && widgetLayout.includes('usage'))) && chartData && (
        <div className="analytics-usage">
          <div className="usage-sections">
            {/* Hourly Usage Pattern */}
            <div className="usage-section">
              <h3>Usage Patterns by Hour</h3>
              <div className="hourly-chart">
                {chartData.hourlyUsage.map((hour) => (
                  <div key={hour.hour} className="hour-bar">
                    <div 
                      className="hour-fill" 
                      style={{ 
                        height: `${Math.max(5, (hour.count / Math.max(...chartData.hourlyUsage.map(h => h.count))) * 100)}%` 
                      }}
                    ></div>
                    <span className="hour-label">{hour.hour}</span>
                    <span className="hour-count">{hour.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Endpoint Usage */}
            <div className="usage-section">
              <h3>API Endpoint Usage</h3>
              <div className="endpoint-usage">
                {Object.entries(analyticsData.usagePatterns.apiEndpointUsage)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([endpoint, count]) => (
                    <div key={endpoint} className="endpoint-item">
                      <span className="endpoint-path">{endpoint}</span>
                      <span className="endpoint-count">{count} calls</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Analytics View */}
      {(selectedView === "predictive" || (customLayout && widgetLayout.includes('predictive'))) && analyticsData.predictiveAnalytics && (
        <div className="analytics-predictive">
          <div className="predictive-sections">
            {/* Trend Predictions */}
            <div className="predictive-section">
              <h3>Trend Predictions</h3>
              <div className="predictions-grid">
                {analyticsData.predictiveAnalytics.trendPrediction.map((prediction, index) => (
                  <div key={index} className="prediction-card">
                    <div className="prediction-header">
                      <span className="prediction-date">{prediction.date}</span>
                      <span className="prediction-confidence">
                        Confidence: {prediction.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="prediction-value">
                      {prediction.predictedValue.toFixed(0)} analyses
                    </div>
                    <div className="prediction-indicator">
                      <div 
                        className="confidence-bar" 
                        style={{ width: `${prediction.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomaly Detection */}
            <div className="predictive-section">
              <h3>Anomaly Detection</h3>
              <div className="anomalies-list">
                {analyticsData.predictiveAnalytics.anomalyDetection.map((anomaly, index) => (
                  <div key={index} className={`anomaly-item ${anomaly.severity}`}>
                    <div className="anomaly-header">
                      <span className="anomaly-date">{anomaly.date}</span>
                      <span className={`anomaly-severity ${anomaly.severity}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="anomaly-metric">{anomaly.metric}</div>
                    <div className="anomaly-description">{anomaly.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Suggestions */}
            <div className="predictive-section">
              <h3>Optimization Suggestions</h3>
              <div className="suggestions-list">
                {analyticsData.predictiveAnalytics.optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-header">
                      <span className="suggestion-category">{suggestion.category}</span>
                      <span className={`suggestion-impact ${suggestion.impact.toLowerCase()}`}>
                        {suggestion.impact} Impact
                      </span>
                    </div>
                    <div className="suggestion-text">{suggestion.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analyticsData.recommendations && analyticsData.recommendations.length > 0 && (
        <div className="analytics-recommendations">
          <h3>Recommendations</h3>
          <div className="recommendations-list">
            {analyticsData.recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-icon"></div>
                <span className="recommendation-text">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'var(--error-600)',
    high: 'var(--error-500)',
    medium: 'var(--warning-600)',
    low: 'var(--success-600)',
    info: 'var(--primary-600)'
  };
  return colors[severity] || 'var(--neutral-500)';
}

function getQualityScoreColor(score: number): string {
  if (score >= 80) return 'var(--success-600)';
  if (score >= 60) return 'var(--warning-600)';
  if (score >= 40) return 'var(--error-600)';
  return 'var(--neutral-500)';
}

function getIssueTypeColor(index: number): string {
  const colors = [
    'var(--primary-600)', 'var(--success-600)', 'var(--warning-600)', 'var(--error-600)',
    'var(--primary-700)', 'var(--success-500)', 'var(--warning-500)', 'var(--error-500)'
  ];
  return colors[index % colors.length] || 'var(--primary-600)';
}

function getFileTypeIcon(fileType: string): string {
  const icons: Record<string, string> = {
    ts: 'TS',
    tsx: 'TSX',
    js: 'JS',
    jsx: 'JSX',
    vue: 'VUE',
    json: 'JSON',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML'
  };
  return icons[fileType] || 'FILE';
}
