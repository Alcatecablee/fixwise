// Create user settings for the specific user
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserSettingsForUser() {
  try {
    console.log('[INFO] Creating user settings for user...');

    const userId = '4d4bd5d1-1bd9-4945-8466-bd55b6afb3c0'; // From the error

    // Check if user settings already exist
    console.log('\n1. Checking existing user settings...');
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId);

    if (checkError) {
      console.log('[ERROR] Check error:', checkError.message);
      return;
    }

    if (existingSettings && existingSettings.length > 0) {
      console.log('[SUCCESS] User settings already exist');
      console.log('Settings:', existingSettings[0]);
      return;
    }

    // Create user settings
    console.log('\n2. Creating user settings...');
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        default_layers: [1, 2, 3],
        auto_save: true,
        notifications: true,
        theme: 'dark'
      })
      .select();

    if (createError) {
      console.log('[ERROR] Create error:', createError.message);
      console.log('Error code:', createError.code);
      return;
    }

    console.log('[SUCCESS] User settings created successfully');
    console.log('New settings:', newSettings[0]);

    // Verify the settings can be queried
    console.log('\n3. Verifying settings can be queried...');
    const { data: verifySettings, error: verifyError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId);

    if (verifyError) {
      console.log('[ERROR] Verify error:', verifyError.message);
    } else {
      console.log('[SUCCESS] Settings verified successfully');
      console.log('Settings found:', verifySettings?.length || 0);
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

createUserSettingsForUser(); 