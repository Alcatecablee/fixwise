"use client";

import React from "react";

export const dynamic = "force-dynamic";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Something went wrong!
      </h1>
      <p style={{ marginBottom: "2rem", color: "rgba(255, 255, 255, 0.7)" }}>
        An error occurred while processing your request.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "0.75rem 1.5rem",
          background:
            "linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(30, 136, 229, 0.8) 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
