// Discover teams table columns
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function discoverTeamsColumns() {
  try {
    console.log('[INFO] Discovering teams table columns...\n');

    // Common column names to test
    const possibleColumns = [
      'id', 'name', 'description', 'user_id', 'owner_id', 'created_by', 'creator_id',
      'settings', 'config', 'created_at', 'updated_at', 'team_id', 'member_id'
    ];

    console.log('[INFO] Testing possible columns...\n');

    for (const column of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`[ERROR] Column '${column}': ${error.message}`);
        } else {
          console.log(`[SUCCESS] Column '${column}' exists`);
        }
      } catch (err) {
        console.log(`[ERROR] Column '${column}': ${err.message}`);
      }
    }

    // Try to get all columns with *
    console.log('\n[INFO] Testing select *...');
    const { data: allData, error: allError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (allError) {
      console.log('[ERROR] Select * error:', allError.message);
    } else {
      console.log('[SUCCESS] Select * works');
      if (allData && allData.length > 0) {
        console.log('[INFO] All available columns:', Object.keys(allData[0]));
      } else {
        console.log('[INFO] Table is empty, but structure is accessible');
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

discoverTeamsColumns(); 