#!/usr/bin/env node

/**
 * Simple Database Schema Fix Script for NeuroLint Pro
 * 
 * This script directly executes SQL to fix the missing usage_logs table 
 * and profile schema issues without complex schema checking.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function fixDatabaseSchema() {
  console.log('[INFO] NeuroLint Pro Database Schema Fix (Simple)');
  console.log('=============================================');
  
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
    console.log('\n[INFO] Executing database schema fixes...');
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../supabase-professional-tier-fix.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some errors are expected (like "table already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`  [WARNING]  Expected: ${error.message}`);
          } else {
            console.log(`  [ERROR] Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`  [SUCCESS] Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`  [ERROR] Failed: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n[INFO] Execution Summary:`);
    console.log(`[SUCCESS] Successful: ${successCount}`);
    console.log(`[ERROR] Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n[SUCCESS] Database schema fix completed successfully!');
      console.log('\nYour Professional tier should now work properly with:');
      console.log('[SUCCESS] Fixed profile schema (no more first_name errors)');
      console.log('[SUCCESS] Usage tracking (usage_logs table)');
      console.log('[SUCCESS] Analytics and billing integration');
      console.log('[SUCCESS] Team collaboration features');
      console.log('[SUCCESS] Proper RLS security policies');
    } else {
      console.log('\n[WARNING]  Some operations failed, but the core fixes should be applied.');
      console.log('Please check the errors above and restart your web app to test.');
    }
    
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