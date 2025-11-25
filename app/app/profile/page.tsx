"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./profile.css";

export default function ProfilePage() {
  const {
    user,
    session,
    loading: authLoading,
    updateProfile,
    signOut,
  } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch("/api/subscriptions", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [session?.access_token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(formData.firstName, formData.lastName);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "status-active",
      cancelled: "status-cancelled",
      expired: "status-expired",
      pending: "status-pending",
    };

    return (
      <span
        className={`status-badge ${colors[status as keyof typeof colors] || colors.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <h1 className="page-title">Profile Settings</h1>
            <Link href="/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
          </div>
          <p className="page-subtitle">
            Manage your account information and preferences
          </p>
        </div>

        <div className="profile-grid">
          {/* Profile Information */}
          <div className="main-content">
            <div className="profile-card">
              <h2 className="card-title">Personal Information</h2>

              {success && (
                <div className="alert success">
                  <p>{success}</p>
                </div>
              )}

              {error && (
                <div className="alert error">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="form-input disabled"
                  />
                  <p className="form-help">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn primary ${loading ? "loading" : ""}`}
                  >
                    {loading ? (
                      <div className="btn-loading">
                        <div className="loading-spinner"></div>
                        Saving...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Overview */}
          <div className="sidebar">
            {/* Account Status */}
            <div className="profile-card">
              <h3 className="card-subtitle">Account Status</h3>
              <div className="status-list">
                <div className="status-item">
                  <span className="status-label">Plan</span>
                  <span className="status-value">
                    {user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1)}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Email Status</span>
                  <span
                    className={`status-value ${user.emailConfirmed ? "verified" : "pending"}`}
                  >
                    {user.emailConfirmed ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Member Since</span>
                  <span className="status-value">
                    {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <Link href="/pricing" className="btn secondary full-width">
                  Upgrade Plan
                </Link>
                <button onClick={signOut} className="btn tertiary full-width">
                  Sign Out
                </button>
              </div>
            </div>

            {/* Subscription History */}
            <div className="profile-card">
              <h3 className="card-subtitle">Subscription History</h3>

              {loadingSubscriptions ? (
                <div className="loading-center">
                  <div className="spinner small"></div>
                </div>
              ) : subscriptions.length === 0 ? (
                <p className="empty-state">No subscription history</p>
              ) : (
                <div className="subscription-list">
                  {subscriptions.map((subscription: any) => (
                    <div key={subscription.id} className="subscription-item">
                      <div className="subscription-header">
                        <span className="subscription-name">
                          {subscription.plan?.charAt(0).toUpperCase() +
                            subscription.plan?.slice(1)}{" "}
                          Plan
                        </span>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="subscription-details">
                        <div>
                          Started: {formatDate(subscription.created_at)}
                        </div>
                        {subscription.current_period_end && (
                          <div>
                            Ends: {formatDate(subscription.current_period_end)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
