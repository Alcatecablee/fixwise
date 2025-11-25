"use client";

import React, { useState, useEffect } from "react";

interface Rule {
  id: string;
  name: string;
  layer: number;
  type: "regex" | "ast";
  enabled: boolean;
  pattern: string;
  description: string;
  version: string;
  lastModified: Date;
  usage: number;
}

interface Layer {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  ruleCount: number;
}

export default function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRule, setShowAddRule] = useState(false);

  useEffect(() => {
    loadRulesAndLayers();
  }, []);

  const loadRulesAndLayers = async () => {
    try {
      setLoading(true);

      // Load layers and rules from API
      const [layersResponse, rulesResponse] = await Promise.all([
        fetch("/api/admin/layers"),
        fetch("/api/admin/rules"),
      ]);

      if (layersResponse.ok) {
        const layersData = await layersResponse.json();
        setLayers(layersData.layers || []);
      } else {
        setLayers([]);
      }

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData.rules || []);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error("Failed to load rules:", error);
      setLayers([]);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/rules/${ruleId}/toggle`, {
        method: "POST",
      });
      if (response.ok) {
        setRules((prev) =>
          prev.map((rule) =>
            rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const toggleLayer = async (layerId: number) => {
    try {
      const response = await fetch(`/api/admin/layers/${layerId}/toggle`, {
        method: "POST",
      });
      if (response.ok) {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === layerId
              ? { ...layer, enabled: !layer.enabled }
              : layer,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to toggle layer:", error);
    }
  };

  const filteredRules = rules.filter((rule) => {
    const matchesLayer =
      selectedLayer === "all" || rule.layer === selectedLayer;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLayer && matchesSearch;
  });

  const getRuleTypeIcon = (type: string) => {
    return type === "regex" ? (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="rule-type-icon"
      >
        <path d="M12 2l3.09 6.26L22 9l-5.27 3.74L18 19l-6-3.91L6 19l1.27-6.26L2 9l6.91-.74L12 2z" />
      </svg>
    ) : (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="rule-type-icon"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-title">
          <h1>Rule Management</h1>
          <p>Manage transformation rules across all layers</p>
        </div>
        <div className="section-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowAddRule(true)}
          >
            Add Rule
          </button>
          <button className="btn-primary" onClick={loadRulesAndLayers}>
            Refresh
          </button>
        </div>
      </div>

      <div className="layers-overview">
        <h2>Layers Overview</h2>
        <div className="layers-grid">
          {layers.map((layer) => (
            <div key={layer.id} className="layer-card">
              <div className="layer-header">
                <div className="layer-info">
                  <h3>
                    Layer {layer.id}: {layer.name}
                  </h3>
                  <p>{layer.description}</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={() => toggleLayer(layer.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="layer-stats">
                <span className="rule-count">{layer.ruleCount} rules</span>
                <span
                  className={`layer-status ${layer.enabled ? "enabled" : "disabled"}`}
                >
                  {layer.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rules-section">
        <div className="rules-header">
          <h2>Rules</h2>
          <div className="rules-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={selectedLayer}
              onChange={(e) =>
                setSelectedLayer(
                  e.target.value === "all" ? "all" : parseInt(e.target.value),
                )
              }
              className="filter-select"
            >
              <option value="all">All Layers</option>
              {layers.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  Layer {layer.id}: {layer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rules-list">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="rule-card">
              <div className="rule-header">
                <div className="rule-info">
                  <div className="rule-title">
                    {getRuleTypeIcon(rule.type)}
                    <h3>{rule.name}</h3>
                    <span className="layer-badge">L{rule.layer}</span>
                  </div>
                  <p className="rule-description">{rule.description}</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="rule-details">
                <div className="rule-pattern">
                  <span className="pattern-label">Pattern:</span>
                  <code className="pattern-code">{rule.pattern}</code>
                </div>

                <div className="rule-meta">
                  <div className="meta-item">
                    <span className="meta-label">Version:</span>
                    <span className="meta-value">{rule.version}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Usage:</span>
                    <span className="meta-value">{rule.usage} times</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Modified:</span>
                    <span className="meta-value">
                      {rule.lastModified.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rule-actions">
                <button className="btn-text">Edit</button>
                <button className="btn-text">History</button>
                <button className="btn-text">Test</button>
                <button className="btn-text danger">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {filteredRules.length === 0 && (
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
            <h3>No rules found</h3>
            <p>No rules match the current search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
