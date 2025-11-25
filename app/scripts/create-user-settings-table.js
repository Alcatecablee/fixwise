// Create user_settings table
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserSettingsTable() {
  try {
    console.log('[INFO] Creating user_settings table...');

    // Create user_settings table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          default_layers INTEGER[] DEFAULT '{}',
          auto_save BOOLEAN DEFAULT true,
          notifications BOOLEAN DEFAULT true,
          theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });

    if (createError) {
      console.log('[ERROR] Error creating user_settings table:', createError.message);
      
      // Try alternative approach using direct SQL
      const { error: directError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('[INFO] user_settings table does not exist. Creating with direct SQL...');
        
        // Since we can't use RPC, let's just log the SQL that needs to be run
        console.log(`
        Please run this SQL in your Supabase SQL editor:
        
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          default_layers INTEGER[] DEFAULT '{}',
          auto_save BOOLEAN DEFAULT true,
          notifications BOOLEAN DEFAULT true,
          theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        -- Enable RLS
        ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own settings" ON public.user_settings
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own settings" ON public.user_settings
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own settings" ON public.user_settings
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own settings" ON public.user_settings
          FOR DELETE USING (auth.uid() = user_id);
        `);
      }
    } else {
      console.log('[SUCCESS] user_settings table created successfully');
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

createUserSettingsTable(); 