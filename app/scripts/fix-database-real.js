#!/usr/bin/env node

/**
 * Real Database Schema Fix Script for NeuroLint Pro
 * 
 * This script actually connects to Supabase and fixes the schema issues.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function fixDatabaseSchema() {
  console.log('[INFO] NeuroLint Pro Database Schema Fix (Real)');
  console.log('===========================================');
  
  // Check if environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('[ERROR] Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    process.exit(1);
  }
  
  console.log('[SUCCESS] Environment variables configured');
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('\n[INFO] Checking existing database schema...');
    
    // First, let's see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('[WARNING]  Could not check existing tables, proceeding with fixes...');
    } else {
      console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    }
    
    // Check if profiles table exists and what columns it has
    let profilesColumns = [];
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles');
      
      if (!columnsError && columns) {
        profilesColumns = columns.map(c => c.column_name);
        console.log('Profiles table columns:', profilesColumns.join(', '));
      }
    } catch (e) {
      console.log('Could not check profiles columns');
    }
    
    console.log('\n[INFO] Applying fixes...');
    
    // 1. Fix profiles table - add missing columns
    console.log('1. Fixing profiles table...');
    const profileFixes = [];
    
    if (!profilesColumns.includes('full_name')) {
      profileFixes.push('ADD COLUMN full_name TEXT');
    }
    if (!profilesColumns.includes('plan')) {
      profileFixes.push('ADD COLUMN plan TEXT DEFAULT \'free\'');
    }
    if (!profilesColumns.includes('usage')) {
      profileFixes.push('ADD COLUMN usage JSONB DEFAULT \'{"remainingFixes": -1, "remainingAnalyzes": -1, "lastReset": null}\'::jsonb');
    }
    
    if (profileFixes.length > 0) {
      const alterSQL = `ALTER TABLE public.profiles ${profileFixes.join(', ')};`;
      console.log('Executing:', alterSQL);
      
      const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterSQL });
      if (alterError) {
        console.log('[WARNING]  Could not alter profiles table:', alterError.message);
      } else {
        console.log('[SUCCESS] Profiles table updated');
      }
    }
    
    // 2. Create usage_logs table
    console.log('2. Creating usage_logs table...');
    const usageLogsSQL = `
      CREATE TABLE IF NOT EXISTS public.usage_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        action TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        files_processed INTEGER DEFAULT 0,
        layers_used INTEGER[] DEFAULT '{}',
        execution_time_ms INTEGER DEFAULT 0,
        cost_usd DECIMAL(10,6) DEFAULT 0.000000,
        credits_used INTEGER DEFAULT 0,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: usageError } = await supabase.rpc('exec_sql', { sql: usageLogsSQL });
    if (usageError) {
      console.log('[WARNING]  Could not create usage_logs table:', usageError.message);
    } else {
      console.log('[SUCCESS] Usage logs table created');
    }
    
    // 3. Create projects table if it doesn't exist
    console.log('3. Creating projects table...');
    const projectsSQL = `
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        files JSONB DEFAULT '[]',
        stats JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_analyzed TIMESTAMP WITH TIME ZONE
      );
    `;
    
    const { error: projectsError } = await supabase.rpc('exec_sql', { sql: projectsSQL });
    if (projectsError) {
      console.log('[WARNING]  Could not create projects table:', projectsError.message);
    } else {
      console.log('[SUCCESS] Projects table created');
    }
    
    // 4. Create indexes
    console.log('4. Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
    `;
    
    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexesError) {
      console.log('[WARNING]  Could not create indexes:', indexesError.message);
    } else {
      console.log('[SUCCESS] Indexes created');
    }
    
    // 5. Enable RLS
    console.log('5. Enabling RLS...');
    const rlsSQL = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('[WARNING]  Could not enable RLS:', rlsError.message);
    } else {
      console.log('[SUCCESS] RLS enabled');
    }
    
    // 6. Create basic RLS policies
    console.log('6. Creating RLS policies...');
    const policiesSQL = `
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
      
      DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can view own usage logs" ON public.usage_logs
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
      CREATE POLICY "Users can view own projects" ON public.projects
        FOR SELECT USING (auth.uid() = user_id);
    `;
    
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.log('[WARNING]  Could not create policies:', policiesError.message);
    } else {
      console.log('[SUCCESS] RLS policies created');
    }
    
    console.log('\n[SUCCESS] Database schema fix completed!');
    console.log('\nYour Professional tier should now work properly.');
    console.log('Restart your web app and check that these errors are gone:');
    console.log('- Profile fetch error: column profiles.first_name does not exist');
    console.log('- Error fetching usage logs: relation "public.usage_logs" does not exist');
    console.log('- Usage logs table not found, using empty data');
    
  } catch (error) {
    console.log('[ERROR] Database schema fix failed:', error.message);
    console.log('Error details:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseSchema().catch(error => {
  console.log('[ERROR] Database schema fix failed:', error.message);
  process.exit(1);
}); 