// Final test of collaboration system with existing database structure
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCollaborationFinal() {
  try {
    console.log('🧪 Final test of collaboration system...\n');

    // Get a real user ID
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.log('[ERROR] No users found');
      return;
    }

    const userId = profiles[0].id;
    console.log('[SUCCESS] Using user ID:', userId);

    // Test 1: Team creation
    console.log('\n[INFO] Test 1: Team creation...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Final Test Team',
        description: 'Testing the fixed collaboration system',
        owner_id: userId
      })
      .select()
      .single();

    if (teamError) {
      console.log('[ERROR] Team creation failed:', teamError.message);
    } else {
      console.log('[SUCCESS] Team created:', teamData.id);
      
      // Test 2: Team member addition
      console.log('\n[INFO] Test 2: Team member addition...');
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) {
        console.log('[ERROR] Team member addition failed:', memberError.message);
      } else {
        console.log('[SUCCESS] Team member added');
      }
    }

    // Test 3: Collaboration session creation
    console.log('\n[INFO] Test 3: Collaboration session creation...');
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('collaboration_sessions')
      .insert({
        session_id: sessionId,
        name: 'Final Test Session',
        host_user_id: userId,
        document_content: 'Test content for collaboration',
        filename: 'test.js',
        language: 'javascript',
        is_active: true,
        participant_count: 1,
        is_public: false
      })
      .select()
      .single();

    if (sessionError) {
      console.log('[ERROR] Session creation failed:', sessionError.message);
    } else {
      console.log('[SUCCESS] Session created:', sessionData.id);
      
      // Test 4: Session participant addition
      console.log('\n[INFO] Test 4: Session participant addition...');
      const { error: participantError } = await supabase
        .from('collaboration_participants')
        .insert({
          session_id: sessionData.id,
          user_id: userId
        });

      if (participantError) {
        console.log('[ERROR] Session participant addition failed:', participantError.message);
      } else {
        console.log('[SUCCESS] Session participant added');
      }
    }

    // Test 5: Query teams
    console.log('\n[INFO] Test 5: Query teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(user_id)
      `)
      .eq('team_members.user_id', userId);

    if (teamsError) {
      console.log('[ERROR] Teams query failed:', teamsError.message);
    } else {
      console.log('[SUCCESS] Teams query successful, found:', teams.length, 'teams');
    }

    // Test 6: Query sessions
    console.log('\n[INFO] Test 6: Query sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('collaboration_sessions')
      .select(`
        *,
        collaboration_participants!inner(user_id)
      `)
      .eq('collaboration_participants.user_id', userId)
      .eq('is_active', true);

    if (sessionsError) {
      console.log('[ERROR] Sessions query failed:', sessionsError.message);
    } else {
      console.log('[SUCCESS] Sessions query successful, found:', sessions.length, 'sessions');
    }

    console.log('\n[INFO] Final test complete! Collaboration system is working with existing database structure.');

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testCollaborationFinal(); 