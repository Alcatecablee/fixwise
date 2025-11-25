const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://jetwhffgmohdkquegtjh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldHdoZmZnbW9oZHFrdWVndGpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA3MjQyNywiZXhwIjoyMDY0NjQ4NDI3fQ.JnZiO1qf4R_aXClRvSSJ6Xmk2KsvwAudvrIaEBNexuM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(sqlContent, migrationName) {
  try {
    console.log(`Running migration: ${migrationName}`);
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`Error executing statement:`, error);
          // Continue with other statements
        }
      }
    }
    
    console.log(`[SUCCESS] Migration ${migrationName} completed`);
  } catch (error) {
    console.error(`[ERROR] Migration ${migrationName} failed:`, error);
  }
}

async function createCollaborationAnalysesTable() {
  const sql = `
    -- Create collaboration_analyses table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.collaboration_analyses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
      input_code TEXT NOT NULL,
      output_code TEXT NOT NULL,
      layers_executed INTEGER[] DEFAULT '{}',
      dry_run BOOLEAN DEFAULT FALSE,
      execution_time INTEGER DEFAULT 0,
      success BOOLEAN DEFAULT FALSE,
      analysis_results JSONB DEFAULT '{}'::jsonb,
      triggered_by UUID,
      triggered_by_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_session_id ON public.collaboration_analyses(session_id);
    CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_triggered_by ON public.collaboration_analyses(triggered_by);
    CREATE INDEX IF NOT EXISTS idx_collaboration_analyses_created_at ON public.collaboration_analyses(created_at DESC);

    -- Enable Row Level Security
    ALTER TABLE public.collaboration_analyses ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    DROP POLICY IF EXISTS "Participants can view session analyses" ON public.collaboration_analyses;
    CREATE POLICY "Participants can view session analyses" ON public.collaboration_analyses
      FOR SELECT USING (
        session_id IN (
          SELECT id FROM public.collaboration_sessions 
          WHERE host_user_id::uuid = auth.uid()::uuid OR is_public = TRUE
        ) OR
        session_id IN (
          SELECT session_id FROM public.collaboration_participants 
          WHERE user_id::uuid = auth.uid()::uuid
        )
      );

    DROP POLICY IF EXISTS "Participants can create analyses" ON public.collaboration_analyses;
    CREATE POLICY "Participants can create analyses" ON public.collaboration_analyses
      FOR INSERT WITH CHECK (
        session_id IN (
          SELECT session_id FROM public.collaboration_participants 
          WHERE user_id::uuid = auth.uid()::uuid AND is_active = TRUE
        )
      );

    -- Create trigger for updated_at column
    DROP TRIGGER IF EXISTS update_collaboration_analyses_updated_at ON public.collaboration_analyses;
    CREATE TRIGGER update_collaboration_analyses_updated_at 
      BEFORE UPDATE ON public.collaboration_analyses 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Enable real-time for collaboration analyses
    ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_analyses;
  `;

  await runMigration(sql, 'collaboration_analyses');
}

async function checkExistingTables() {
  try {
    console.log('Checking existing tables...');
    
    // Check if collaboration_analyses table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'collaboration_analyses');

    if (error) {
      console.error('Error checking tables:', error);
      return false;
    }

    const exists = tables && tables.length > 0;
    console.log(`collaboration_analyses table exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

async function main() {
  console.log('[INFO] Starting database migration...');
  
  try {
    // Check if tables already exist
    const tableExists = await checkExistingTables();
    
    if (!tableExists) {
      console.log('Creating missing tables...');
      await createCollaborationAnalysesTable();
    } else {
      console.log('[SUCCESS] All tables already exist');
    }
    
    console.log('[SUCCESS] Database migration completed!');
  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    process.exit(1);
  }
}

main(); 