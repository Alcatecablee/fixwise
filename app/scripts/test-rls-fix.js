require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testRLSFix() {
  console.log('Testing RLS Policy Fix');
  console.log('======================');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('Testing team_members query...');
    
    // Test 1: Simple query to team_members
    const { data: teamMembersData, error: teamMembersError } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role')
      .limit(5);
    
    if (teamMembersError) {
      console.log('[ERROR] team_members query failed:', teamMembersError.message);
      if (teamMembersError.message.includes('infinite recursion')) {
        console.log('   The infinite recursion issue is still present.');
        console.log('   Please ensure you have applied the SQL fix in Supabase dashboard.');
      }
    } else {
      console.log('[SUCCESS] team_members query successful');
      console.log(`   Found ${teamMembersData?.length || 0} records`);
    }
    
    console.log('\nTesting collaboration_participants query...');
    
    // Test 2: Simple query to collaboration_participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('collaboration_participants')
      .select('id, session_id, user_id, role')
      .limit(5);
    
    if (participantsError) {
      console.log('[ERROR] collaboration_participants query failed:', participantsError.message);
      if (participantsError.message.includes('infinite recursion')) {
        console.log('   The infinite recursion issue is still present.');
        console.log('   Please ensure you have applied the SQL fix in Supabase dashboard.');
      }
    } else {
      console.log('[SUCCESS] collaboration_participants query successful');
      console.log(`   Found ${participantsData?.length || 0} records`);
    }
    
    console.log('\nTesting teams query...');
    
    // Test 3: Query teams table
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, owner_id')
      .limit(5);
    
    if (teamsError) {
      console.log('[ERROR] teams query failed:', teamsError.message);
    } else {
      console.log('[SUCCESS] teams query successful');
      console.log(`   Found ${teamsData?.length || 0} records`);
    }
    
    console.log('\nSummary:');
    if (!teamMembersError && !participantsError && !teamsError) {
      console.log('[SUCCESS] All queries successful! The RLS policies are working correctly.');
      console.log('   The infinite recursion issue has been resolved.');
    } else {
      console.log('[WARNING]  Some queries failed. Please check the error messages above.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRLSFix();
}

module.exports = { testRLSFix }; 