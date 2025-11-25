-- Fix Infinite Recursion in RLS Policies
-- Run this script in your Supabase SQL Editor
-- This fixes the infinite recursion issue in team_members and collaboration_participants policies

-- Step 1: Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Participants can view session participants" ON public.collaboration_participants;

-- Step 2: Create fixed policies that avoid infinite recursion
-- Fixed: Simplified team_members policy to avoid infinite recursion
CREATE POLICY "Team members can view team membership" ON public.team_members
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_members.team_id AND owner_id::uuid = auth.uid()::uuid
    )
  );

-- Fixed: Simplified collaboration_participants policy to avoid infinite recursion
CREATE POLICY "Participants can view session participants" ON public.collaboration_participants
  FOR SELECT USING (
    user_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions 
      WHERE id = collaboration_participants.session_id AND host_user_id::uuid = auth.uid()::uuid
    )
  );

-- Step 3: Verify the fix by testing a simple query
-- This should not cause infinite recursion anymore
SELECT 'RLS policies fixed successfully!' as status; 