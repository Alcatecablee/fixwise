import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "NeuroLint API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      demo: "/api/demo",
      auth: "/api/auth/*",
      dashboard: "/api/dashboard",
      analyze: "/api/analyze",
      docs: "/api/docs"
    }
  });
}
