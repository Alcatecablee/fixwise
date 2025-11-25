import { NextRequest, NextResponse } from "next/server";

// This route provides information about the migration from WebSocket to Supabase Realtime
// WebSockets are not supported on Vercel, so we use Supabase Realtime instead
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const userName = searchParams.get("userName");

  if (!sessionId || !userName) {
    return NextResponse.json(
      { error: "Missing sessionId or userName" },
      { status: 400 }
    );
  }

  // Return migration info
  return NextResponse.json({
    message: "NeuroLint Collaboration has migrated to Supabase Realtime",
    migration: {
      reason: "WebSockets are not supported on Vercel serverless platform",
      solution: "Using Supabase Realtime for real-time collaboration",
      benefits: [
        "Works with Vercel deployment",
        "Better scalability and reliability",
        "Built-in authentication and RLS",
        "Persistent message history"
      ]
    },
    newApproach: {
      technology: "Supabase Realtime",
      endpoint: "/api/collaboration/sessions",
      client: "useCollaborationRealtime hook",
      tables: [
        "collaboration_sessions",
        "collaboration_participants",
        "collaboration_messages",
        "collaboration_comments"
      ]
    },
    sessionInfo: {
      sessionId,
      userName,
      note: "Use the new useCollaborationRealtime hook for real-time features"
    }
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "WebSocket endpoints are deprecated",
      message: "Use Supabase Realtime for collaboration features",
      migration: {
        from: "WebSocket server (not Vercel compatible)",
        to: "Supabase Realtime (Vercel compatible)",
        hook: "useCollaborationRealtime",
        api: "/api/collaboration/sessions"
      }
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
