'use client';
import React from 'react';
import { useEffect, useState } from "react";
import {  useRouter  } from 'next/navigation';
import {  useAuth  } from '../lib/auth-context';
import LoginPage from "./login/page";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "2px solid rgba(0, 0, 0, 0.8)",
                  borderTop: "2px solid #ffffff",
                  borderRadius: "50%",
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <p className="onboarding-subtitle">Loading...</p>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // If user is not authenticated, show login page directly
  if (!user) {
    return <LoginPage />;
  }

  // Show loading while redirecting authenticated users
  return (
    <div className="onboarding-section">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <div className="onboarding-card">
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "2px solid rgba(0, 0, 0, 0.8)",
                borderTop: "2px solid #ffffff",
                borderRadius: "50%",
                margin: "0 auto 1.5rem",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p className="onboarding-subtitle">Taking you to dashboard...</p>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}