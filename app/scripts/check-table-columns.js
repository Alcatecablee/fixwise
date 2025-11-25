// Check user_settings table columns
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableColumns() {
  try {
    console.log('[INFO] Checking user_settings table columns...');

    // Try to get table structure by querying with select *
    const { data: sampleData, error: queryError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);

    if (queryError) {
      console.log('[ERROR] Query error:', queryError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('[SUCCESS] Table structure from sample data:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach((column, index) => {
        console.log(`${index + 1}. ${column}: ${typeof sampleData[0][column]}`);
      });
    } else {
      console.log('[INFO] No data in table, checking schema...');
      
      // Try to get schema information
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_settings')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.log('[ERROR] Schema query error:', schemaError.message);
      } else {
        console.log('[SUCCESS] Table columns from schema:');
        schemaData.forEach((column, index) => {
          console.log(`${index + 1}. ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
        });
      }
    }

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
  }
}

checkTableColumns(); 