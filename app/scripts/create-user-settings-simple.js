// Create user_settings table using Supabase client
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserSettingsTable() {
  try {
    console.log('[INFO] Creating user_settings table...');

    // Try to create the table using a simple insert that will fail if table doesn't exist
    const { error: testError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('[INFO] user_settings table does not exist.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Create user_settings table');
      console.log('CREATE TABLE IF NOT EXISTS public.user_settings (');
      console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
      console.log('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,');
      console.log('  default_layers INTEGER[] DEFAULT \'{}\',');
      console.log('  auto_save BOOLEAN DEFAULT true,');
      console.log('  notifications BOOLEAN DEFAULT true,');
      console.log('  theme TEXT DEFAULT \'dark\' CHECK (theme IN (\'dark\', \'light\')),');
      console.log('  email_notifications BOOLEAN DEFAULT true,');
      console.log('  webhook_notifications BOOLEAN DEFAULT false,');
      console.log('  onboarding_completed BOOLEAN DEFAULT false,');
      console.log('  onboarding_data JSONB DEFAULT \'{}\'::jsonb,');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  UNIQUE(user_id)');
      console.log(');');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create RLS policies');
      console.log('CREATE POLICY "Users can view their own settings" ON public.user_settings');
      console.log('  FOR SELECT USING (auth.uid() = user_id);');
      console.log('');
      console.log('CREATE POLICY "Users can insert their own settings" ON public.user_settings');
      console.log('  FOR INSERT WITH CHECK (auth.uid() = user_id);');
      console.log('');
      console.log('CREATE POLICY "Users can update their own settings" ON public.user_settings');
      console.log('  FOR UPDATE USING (auth.uid() = user_id);');
      console.log('');
      console.log('CREATE POLICY "Users can delete their own settings" ON public.user_settings');
      console.log('  FOR DELETE USING (auth.uid() = user_id);');
      console.log('');
      console.log('-- Create index for performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);');
      console.log('');
      console.log('-- Create trigger for updated_at');
      console.log('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      console.log('RETURNS TRIGGER AS $$');
      console.log('BEGIN');
      console.log('    NEW.updated_at = NOW();');
      console.log('    RETURN NEW;');
      console.log('END;');
      console.log('$$ language \'plpgsql\';');
      console.log('');
      console.log('CREATE TRIGGER update_user_settings_updated_at');
      console.log('  BEFORE UPDATE ON public.user_settings');
      console.log('  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
      console.log('');
      console.log('After running this SQL, restart your development server.');
    } else if (testError) {
      console.log('[ERROR] Error checking table:', testError.message);
    } else {
      console.log('[SUCCESS] user_settings table already exists');
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

createUserSettingsTable(); 