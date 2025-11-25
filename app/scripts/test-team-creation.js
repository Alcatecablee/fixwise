// Test team creation to see exact error
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTeamCreation() {
  try {
    console.log('🧪 Testing team creation...\n');

    // First, let's try to see the table structure by attempting an insert
    console.log('[INFO] Attempting to insert into teams table...');
    
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team',
        description: 'Test description',
        user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        settings: {}
      })
      .select();

    if (error) {
      console.log('[ERROR] Error inserting into teams table:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
    } else {
      console.log('[SUCCESS] Successfully inserted into teams table');
      console.log('Data:', data);
    }

    // Let's also try to see what columns are available by doing a select with specific columns
    console.log('\n[INFO] Testing column access...');
    
    const { data: testData, error: testError } = await supabase
      .from('teams')
      .select('id, name, description, user_id, settings, created_at, updated_at')
      .limit(1);

    if (testError) {
      console.log('[ERROR] Error selecting from teams table:');
      console.log('Error code:', testError.code);
      console.log('Error message:', testError.message);
    } else {
      console.log('[SUCCESS] Successfully selected from teams table');
      console.log('Available columns work correctly');
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testTeamCreation(); 