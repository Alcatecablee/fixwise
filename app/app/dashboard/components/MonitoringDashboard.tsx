'use client';

import React, { useState, useEffect } from "react";
import { monitoringService } from "../../../lib/monitoring-service";

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  status: 'good' | 'warning' | 'error';
  icon: string;
}

export default function MonitoringDashboard() {
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    errorRate: 0,
    averageResponseTime: 0,
    activeUsers: 0,
    activeSessions: 0,
    systemHealth: 'healthy' as 'healthy' | 'degraded' | 'down'
  });
  
  const [usageStats, setUsageStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalAnalyses: 0,
    avgResponseTime: 0,
    errorRate: 0,
    uptime: 99.9
  });

  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({ status: 'healthy', checks: {} });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    
    // Update real-time metrics every 30 seconds
    const interval = setInterval(() => {
      setRealTimeMetrics(monitoringService.getRealTimeMetrics());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    setIsLoading(true);
    
    try {
      // Load current metrics
      setRealTimeMetrics(monitoringService.getRealTimeMetrics());
      setUsageStats(monitoringService.getUsageStats());
      setErrorLogs(monitoringService.getErrorLogs(20));
      setPerformanceMetrics(monitoringService.getPerformanceMetrics(20));
      
      // Check system health
      const health = await monitoringService.checkSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponseTime = (time: number): string => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatErrorRate = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'good':
      case 'ok':
        return '#4caf50';
      case 'warning':
      case 'degraded':
        return '#ff9800';
      case 'error':
      case 'down':
        return '#f44336';
      default:
        return '#64748b';
    }
  };

  const metricCards: MetricCard[] = [
    {
      title: 'System Health',
      value: realTimeMetrics.systemHealth,
      status: realTimeMetrics.systemHealth === 'healthy' ? 'good' : 
              realTimeMetrics.systemHealth === 'degraded' ? 'warning' : 'error',
      icon: realTimeMetrics.systemHealth === 'healthy' ? 'OK' :
            realTimeMetrics.systemHealth === 'degraded' ? 'WARN' : 'ERR'
    },
    {
      title: 'Active Users',
      value: realTimeMetrics.activeUsers,
      status: 'good',
      icon: 'USR'
    },
    {
      title: 'Active Sessions',
      value: realTimeMetrics.activeSessions,
      status: 'good',
      icon: 'SES'
    },
    {
      title: 'Error Rate',
      value: formatErrorRate(realTimeMetrics.errorRate),
      status: realTimeMetrics.errorRate < 0.01 ? 'good' : 
             realTimeMetrics.errorRate < 0.05 ? 'warning' : 'error',
      icon: 'ERR'
    },
    {
      title: 'Avg Response Time',
      value: formatResponseTime(realTimeMetrics.averageResponseTime),
      status: realTimeMetrics.averageResponseTime < 200 ? 'good' : 
             realTimeMetrics.averageResponseTime < 500 ? 'warning' : 'error',
      icon: 'TIME'
    },
    {
      title: 'Total Analyses',
      value: usageStats.totalAnalyses,
      status: 'good',
      icon: 'SCAN'
    },
    {
      title: 'Uptime',
      value: `${usageStats.uptime}%`,
      status: usageStats.uptime > 99.5 ? 'good' : 
             usageStats.uptime > 99 ? 'warning' : 'error',
      icon: 'UP'
    }
  ];

  if (isLoading) {
    return (
      <div className="monitoring-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h1>System Monitoring</h1>
        <div className="health-indicator">
          <span 
            className="health-status"
            style={{ color: getStatusColor(systemHealth.status) }}
          >
            {systemHealth.status.toUpperCase()}
          </span>
          <button onClick={loadMonitoringData} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="metrics-grid">
        {metricCards.map((card, index) => (
          <div key={index} className={`metric-card ${card.status}`}>
            <div className="metric-header">
              <span className="metric-icon">{card.icon}</span>
              <span className="metric-title">{card.title}</span>
            </div>
            <div className="metric-value">{card.value}</div>
            {card.change && (
              <div className="metric-change">{card.change}</div>
            )}
          </div>
        ))}
      </div>

      {/* System Health Details */}
      <div className="health-section">
        <h2>System Health Checks</h2>
        <div className="health-checks">
          {Object.entries(systemHealth.checks).map(([service, check]) => (
            <div key={service} className={`health-check ${(check as any).status}`}>
              <div className="check-header">
                <span className="check-name">{service}</span>
                <span 
                  className="check-status"
                  style={{ color: getStatusColor((check as any).status) }}
                >
                  {(check as any).status}
                </span>
              </div>
              {(check as any).responseTime && (
                <div className="check-metric">
                  Response Time: {formatResponseTime((check as any).responseTime)}
                </div>
              )}
              {(check as any).message && (
                <div className="check-message">{(check as any).message}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Logs */}
      <div className="logs-section">
        <h2>Recent Error Logs</h2>
        <div className="error-logs">
          {errorLogs.length === 0 ? (
            <div className="no-errors">No recent errors - system running smoothly!</div>
          ) : (
            errorLogs.map((error) => (
              <div key={error.id} className={`error-log ${error.level}`}>
                <div className="error-header">
                  <span className="error-level">{error.level.toUpperCase()}</span>
                  <span className="error-time">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="error-message">{error.message}</div>
                {error.context && (
                  <div className="error-context">
                    <details>
                      <summary>Context</summary>
                      <pre>{JSON.stringify(error.context, null, 2)}</pre>
                    </details>
                  </div>
                )}
                {error.stack && (
                  <div className="error-stack">
                    <details>
                      <summary>Stack Trace</summary>
                      <pre>{error.stack}</pre>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-section">
        <h2>Performance Metrics</h2>
        <div className="performance-metrics">
          {performanceMetrics.slice(0, 10).map((metric) => (
            <div key={metric.id} className="performance-metric">
              <div className="metric-info">
                <span className="metric-name">{metric.metric}</span>
                <span className="metric-timestamp">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="metric-value-container">
                <span className="metric-value">
                  {metric.value} {metric.unit}
                </span>
                {metric.context && (
                  <details className="metric-context">
                    <summary>Details</summary>
                    <pre>{JSON.stringify(metric.context, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="usage-section">
        <h2>Usage Statistics (Last Hour)</h2>
        <div className="usage-stats">
          <div className="stat-item">
            <span className="stat-label">Total Users:</span>
            <span className="stat-value">{usageStats.totalUsers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Users:</span>
            <span className="stat-value">{usageStats.activeUsers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Sessions:</span>
            <span className="stat-value">{usageStats.totalSessions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Sessions:</span>
            <span className="stat-value">{usageStats.activeSessions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Code Analyses:</span>
            <span className="stat-value">{usageStats.totalAnalyses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Response Time:</span>
            <span className="stat-value">{formatResponseTime(usageStats.avgResponseTime)}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .monitoring-dashboard {
          padding: 20px;
          background: transparent;
          color: white;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .health-indicator {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .health-status {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: rgba(33, 150, 243, 0.2);
          border: 1px solid #000000;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          background: rgba(33, 150, 243, 0.3);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .metric-card.good {
          border-left: 4px solid #4caf50;
        }

        .metric-card.warning {
          border-left: 4px solid #ff9800;
        }

        .metric-card.error {
          border-left: 4px solid #f44336;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .metric-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid #000000;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 700;
          color: #2196f3;
          text-align: center;
        }

        .metric-title {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .metric-change {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 5px;
        }

        .health-section,
        .logs-section,
        .performance-section,
        .usage-section {
          margin-bottom: 40px;
        }

        .health-section h2,
        .logs-section h2,
        .performance-section h2,
        .usage-section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.9);
        }

        .health-checks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .health-check {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 15px;
        }

        .check-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .check-name {
          font-weight: 600;
          text-transform: capitalize;
        }

        .check-status {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .check-metric,
        .check-message {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .error-logs {
          max-height: 500px;
          overflow-y: auto;
        }

        .no-errors {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        .error-log {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .error-log.error {
          border-left: 4px solid #f44336;
        }

        .error-log.warning {
          border-left: 4px solid #ff9800;
        }

        .error-log.info {
          border-left: 4px solid #2196f3;
        }

        .error-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .error-level {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .error-time {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .error-message {
          font-weight: 500;
          margin-bottom: 10px;
        }

        .error-context,
        .error-stack {
          margin-top: 10px;
        }

        .error-context pre,
        .error-stack pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          overflow-x: auto;
        }

        .performance-metrics {
          display: grid;
          gap: 10px;
        }

        .performance-metric {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 15px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .metric-name {
          font-weight: 600;
        }

        .metric-timestamp {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .metric-value-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-context {
          font-size: 0.8rem;
        }

        .usage-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 2px solid #000000;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          margin-bottom: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
