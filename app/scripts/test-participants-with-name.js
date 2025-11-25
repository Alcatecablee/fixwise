// Test participants with user_name field
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testParticipantsWithName() {
  try {
    console.log('🧪 Testing participants with user_name...\n');

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

    // Get a session ID
    const { data: sessions } = await supabase
      .from('collaboration_sessions')
      .select('id')
      .limit(1);

    if (!sessions || sessions.length === 0) {
      console.log('[ERROR] No sessions found');
      return;
    }

    const sessionId = sessions[0].id;
    console.log('[SUCCESS] Using session ID:', sessionId);

    // Test adding participant with user_name
    console.log('\n[INFO] Testing participant addition with user_name...');
    const { data, error } = await supabase
      .from('collaboration_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_name: userName
      })
      .select();

    if (error) {
      console.log('[ERROR] Participant addition failed:', error.message);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
    } else {
      console.log('[SUCCESS] Participant added successfully');
      console.log('Data:', data);
    }

    // Test selecting to see all columns
    console.log('\n[INFO] Testing select to see all columns...');
    const { data: allData, error: selectError } = await supabase
      .from('collaboration_participants')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('[ERROR] Select failed:', selectError.message);
    } else {
      console.log('[SUCCESS] Select successful');
      if (allData && allData.length > 0) {
        console.log('[INFO] All columns:', Object.keys(allData[0]));
        console.log('Sample data:', allData[0]);
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testParticipantsWithName(); 