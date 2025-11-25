require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSchema() {
  console.log('[INFO] Checking database schema...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] Missing Supabase environment variables');
    process.exit(1);
  }

  try {
    // Check if team_members table exists
    console.log('\n[INFO] Checking team_members table...');
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (teamMembersError) {
      console.log('[ERROR] team_members table error:', teamMembersError.message);
    } else {
      console.log('[SUCCESS] team_members table exists and is accessible');
    }

    // Check if teams table exists
    console.log('\n[INFO] Checking teams table...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .limit(1);
    
    if (teamsError) {
      console.log('[ERROR] teams table error:', teamsError.message);
    } else {
      console.log('[SUCCESS] teams table exists and is accessible');
    }

    // Check if collaboration_sessions table exists
    console.log('\n[INFO] Checking collaboration_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('collaboration_sessions')
      .select('id')
      .limit(1);
    
    if (sessionsError) {
      console.log('[ERROR] collaboration_sessions table error:', sessionsError.message);
    } else {
      console.log('[SUCCESS] collaboration_sessions table exists and is accessible');
    }

    // Check if collaboration_participants table exists
    console.log('\n[INFO] Checking collaboration_participants table...');
    const { data: participants, error: participantsError } = await supabase
      .from('collaboration_participants')
      .select('id')
      .limit(1);
    
    if (participantsError) {
      console.log('[ERROR] collaboration_participants table error:', participantsError.message);
    } else {
      console.log('[SUCCESS] collaboration_participants table exists and is accessible');
    }

    // Check if collaboration_comments table exists
    console.log('\n[INFO] Checking collaboration_comments table...');
    const { data: comments, error: commentsError } = await supabase
      .from('collaboration_comments')
      .select('id')
      .limit(1);
    
    if (commentsError) {
      console.log('[ERROR] collaboration_comments table error:', commentsError.message);
    } else {
      console.log('[SUCCESS] collaboration_comments table exists and is accessible');
    }

    // List all tables in public schema
    console.log('\n[INFO] Listing all tables in public schema...');
    const { data: allTables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.log('[ERROR] Cannot list tables (exec_sql not available):', tablesError.message);
      console.log('[INFO] This is normal for remote Supabase instances');
    } else {
      console.log('[SUCCESS] Available tables:', allTables);
    }

  } catch (error) {
    console.error('[ERROR] Error checking database schema:', error);
  }
}

checkDatabaseSchema().then(() => {
  console.log('\n🏁 Database schema check completed');
  process.exit(0);
}).catch((error) => {
  console.error('[ERROR] Check failed:', error);
  process.exit(1);
}); 