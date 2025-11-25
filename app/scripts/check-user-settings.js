require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserSettings() {
  console.log('[INFO] Checking user_settings table structure...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] Missing Supabase environment variables');
    process.exit(1);
  }

  try {
    // Test 1: Check if user_settings table exists
    console.log('\n[INFO] Test 1: Checking if user_settings table exists...');
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('[ERROR] User settings query error:', settingsError.message);
    } else {
      console.log('[SUCCESS] User settings table exists');
      if (settings && settings.length > 0) {
        console.log('[INFO] Sample user_settings columns:', Object.keys(settings[0]));
      } else {
        console.log('[INFO] No user_settings records found');
      }
    }

    // Test 2: Try to create a user_settings record with minimal fields
    console.log('\n[INFO] Test 2: Testing user_settings creation with minimal fields...');
    const testUserId = '4d4bd5d1-1bd9-4945-8466-bd55b6afb3c0';
    
    const { data: newSetting, error: createError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: testUserId,
        theme: 'dark'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('[ERROR] User settings creation error:', createError.message);
      
      // Try to get more info about the table structure
      console.log('\n[INFO] Test 3: Trying to get table info...');
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_settings' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
      
      if (tableError) {
        console.log('[ERROR] Cannot get table info (exec_sql not available):', tableError.message);
      } else {
        console.log('[SUCCESS] User_settings table structure:', tableInfo);
      }
    } else {
      console.log('[SUCCESS] User settings created/updated:', newSetting);
    }

    // Test 4: Check if there are any users in the system
    console.log('\n[INFO] Test 4: Checking for users in the system...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .limit(10);
    
    if (profilesError) {
      console.log('[ERROR] Profiles query error:', profilesError.message);
    } else {
      console.log('[SUCCESS] Found', allProfiles?.length || 0, 'user profiles');
      if (allProfiles && allProfiles.length > 0) {
        console.log('[INFO] Sample profiles:', allProfiles.slice(0, 3));
      }
    }

    console.log('\n[INFO] User settings check completed!');

  } catch (error) {
    console.error('[ERROR] Error checking user settings:', error);
  }
}

checkUserSettings().then(() => {
  console.log('\n🏁 User settings check completed');
  process.exit(0);
}).catch((error) => {
  console.error('[ERROR] Check failed:', error);
  process.exit(1);
}); 