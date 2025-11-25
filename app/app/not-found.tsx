"use client";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
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
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
      <h2 style={{ marginBottom: "2rem" }}>Page Not Found</h2>
      <p style={{ marginBottom: "2rem", color: "rgba(255, 255, 255, 0.7)" }}>
        Could not find the requested page.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          background:
            "linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(30, 136, 229, 0.8) 100%)",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          border: "1px solid rgba(33, 150, 243, 0.4)",
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
