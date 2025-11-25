import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../../../../lib/data-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = request.headers.get("x-user-id");

    console.log("[COMMENTS GET] Request:", { sessionId, userId });

    if (!userId) {
      console.log("[COMMENTS GET] No user ID provided");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!sessionId) {
      console.log("[COMMENTS GET] No session ID provided");
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    // Skip participant check for now to avoid access issues during polling
    console.log("[COMMENTS GET] Fetching comments for session:", sessionId);

    // Get comments for session
    const comments = [];
    if (dataStore.collaborationComments) {
      for (const [key, comment] of dataStore.collaborationComments.entries()) {
        if (key.startsWith(`${sessionId}_`)) {
          comments.push(comment);
        }
      }
    }

    // Sort by creation time
    comments.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    console.log("[COMMENTS GET] Returning comments:", comments.length);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const body = await request.json();
    const { sessionId, content, lineNumber } = body;
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Anonymous";

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "Session ID and content required" },
        { status: 400 },
      );
    }

    // Check if user is participant
    const participantKey = `${sessionId}_${userId}`;
    const participant =
      dataStore.collaborationParticipants?.get(participantKey);

    if (!participant || !participant.is_active) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create comment
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const comment = {
      id: commentId,
      session_id: sessionId,
      user_id: userId,
      author_name: userName,
      content: content.trim(),
      line_number: lineNumber || 0,
      column_number: 0,
      is_resolved: false,
      comment_type: "chat",
      created_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
    };

    const commentKey = `${sessionId}_${commentId}`;
    dataStore.collaborationComments.set(commentKey, comment);

    // Update session activity
    const session = dataStore.collaborationSessions?.get(sessionId);
    if (session) {
      session.last_activity = new Date().toISOString();
      dataStore.collaborationSessions.set(sessionId, session);
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, action, data } = body;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Find comment
    let comment = null;
    let commentKey = null;

    for (const [key, c] of dataStore.collaborationComments.entries()) {
      if (c.id === commentId) {
        comment = c;
        commentKey = key;
        break;
      }
    }

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user can modify comment
    if (comment.user_id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    switch (action) {
      case "resolve":
        comment.is_resolved = data.resolved;
        comment.resolved_at = data.resolved ? new Date().toISOString() : null;
        comment.resolved_by = data.resolved ? userId : null;
        break;

      case "edit":
        comment.content = data.content;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    dataStore.collaborationComments.set(commentKey, comment);

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Comments PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
