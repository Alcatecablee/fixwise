#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabaseSafe() {
  console.log('Safe Database Setup Instructions');
  console.log('================================');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }
  
  console.log('Environment variables configured ✓');
  
  try {
    // Create a safe SQL script that drops existing policies first
    const safeSQL = `-- Safe Database Setup Script
-- This script will drop existing policies and recreate them

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;

DROP POLICY IF EXISTS "Users can view sessions they participate in" ON public.collaboration_sessions;
DROP POLICY IF EXISTS "Session hosts can manage their sessions" ON public.collaboration_sessions;

DROP POLICY IF EXISTS "Participants can view session participants" ON public.collaboration_participants;
DROP POLICY IF EXISTS "Session hosts can manage participants" ON public.collaboration_participants;

DROP POLICY IF EXISTS "Participants can view session comments" ON public.collaboration_comments;
DROP POLICY IF EXISTS "Participants can create comments" ON public.collaboration_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON public.collaboration_comments;

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;

-- Create tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_content TEXT,
  filename TEXT,
  language TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  participant_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collaboration_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_color TEXT DEFAULT '#3B82F6',
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  left_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.collaboration_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  collaboration_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_user_id ON public.collaboration_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_is_active ON public.collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session_id ON public.collaboration_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user_id ON public.collaboration_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_is_active ON public.collaboration_participants(is_active);
CREATE INDEX IF NOT EXISTS idx_collaboration_comments_session_id ON public.collaboration_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_comments_user_id ON public.collaboration_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view teams they are members of" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id AND user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (owner_id::uuid = auth.uid()::uuid);

CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (owner_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (owner_id::uuid = auth.uid()::uuid);

-- Fixed: Simplified team_members policy to avoid infinite recursion
CREATE POLICY "Team members can view team membership" ON public.team_members
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_members.team_id AND owner_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_members.team_id AND owner_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can view sessions they participate in" ON public.collaboration_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_participants 
      WHERE session_id = collaboration_sessions.id AND user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Session hosts can manage their sessions" ON public.collaboration_sessions
  FOR ALL USING (host_user_id::uuid = auth.uid()::uuid);

-- Fixed: Simplified collaboration_participants policy to avoid infinite recursion
CREATE POLICY "Participants can view session participants" ON public.collaboration_participants
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions 
      WHERE id = collaboration_participants.session_id AND host_user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Session hosts can manage participants" ON public.collaboration_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions 
      WHERE id = collaboration_participants.session_id AND host_user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Participants can view session comments" ON public.collaboration_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_participants 
      WHERE session_id = collaboration_comments.session_id AND user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Participants can create comments" ON public.collaboration_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaboration_participants 
      WHERE session_id = collaboration_comments.session_id AND user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Comment authors can update their comments" ON public.collaboration_comments
  FOR UPDATE USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON public.teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collaboration_sessions_updated_at ON public.collaboration_sessions;
CREATE TRIGGER update_collaboration_sessions_updated_at 
  BEFORE UPDATE ON public.collaboration_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collaboration_comments_updated_at ON public.collaboration_comments;
CREATE TRIGGER update_collaboration_comments_updated_at 
  BEFORE UPDATE ON public.collaboration_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON public.user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    // Write the safe SQL to a file
    const outputPath = path.join(__dirname, '..', 'database-schema-safe.sql');
    fs.writeFileSync(outputPath, safeSQL);
    
    console.log('Safe SQL schema created: database-schema-safe.sql ✓');
    console.log('');
    console.log('This script will:');
    console.log('1. Drop any existing policies to avoid conflicts');
    console.log('2. Create tables if they don\'t exist');
    console.log('3. Create indexes if they don\'t exist');
    console.log('4. Enable RLS on all tables');
    console.log('5. Create all policies with proper UUID casting');
    console.log('6. Create triggers for updated_at timestamps');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the contents of database-schema-safe.sql');
    console.log('5. Paste and run the SQL commands');
    console.log('');
    console.log('This will safely recreate all policies and fix any existing issues.');
    console.log('');
    console.log('Schema file location:', outputPath);
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabaseSafe().catch(console.error); 