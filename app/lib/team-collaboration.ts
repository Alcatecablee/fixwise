import { supabase } from './supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string; // Changed from user_id to owner_id to match existing table
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export interface CollaborationSession {
  id: string;
  session_id: string;
  name: string;
  host_user_id: string; // Changed from user_id to host_user_id
  document_content?: string;
  filename?: string;
  language?: string;
  is_active: boolean; // Changed from status to is_active
  participant_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  last_activity: string;
  participants?: CollaborationParticipant[];
}

export interface CollaborationParticipant {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  joined_at: string;
  last_seen_at: string;
  is_active: boolean;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  presence?: {
    status: 'online' | 'away' | 'offline';
    last_seen: string;
    current_file?: string;
    cursor_position?: { line: number; column: number };
  };
}

export interface CollaborationComment {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  file_path?: string;
  line_number?: number;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export class TeamCollaborationSystem {
  private static instance: TeamCollaborationSystem;
  private presenceInterval: NodeJS.Timeout | null = null;
  private activeSessions = new Map<string, CollaborationSession>();

  static getInstance(): TeamCollaborationSystem {
    if (!TeamCollaborationSystem.instance) {
      TeamCollaborationSystem.instance = new TeamCollaborationSystem();
    }
    return TeamCollaborationSystem.instance;
  }

  // Team Management
  async createTeam(userId: string, name: string, description?: string, authenticatedClient?: SupabaseClient): Promise<Team> {
    const client = authenticatedClient || supabase;
    // Validate input
    if (!name?.trim()) {
      throw new Error('Team name is required');
    }
    
    if (name.length > 100) {
      throw new Error('Team name must be less than 100 characters');
    }

    // Check for duplicate team names for this user (simplified to avoid recursion)
    const { data: existingTeams, error: checkError } = await client
      .from('teams')
      .select('name')
      .eq('owner_id', userId)
      .ilike('name', name.trim());
    
    if (checkError) {
      console.warn('Could not check for duplicate team names:', checkError.message);
    } else if (existingTeams && existingTeams.length > 0) {
      throw new Error('A team with this name already exists');
    }

    const { data, error } = await client
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        owner_id: userId
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create team: ${error.message}`);

    // Try to add creator as owner, but don't fail if this doesn't work
    try {
      await this.addTeamMember(data.id, userId, 'owner', client);
    } catch (memberError) {
      console.warn('Could not add team member automatically:', memberError);
      // Continue without failing the team creation
    }

    return data;
  }

  async getTeams(userId: string, authenticatedClient?: SupabaseClient): Promise<Team[]> {
    const client = authenticatedClient || supabase;
    try {
      // Get teams where user is a member or owner
      const { data: teamMemberships, error: membershipError } = await client
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (membershipError) {
        // If table doesn't exist, return empty array instead of throwing
        if (membershipError.message.includes('does not exist')) {
          console.log('Collaboration tables not set up yet, returning empty teams');
          return [];
        }
        throw new Error(`Failed to get team memberships: ${membershipError.message}`);
      }

      // Get teams where user is the owner
      const { data: ownedTeams, error: ownedError } = await client
        .from('teams')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) {
        // If table doesn't exist, return empty array instead of throwing
        if (ownedError.message.includes('does not exist')) {
          console.log('Teams table not set up yet, returning empty teams');
          return [];
        }
        throw new Error(`Failed to get owned teams: ${ownedError.message}`);
      }

      // Combine team IDs from memberships and ownership
      const teamIds = new Set([
        ...(teamMemberships || []).map(tm => tm.team_id),
        ...(ownedTeams || []).map(team => team.id)
      ]);

      if (teamIds.size === 0) {
        return [];
      }

      // Get all teams
      const { data: teams, error: teamsError } = await client
        .from('teams')
        .select('*')
        .in('id', Array.from(teamIds));

      if (teamsError) throw new Error(`Failed to get teams: ${teamsError.message}`);

      // Get team members for each team
      const teamsWithMembers = await Promise.all(
        (teams || []).map(async (team) => {
          const { data: members } = await client
            .from('team_members')
            .select(`
              id,
              user_id,
              role,
              joined_at
            `)
            .eq('team_id', team.id);

          // Get user profiles for members
          const memberProfiles = await Promise.all(
            (members || []).map(async (member) => {
              const { data: profile } = await client
                .from('profiles')
                .select('id, email, full_name')
                .eq('id', member.user_id)
                .single();

              return {
                ...member,
                user: profile || { id: member.user_id, email: '', full_name: '' }
              };
            })
          );

          return {
            ...team,
            members: memberProfiles
          };
        })
      );

      return teamsWithMembers;
    } catch (error) {
      console.error('Error in getTeams:', error);
      // Return empty array instead of throwing to prevent API errors
      return [];
    }
  }

  async getTeam(teamId: string, userId: string): Promise<Team | null> {
    // Check if user is a member or owner of this team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    // Check if user is the owner
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) {
      if (teamError.code === 'PGRST116') return null;
      throw new Error(`Failed to get team: ${teamError.message}`);
    }

    // User must be either a member or the owner
    const isMember = membership && membership.team_id === teamId;
    const isOwner = team.owner_id === userId;

    if (!isMember && !isOwner) {
      return null; // User is not authorized
    }

    // Get team members
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('team_id', teamId);

    // Get user profiles for members
    const memberProfiles = await Promise.all(
      (members || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', member.user_id)
          .single();

        return {
          ...member,
          user: profile || { id: member.user_id, email: '', full_name: '' }
        };
      })
    );

    return {
      ...team,
      members: memberProfiles
    };
  }

  async addTeamMember(teamId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member', authenticatedClient?: SupabaseClient): Promise<void> {
    const client = authenticatedClient || supabase;
    try {
      // Check if user is already a member
      const { data: existing, error: checkError } = await client
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // If it's not a "not found" error, the table might not exist
        if (checkError.message.includes('does not exist')) {
          console.warn('Team members table does not exist, skipping member addition');
          return;
        }
        throw new Error(`Failed to check existing membership: ${checkError.message}`);
      }

      if (existing) {
        throw new Error('User is already a member of this team');
      }

      const { error } = await client
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role
        });

      if (error) {
        if (error.message.includes('does not exist')) {
          console.warn('Team members table does not exist, skipping member addition');
          return;
        }
        throw new Error(`Failed to add team member: ${error.message}`);
      }
    } catch (error) {
      // If it's a table doesn't exist error, just log and continue
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.warn('Team members table does not exist, skipping member addition');
        return;
      }
      throw error;
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    // Check if user is trying to remove themselves as the last owner
    const { data: members } = await supabase
      .from('team_members')
      .select('role, user_id')
      .eq('team_id', teamId);

    const owners = members?.filter(m => m.role === 'owner') || [];
    const userRole = members?.find(m => m.user_id === userId)?.role;

    if (userRole === 'owner' && owners.length === 1) {
      throw new Error('Cannot remove the last owner from the team');
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to remove team member: ${error.message}`);
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: 'owner' | 'admin' | 'member'): Promise<void> {
    // Validate role change
    if (role === 'owner') {
      const { data: owners } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('role', 'owner');

      if (owners && owners.length > 0 && !owners.find(o => o.user_id === userId)) {
        throw new Error('Cannot have multiple owners');
      }
    }

    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to update team member role: ${error.message}`);
  }

  // Collaboration Sessions
  async createCollaborationSession(
    userId: string,
    name: string,
    description?: string,
    projectId?: string,
    authenticatedClient?: SupabaseClient
  ): Promise<CollaborationSession> {
    const client = authenticatedClient || supabase;
    // Validate input
    if (!name?.trim()) {
      throw new Error('Session name is required');
    }

    if (name.length > 100) {
      throw new Error('Session name must be less than 100 characters');
    }

        const { data, error } = await client
      .from('collaboration_sessions')
      .insert({
        name: name.trim(),
        host_user_id: userId,
        document_content: description || '',
        filename: 'untitled.js',
        language: 'javascript',
        is_active: true,
        participant_count: 1,
        is_public: false
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create collaboration session: ${error.message}`);

    // Add creator as participant
    await this.addSessionParticipant(data.id, userId, 'viewer', client);

    this.activeSessions.set(data.id, data);
    return data;
  }

  async getCollaborationSessions(userId: string, authenticatedClient?: SupabaseClient): Promise<CollaborationSession[]> {
    const client = authenticatedClient || supabase;
    try {
      // First get sessions where user is a participant
      const { data: participations, error: participationError } = await client
        .from('collaboration_participants')
        .select('session_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (participationError) {
        // If table doesn't exist or other schema issues, return empty array
        if (participationError.message.includes('relation') || participationError.message.includes('does not exist')) {
          console.warn('Collaboration tables not set up yet, returning empty sessions');
          return [];
        }
        throw new Error(`Failed to get collaboration participations: ${participationError.message}`);
      }

      // Get sessions where user is the host
      const { data: hostedSessions, error: hostedError } = await client
        .from('collaboration_sessions')
        .select('*')
        .eq('host_user_id', userId)
        .eq('is_active', true);

      if (hostedError) {
        // If table doesn't exist or other schema issues, return empty array
        if (hostedError.message.includes('relation') || hostedError.message.includes('does not exist')) {
          console.warn('Collaboration sessions table not set up yet, returning empty sessions');
          return [];
        }
        throw new Error(`Failed to get hosted sessions: ${hostedError.message}`);
      }

      // Combine session IDs
      const sessionIds = new Set([
        ...(participations || []).map(p => p.session_id),
        ...(hostedSessions || []).map(s => s.id)
      ]);

      if (sessionIds.size === 0) {
        return [];
      }

      // Get all sessions
      const { data: sessions, error: sessionsError } = await client
        .from('collaboration_sessions')
        .select('*')
        .in('id', Array.from(sessionIds))
        .eq('is_active', true);

      if (sessionsError) {
        // If table doesn't exist or other schema issues, return empty array
        if (sessionsError.message.includes('relation') || sessionsError.message.includes('does not exist')) {
          console.warn('Collaboration sessions table not set up yet, returning empty sessions');
          return [];
        }
        throw new Error(`Failed to get collaboration sessions: ${sessionsError.message}`);
      }

      // Get participants for each session
      const sessionsWithParticipants = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: participants } = await client
            .from('collaboration_participants')
            .select(`
              id,
              user_id,
              user_name,
              user_color,
              joined_at,
              last_seen_at,
              is_active
            `)
            .eq('session_id', session.id)
            .eq('is_active', true);

          // Get user profiles for participants
          const participantsWithProfiles = await Promise.all(
            (participants || []).map(async (participant) => {
              const { data: profile } = await client
                .from('profiles')
                .select('id, email, full_name')
                .eq('id', participant.user_id)
                .single();

              return {
                ...participant,
                user: profile || { id: participant.user_id, email: '', full_name: '' }
              };
            })
          );

          return {
            ...session,
            participants: participantsWithProfiles
          };
        })
      );

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error in getCollaborationSessions:', error);
      return [];
    }
  }

  async getCollaborationSession(sessionId: string, userId: string): Promise<CollaborationSession | null> {
    // Check if user is a participant
    const { data: participation, error: participationError } = await supabase
      .from('collaboration_participants')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .is('left_at', null)
      .single();

    if (participationError || !participation) {
      return null; // User is not a participant
    }

    // Get session details
    const { data, error } = await supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get collaboration session: ${error.message}`);
    }

    // Get participants
    const { data: participants } = await supabase
      .from('collaboration_participants')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        left_at,
        last_activity
      `)
      .eq('session_id', sessionId)
      .is('left_at', null);

    // Get user profiles for participants
    const participantsWithProfiles = await Promise.all(
      (participants || []).map(async (participant) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', participant.user_id)
          .single();

        return {
          ...participant,
          user: profile || { id: participant.user_id, email: '', full_name: '' }
        };
      })
    );

    return {
      ...data,
      participants: participantsWithProfiles
    };
  }

  async addSessionParticipant(
    sessionId: string,
    userId: string,
    role: 'owner' | 'editor' | 'viewer' = 'viewer'
  , authenticatedClient?: SupabaseClient): Promise<void> {
    const client = authenticatedClient || supabase;
    // Check if user is already a participant
    const { data: existing } = await client
      .from('collaboration_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existing) {
      throw new Error('User is already a participant in this session');
    }

    // Get user name from profiles
    const { data: profile } = await client
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userName = profile?.full_name || 'Unknown User';

    const { error } = await client
      .from('collaboration_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_name: userName,
        user_color: '#3B82F6', // Default blue color
        is_active: true
      });

    if (error) throw new Error(`Failed to add session participant: ${error.message}`);
  }

  async removeSessionParticipant(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('collaboration_participants')
      .update({ 
        is_active: false,
        last_seen_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to remove session participant: ${error.message}`);
  }

  async updateParticipantActivity(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('collaboration_participants')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to update participant activity: ${error.message}`);
  }

  // Comments
  async addComment(
    sessionId: string,
    userId: string,
    content: string,
    filePath?: string,
    lineNumber?: number
  ): Promise<CollaborationComment> {
    // Validate input
    if (!content?.trim()) {
      throw new Error('Comment content is required');
    }

    if (content.length > 1000) {
      throw new Error('Comment content must be less than 1000 characters');
    }

    const { data, error } = await supabase
      .from('collaboration_comments')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: content.trim(),
        file_path: filePath,
        line_number: lineNumber,
        resolved: false
      })
      .select('*')
      .single();

    if (error) throw new Error(`Failed to add comment: ${error.message}`);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    return {
      ...data,
      user: profile || { id: userId, email: '', full_name: '' }
    };
  }

  async getComments(sessionId: string): Promise<CollaborationComment[]> {
    const { data, error } = await supabase
      .from('collaboration_comments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get comments: ${error.message}`);

    // Get user profiles for comments
    const commentsWithProfiles = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          user: profile || { id: comment.user_id, email: '', full_name: '' }
        };
      })
    );

    return commentsWithProfiles;
  }

  async resolveComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('collaboration_comments')
      .update({ resolved: true })
      .eq('id', commentId);

    if (error) throw new Error(`Failed to resolve comment: ${error.message}`);
  }

  // Real-time Presence
  async updatePresence(
    sessionId: string,
    userId: string,
    status: 'online' | 'away' | 'offline',
    currentFile?: string,
    cursorPosition?: { line: number; column: number }
  ): Promise<void> {
    // Update last activity
    await this.updateParticipantActivity(sessionId, userId);

    // Store presence in memory for real-time updates
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const participant = session.participants?.find(p => p.user_id === userId);
      if (participant) {
        participant.presence = {
          status,
          last_seen: new Date().toISOString(),
          current_file: currentFile,
          cursor_position: cursorPosition
        };
      }
    }
  }

  async getSessionPresence(sessionId: string): Promise<CollaborationParticipant[]> {
    const { data, error } = await supabase
      .from('collaboration_participants')
      .select(`
        id,
        session_id,
        user_id,
        user_name,
        user_color,
        joined_at,
        last_seen_at,
        is_active,
        profiles(id, email, full_name)
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get session presence: ${error.message}`);

    // Add presence data from memory
    const session = this.activeSessions.get(sessionId);
    if (session?.participants) {
      return (data || []).map(participant => ({
        ...participant,
        user: participant.profiles?.[0] || null,
        presence: session.participants?.find(p => p.user_id === participant.user_id)?.presence
      }));
    }

    return (data || []).map(participant => ({
      ...participant,
      user: participant.profiles?.[0] || null
    }));
  }

  // Session Management
  async endSession(sessionId: string, userId: string): Promise<void> {
    // Verify user is session owner
    const session = await this.getCollaborationSession(sessionId, userId);
    if (!session) throw new Error('Session not found or access denied');

    const { error } = await supabase
      .from('collaboration_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to end session: ${error.message}`);

    this.activeSessions.delete(sessionId);
  }

  async pauseSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getCollaborationSession(sessionId, userId);
    if (!session) throw new Error('Session not found or access denied');

    const { error } = await supabase
      .from('collaboration_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to pause session: ${error.message}`);
  }

  async resumeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getCollaborationSession(sessionId, userId);
    if (!session) throw new Error('Session not found or access denied');

    const { error } = await supabase
      .from('collaboration_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to resume session: ${error.message}`);
  }

  // Cleanup
  async cleanupInactiveSessions(): Promise<void> {
    const { error } = await supabase
      .from('collaboration_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago
      .eq('status', 'active');

    if (error) throw new Error(`Failed to cleanup inactive sessions: ${error.message}`);
  }

  // Initialize presence tracking
  startPresenceTracking(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }

    this.presenceInterval = setInterval(async () => {
      try {
        // Update presence for all active sessions
        for (const [sessionId, session] of this.activeSessions) {
                  for (const participant of session.participants || []) {
          const lastSeen = new Date(participant.last_seen_at);
          const now = new Date();
          const timeDiff = now.getTime() - lastSeen.getTime();

          let status: 'online' | 'away' | 'offline' = 'online';
          if (timeDiff > 5 * 60 * 1000) status = 'away'; // 5 minutes
          if (timeDiff > 30 * 60 * 1000) status = 'offline'; // 30 minutes

          await this.updatePresence(sessionId, participant.user_id, status);
        }
        }
      } catch (error) {
        console.error('Presence tracking error:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  stopPresenceTracking(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }
}

export const teamCollaboration = TeamCollaborationSystem.getInstance(); 