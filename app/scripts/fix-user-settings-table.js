// Fix user_settings table using Supabase REST API
require('dotenv').config({ path: '.env.local' });

const fetch = require('node-fetch');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function executeSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function fixUserSettingsTable() {
  try {
    console.log('[INFO] Fixing user_settings table...');

    // First, check if the table exists
    const checkTableSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings'
      );
    `;

    const tableExists = await executeSQL(checkTableSQL);
    console.log('Table exists check result:', tableExists);

    if (!tableExists || !tableExists[0]?.exists) {
      console.log('[INFO] Creating user_settings table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          default_layers INTEGER[] DEFAULT '{}',
          auto_save BOOLEAN DEFAULT true,
          notifications BOOLEAN DEFAULT true,
          theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
          email_notifications BOOLEAN DEFAULT true,
          webhook_notifications BOOLEAN DEFAULT false,
          onboarding_completed BOOLEAN DEFAULT false,
          onboarding_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `;

      await executeSQL(createTableSQL);
      console.log('[SUCCESS] Table created successfully');

      // Enable RLS
      await executeSQL('ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;');
      console.log('[SUCCESS] RLS enabled');

      // Create RLS policies
      const policies = [
        `CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);`,
        `CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        `CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);`,
        `CREATE POLICY "Users can delete their own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);`
      ];

      for (const policy of policies) {
        try {
          await executeSQL(policy);
          console.log('[SUCCESS] Policy created:', policy.split('"')[1]);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('[INFO] Policy already exists:', policy.split('"')[1]);
          } else {
            console.error('[ERROR] Error creating policy:', error.message);
          }
        }
      }

      // Create index
      await executeSQL('CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);');
      console.log('[SUCCESS] Index created');

      // Create trigger function if it doesn't exist
      const triggerFunctionSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `;

      await executeSQL(triggerFunctionSQL);
      console.log('[SUCCESS] Trigger function created');

      // Create trigger
      const triggerSQL = `
        DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
        CREATE TRIGGER update_user_settings_updated_at 
          BEFORE UPDATE ON public.user_settings 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;

      await executeSQL(triggerSQL);
      console.log('[SUCCESS] Trigger created');

    } else {
      console.log('[SUCCESS] user_settings table already exists');
    }

    console.log('[SUCCESS] user_settings table setup completed successfully!');

  } catch (error) {
    console.error('[ERROR] Error fixing user_settings table:', error.message);
    
    if (error.message.includes('exec_sql')) {
      console.log(`
      The exec_sql function is not available. Please run this SQL manually in your Supabase SQL editor:
      
      ${fs.readFileSync('./user-settings-table.sql', 'utf8')}
      `);
    }
  }
}

fixUserSettingsTable(); 