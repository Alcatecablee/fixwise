"use client";

import React, { useState } from "react";
import { useToast } from "../../components/ui/Toast";
import Link from "next/link";

export default function MigrationQuotePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // User Info
    fullName: "",
    email: "",
    company: "",
    
    // Project Info
    projectName: "",
    projectDescription: "",
    currentFramework: "",
    targetFramework: "",
    
    // Scope
    estimatedLines: "",
    complexity: "",
    timelinePreference: "",
    specialRequirements: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/migration/request-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo: {
            fullName: formData.fullName,
            email: formData.email,
            company: formData.company,
          },
          projectInfo: {
            name: formData.projectName,
            description: formData.projectDescription,
          },
          currentFramework: formData.currentFramework,
          targetFramework: formData.targetFramework,
          estimatedCodebase: formData.estimatedLines,
          migrationScope: {
            size: getSizeFromLines(formData.estimatedLines),
            complexity: formData.complexity,
          },
          timelinePreference: formData.timelinePreference,
          specialRequirements: formData.specialRequirements,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
      } else {
        showToast({
          type: 'error',
          title: 'Submission Failed',
          message: result.error || 'Failed to submit quote request',
        });
      }
    } catch (error) {
      console.error('Quote request error:', error);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit quote request. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSizeFromLines = (lines: string): string => {
    const numLines = parseInt(lines.replace(/,/g, ''));
    if (numLines < 10000) return 'small';
    if (numLines < 50000) return 'medium';
    if (numLines < 200000) return 'large';
    return 'enterprise';
  };

  if (submitted) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div className="onboarding-logo">
                <Link href="/" className="modal-logo-bee">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                    alt="NeuroLint"
                  />
                </Link>
              </div>

              <h2 className="onboarding-title">Quote Request Submitted!</h2>
              <p className="onboarding-subtitle">
                Thank you for your interest in our one-time migration service. 
                Our team will review your requirements and contact you within 24 hours 
                with a detailed quote and migration plan.
              </p>

              <div style={{ 
                background: "rgba(33, 150, 243, 0.1)",
                border: "1px solid rgba(33, 150, 243, 0.3)",
                borderRadius: "12px",
                padding: "1.5rem",
                margin: "2rem 0",
                textAlign: "left"
              }}>
                <h4 style={{ color: "rgba(33, 150, 243, 0.9)", margin: "0 0 1rem 0" }}>
                  What happens next:
                </h4>
                <ul style={{ color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.6" }}>
                  <li>Our migration specialists will analyze your project requirements</li>
                  <li>We'll prepare a detailed migration plan and timeline</li>
                  <li>You'll receive a comprehensive quote within 24 hours</li>
                  <li>Schedule a consultation call to discuss the approach</li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <Link href="/pricing" className="onboarding-btn secondary">
                  ← Back to Pricing
                </Link>
                <Link href="/dashboard" className="onboarding-btn primary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-section">
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <div className="onboarding-content">
          {/* Header Navigation */}
          <div className="hero-nav" style={{ position: "relative", marginBottom: "2rem" }}>
            <div className="nav-left">
              <Link href="/" className="brand-logo">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                  alt="NeuroLint"
                />
              </Link>
            </div>
            <div className="nav-center">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/api-docs" className="nav-link">API Docs</Link>
            </div>
            <div className="nav-right">
              <Link href="/dashboard" className="nav-link dashboard-btn">Dashboard</Link>
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.4) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            padding: "3rem 2rem",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(25px) saturate(1.2)",
            WebkitBackdropFilter: "blur(25px) saturate(1.2)",
          }}>
            <h2 className="onboarding-title" style={{ fontSize: "2rem", marginBottom: "1rem" }}>
              One-Time Migration Service
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: "2rem", fontSize: "1.1rem" }}>
              Get a custom quote for migrating your React/Next.js codebase. Our expert team handles 
              everything from React 16→18 upgrades to Next.js App Router migrations.
            </p>

            <form onSubmit={handleSubmit}>
              {/* User Information */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>Contact Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="onboarding-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="onboarding-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="onboarding-label">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="onboarding-input"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              {/* Project Information */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>Project Details</h3>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">Project Name *</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    required
                    className="onboarding-input"
                    placeholder="Your project name"
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">Project Description *</label>
                  <textarea
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    required
                    className="onboarding-input"
                    rows={3}
                    placeholder="Brief description of your project and its current state"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="onboarding-label">Current Framework *</label>
                    <select
                      name="currentFramework"
                      value={formData.currentFramework}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                    >
                      <option value="">Select current framework</option>
                      <option value="react-16">React 16</option>
                      <option value="react-17">React 17</option>
                      <option value="react-18-class">React 18 (Class Components)</option>
                      <option value="nextjs-12">Next.js 12</option>
                      <option value="nextjs-13-pages">Next.js 13 (Pages Router)</option>
                      <option value="other">Other (specify in requirements)</option>
                    </select>
                  </div>
                  <div>
                    <label className="onboarding-label">Target Framework *</label>
                    <select
                      name="targetFramework"
                      value={formData.targetFramework}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                    >
                      <option value="">Select target framework</option>
                      <option value="react-18">React 18 (Hooks)</option>
                      <option value="nextjs-14-app">Next.js 14 (App Router)</option>
                      <option value="nextjs-14-pages">Next.js 14 (Pages Router)</option>
                      <option value="other">Other (specify in requirements)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Migration Scope */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>Migration Scope</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="onboarding-label">Estimated Lines of Code *</label>
                    <select
                      name="estimatedLines"
                      value={formData.estimatedLines}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                    >
                      <option value="">Select codebase size</option>
                      <option value="1000-10000">1k-10k lines (Small)</option>
                      <option value="10000-50000">10k-50k lines (Medium)</option>
                      <option value="50000-200000">50k-200k lines (Large)</option>
                      <option value="200000+">200k+ lines (Enterprise)</option>
                    </select>
                  </div>
                  <div>
                    <label className="onboarding-label">Migration Complexity *</label>
                    <select
                      name="complexity"
                      value={formData.complexity}
                      onChange={handleInputChange}
                      required
                      className="onboarding-input"
                    >
                      <option value="">Select complexity</option>
                      <option value="basic">Basic (Component migration only)</option>
                      <option value="intermediate">Intermediate (+ State management & routing)</option>
                      <option value="advanced">Advanced (+ Custom hooks, SSR, testing)</option>
                      <option value="enterprise">Enterprise (+ Legacy patterns, performance)</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="onboarding-label">Preferred Timeline *</label>
                  <select
                    name="timelinePreference"
                    value={formData.timelinePreference}
                    onChange={handleInputChange}
                    required
                    className="onboarding-input"
                  >
                    <option value="">Select timeline</option>
                    <option value="urgent">ASAP (Rush job - additional cost)</option>
                    <option value="standard">Standard (2-8 weeks)</option>
                    <option value="flexible">Flexible (cost-optimized)</option>
                  </select>
                </div>
                <div>
                  <label className="onboarding-label">Special Requirements</label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    className="onboarding-input"
                    rows={3}
                    placeholder="Any specific requirements, constraints, or goals for this migration?"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`onboarding-btn primary ${loading ? "disabled" : ""}`}
                style={{
                  width: "100%",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "1.1rem",
                  padding: "1rem 2rem",
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Submitting Request...
                  </>
                ) : (
                  "Request Migration Quote"
                )}
              </button>

              <div style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
              }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  🔒 Your information is secure and will only be used for quote preparation
                </div>
                <div>
                  Typical response time: 24 hours • Price range: $999-$9,999 • No obligation
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
