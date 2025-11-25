// Test team creation with fixed code
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTeamCreationFixed() {
  try {
    console.log('🧪 Testing team creation with fixed code...\n');

    // Test inserting into teams table with owner_id
    console.log('[INFO] Attempting to insert into teams table with owner_id...');
    
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team Fixed',
        description: 'Test description with fixed schema',
        owner_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
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

    // Test selecting with owner_id
    console.log('\n[INFO] Testing select with owner_id...');
    
    const { data: testData, error: testError } = await supabase
      .from('teams')
      .select('id, name, description, owner_id, created_at, updated_at')
      .limit(1);

    if (testError) {
      console.log('[ERROR] Error selecting from teams table:');
      console.log('Error code:', testError.code);
      console.log('Error message:', testError.message);
    } else {
      console.log('[SUCCESS] Successfully selected from teams table');
      console.log('Available columns work correctly');
      if (testData && testData.length > 0) {
        console.log('Sample data:', testData[0]);
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testTeamCreationFixed(); 