"use client";

export const dynamic = "force-dynamic";

export default function Custom500() {
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
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>500</h1>
      <h2 style={{ marginBottom: "2rem" }}>Server Error</h2>
      <p style={{ marginBottom: "2rem", color: "rgba(255, 255, 255, 0.7)" }}>
        An internal server error occurred.
      </p>
    </div>
  );
}
