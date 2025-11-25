#!/usr/bin/env node

/**
 * Database Schema Fix Script for NeuroLint Pro
 * 
 * This script fixes the missing usage_logs table and profile schema issues
 * that are preventing the Professional tier from working properly.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function fixDatabaseSchema() {
  console.log('[INFO] NeuroLint Pro Database Schema Fix');
  console.log('====================================');
  
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
    console.log('\nPlease set these in your .env.local file before running this script.');
    process.exit(1);
  }
  
  console.log('[SUCCESS] Environment variables configured');
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('\n[INFO] Fixing database schema...');
    
    // 1. Fix profiles table schema
    console.log('1. Fixing profiles table schema...');
    await fixProfilesTable(supabase);
    
    // 2. Create usage_logs table
    console.log('2. Creating usage_logs table...');
    await createUsageLogsTable(supabase);
    
    // 3. Create missing collaboration tables
    console.log('3. Creating collaboration tables...');
    await createCollaborationTables(supabase);
    
    // 4. Create missing billing tables
    console.log('4. Creating billing tables...');
    await createBillingTables(supabase);
    
    // 5. Create indexes for performance
    console.log('5. Creating performance indexes...');
    await createIndexes(supabase);
    
    // 6. Set up RLS policies
    console.log('6. Setting up RLS policies...');
    await setupRLSPolicies(supabase);
    
    console.log('\n[SUCCESS] Database schema fix completed successfully!');
    console.log('\n[SUCCESS] Your Professional tier should now work properly with:');
    console.log('[SUCCESS] Fixed profile schema (no more first_name errors)');
    console.log('[SUCCESS] Usage tracking (usage_logs table)');
    console.log('[SUCCESS] Analytics and billing integration');
    console.log('[SUCCESS] Team collaboration features');
    console.log('[SUCCESS] Proper RLS security policies');
    
  } catch (error) {
    console.log('[ERROR] Database schema fix failed:', error.message);
    console.log('Error details:', error);
    process.exit(1);
  }
}

async function fixProfilesTable(supabase) {
  // Check if profiles table exists and has correct schema
  const { data: existingColumns, error: columnError } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'profiles')
    .eq('table_schema', 'public');
  
  if (columnError) {
    throw new Error(`Failed to check profiles table: ${columnError.message}`);
  }
  
  const columnNames = existingColumns.map(col => col.column_name);
  
  // Add missing columns if they don't exist
  const missingColumns = [];
  
  if (!columnNames.includes('full_name')) {
    missingColumns.push(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS first_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 1)) STORED,
      ADD COLUMN IF NOT EXISTS last_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 2)) STORED;
    `);
  }
  
  if (!columnNames.includes('plan')) {
    missingColumns.push(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'professional', 'business', 'enterprise')),
      ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'suspended', 'trial')),
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS subscription_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
    `);
  }
  
  if (!columnNames.includes('usage')) {
    missingColumns.push(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{"remainingFixes": -1, "remainingAnalyzes": -1, "lastReset": null}'::jsonb;
    `);
  }
  
  // Execute missing column additions
  for (const sql of missingColumns) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log(`Warning: Could not add column: ${error.message}`);
    }
  }
  
  // Create profiles table if it doesn't exist
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        first_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 1)) STORED,
        last_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 2)) STORED,
        avatar_url TEXT,
        email_confirmed BOOLEAN DEFAULT FALSE,
        plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'professional', 'business', 'enterprise')),
        subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'suspended', 'trial')),
        trial_ends_at TIMESTAMP WITH TIME ZONE,
        subscription_id TEXT,
        payment_method TEXT DEFAULT 'card',
        usage JSONB DEFAULT '{"remainingFixes": -1, "remainingAnalyzes": -1, "lastReset": null}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (createError) {
    console.log(`Warning: Could not create profiles table: ${createError.message}`);
  }
}

async function createUsageLogsTable(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.usage_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('analyze', 'fix', 'scan', 'export', 'api_call')),
        metadata JSONB DEFAULT '{}'::jsonb,
        files_processed INTEGER DEFAULT 0,
        layers_used INTEGER[] DEFAULT '{}',
        execution_time_ms INTEGER DEFAULT 0,
        cost_usd DECIMAL(10,6) DEFAULT 0.000000,
        credits_used INTEGER DEFAULT 0,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action ON public.usage_logs(user_id, action);
    `
  });
  
  if (error) {
    throw new Error(`Failed to create usage_logs table: ${error.message}`);
  }
}

async function createCollaborationTables(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Collaboration sessions table
      CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE
      );
      
      -- Collaboration participants table
      CREATE TABLE IF NOT EXISTS public.collaboration_participants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        left_at TIMESTAMP WITH TIME ZONE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, user_id)
      );
      
      -- Collaboration comments table
      CREATE TABLE IF NOT EXISTS public.collaboration_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT,
        line_number INTEGER,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Teams table
      CREATE TABLE IF NOT EXISTS public.teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Team members table
      CREATE TABLE IF NOT EXISTS public.team_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `
  });
  
  if (error) {
    throw new Error(`Failed to create collaboration tables: ${error.message}`);
  }
}

async function createBillingTables(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Project subscriptions table
      CREATE TABLE IF NOT EXISTS public.project_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        plan TEXT NOT NULL CHECK (plan IN ('free', 'professional', 'business', 'enterprise')),
        billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'suspended', 'trial')),
        current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        current_period_end TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(project_id)
      );
      
      -- Project usage table
      CREATE TABLE IF NOT EXISTS public.project_usage (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        current_month TEXT NOT NULL,
        monthly_fix_count INTEGER DEFAULT 0,
        total_fix_count INTEGER DEFAULT 0,
        last_fix_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(project_id, current_month)
      );
      
      -- Billing cycles table
      CREATE TABLE IF NOT EXISTS public.billing_cycles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
        cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
        plan TEXT NOT NULL,
        fixes_used INTEGER DEFAULT 0,
        fixes_limit INTEGER DEFAULT -1,
        cost_usd DECIMAL(10,4) DEFAULT 0.0000,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'billed', 'overdue')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (error) {
    throw new Error(`Failed to create billing tables: ${error.message}`);
  }
}

async function createIndexes(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Performance indexes for collaboration
      CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_owner_id ON public.collaboration_sessions(owner_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON public.collaboration_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session_id ON public.collaboration_participants(session_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user_id ON public.collaboration_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_comments_session_id ON public.collaboration_comments(session_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_comments_user_id ON public.collaboration_comments(user_id);
      
      -- Performance indexes for billing
      CREATE INDEX IF NOT EXISTS idx_project_subscriptions_user_id ON public.project_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_project_subscriptions_plan ON public.project_subscriptions(plan);
      CREATE INDEX IF NOT EXISTS idx_project_usage_project_id ON public.project_usage(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_usage_current_month ON public.project_usage(current_month);
      CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON public.billing_cycles(user_id);
      CREATE INDEX IF NOT EXISTS idx_billing_cycles_cycle_start ON public.billing_cycles(cycle_start DESC);
      
      -- Performance indexes for teams
      CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
    `
  });
  
  if (error) {
    throw new Error(`Failed to create indexes: ${error.message}`);
  }
}

async function setupRLSPolicies(supabase) {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Enable RLS on all tables
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaboration_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_usage ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
      
      -- Profiles policies
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
      
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
      
      -- Usage logs policies
      DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can view own usage logs" ON public.usage_logs
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
      CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      -- Collaboration policies
      DROP POLICY IF EXISTS "Users can view sessions they own or participate in" ON public.collaboration_sessions;
      CREATE POLICY "Users can view sessions they own or participate in" ON public.collaboration_sessions
        FOR SELECT USING (
          auth.uid() = owner_id OR 
          auth.uid() IN (
            SELECT user_id FROM public.collaboration_participants 
            WHERE session_id = id
          )
        );
      
      -- Billing policies
      DROP POLICY IF EXISTS "Users can view own billing data" ON public.project_subscriptions;
      CREATE POLICY "Users can view own billing data" ON public.project_subscriptions
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can view own usage data" ON public.project_usage;
      CREATE POLICY "Users can view own usage data" ON public.project_usage
        FOR SELECT USING (auth.uid() = user_id);
    `
  });
  
  if (error) {
    throw new Error(`Failed to setup RLS policies: ${error.message}`);
  }
}

// Run the fix
fixDatabaseSchema().catch(error => {
  console.log('[ERROR] Database schema fix failed:', error.message);
  process.exit(1);
}); 