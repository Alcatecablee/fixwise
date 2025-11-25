"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "devops" | "developer" | "viewer";
  status: "active" | "inactive" | "pending";
  lastActive: Date;
  permissions: {
    ruleEditing: boolean;
    projectMonitoring: boolean;
    systemConfig: boolean;
    userManagement: boolean;
  };
  createdAt: Date;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: Date;
  details: string;
}

export default function TeamManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      setAuditLogs([]);
    }
  };

  const updateUserRole = async (userId: string, newRole: User["role"]) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  status: user.status === "active" ? "inactive" : "active",
                }
              : user,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const updateUserPermissions = async (
    userId: string,
    permissions: Partial<User["permissions"]>,
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  permissions: { ...user.permissions, ...permissions },
                }
              : user,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to update user permissions:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="role-icon admin"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case "devops":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="role-icon devops"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
        );
      case "developer":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="role-icon developer"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
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
            className="role-icon viewer"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`status-badge ${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTimeAgo = (date: Date) => {
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
          <p>Loading team management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Team Management</h1>
          <p>Manage users, roles, and permissions</p>
        </div>
        <div className="section-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowAddUser(true)}
          >
            Add User
          </button>
          <button className="btn-primary" onClick={loadUsers}>
            Refresh
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab-button ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {activeTab === "users" && (
        <div className="users-section">
          <div className="users-list">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="user-meta">
                    <div className="user-role">
                      {getRoleIcon(user.role)}
                      <span>{user.role}</span>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>
                </div>

                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-label">Last Active</span>
                    <span className="stat-value">
                      {formatTimeAgo(user.lastActive)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Member Since</span>
                    <span className="stat-value">
                      {user.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="user-permissions">
                  <span className="permissions-label">Permissions:</span>
                  <div className="permissions-list">
                    {Object.entries(user.permissions).map(([key, value]) => (
                      <div key={key} className="permission-item">
                        <span className="permission-name">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </span>
                        <label className="toggle-switch small">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              updateUserPermissions(user.id, {
                                [key]: e.target.checked,
                              })
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="user-actions">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateUserRole(user.id, e.target.value as User["role"])
                    }
                    className="role-select"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="developer">Developer</option>
                    <option value="devops">DevOps</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className={`btn-text ${user.status === "active" ? "danger" : ""}`}
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="btn-text"
                    onClick={() => setSelectedUser(user)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="audit-section">
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div key={log.id} className="audit-entry">
                <div className="audit-header">
                  <div className="audit-user">
                    <span className="user-name">{log.userName}</span>
                    <span className="action">
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="target">{log.target}</span>
                  </div>
                  <span className="audit-timestamp">
                    {log.timestamp.toLocaleString()}
                  </span>
                </div>
                <p className="audit-details">{log.details}</p>
              </div>
            ))}
          </div>

          {auditLogs.length === 0 && (
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
              <h3>No audit logs</h3>
              <p>No activity has been recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User: {selectedUser.name}</h3>
              <button
                className="btn-text"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <h4>User Information</h4>
                <div className="form-row">
                  <div className="form-field">
                    <label>Name</label>
                    <input type="text" value={selectedUser.name} readOnly />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input type="email" value={selectedUser.email} readOnly />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Role & Status</h4>
                <div className="form-row">
                  <div className="form-field">
                    <label>Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => {
                        const newRole = e.target.value as User["role"];
                        setSelectedUser((prev) =>
                          prev ? { ...prev, role: newRole } : null,
                        );
                        updateUserRole(selectedUser.id, newRole);
                      }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="developer">Developer</option>
                      <option value="devops">DevOps</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={selectedUser.status} disabled>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
