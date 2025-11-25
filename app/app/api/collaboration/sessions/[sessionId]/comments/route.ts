import { NextRequest, NextResponse } from "next/server";
import { teamCollaboration } from "../../../../../../lib/team-collaboration";
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
    console.log("[DEBUG] Comments GET request for session:", params.sessionId);
    
    const authHeader = request.headers.get("authorization");
    const hasBearer = !!authHeader?.startsWith("Bearer ");
    const token = hasBearer ? authHeader!.replace("Bearer ", "") : null;

    const guestUserId = request.headers.get("x-user-id");
    const guestUserName = request.headers.get("x-user-name");

    console.log("[DEBUG] Comments auth headers:", { hasBearer: !!hasBearer, guestUserId, guestUserName });

    if (!hasBearer && !(guestUserId && guestUserName)) {
      console.log("[DEBUG] No auth provided for comments");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // If bearer was provided, validate for strict auth; guests are allowed read access
    if (hasBearer && token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        console.log("[DEBUG] Bearer auth failed for comments:", authError);
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 }
        );
      }
      console.log("[DEBUG] Authenticated user for comments:", user.id);
    }

    const { sessionId } = params;
    console.log("[DEBUG] Fetching comments for session:", sessionId);
    
    const comments = await teamCollaboration.getComments(sessionId);
    console.log("[DEBUG] Comments fetched:", comments?.length || 0);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { content, filePath, lineNumber } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const comment = await teamCollaboration.addComment(
      sessionId,
      userId!,
      content.trim(),
      filePath,
      lineNumber
    );

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
} 