// Check user and RLS policies
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserAndRLS() {
  try {
    console.log('[INFO] Checking user and RLS policies...');

    const testUserId = '4d4bd5d1-1bd9-4945-8466-bd55b6afb3c0'; // From the error

    // Test 1: Check if user exists in auth.users
    console.log('\n1. Checking if user exists in auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId);

    if (authError) {
      console.log('[ERROR] Auth user check error:', authError.message);
      console.log('This might be the cause of the 406 error - user not found in auth.users');
    } else {
      console.log('[SUCCESS] User exists in auth.users');
      console.log('User email:', authUser.user.email);
      console.log('User created:', authUser.user.created_at);
    }

    // Test 2: Check if user has any settings
    console.log('\n2. Checking existing user settings...');
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUserId);

    if (settingsError) {
      console.log('[ERROR] Settings query error:', settingsError.message);
    } else {
      console.log('[SUCCESS] Settings query successful');
      console.log('Existing settings count:', existingSettings?.length || 0);
      if (existingSettings && existingSettings.length > 0) {
        console.log('Settings:', existingSettings[0]);
      }
    }

    // Test 3: Test RLS by creating a user settings record
    console.log('\n3. Testing RLS with user settings creation...');
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({
        user_id: testUserId,
        default_layers: [1, 2, 3],
        auto_save: true,
        notifications: true,
        theme: 'dark'
      })
      .select();

    if (createError) {
      console.log('[ERROR] Create error:', createError.message);
      console.log('Error code:', createError.code);
    } else {
      console.log('[SUCCESS] Settings created successfully');
      console.log('New settings:', newSettings[0]);
    }

    // Test 4: Test querying with the created settings
    console.log('\n4. Testing query with created settings...');
    const { data: querySettings, error: queryError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUserId);

    if (queryError) {
      console.log('[ERROR] Query error:', queryError.message);
      console.log('Error code:', queryError.code);
    } else {
      console.log('[SUCCESS] Query successful');
      console.log('Settings found:', querySettings?.length || 0);
    }

    // Test 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.log('[ERROR] Delete error:', deleteError.message);
    } else {
      console.log('[SUCCESS] Test data cleaned up');
    }

    // Test 6: Check RLS policies manually
    console.log('\n6. Checking RLS policies manually...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'user_settings')
      .eq('table_schema', 'public');

    if (policiesError) {
      console.log('[ERROR] Policies query error:', policiesError.message);
    } else {
      console.log('[SUCCESS] RLS policies found:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`Policy ${index + 1}: ${policy.policy_name}`);
          console.log(`  Action: ${policy.action}`);
          console.log(`  Definition: ${policy.definition}`);
        });
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

checkUserAndRLS(); 