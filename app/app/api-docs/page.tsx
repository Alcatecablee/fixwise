"use client";

import React, { useEffect } from "react";

export default function ApiDocsPage() {
  useEffect(() => {
    // Redirect to the actual API docs
    window.location.href = "/api/docs?format=html";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            borderTop: "4px solid #2196f3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <h1 style={{ margin: "0 0 10px 0", fontSize: "1.5rem" }}>
          Loading API Documentation
        </h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Redirecting to interactive API docs...
        </p>

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
    </div>
  );
}
