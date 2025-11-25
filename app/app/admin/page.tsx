"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../dashboard/dashboard.css";
import "../dashboard/integrations.css";
import ErrorBoundary from "../dashboard/components/ErrorBoundary";
import ProjectMonitoring from "./components/ProjectMonitoring";
import RuleManagement from "./components/RuleManagement";
import ExecutionLogs from "./components/ExecutionLogs";
import UsageAnalytics from "./components/UsageAnalytics";

import SafetyControls from "./components/SafetyControls";
import TeamManagement from "./components/TeamManagement";
import SystemConfiguration from "./components/SystemConfiguration";
import VersionManagement from "./components/VersionManagement";
import ActivityFeed from "./components/ActivityFeed";

interface AdminDashboardState {
  activeSection: string;
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [adminState, setAdminState] = useState<AdminDashboardState>({
    activeSection: "projects",
    isLoading: false,
    error: null,
    sidebarCollapsed: false,
  });

  // Check admin permissions
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user && !isAdmin(user)) {
      router.push("/dashboard");
      return;
    }

    // Additional server-side verification
    if (user) {
      verifyAdminAccess();
    }
  }, [user, loading, router]);

  const verifyAdminAccess = async () => {
    try {
      // Get the access token from localStorage
      const savedSession = localStorage.getItem("supabase_session");
      if (!savedSession) {
        router.push("/dashboard");
        return;
      }

      const sessionData = JSON.parse(savedSession);
      const accessToken = sessionData.access_token;

      if (!accessToken) {
        router.push("/dashboard");
        return;
      }

      const response = await fetch("/api/admin/verify-access", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Admin access verification failed:", error);
      router.push("/dashboard");
    }
  };

  const isAdmin = (user: { email?: string; role?: string } | null) => {
    if (!user) return false;
    return (
      user.email === "admin@neurolint.com" ||
      user.role === "admin" ||
      user.email === "info@neurolint.com"
    );
  };

  const sidebarSections = [
    {
      id: "projects",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c0 5-9 13-9 13s-9-8-9-13a9 9 0 0 1 18 0z" />
        </svg>
      ),
      label: "Project Monitoring",
      description: "Connected projects & analysis",
    },
    {
      id: "rules",
      icon: (
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
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      ),
      label: "Rule Management",
      description: "Transformation rules & layers",
    },
    {
      id: "logs",
      icon: (
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
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      label: "Execution Logs",
      description: "Reports & error tracking",
    },
        {
      id: "analytics",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 3 3 21 21 21" />
          <path d="M7 12h4l3-8 4 8h3" />
        </svg>
      ),
      label: "Usage Analytics",
      description: "Performance & metrics",
    },
    {
      id: "onboarding-analytics",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M12 11v5" />
          <path d="M9 14h6" />
        </svg>
      ),
      label: "Onboarding Analytics",
      description: "User onboarding metrics",
    },
    {
      id: "safety",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      label: "Safety Controls",
      description: "Rollback & diff viewer",
    },
    {
      id: "team",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: "Team Management",
      description: "Users & permissions",
    },
    {
      id: "config",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
        </svg>
      ),
      label: "System Config",
      description: "Settings & API keys",
    },
    {
      id: "version",
      icon: (
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
      ),
      label: "Version Control",
      description: "Updates & rollbacks",
    },
    {
      id: "activity",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      label: "Activity Feed",
      description: "Real-time system events",
    },
  ];

  const handleSectionChange = (sectionId: string) => {
    setAdminState((prev) => ({
      ...prev,
      activeSection: sectionId,
    }));
  };

  const toggleSidebar = () => {
    setAdminState((prev) => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div
        className={`dashboard-sidebar ${adminState.sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="logo-container">
            <h2>NeuroLint Admin</h2>
            <span className="badge">System Control</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarSections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${adminState.activeSection === section.id ? "active" : ""}`}
              onClick={() => handleSectionChange(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <div className="nav-content">
                <span className="nav-label">{section.label}</span>
                <span className="nav-description">{section.description}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="user-details">
              <span className="user-name">Admin</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <Link href="/dashboard" className="back-link">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="main-content">
          <ErrorBoundary>
            {adminState.activeSection === "projects" && <ProjectMonitoring />}
            {adminState.activeSection === "rules" && <RuleManagement />}
            {adminState.activeSection === "logs" && <ExecutionLogs />}
                        {adminState.activeSection === "analytics" && <UsageAnalytics />}
            
            {adminState.activeSection === "safety" && <SafetyControls />}
            {adminState.activeSection === "team" && <TeamManagement />}
            {adminState.activeSection === "config" && <SystemConfiguration />}
            {adminState.activeSection === "version" && <VersionManagement />}
            {adminState.activeSection === "activity" && <ActivityFeed />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
