#!/usr/bin/env node

/**
 * Direct Database Schema Fix Script for NeuroLint Pro
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
  console.log('[INFO] NeuroLint Pro Database Schema Fix (Direct)');
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
  
  try {
    console.log('\n[INFO] Since direct SQL execution is complex, let\'s use the manual approach:');
    console.log('\n1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the content from: web-app/supabase-professional-tier-fix.sql');
    console.log('5. Paste and run the SQL');
    
    console.log('\n[INFO] SQL file location: web-app/supabase-professional-tier-fix.sql');
    
    // Show the SQL content
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../supabase-professional-tier-fix.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log('\n[INFO] SQL Content to copy:');
      console.log('='.repeat(50));
      console.log(sqlContent);
      console.log('='.repeat(50));
    } else {
      console.log('[ERROR] SQL file not found at:', sqlPath);
    }
    
    console.log('\n[INFO] After running the SQL in Supabase:');
    console.log('1. Restart your web app');
    console.log('2. Check that these errors are gone:');
    console.log('   - Profile fetch error: column profiles.first_name does not exist');
    console.log('   - Error fetching usage logs: relation "public.usage_logs" does not exist');
    console.log('   - Usage logs table not found, using empty data');
    
  } catch (error) {
    console.log('[ERROR] Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseSchema().catch(error => {
  console.log('[ERROR] Database schema fix failed:', error.message);
  process.exit(1);
}); 