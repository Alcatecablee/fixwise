import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client only if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sessionId, operation, type } = body;
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Anonymous";

    // More flexible validation - allow empty operations for heartbeat/sync
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Check if session exists and is active (shared across all operation types)
    const { data: session, error: sessionError } = await supabase
      .from("collaboration_sessions")
      .select("id, is_active, host_user_id, document_content")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 403 },
      );
    }

    // Handle join/leave messages sent by client
    if (type === "join") {
      const effectiveUserId = userId || `guest_${Date.now()}`;

      // Upsert participant as active
      const { error: upsertError } = await supabase
        .from("collaboration_participants")
        .upsert(
          {
            session_id: sessionId,
            user_id: effectiveUserId,
            user_name: userName,
            user_color: "#3B82F6",
            is_active: true,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "session_id,user_id" }
        );

      if (upsertError) {
        return NextResponse.json(
          { error: `Failed to join session: ${upsertError.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    if (type === "leave") {
      const effectiveUserId = userId || `guest_${Date.now()}`;

      const { error: updateError } = await supabase
        .from("collaboration_participants")
        .update({ is_active: false, last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", effectiveUserId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to leave session: ${updateError.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    // If no operation provided, just return success (heartbeat)
    if (!operation) {
      return NextResponse.json({
        success: true,
        message: "Heartbeat received",
      });
    }

    // Validate operation
    const validationError = validateOperation(operation);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // For simplified implementation, apply operation directly to document
    const newContent = applyOperationToContent(
      session.document_content,
      operation,
    );

    // Update session document
    await supabase
      .from("collaboration_sessions")
      .update({
        document_content: newContent,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      content: newContent,
    });
  } catch (error) {
    console.error("Operations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = request.headers.get("x-user-id");

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from("collaboration_sessions")
      .select("document_content, is_active")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    // Return current document content (simplified without operations history)
    return NextResponse.json({
      operations: [],
      document_content: session.document_content,
    });
  } catch (error) {
    console.error("Get operations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function validateOperation(operation: any): string | null {
  if (
    !operation.type ||
    !["insert", "delete", "replace"].includes(operation.type)
  ) {
    return "Invalid operation type";
  }

  if (typeof operation.position !== "number" || operation.position < 0) {
    return "Invalid position";
  }

  if (operation.type === "insert" || operation.type === "replace") {
    if (typeof operation.content !== "string") {
      return "Content required for insert/replace operations";
    }
    if (operation.content.length > 10000) {
      return "Content too large";
    }
  }

  if (operation.type === "delete" || operation.type === "replace") {
    if (typeof operation.length !== "number" || operation.length <= 0) {
      return "Length required for delete operations";
    }
  }

  return null;
}

// Simplified version without operational transform for now

function applyOperationToContent(content: string, operation: any): string {
  try {
    switch (operation.type) {
      case "insert":
        return (
          content.slice(0, operation.position) +
          operation.content +
          content.slice(operation.position)
        );

      case "delete":
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + operation.length)
        );

      case "replace":
        return (
          content.slice(0, operation.position) +
          operation.content +
          content.slice(
            operation.position + (operation.old_length || operation.length),
          )
        );

      default:
        return content;
    }
  } catch (error) {
    console.error("Failed to apply operation to content:", error);
    return content;
  }
}
