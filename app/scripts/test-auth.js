require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuth() {
  console.log('🔐 Testing authentication...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] Missing Supabase environment variables');
    process.exit(1);
  }

  try {
    // Test 1: Check if we can access auth.users table
    console.log('\n[INFO] Test 1: Checking auth.users table access...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5);
    
    if (usersError) {
      console.log('[ERROR] Auth users query error:', usersError.message);
    } else {
      console.log('[SUCCESS] Auth users query successful, found', users?.length || 0, 'users');
    }

    // Test 2: Check if we can access profiles table
    console.log('\n[INFO] Test 2: Checking profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5);
    
    if (profilesError) {
      console.log('[ERROR] Profiles query error:', profilesError.message);
    } else {
      console.log('[SUCCESS] Profiles query successful, found', profiles?.length || 0, 'profiles');
    }

    // Test 3: Test with a dummy user ID
    console.log('\n[INFO] Test 3: Testing with dummy user ID...');
    const dummyUserId = '4d4bd5d1-1bd9-4945-8466-bd55b6afb3c0'; // From the error logs
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', dummyUserId)
      .single();
    
    if (profileError) {
      console.log('[ERROR] User profile query error:', profileError.message);
    } else {
      console.log('[SUCCESS] User profile found:', userProfile);
    }

    // Test 4: Test user_settings table
    console.log('\n[INFO] Test 4: Testing user_settings table...');
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', dummyUserId)
      .single();
    
    if (settingsError) {
      console.log('[ERROR] User settings query error:', settingsError.message);
      if (settingsError.code === 'PGRST116') {
        console.log('[INFO] User settings not found - this is normal for new users');
      }
    } else {
      console.log('[SUCCESS] User settings found:', userSettings);
    }

    // Test 5: Test creating a user setting
    console.log('\n[INFO] Test 5: Testing user settings creation...');
    const { data: newSetting, error: createError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: dummyUserId,
        theme: 'dark',
        notifications_enabled: true,
        collaboration_enabled: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log('[ERROR] User settings creation error:', createError.message);
    } else {
      console.log('[SUCCESS] User settings created/updated:', newSetting);
    }

    console.log('\n[INFO] Authentication tests completed!');

  } catch (error) {
    console.error('[ERROR] Error testing authentication:', error);
  }
}

testAuth().then(() => {
  console.log('\n🏁 Authentication testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('[ERROR] Testing failed:', error);
  process.exit(1);
}); 