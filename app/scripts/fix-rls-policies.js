require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

async function fixRLSPolicies() {
  console.log('Fixing RLS Policies - Infinite Recursion Issue');
  console.log('===============================================');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local');
    console.error('Current environment:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    process.exit(1);
  }
  
  console.log('Environment variables configured ✓');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('Testing current team_members query to reproduce the error...');
    
    // Test the current query that's causing the infinite recursion
    const { data: testData, error: testError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('Current error reproduced:', testError.message);
      
      if (testError.message.includes('infinite recursion')) {
        console.log('');
        console.log('Infinite recursion confirmed. This needs to be fixed in the database.');
        console.log('');
        console.log('SOLUTION:');
        console.log('1. Access your Supabase dashboard');
        console.log('2. Go to Authentication > Policies');
        console.log('3. Find the "team_members" table');
        console.log('4. Drop the policy "Team members can view team membership"');
        console.log('5. Create a new policy with this SQL:');
        console.log('');
        console.log('CREATE POLICY "Team members can view team membership" ON public.team_members');
        console.log('  FOR SELECT USING (');
        console.log('    user_id::uuid = auth.uid()::uuid OR');
        console.log('    EXISTS (');
        console.log('      SELECT 1 FROM public.teams');
        console.log('      WHERE id = team_members.team_id AND owner_id::uuid = auth.uid()::uuid');
        console.log('    )');
        console.log('  );');
        console.log('');
        console.log('6. Also fix the collaboration_participants policy:');
        console.log('');
        console.log('CREATE POLICY "Participants can view session participants" ON public.collaboration_participants');
        console.log('  FOR SELECT USING (');
        console.log('    user_id::uuid = auth.uid()::uuid OR');
        console.log('    EXISTS (');
        console.log('      SELECT 1 FROM public.collaboration_sessions');
        console.log('      WHERE id = collaboration_participants.session_id AND host_user_id::uuid = auth.uid()::uuid');
        console.log('    )');
        console.log('  );');
        console.log('');
        console.log('The issue is that the current policies reference the same table they protect,');
        console.log('causing infinite recursion when Supabase tries to evaluate the policy.');
      }
    } else {
      console.log('Query successful - no infinite recursion detected');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixRLSPolicies();
}

module.exports = { fixRLSPolicies }; 