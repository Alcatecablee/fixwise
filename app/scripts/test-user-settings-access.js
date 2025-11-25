// Test user_settings table access
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserSettingsAccess() {
  try {
    console.log('[INFO] Testing user_settings table access...');

    // Test 1: Check if table exists
    console.log('\n1. Checking if user_settings table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('[ERROR] Table access error:', tableError.message);
      console.log('Error code:', tableError.code);
      console.log('Error details:', tableError.details);
      return;
    }

    console.log('[SUCCESS] Table exists and is accessible');

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(0);

    if (structureError) {
      console.log('[ERROR] Structure check error:', structureError.message);
    } else {
      console.log('[SUCCESS] Table structure is valid');
    }

    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    let policies = null;
    let policiesError = null;
    try {
      const result = await supabase.rpc('get_policies', { table_name: 'user_settings' });
      policies = result.data;
      policiesError = result.error;
    } catch (error) {
      policiesError = { message: 'get_policies function not available' };
    }

    if (policiesError) {
      console.log('[INFO] Could not check policies directly:', policiesError.message);
    } else if (policies) {
      console.log('[SUCCESS] RLS policies found:', policies.length);
    }

    // Test 4: Try to create a test user settings record
    console.log('\n4. Testing record creation...');
    const testUserId = '4d4bd5d1-1bd9-4945-8466-bd55b6afb3c0'; // From the error
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_settings')
      .insert({
        user_id: testUserId,
        default_layers: [1, 2, 3],
        auto_save: true,
        notifications: true,
        theme: 'dark'
      })
      .select();

    if (insertError) {
      console.log('[ERROR] Insert error:', insertError.message);
      console.log('Error code:', insertError.code);
    } else {
      console.log('[SUCCESS] Test record created successfully');
      
      // Clean up
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', testUserId);
      console.log('[SUCCESS] Test record cleaned up');
    }

    // Test 5: Try to query the specific user
    console.log('\n5. Testing specific user query...');
    const { data: userData, error: userError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUserId);

    if (userError) {
      console.log('[ERROR] User query error:', userError.message);
      console.log('Error code:', userError.code);
    } else {
      console.log('[SUCCESS] User query successful');
      console.log('Records found:', userData?.length || 0);
    }

    // Test 6: Check if there are any existing records
    console.log('\n6. Checking existing records...');
    const { data: allData, error: allError } = await supabase
      .from('user_settings')
      .select('user_id, created_at')
      .limit(5);

    if (allError) {
      console.log('[ERROR] All records query error:', allError.message);
    } else {
      console.log('[SUCCESS] All records query successful');
      console.log('Total records found:', allData?.length || 0);
      if (allData && allData.length > 0) {
        console.log('Sample records:', allData.slice(0, 3));
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

testUserSettingsAccess(); 