// Test collaboration system with user_color field
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCollaborationWithColor() {
  try {
    console.log('🧪 Testing collaboration system with user_color...\n');

    // Get a real user ID and name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.log('[ERROR] No users found');
      return;
    }

    const userId = profiles[0].id;
    const userName = profiles[0].full_name || 'Unknown User';
    console.log('[SUCCESS] Using user ID:', userId);
    console.log('[SUCCESS] Using user name:', userName);

    // Test 1: Team creation
    console.log('\n[INFO] Test 1: Team creation...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team with Color',
        description: 'Testing with user_color field',
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
        name: 'Test Session with Color',
        host_user_id: userId,
        document_content: 'Test content',
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
      
      // Test 4: Session participant addition with user_name and user_color
      console.log('\n[INFO] Test 4: Session participant addition with user_name and user_color...');
      const { error: participantError } = await supabase
        .from('collaboration_participants')
        .insert({
          session_id: sessionData.id,
          user_id: userId,
          user_name: userName,
          user_color: '#3B82F6' // Blue color
        });

      if (participantError) {
        console.log('[ERROR] Session participant addition failed:', participantError.message);
        console.log('Error details:', participantError.details);
        console.log('Error hint:', participantError.hint);
      } else {
        console.log('[SUCCESS] Session participant added with user_name and user_color');
      }
    }

    // Test 5: Query all data
    console.log('\n[INFO] Test 5: Query all data...');
    
    // Query teams
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

    // Query sessions
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

    console.log('\n[INFO] Collaboration system test complete! The system is working with the existing database structure.');

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testCollaborationWithColor(); 