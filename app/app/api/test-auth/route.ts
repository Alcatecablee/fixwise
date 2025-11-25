import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header provided" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Set the session using the provided token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Invalid token or user not found",
          details: userError?.message,
        },
        { status: 401 },
      );
    }

    // Test project creation
    const testProject = {
      user_id: user.id,
      name: `Test Project ${Date.now()}`,
      description: "Test project for debugging RLS",
      files: [],
    };

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(testProject)
      .select()
      .single();

    if (projectError) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
        projectTest: {
          success: false,
          error: projectError.message,
          code: projectError.code,
          details: projectError.details,
        },
      });
    }

    // Clean up test project
    await supabase.from("projects").delete().eq("id", project.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      projectTest: {
        success: true,
        message: "Project created and deleted successfully",
      },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
