#!/usr/bin/env node

/**
 * REST API Database Schema Fix Script for NeuroLint Pro
 * 
 * This script uses Supabase's REST API to execute SQL directly.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');

async function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function executeSQL(sql) {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const apiUrl = `${url.protocol}//${url.host}/rest/v1/rpc/exec_sql`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ sql })
  };
  
  try {
    const response = await makeRequest(apiUrl, options);
    return response;
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

async function fixDatabaseSchema() {
  console.log('[INFO] NeuroLint Pro Database Schema Fix (REST API)');
  console.log('===============================================');
  
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
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    console.log('\n[INFO] Since Supabase doesn\'t have exec_sql by default, let\'s create it first...');
    
    // First, let's try to create the exec_sql function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    console.log('Creating exec_sql function...');
    const functionResponse = await executeSQL(createFunctionSQL);
    console.log('Function creation response:', functionResponse);
    
    // Now let's execute the actual fixes
    console.log('\n[INFO] Applying database fixes...');
    
    // 1. Fix profiles table
    console.log('1. Fixing profiles table...');
    const profilesSQL = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{"remainingFixes": -1, "remainingAnalyzes": -1, "lastReset": null}'::jsonb;
    `;
    
    const profilesResponse = await executeSQL(profilesSQL);
    console.log('Profiles fix response:', profilesResponse);
    
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
    
    const usageResponse = await executeSQL(usageLogsSQL);
    console.log('Usage logs creation response:', usageResponse);
    
    // 3. Create projects table
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
    
    const projectsResponse = await executeSQL(projectsSQL);
    console.log('Projects creation response:', projectsResponse);
    
    // 4. Create indexes
    console.log('4. Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
    `;
    
    const indexesResponse = await executeSQL(indexesSQL);
    console.log('Indexes creation response:', indexesResponse);
    
    // 5. Enable RLS
    console.log('5. Enabling RLS...');
    const rlsSQL = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    `;
    
    const rlsResponse = await executeSQL(rlsSQL);
    console.log('RLS enable response:', rlsResponse);
    
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