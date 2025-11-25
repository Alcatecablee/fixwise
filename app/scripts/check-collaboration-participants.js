// Check collaboration_participants table structure
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCollaborationParticipants() {
  try {
    console.log('[INFO] Checking collaboration_participants table structure...\n');

    // Test inserting with minimal required columns
    console.log('[INFO] Attempting to insert into collaboration_participants table...');
    
    const { data, error } = await supabase
      .from('collaboration_participants')
      .insert({
        session_id: 'test-session-id',
        user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      })
      .select();

    if (error) {
      console.log('[ERROR] Error inserting into collaboration_participants table:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
    } else {
      console.log('[SUCCESS] Successfully inserted into collaboration_participants table');
      console.log('Data:', data);
    }

    // Test selecting with all possible columns
    console.log('\n[INFO] Testing select with all possible columns...');
    
    const { data: testData, error: testError } = await supabase
      .from('collaboration_participants')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('[ERROR] Error selecting from collaboration_participants table:');
      console.log('Error code:', testError.code);
      console.log('Error message:', testError.message);
    } else {
      console.log('[SUCCESS] Successfully selected from collaboration_participants table');
      if (testData && testData.length > 0) {
        console.log('[INFO] Available columns:', Object.keys(testData[0]));
        console.log('Sample data:', testData[0]);
      } else {
        console.log('[INFO] Table is empty, but structure is accessible');
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

checkCollaborationParticipants(); 