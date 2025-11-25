import { NextRequest, NextResponse } from "next/server";
import { teamCollaboration } from "../../../../../../../../lib/team-collaboration";
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

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; commentId: string } }
) {
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

    const { commentId } = params;
    await teamCollaboration.resolveComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resolve comment error:", error);
    return NextResponse.json(
      { error: "Failed to resolve comment" },
      { status: 500 }
    );
  }
} 