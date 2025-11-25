import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Create Supabase client only if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

interface ActivityEvent {
  id: string;
  type:
    | "session_created"
    | "session_joined"
    | "session_left"
    | "document_edited"
    | "comment_added"
    | "analysis_run"
    | "member_invited"
    | "member_joined";
  session_id?: string;
  team_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  timestamp: string;
  details: any;
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

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const sessionId = searchParams.get("sessionId");
    const teamId = searchParams.get("teamId");

    // For now, return empty activities array since we don't have an activities table yet
    // In a full implementation, you would query the activities table here
    const activities: ActivityEvent[] = [];

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Activity API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, sessionId, teamId, details } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 },
      );
    }

    // For now, just return success since we don't have an activities table yet
    // In a full implementation, you would insert into the activities table here
    const activity: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type,
      session_id: sessionId,
      team_id: teamId,
      user_id: user.id,
      user_name: user.email || "Anonymous",
      timestamp: new Date().toISOString(),
      details: details || {},
    };

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Activity creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
