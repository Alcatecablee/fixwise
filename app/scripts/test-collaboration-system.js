// Test collaboration system with fixed code
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCollaborationSystem() {
  try {
    console.log('🧪 Testing collaboration system with fixed code...\n');

    // First, let's get a real user ID from the profiles table
    console.log('[INFO] Getting a real user ID...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('[ERROR] No users found in profiles table');
      return;
    }

    const userId = profiles[0].id;
    console.log('[SUCCESS] Using user ID:', userId);

    // Test team creation
    console.log('\n[INFO] Testing team creation...');
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: 'Test Team for Collaboration',
          description: 'Test team for collaboration system',
          owner_id: userId
        })
        .select()
        .single();

      if (teamError) {
        console.log('[ERROR] Team creation error:', teamError.message);
      } else {
        console.log('[SUCCESS] Team created successfully:', teamData.id);
        
        // Test team member addition
        console.log('\n[INFO] Testing team member addition...');
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamData.id,
            user_id: userId,
            role: 'owner'
          });

        if (memberError) {
          console.log('[ERROR] Team member addition error:', memberError.message);
        } else {
          console.log('[SUCCESS] Team member added successfully');
        }
      }
    } catch (error) {
      console.log('[ERROR] Team creation failed:', error.message);
    }

    // Test collaboration session creation
    console.log('\n[INFO] Testing collaboration session creation...');
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('collaboration_sessions')
        .insert({
          session_id: sessionId,
          name: 'Test Collaboration Session',
          host_user_id: userId,
          document_content: 'Test document content',
          filename: 'test.js',
          language: 'javascript',
          is_active: true,
          participant_count: 1,
          is_public: false
        })
        .select()
        .single();

      if (sessionError) {
        console.log('[ERROR] Session creation error:', sessionError.message);
      } else {
        console.log('[SUCCESS] Session created successfully:', sessionData.id);
        
        // Test session participant addition
        console.log('\n[INFO] Testing session participant addition...');
        const { error: participantError } = await supabase
          .from('collaboration_participants')
          .insert({
            session_id: sessionData.id,
            user_id: userId,
            user_name: 'Test User',
            user_color: '#3B82F6',
            is_active: true
          });

        if (participantError) {
          console.log('[ERROR] Session participant addition error:', participantError.message);
        } else {
          console.log('[SUCCESS] Session participant added successfully');
        }
      }
    } catch (error) {
      console.log('[ERROR] Session creation failed:', error.message);
    }

    console.log('\n[INFO] Collaboration system test complete!');

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testCollaborationSystem(); 