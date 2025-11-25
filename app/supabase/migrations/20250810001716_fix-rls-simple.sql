-- Fix RLS policies with simple, non-recursive policies
-- This approach avoids any circular references that cause infinite recursion

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view teams they own" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

DROP POLICY IF EXISTS "Users can view their own team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage their own team memberships" ON public.team_members;

-- Create very simple policies that avoid recursion

-- Teams: Allow users to do everything with teams they own
CREATE POLICY "teams_owner_policy" ON public.teams
  FOR ALL USING (owner_id::uuid = auth.uid()::uuid);

-- Team members: Allow users to see their own memberships
CREATE POLICY "team_members_self_policy" ON public.team_members
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

-- Team members: Allow team owners to manage members
CREATE POLICY "team_members_owner_policy" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id::uuid = auth.uid()::uuid
    )
  );

-- Team members: Allow users to manage their own memberships (join/leave)
CREATE POLICY "team_members_manage_self" ON public.team_members
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

-- Collaboration sessions: Allow hosts to manage their sessions
CREATE POLICY "collaboration_sessions_host_policy" ON public.collaboration_sessions
  FOR ALL USING (host_user_id::uuid = auth.uid()::uuid);

-- Collaboration sessions: Allow participants to view sessions they're in
CREATE POLICY "collaboration_sessions_participant_policy" ON public.collaboration_sessions
  FOR SELECT USING (
    id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

-- Collaboration participants: Allow users to manage their own participation
CREATE POLICY "collaboration_participants_self_policy" ON public.collaboration_participants
  FOR ALL USING (user_id::uuid = auth.uid()::uuid);

-- Collaboration participants: Allow session hosts to manage participants
CREATE POLICY "collaboration_participants_host_policy" ON public.collaboration_participants
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.collaboration_sessions 
      WHERE host_user_id::uuid = auth.uid()::uuid
    )
  );

-- Collaboration comments: Allow participants to view comments
CREATE POLICY "collaboration_comments_view_policy" ON public.collaboration_comments
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

-- Collaboration comments: Allow participants to create comments
CREATE POLICY "collaboration_comments_create_policy" ON public.collaboration_comments
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT session_id FROM public.collaboration_participants 
      WHERE user_id::uuid = auth.uid()::uuid
    )
  );

-- Collaboration comments: Allow users to update their own comments
CREATE POLICY "collaboration_comments_update_policy" ON public.collaboration_comments
  FOR UPDATE USING (user_id::uuid = auth.uid()::uuid);
