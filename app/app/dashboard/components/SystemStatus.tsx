'use client';

import React, { useState, useEffect } from "react";

interface HealthStatus {
  service: string;
  status: "healthy" | "warning" | "error";
  uptime: string;
  lastCheck: string;
  details?: string;
}

export default function SystemStatus() {
  const [healthData, setHealthData] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const checkSystemHealth = async () => {
    const services = [
      { endpoint: "/api/dashboard", name: "Analysis Engine" },
      { endpoint: "/api/analyze", name: "API Service" },
      { endpoint: "/api/projects", name: "Project Management" },
      { endpoint: "/api/auth/api-keys", name: "Authentication" },
      { endpoint: "/api/webhooks", name: "Webhooks" },
      { endpoint: "/api/teams", name: "Team Collaboration" },
      { endpoint: "/api/integrations/cicd", name: "CI/CD Integrations" },
      { endpoint: "/api/docs", name: "Documentation" },
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const start = Date.now();
        try {
          const response = await fetch(service.endpoint, {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
          });
          const responseTime = Date.now() - start;

          return {
            service: service.name,
            status: response.ok ? ("healthy" as const) : ("warning" as const),
            uptime: `${responseTime}ms`,
            lastCheck: new Date().toLocaleTimeString(),
            details: response.ok ? "Operational" : `HTTP ${response.status}`,
          };
        } catch (error) {
          return {
            service: service.name,
            status: "error" as const,
            uptime: "N/A",
            lastCheck: new Date().toLocaleTimeString(),
            details:
              error instanceof Error ? error.message : "Connection failed",
          };
        }
      }),
    );

    const results = healthChecks.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            service: services[index].name,
            status: "error" as const,
            uptime: "N/A",
            lastCheck: new Date().toLocaleTimeString(),
            details: "Health check failed",
          },
    );

    setHealthData(results);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "●";
      case "warning":
        return "●";
      case "error":
        return "●";
      default:
        return "●";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      case "error":
        return "#e53e3e";
      default:
        return "#666666";
    }
  };

  const healthyServices = healthData.filter(
    (s) => s.status === "healthy",
  ).length;
  const totalServices = healthData.length;
  const overallStatus =
    healthyServices === totalServices
      ? "healthy"
      : healthyServices > totalServices * 0.7
        ? "warning"
        : "error";

  return (
    <div className="system-status">
      <div className="status-header">
        <h3>System Status</h3>
        <div className="overall-status">
          <span
            className="status-indicator"
            style={{ color: getStatusColor(overallStatus) }}
          >
            {getStatusIcon(overallStatus)}
          </span>
          <span className="status-text">
            {healthyServices}/{totalServices} services operational
          </span>
        </div>
      </div>

      <div className="status-summary">
        <div className="summary-card">
          <div className="summary-number">{healthyServices}</div>
          <div className="summary-label">Healthy Services</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {healthData.filter((s) => s.status === "warning").length}
          </div>
          <div className="summary-label">Warnings</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {healthData.filter((s) => s.status === "error").length}
          </div>
          <div className="summary-label">Errors</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {loading ? "..." : new Date().toLocaleDateString()}
          </div>
          <div className="summary-label">Last Updated</div>
        </div>
      </div>

      <div className="services-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Checking system health...</p>
          </div>
        ) : (
          healthData.map((service, index) => (
            <div key={index} className="service-item">
              <div className="service-info">
                <div className="service-header">
                  <span className="service-icon">
                    {getStatusIcon(service.status)}
                  </span>
                  <span className="service-name">{service.service}</span>
                  <span
                    className="service-status"
                    style={{ color: getStatusColor(service.status) }}
                  >
                    {service.status.toUpperCase()}
                  </span>
                </div>
                <div className="service-details">
                  <span className="service-detail">
                    Response: {service.uptime}
                  </span>
                  <span className="service-detail">
                    Last check: {service.lastCheck}
                  </span>
                  {service.details && (
                    <span className="service-detail">{service.details}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="status-actions">
        <button
          className="btn btn-secondary"
          onClick={checkSystemHealth}
          disabled={loading}
        >
          {loading ? "Checking..." : "Refresh Status"}
        </button>
        <span className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <style jsx>{`
        .system-status {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid #000000;
          padding: 24px;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .status-header h3 {
          color: #ffffff;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .overall-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          font-size: 1.2rem;
        }

        .status-text {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .status-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .summary-number {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 8px;
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .services-list {
          margin-bottom: 24px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 1px solid #000000;
          border-top: 1px solid #000000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .service-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .service-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .service-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .service-icon {
          font-size: 1.1rem;
        }

        .service-name {
          color: #ffffff;
          font-weight: 500;
          flex: 1;
        }

        .service-status {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .service-details {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-left: 32px;
        }

        .service-detail {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
        }

        .status-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #000000;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid #000000;
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .last-update {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .status-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .status-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .service-details {
            flex-direction: column;
            gap: 4px;
            margin-left: 24px;
          }

          .status-actions {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
