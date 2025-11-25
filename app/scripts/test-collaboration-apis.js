require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jetwhffgmohdkquegtjh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldHdoZmZnbW9oZHFrdWVndGpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA3MjQyNywiZXhwIjoyMDY0NjQ4NDI3fQ.JnZiO1qf4R_aXClRvSSJ6Xmk2KsvwAudvrIaEBNexuM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCollaborationAPIs() {
  console.log('🧪 Testing Collaboration APIs...\n');

  try {
    // Test 1: Check if collaboration_sessions table exists
    console.log('1. Checking collaboration_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('collaboration_sessions')
      .select('id, name')
      .limit(1);

    if (sessionsError) {
      console.log('[ERROR] collaboration_sessions table error:', sessionsError.message);
    } else {
      console.log('[SUCCESS] collaboration_sessions table exists');
      console.log(`   Found ${sessions?.length || 0} sessions`);
    }

    // Test 2: Check if collaboration_analyses table exists
    console.log('\n2. Checking collaboration_analyses table...');
    const { data: analyses, error: analysesError } = await supabase
      .from('collaboration_analyses')
      .select('id')
      .limit(1);

    if (analysesError) {
      console.log('[ERROR] collaboration_analyses table error:', analysesError.message);
      console.log('   This table needs to be created. Run the SQL script in Supabase dashboard.');
    } else {
      console.log('[SUCCESS] collaboration_analyses table exists');
      console.log(`   Found ${analyses?.length || 0} analyses`);
    }

    // Test 3: Check if collaboration_participants table exists
    console.log('\n3. Checking collaboration_participants table...');
    const { data: participants, error: participantsError } = await supabase
      .from('collaboration_participants')
      .select('id')
      .limit(1);

    if (participantsError) {
      console.log('[ERROR] collaboration_participants table error:', participantsError.message);
    } else {
      console.log('[SUCCESS] collaboration_participants table exists');
      console.log(`   Found ${participants?.length || 0} participants`);
    }

    // Test 4: Check if collaboration_comments table exists
    console.log('\n4. Checking collaboration_comments table...');
    const { data: comments, error: commentsError } = await supabase
      .from('collaboration_comments')
      .select('id')
      .limit(1);

    if (commentsError) {
      console.log('[ERROR] collaboration_comments table error:', commentsError.message);
    } else {
      console.log('[SUCCESS] collaboration_comments table exists');
      console.log(`   Found ${comments?.length || 0} comments`);
    }

    // Test 5: Create a test session
    console.log('\n5. Testing session creation...');
    const testSession = {
      name: 'Test Session',
      description: 'Test session for API validation',
      host_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      document_content: '// Test code\nconsole.log("Hello World");',
      filename: 'test.js',
      language: 'javascript',
      is_active: true,
      is_public: true
    };

    const { data: newSession, error: createError } = await supabase
      .from('collaboration_sessions')
      .insert(testSession)
      .select()
      .single();

    if (createError) {
      console.log('[ERROR] Session creation error:', createError.message);
    } else {
      console.log('[SUCCESS] Test session created successfully');
      console.log(`   Session ID: ${newSession.id}`);

      // Clean up test session
      await supabase
        .from('collaboration_sessions')
        .delete()
        .eq('id', newSession.id);
      console.log('   Test session cleaned up');
    }

    console.log('\n[SUCCESS] API testing completed!');

  } catch (error) {
    console.error('[ERROR] Test failed:', error);
  }
}

testCollaborationAPIs(); 