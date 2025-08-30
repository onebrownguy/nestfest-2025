// Fix user_sessions table - add missing column
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixSessionsTable() {
  console.log('========================================');
  console.log('Fixing user_sessions table');
  console.log('========================================\n');

  try {
    // Add the missing column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW()`
    }).catch(async () => {
      // If RPC doesn't work, try direct approach
      console.log('Using direct SQL approach...');
      
      // Check if column exists first
      const { data: columns } = await supabase
        .from('user_sessions')
        .select('*')
        .limit(0);
      
      console.log('Current user_sessions columns:', Object.keys(columns || {}));
      
      // For Supabase, we'll need to use the SQL editor manually
      console.log('\n❗ MANUAL ACTION REQUIRED:');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log('ALTER TABLE user_sessions');
      console.log('ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();');
      console.log('----------------------------------------');
      
      return { manual: true };
    });

    if (data?.manual) {
      return;
    }

    if (error) {
      console.log('Error adding column:', error.message);
      console.log('\n❗ Please run this SQL manually in Supabase SQL Editor:');
      console.log('ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();');
    } else {
      console.log('✅ Successfully added last_activity_at column to user_sessions table');
    }

    // Verify the table structure
    const { data: testSelect } = await supabase
      .from('user_sessions')
      .select('id, last_activity_at')
      .limit(1);

    if (testSelect !== null) {
      console.log('✅ Column verification successful - last_activity_at exists');
    }

  } catch (err) {
    console.log('\n❗ MANUAL ACTION REQUIRED:');
    console.log('Please run this SQL in your Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log('ALTER TABLE user_sessions');
    console.log('ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();');
    console.log('----------------------------------------');
  }

  console.log('\n========================================');
  console.log('Fix Complete');
  console.log('========================================');
}

fixSessionsTable().catch(console.error);