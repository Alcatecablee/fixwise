import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest } from "../../../../lib/auth-middleware";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Participant colors for assignment
const participantColors = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', 
  '#9C27B0', '#00BCD4', '#FFC107', '#795548',
  '#607D8B', '#F44336', '#8BC34A', '#3F51B5'
];

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const { sessionId, userName, role = 'participant' } = await request.json();

    // Handle collaboration-style authentication if standard auth fails
    let user = authResult.user;
    let userId = user?.id;

    if (!authResult.success) {
      const collaborativeUserId = request.headers.get("x-user-id");
      const collaborativeUserName = request.headers.get("x-user-name");

      if (collaborativeUserId && collaborativeUserName) {
        user = {
          id: collaborativeUserId,
          email: `${collaborativeUserId}@guest.neurolint.dev`,
          firstName: collaborativeUserName,
          plan: 'guest',
          tier: 'guest',
          emailConfirmed: false
        };
        userId = collaborativeUserId;
      }
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if session exists and is accessible
    const { data: session, error: sessionError } = await supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Check if session is active
    if (!session.is_active) {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    let existingParticipant = null;
    
    if (authResult.success && authResult.user) {
      // For authenticated users, check by user_id
      const { data: authParticipant } = await supabase
        .from('collaboration_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      existingParticipant = authParticipant;
    } else {
      // For guest users, check by guest_user_id
      const { data: guestParticipant } = await supabase
        .from('collaboration_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('guest_user_id', userId)
        .eq('is_active', true)
        .single();
      
      existingParticipant = guestParticipant;
    }

    // If not already a participant, add them
    if (!existingParticipant) {
      const participantData: any = {
        session_id: session.id,
        user_name: userName,
        user_color: participantColors[Math.floor(Math.random() * participantColors.length)],
        role: role === 'participant' ? 'viewer' : role,
        is_active: true,
        joined_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      };

      // Add user-specific fields based on whether it's a guest or authenticated user
      if (!authResult.success) {
        participantData.guest_user_id = userId;
        participantData.guest_user_name = userName;
      } else {
        participantData.user_id = userId;
      }

      const { error: participantError } = await supabase
        .from('collaboration_participants')
        .insert(participantData);

      if (participantError) {
        console.error('Failed to add participant:', participantError);
        return NextResponse.json(
          { error: 'Failed to join session' },
          { status: 500 }
        );
      }
    } else {
      // Update existing participant's last seen time
      const updateData = {
        last_seen_at: new Date().toISOString(),
        is_active: true
      };

      await supabase
        .from('collaboration_participants')
        .update(updateData)
        .eq('id', existingParticipant.id);
    }

    // Update session activity to indicate someone joined
    const { error: activityError } = await supabase
      .from('collaboration_sessions')
      .update({
        last_activity: new Date().toISOString(),
        participant_count: session.participant_count + (existingParticipant ? 0 : 1)
      })
      .eq('id', sessionId);

    if (activityError) {
      console.error('Failed to update session activity:', activityError);
    }

    // Get all active participants for this session
    const { data: participants, error: participantsError } = await supabase
      .from('collaboration_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error('Failed to fetch participants:', participantsError);
    }

    // Return the session with mapped field names for frontend compatibility
    const sessionResponse = {
      ...session,
      document_filename: session.filename,
      document_language: session.language,
      document_content: session.document_content,
      participants: participants?.map((p: any) => ({
        id: p.id,
        user_id: p.user_id || p.guest_user_id,
        user_name: p.user_name,
        user_color: p.user_color,
        is_active: p.is_active,
        joined_at: p.joined_at,
        role: p.role,
        is_guest: !!p.guest_user_id
      })) || []
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the session',
      session: sessionResponse,
    });

  } catch (error) {
    console.error('Join collaboration session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get session to check if it exists
    const { data: session, error: sessionError } = await supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update participant count
    const { error: updateError } = await supabase
      .from('collaboration_sessions')
      .update({
        participant_count: Math.max(1, session.participant_count - 1),
        last_activity: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session on leave:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the session',
    });

  } catch (error) {
    console.error('Leave collaboration session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
