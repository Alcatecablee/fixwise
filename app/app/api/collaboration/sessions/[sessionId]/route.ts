import { NextRequest, NextResponse } from "next/server";
import { teamCollaboration } from "../../../../../lib/team-collaboration";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    console.log("[DEBUG] Session GET request for:", params.sessionId);
    
    const authHeader = request.headers.get("authorization");
    const hasBearer = !!authHeader?.startsWith("Bearer ");
    const token = hasBearer ? authHeader!.replace("Bearer ", "") : null;

    // Support guest collaboration fallback via headers
    const guestUserId = request.headers.get("x-user-id");
    const guestUserName = request.headers.get("x-user-name");

    console.log("[DEBUG] Auth headers:", { hasBearer: !!hasBearer, guestUserId, guestUserName });

    let userId: string | null = null;

    if (hasBearer && token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        console.log("[DEBUG] Bearer auth failed:", authError);
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 }
        );
      }
      userId = user.id;
      console.log("[DEBUG] Authenticated user:", userId);
    } else if (guestUserId && guestUserName) {
      // Treat as guest participant
      userId = guestUserId;
      console.log("[DEBUG] Guest user:", userId);
    } else {
      console.log("[DEBUG] No auth provided");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    // For bearer users, enforce access via teamCollaboration which validates membership.
    // For guests, do a permissive check that session exists and is active.
    let session: any = null;
    if (hasBearer && userId) {
      console.log("[DEBUG] Using teamCollaboration for authenticated user");
      session = await teamCollaboration.getCollaborationSession(sessionId, userId);
    } else {
      console.log("[DEBUG] Using direct Supabase query for guest");
      // Try both id and session_id columns
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .or(`id.eq.${sessionId},session_id.eq.${sessionId}`)
        .eq('is_active', true)
        .single();
      
      console.log("[DEBUG] Supabase query result:", { data, error });
      
      if (error) {
        console.log("[DEBUG] Session not found in DB:", error);
        return NextResponse.json(
          { error: "Session not found or access denied" },
          { status: 404 }
        );
      }
      // Map DB fields to expected response shape
      session = {
        ...data,
        document_filename: data.filename,
        document_language: data.language,
        document_content: data.document_content,
      };
    }
    
    if (!session) {
      console.log("[DEBUG] No session returned");
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    console.log("[DEBUG] Session found, fetching participants and comments");

    // Get participants and comments
    const [participants, comments] = await Promise.all([
      teamCollaboration.getSessionPresence(sessionId),
      teamCollaboration.getComments(sessionId)
    ]);

    console.log("[DEBUG] Returning session data");

    return NextResponse.json({
      session,
      participants,
      comments
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const hasBearer = !!authHeader?.startsWith("Bearer ");
    const token = hasBearer ? authHeader!.replace("Bearer ", "") : null;

    const guestUserId = request.headers.get("x-user-id");
    const guestUserName = request.headers.get("x-user-name");

    let userId: string | null = null;

    if (hasBearer && token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 }
        );
      }
      userId = user.id;
    } else if (guestUserId && guestUserName) {
      userId = guestUserId;
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const { action } = await request.json();

    // Only allow control actions for authenticated owners; guests are not permitted
    if (!hasBearer) {
      return NextResponse.json(
        { error: "Only authenticated users can modify session state" },
        { status: 403 }
      );
    }

    switch (action) {
      case 'pause':
        await teamCollaboration.pauseSession(sessionId, userId!);
        break;
      case 'resume':
        await teamCollaboration.resumeSession(sessionId, userId!);
        break;
      case 'end':
        await teamCollaboration.endSession(sessionId, userId!);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
