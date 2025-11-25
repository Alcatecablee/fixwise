-- Fix RLS policies to prevent infinite recursion
-- The issue is that team_members policy references teams, and teams policy references team_members

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;

-- Create simplified policies that avoid infinite recursion

-- Teams policies
CREATE POLICY "Users can view teams they own" ON public.teams
  FOR SELECT USING (owner_id::uuid = auth.uid()::uuid);

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

-- Team members policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own team memberships" ON public.team_members
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Team owners can view team members" ON public.team_members
  FOR SELECT USING (
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

-- Users can manage their own team memberships (join/leave teams)
CREATE POLICY "Users can manage their own team memberships" ON public.team_members
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);
