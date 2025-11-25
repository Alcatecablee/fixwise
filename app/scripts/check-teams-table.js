// Check teams table structure specifically
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTeamsTable() {
  try {
    console.log('[INFO] Checking teams table structure...\n');

    // Try to get actual data from teams table
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(5);

    if (teamsError) {
      console.log('[ERROR] Teams table error:', teamsError.message);
      return;
    }

    console.log('[SUCCESS] Teams table exists');
    
    if (teamsData && teamsData.length > 0) {
      console.log('[INFO] Teams table columns:', Object.keys(teamsData[0]));
      console.log('\n[INFO] Sample team data:');
      console.log(JSON.stringify(teamsData[0], null, 2));
    } else {
      console.log('[INFO] Teams table is empty');
    }

    // Try to get team_members data
    console.log('\n[INFO] Checking team_members table structure...');
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .limit(5);

    if (membersError) {
      console.log('[ERROR] Team members table error:', membersError.message);
    } else {
      console.log('[SUCCESS] Team members table exists');
      if (membersData && membersData.length > 0) {
        console.log('[INFO] Team members columns:', Object.keys(membersData[0]));
        console.log('\n[INFO] Sample team member data:');
        console.log(JSON.stringify(membersData[0], null, 2));
      } else {
        console.log('[INFO] Team members table is empty');
      }
    }

  } catch (error) {
    console.error('[ERROR] Error checking teams table:', error);
  }
}

checkTeamsTable(); 