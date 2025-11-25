#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('Database Setup Instructions');
  console.log('==========================');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }
  
  console.log('Environment variables configured ✓');
  
  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-collaboration-tables-fixed.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Create a copy for easy access
    const outputPath = path.join(__dirname, '..', 'database-schema.sql');
    fs.writeFileSync(outputPath, schema);
    
    console.log('SQL schema extracted and saved to database-schema.sql ✓');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the contents of database-schema.sql');
    console.log('5. Paste and run the SQL commands');
    console.log('');
    console.log('After running the schema, your application will have:');
    console.log('✓ Collaboration sessions management');
    console.log('✓ Team management');
    console.log('✓ User settings storage');
    console.log('✓ Real-time collaboration features');
    console.log('');
    console.log('Schema file location:', outputPath);
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error); 