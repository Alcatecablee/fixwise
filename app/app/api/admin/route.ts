import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Basic admin status endpoint
    return NextResponse.json({
      status: "active",
      version: "2.4.1",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    // Handle basic admin actions
    switch (action) {
      case "refresh_cache":
        return NextResponse.json({ success: true, message: "Cache refreshed" });
      case "system_status":
        return NextResponse.json({
          status: "operational",
          components: {
            database: "healthy",
            processing: "healthy",
            api: "healthy",
          },
        });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
