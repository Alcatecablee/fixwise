import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../../../lib/auth-middleware";

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('Supabase configuration missing. Projects API will not function properly.');
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({
        projects: [],
        total: 0
      });
    }

    if (projectId) {
      // Get specific project
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (error || !project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(project);
    }

    // Get all projects for user
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({
        projects: [],
        total: 0
      });
    }

    return NextResponse.json({
      projects: projects || [],
      total: projects?.length || 0
    });

  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({
      projects: [],
      total: 0
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, description, gitUrl, framework, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: "Project name and user ID are required" },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const projectData = {
      name,
      description: description || "",
      git_url: gitUrl || null,
      framework: framework || "react",
      user_id: userId,
      settings: {
        defaultLayers: [],
        autoAnalyze: false,
        notifications: true,
      },
      stats: {
        totalFiles: 0,
        totalIssues: 0,
        lastAnalyzed: null,
        qualityScore: 0,
      },
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        project,
        message: "Project created successfully"
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, updates, userId } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID and user ID are required" },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: "Project not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error("Projects PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable - configuration missing' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID and user ID are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Projects DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
