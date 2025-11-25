-- Fix collaboration tables migration
-- This migration ensures all collaboration tables exist and are properly configured

-- Drop existing tables if they exist (to ensure clean state)
DROP TABLE IF EXISTS public.collaboration_comments CASCADE;
DROP TABLE IF EXISTS public.collaboration_participants CASCADE;
DROP TABLE IF EXISTS public.collaboration_sessions CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.team_invitations CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- Create teams table
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration_sessions table
CREATE TABLE public.collaboration_sessions (
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

-- Create collaboration_participants table
CREATE TABLE public.collaboration_participants (
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

-- Create collaboration_comments table
CREATE TABLE public.collaboration_comments (
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

-- Create indexes for performance
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_invitee_email ON public.team_invitations(invitee_email);

CREATE INDEX idx_collaboration_sessions_host_user_id ON public.collaboration_sessions(host_user_id);
CREATE INDEX idx_collaboration_sessions_is_active ON public.collaboration_sessions(is_active);
CREATE INDEX idx_collaboration_participants_session_id ON public.collaboration_participants(session_id);
CREATE INDEX idx_collaboration_participants_user_id ON public.collaboration_participants(user_id);
CREATE INDEX idx_collaboration_participants_is_active ON public.collaboration_participants(is_active);
CREATE INDEX idx_collaboration_comments_session_id ON public.collaboration_comments(session_id);
CREATE INDEX idx_collaboration_comments_user_id ON public.collaboration_comments(user_id);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view teams they are members of" ON public.teams
  FOR SELECT USING (
    owner_id::uuid = auth.uid()::uuid OR
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (owner_id::uuid = auth.uid()::uuid);

CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (owner_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (owner_id::uuid = auth.uid()::uuid);

CREATE POLICY "Team members can view team membership" ON public.team_members
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    team_id IN (
      SELECT id FROM public.teams 
      WHERE owner_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Team owners can manage team members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM public.teams 
      WHERE owner_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can view sessions they participate in" ON public.collaboration_sessions
  FOR SELECT USING (
    host_user_id::uuid = auth.uid()::uuid OR
    is_public = TRUE OR
    id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Session hosts can manage their sessions" ON public.collaboration_sessions
  FOR ALL USING (host_user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Participants can view session participants" ON public.collaboration_participants
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    session_id IN (
      SELECT id FROM public.collaboration_sessions 
      WHERE host_user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Session hosts can manage participants" ON public.collaboration_participants
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.collaboration_sessions 
      WHERE host_user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Participants can view session comments" ON public.collaboration_comments
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.collaboration_sessions 
      WHERE host_user_id::uuid = auth.uid()::uuid OR
      id IN (
        SELECT session_id FROM public.collaboration_participants 
        WHERE user_id::uuid = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Participants can create comments" ON public.collaboration_comments
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.collaboration_sessions 
      WHERE host_user_id::uuid = auth.uid()::uuid OR
      id IN (
        SELECT session_id FROM public.collaboration_participants 
        WHERE user_id::uuid = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Comment authors can update their comments" ON public.collaboration_comments
  FOR UPDATE USING (user_id::uuid = auth.uid()::uuid);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON public.teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at 
  BEFORE UPDATE ON public.collaboration_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_comments_updated_at 
  BEFORE UPDATE ON public.collaboration_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at 
  BEFORE UPDATE ON public.team_invitations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
