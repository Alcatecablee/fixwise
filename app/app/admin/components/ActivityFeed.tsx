"use client";

import React, { useState, useEffect, useCallback } from "react";

interface ActivityItem {
  id: string;
  type: "execution" | "rule_change" | "user_action" | "system_event";
  timestamp: Date;
  title: string;
  description: string;
  user?: string;
  project?: string;
  status: "success" | "error" | "warning" | "info";
  details?: {
    duration?: number;
    files?: number;
    changes?: number;
    layer?: number;
  };
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "execution" | "rule_change" | "user_action" | "system_event"
  >("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const loadActivitiesCallback = useCallback(async () => {
    try {
      if (!loading) {
        // Don't show loading spinner for auto-refresh
        setLoading(false);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("type", filter);
      }

      const response = await fetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        setActivities([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to load activities:", error);
      setActivities([]);
      setLoading(false);
    }
  }, [filter, loading]);

  useEffect(() => {
    loadActivitiesCallback();

    if (autoRefresh) {
      const interval = setInterval(loadActivitiesCallback, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, loadActivitiesCallback]);

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const filteredActivities = activities.filter(
    (activity) => filter === "all" || activity.type === filter,
  );

  const getActivityIcon = (type: string, status: string) => {
    const baseClass = `activity-icon ${status}`;

    switch (type) {
      case "execution":
        return (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={baseClass}
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case "rule_change":
        return (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={baseClass}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        );
      case "user_action":
        return (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={baseClass}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "system_event":
        return (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={baseClass}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={baseClass}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Activity Feed</h1>
          <p>Real-time system events and activities</p>
        </div>
        <div className="section-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh</span>
          </label>
          <button className="btn-primary" onClick={loadActivitiesCallback}>
            Refresh
          </button>
        </div>
      </div>

      <div className="activity-controls">
        <div className="filter-group">
          <label>Filter by type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="filter-select"
          >
            <option value="all">All Activities</option>
            <option value="execution">Executions</option>
            <option value="rule_change">Rule Changes</option>
            <option value="user_action">User Actions</option>
            <option value="system_event">System Events</option>
          </select>
        </div>

        <div className="activity-stats">
          <span className="stat">{filteredActivities.length} activities</span>
          {autoRefresh && (
            <span className="refresh-indicator">
              <div className="pulse-dot" />
              Live
            </span>
          )}
        </div>
      </div>

      {loading && activities.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading activity feed...</p>
        </div>
      ) : (
        <div className="activity-feed">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`activity-item ${activity.status}`}
            >
              <div className="activity-icon-container">
                {getActivityIcon(activity.type, activity.status)}
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  <h3 className="activity-title">{activity.title}</h3>
                  <span className="activity-timestamp">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>

                <p className="activity-description">{activity.description}</p>

                <div className="activity-meta">
                  {activity.user && (
                    <span className="activity-user">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {activity.user}
                    </span>
                  )}

                  {activity.project && (
                    <span className="activity-project">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12c0 5-9 13-9 13s-9-8-9-13a9 9 0 0 1 18 0z" />
                      </svg>
                      {activity.project}
                    </span>
                  )}
                </div>

                {activity.details && (
                  <div className="activity-details">
                    {activity.details.layer && (
                      <span className="detail-item">
                        Layer {activity.details.layer}
                      </span>
                    )}
                    {activity.details.duration && (
                      <span className="detail-item">
                        {formatDuration(activity.details.duration)}
                      </span>
                    )}
                    {activity.details.files && (
                      <span className="detail-item">
                        {activity.details.files} files
                      </span>
                    )}
                    {activity.details.changes !== undefined && (
                      <span className="detail-item">
                        {activity.details.changes} changes
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <h3>No activities found</h3>
              <p>No activities match the current filter criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
