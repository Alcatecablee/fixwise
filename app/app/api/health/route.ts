import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "NeuroLint Next.js API",
    timestamp: new Date().toISOString(),
    engine: "next.js",
  });
}
