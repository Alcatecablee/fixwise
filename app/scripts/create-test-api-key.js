require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERROR] Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate API key functions
function generateApiKey() {
  return 'nlp_' + crypto.randomBytes(32).toString('hex');
}

function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function createTestApiKey() {
  try {
    console.log('🔑 Creating test API key...');
    
    // First, let's check if there are any existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('[ERROR] Failed to list users:', usersError);
      return;
    }
    
    if (!users.users || users.users.length === 0) {
      console.error('[ERROR] No users found in the database');
      console.log('Please create a user account first through the web interface');
      return;
    }
    
    // Use the first available user
    const testUser = users.users[0];
    console.log('Using user:', testUser.email, 'ID:', testUser.id);
    
    // Generate the API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    
    console.log('Generated API Key:', apiKey);
    console.log('Key Hash:', keyHash);
    
    // Insert the API key into the database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: testUser.id,
        name: 'Test CLI Key',
        key_hash: keyHash,
        permissions: ['analyze', 'projects'],
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[ERROR] Failed to create API key:', error);
      return;
    }
    
    console.log('[SUCCESS] API key created successfully!');
    console.log('API Key ID:', data.id);
    console.log('Full API Key:', apiKey);
    console.log('\nYou can now use this key with the CLI:');
    console.log(`node cli.js login ${apiKey}`);
    
  } catch (error) {
    console.error('[ERROR] Error creating test API key:', error);
  }
}

// Test API key validation
async function testApiKeyValidation(apiKey) {
  try {
    console.log('\n[INFO] Testing API key validation...');
    
    const keyHash = hashApiKey(apiKey);
    console.log('Looking for key hash:', keyHash);
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('[ERROR] API key validation failed:', error);
      return false;
    }
    
    if (!data) {
      console.error('[ERROR] API key not found in database');
      return false;
    }
    
    console.log('[SUCCESS] API key found in database!');
    console.log('Key ID:', data.id);
    console.log('User ID:', data.user_id);
    console.log('Name:', data.name);
    console.log('Is Active:', data.is_active);
    
    return true;
  } catch (error) {
    console.error('[ERROR] Error testing API key validation:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'test') {
    // Test existing API key
    const apiKey = args[1];
    if (!apiKey) {
      console.error('[ERROR] Please provide an API key to test');
      console.log('Usage: node create-test-api-key.js test <api-key>');
      process.exit(1);
    }
    
    await testApiKeyValidation(apiKey);
  } else {
    // Create new test API key
    await createTestApiKey();
  }
}

main().catch(console.error); 