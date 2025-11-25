import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../../../../lib/auth-middleware";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'collaboration_sessions',
        'collaboration_participants', 
        'collaboration_comments',
        'collaboration_operations',
        'collaboration_cursors'
      ]);

    const existingTableNames = existingTables?.map((t: any) => t.table_name) || [];
    const requiredTables = [
      'collaboration_sessions',
      'collaboration_participants',
      'collaboration_comments'
    ];

    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

    if (missingTables.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Collaboration tables already exist',
        tables: existingTableNames
      });
    }

    // Create basic tables if they don't exist
    const createTableSQL = `
      -- Collaboration Sessions
      CREATE TABLE IF NOT EXISTS collaboration_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        document_content TEXT NOT NULL DEFAULT '',
        document_filename TEXT NOT NULL DEFAULT 'untitled.tsx',
        document_language TEXT NOT NULL DEFAULT 'typescript',
        host_user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_locked BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        max_participants INTEGER DEFAULT 10,
        session_settings JSONB DEFAULT '{}'::jsonb,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
      );

      -- Collaboration Participants
      CREATE TABLE IF NOT EXISTS collaboration_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        user_id UUID NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT,
        user_color TEXT NOT NULL DEFAULT '#2196F3',
        user_avatar TEXT,
        role TEXT NOT NULL DEFAULT 'participant',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        cursor_position JSONB DEFAULT '{}'::jsonb,
        permissions JSONB DEFAULT '{}'::jsonb,
        UNIQUE(session_id, user_id)
      );

      -- Collaboration Comments
      CREATE TABLE IF NOT EXISTS collaboration_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        user_id UUID NOT NULL,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT,
        line_number INTEGER,
        column_number INTEGER DEFAULT 0,
        is_resolved BOOLEAN DEFAULT FALSE,
        comment_type TEXT DEFAULT 'comment',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID
      );

      -- Basic indexes
      CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host ON collaboration_sessions(host_user_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session ON collaboration_participants(session_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_comments_session ON collaboration_comments(session_id);

      -- Enable RLS
      ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;

      -- Basic RLS policies
      DROP POLICY IF EXISTS "Users can view public sessions or their own" ON collaboration_sessions;
      CREATE POLICY "Users can view public sessions or their own" ON collaboration_sessions
        FOR SELECT USING (
          is_public = true OR 
          host_user_id = auth.uid() OR
          id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
          )
        );

      DROP POLICY IF EXISTS "Users can create sessions" ON collaboration_sessions;
      CREATE POLICY "Users can create sessions" ON collaboration_sessions
        FOR INSERT WITH CHECK (host_user_id = auth.uid());

      DROP POLICY IF EXISTS "Hosts can modify their sessions" ON collaboration_sessions;
      CREATE POLICY "Hosts can modify their sessions" ON collaboration_sessions
        FOR ALL USING (host_user_id = auth.uid());

      DROP POLICY IF EXISTS "Users can view session participants" ON collaboration_participants;
      CREATE POLICY "Users can view session participants" ON collaboration_participants
        FOR SELECT USING (
          session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE is_public = true OR host_user_id = auth.uid()
          ) OR
          session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
          )
        );

      DROP POLICY IF EXISTS "Users can manage their own participation" ON collaboration_participants;
      CREATE POLICY "Users can manage their own participation" ON collaboration_participants
        FOR ALL USING (user_id = auth.uid());

      DROP POLICY IF EXISTS "Session hosts can manage participants" ON collaboration_participants;
      CREATE POLICY "Session hosts can manage participants" ON collaboration_participants
        FOR ALL USING (
          session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE host_user_id = auth.uid()
          )
        );

      DROP POLICY IF EXISTS "Users can view session comments" ON collaboration_comments;
      CREATE POLICY "Users can view session comments" ON collaboration_comments
        FOR SELECT USING (
          session_id IN (
            SELECT id FROM collaboration_sessions 
            WHERE is_public = true OR host_user_id = auth.uid()
          ) OR
          session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
          )
        );

      DROP POLICY IF EXISTS "Users can create comments" ON collaboration_comments;
      CREATE POLICY "Users can create comments" ON collaboration_comments
        FOR INSERT WITH CHECK (
          user_id = auth.uid() AND
          session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid() AND is_active = TRUE
          )
        );

      DROP POLICY IF EXISTS "Users can modify their own comments" ON collaboration_comments;
      CREATE POLICY "Users can modify their own comments" ON collaboration_comments
        FOR UPDATE USING (user_id = auth.uid());
    `;

    // Execute the schema creation
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Error creating collaboration tables:', error);
      return NextResponse.json(
        { error: 'Failed to create collaboration tables', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Collaboration tables created successfully',
      created: missingTables
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check table existence
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'collaboration_sessions',
        'collaboration_participants',
        'collaboration_comments'
      ]);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check database tables' },
        { status: 500 }
      );
    }

    const existingTables = tables?.map((t: any) => t.table_name) || [];
    const requiredTables = [
      'collaboration_sessions',
      'collaboration_participants', 
      'collaboration_comments'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    return NextResponse.json({
      success: true,
      tablesExist: missingTables.length === 0,
      existingTables,
      missingTables,
      setupRequired: missingTables.length > 0
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}
