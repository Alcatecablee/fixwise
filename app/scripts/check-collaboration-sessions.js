// Check collaboration_sessions table structure
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCollaborationSessions() {
  try {
    console.log('[INFO] Checking collaboration_sessions table structure...\n');

    // From the earlier check, we know it has these columns:
    // 'id', 'session_id', 'host_user_id', 'name', 'document_content', 'filename', 
    // 'language', 'is_active', 'participant_count', 'created_at', 'updated_at', 
    // 'last_activity', 'is_public'

    // Test inserting with the actual column names
    console.log('[INFO] Attempting to insert into collaboration_sessions table...');
    
    const { data, error } = await supabase
      .from('collaboration_sessions')
      .insert({
        session_id: 'test-session-123',
        host_user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        name: 'Test Session',
        document_content: 'Test content',
        filename: 'test.js',
        language: 'javascript',
        is_active: true,
        participant_count: 1,
        is_public: false
      })
      .select();

    if (error) {
      console.log('[ERROR] Error inserting into collaboration_sessions table:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
    } else {
      console.log('[SUCCESS] Successfully inserted into collaboration_sessions table');
      console.log('Data:', data);
    }

    // Test selecting with actual column names
    console.log('\n[INFO] Testing select with actual columns...');
    
    const { data: testData, error: testError } = await supabase
      .from('collaboration_sessions')
      .select('id, session_id, host_user_id, name, document_content, filename, language, is_active, participant_count, created_at, updated_at, last_activity, is_public')
      .limit(1);

    if (testError) {
      console.log('[ERROR] Error selecting from collaboration_sessions table:');
      console.log('Error code:', testError.code);
      console.log('Error message:', testError.message);
    } else {
      console.log('[SUCCESS] Successfully selected from collaboration_sessions table');
      console.log('Available columns work correctly');
      if (testData && testData.length > 0) {
        console.log('Sample data:', testData[0]);
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

checkCollaborationSessions(); 