"use client";

import React, { useState, useEffect } from "react";

interface SystemConfig {
  defaultBehavior: {
    alwaysDryRun: boolean;
    autoBackup: boolean;
    notificationsEnabled: boolean;
    maxFileSize: number;
    timeoutSeconds: number;
  };
  layerSequence: number[];
  notifications: {
    slack: {
      enabled: boolean;
      webhook: string;
      channels: string[];
    };
    email: {
      enabled: boolean;
      recipients: string[];
      frequency: "immediate" | "hourly" | "daily";
    };
  };
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    lastUsed: Date | null;
    created: Date;
  }>;
}

export default function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "general" | "layers" | "notifications" | "api"
  >("general");
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        console.error("Failed to save configuration:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, updates: any) => {
    if (!config) return;

    setConfig((prev) =>
      prev
        ? {
            ...prev,
            [section]: {
              ...prev[section],
              ...updates,
            },
          }
        : null,
    );
  };

  const addApiKey = async () => {
    if (!newApiKeyName.trim() || !config) return;

    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setConfig((prev) =>
          prev
            ? {
                ...prev,
                apiKeys: [...prev.apiKeys, newKey],
              }
            : null,
        );

        setNewApiKeyName("");
        setShowAddApiKey(false);
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConfig((prev) =>
          prev
            ? {
                ...prev,
                apiKeys: prev.apiKeys.filter((key) => key.id !== keyId),
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (!config) return;

    const newSequence = [...config.layerSequence];
    const [removed] = newSequence.splice(fromIndex, 1);
    newSequence.splice(toIndex, 0, removed);

    updateConfig("layerSequence", newSequence);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading system configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="section-container">
        <div className="error-container">
          <h2>Failed to load configuration</h2>
          <button className="btn-primary" onClick={loadConfiguration}>
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
          <h1>System Configuration</h1>
          <p>Configure NeuroLint system settings and behavior</p>
        </div>
        <div className="section-actions">
          <button
            className={`btn-primary ${saving ? "loading" : ""}`}
            onClick={saveConfiguration}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        {[
          { id: "general", label: "General Settings" },
          { id: "layers", label: "Layer Sequence" },
          { id: "notifications", label: "Notifications" },
          { id: "api", label: "API Keys" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeSection === tab.id ? "active" : ""}`}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "general" && (
        <div className="config-section">
          <h2>Default Behavior</h2>
          <div className="config-group">
            <div className="config-item">
              <div className="config-info">
                <h3>Always Run Dry Run First</h3>
                <p>Automatically perform dry run before applying fixes</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.defaultBehavior.alwaysDryRun}
                  onChange={(e) =>
                    updateConfig("defaultBehavior", {
                      alwaysDryRun: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item">
              <div className="config-info">
                <h3>Automatic Backup</h3>
                <p>Create backup before applying transformations</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.defaultBehavior.autoBackup}
                  onChange={(e) =>
                    updateConfig("defaultBehavior", {
                      autoBackup: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item">
              <div className="config-info">
                <h3>Notifications Enabled</h3>
                <p>Enable system notifications for events</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.defaultBehavior.notificationsEnabled}
                  onChange={(e) =>
                    updateConfig("defaultBehavior", {
                      notificationsEnabled: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <h2>Processing Limits</h2>
          <div className="config-group">
            <div className="config-item">
              <div className="config-info">
                <h3>Maximum File Size</h3>
                <p>
                  Maximum size of files to process (
                  {formatFileSize(config.defaultBehavior.maxFileSize)})
                </p>
              </div>
              <input
                type="range"
                min="102400"
                max="10485760"
                step="102400"
                value={config.defaultBehavior.maxFileSize}
                onChange={(e) =>
                  updateConfig("defaultBehavior", {
                    maxFileSize: parseInt(e.target.value),
                  })
                }
                className="config-slider"
              />
            </div>

            <div className="config-item">
              <div className="config-info">
                <h3>Timeout (seconds)</h3>
                <p>Maximum time to wait for operations to complete</p>
              </div>
              <input
                type="number"
                min="10"
                max="300"
                value={config.defaultBehavior.timeoutSeconds}
                onChange={(e) =>
                  updateConfig("defaultBehavior", {
                    timeoutSeconds: parseInt(e.target.value),
                  })
                }
                className="config-input"
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === "layers" && (
        <div className="config-section">
          <h2>Layer Execution Sequence</h2>
          <p>Drag to reorder the sequence in which layers are executed</p>

          <div className="layers-sequence">
            {config.layerSequence.map((layerId, index) => (
              <div key={layerId} className="layer-item">
                <div className="layer-handle">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </div>
                <div className="layer-info">
                  <span className="layer-number">{index + 1}</span>
                  <span className="layer-name">Layer {layerId}</span>
                </div>
                <div className="layer-actions">
                  <button
                    className="btn-text"
                    onClick={() => moveLayer(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    className="btn-text"
                    onClick={() =>
                      moveLayer(
                        index,
                        Math.min(config.layerSequence.length - 1, index + 1),
                      )
                    }
                    disabled={index === config.layerSequence.length - 1}
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "notifications" && (
        <div className="config-section">
          <h2>Slack Integration</h2>
          <div className="config-group">
            <div className="config-item">
              <div className="config-info">
                <h3>Enable Slack Notifications</h3>
                <p>Send notifications to Slack channels</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.notifications.slack.enabled}
                  onChange={(e) =>
                    updateConfig("notifications", {
                      slack: {
                        ...config.notifications.slack,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {config.notifications.slack.enabled && (
              <>
                <div className="config-item">
                  <div className="config-info">
                    <h3>Webhook URL</h3>
                    <p>Slack webhook URL for sending notifications</p>
                  </div>
                  <input
                    type="url"
                    value={config.notifications.slack.webhook}
                    onChange={(e) =>
                      updateConfig("notifications", {
                        slack: {
                          ...config.notifications.slack,
                          webhook: e.target.value,
                        },
                      })
                    }
                    className="config-input"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>

                <div className="config-item">
                  <div className="config-info">
                    <h3>Channels</h3>
                    <p>Channels to send notifications to</p>
                  </div>
                  <div className="channels-list">
                    {config.notifications.slack.channels.map(
                      (channel, index) => (
                        <div key={index} className="channel-item">
                          <span>{channel}</span>
                          <button
                            className="btn-text danger"
                            onClick={() => {
                              const newChannels =
                                config.notifications.slack.channels.filter(
                                  (_, i) => i !== index,
                                );
                              updateConfig("notifications", {
                                slack: {
                                  ...config.notifications.slack,
                                  channels: newChannels,
                                },
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <h2>Email Notifications</h2>
          <div className="config-group">
            <div className="config-item">
              <div className="config-info">
                <h3>Enable Email Notifications</h3>
                <p>Send email notifications for system events</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.notifications.email.enabled}
                  onChange={(e) =>
                    updateConfig("notifications", {
                      email: {
                        ...config.notifications.email,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {config.notifications.email.enabled && (
              <div className="config-item">
                <div className="config-info">
                  <h3>Frequency</h3>
                  <p>How often to send email notifications</p>
                </div>
                <select
                  value={config.notifications.email.frequency}
                  onChange={(e) =>
                    updateConfig("notifications", {
                      email: {
                        ...config.notifications.email,
                        frequency: e.target
                          .value as typeof config.notifications.email.frequency,
                      },
                    })
                  }
                  className="config-select"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "api" && (
        <div className="config-section">
          <div className="section-header">
            <h2>API Key Management</h2>
            <button
              className="btn-secondary"
              onClick={() => setShowAddApiKey(true)}
            >
              Generate New Key
            </button>
          </div>

          <div className="api-keys-list">
            {config.apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="api-key-card">
                <div className="api-key-header">
                  <div className="api-key-info">
                    <h3>{apiKey.name}</h3>
                    <code className="api-key-value">{apiKey.key}</code>
                  </div>
                  <button
                    className="btn-text danger"
                    onClick={() => revokeApiKey(apiKey.id)}
                  >
                    Revoke
                  </button>
                </div>

                <div className="api-key-details">
                  <div className="api-key-meta">
                    <span>Created: {apiKey.created.toLocaleDateString()}</span>
                    <span>
                      Last used:{" "}
                      {apiKey.lastUsed
                        ? apiKey.lastUsed.toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="api-key-permissions">
                    <span>Permissions:</span>
                    <div className="permissions-badges">
                      {Array.isArray(apiKey.permissions) ? apiKey.permissions.map((permission) => (
                        <span key={permission} className="permission-badge">
                          {permission}
                        </span>
                      )) : (
                        <span className="permission-badge">
                          {typeof apiKey.permissions === 'string' ? apiKey.permissions : 'analyze, projects'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddApiKey && (
            <div
              className="modal-overlay"
              onClick={() => setShowAddApiKey(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Generate New API Key</h3>
                  <button
                    className="btn-text"
                    onClick={() => setShowAddApiKey(false)}
                  >
                    Cancel
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Key Name</label>
                    <input
                      type="text"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="e.g., Production CLI, CI/CD Pipeline"
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      className="btn-primary"
                      onClick={addApiKey}
                      disabled={!newApiKeyName.trim()}
                    >
                      Generate Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
