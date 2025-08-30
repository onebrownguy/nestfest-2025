// Direct table alteration using Supabase Admin API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create admin client with service key for full access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixTablesDirectly() {
  console.log('========================================');
  console.log('Fixing Tables Directly via Supabase');
  console.log('========================================\n');

  try {
    // Method 1: Try using raw SQL through fetch to Supabase REST API
    const projectRef = 'diukkmrrepjnibzhxebd';
    const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc`;
    
    console.log('Attempting direct SQL execution...\n');

    // First, let's check current table structure
    const { data: currentColumns, error: checkError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_sessions');

    if (checkError) {
      console.log('Cannot query information_schema directly');
      
      // Alternative: Try to select from the table and see what columns exist
      try {
        const { data: sample, error: sampleError } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .limit(1);
        
        if (!sampleError) {
          const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
          console.log('Current user_sessions columns:', columns.join(', '));
          
          if (!columns.includes('last_activity_at')) {
            console.log('❌ Column "last_activity_at" is missing\n');
          } else {
            console.log('✅ Column "last_activity_at" already exists!\n');
            return;
          }
        }
      } catch (e) {
        console.log('Error checking columns:', e.message);
      }
    }

    // Method 2: Create a new table with the correct structure and migrate data
    console.log('Creating migration approach...\n');

    // Step 1: Create new table with correct structure
    const createTableSQL = `
      -- Create temporary table with correct structure
      CREATE TABLE IF NOT EXISTS user_sessions_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_token_hash TEXT,
        refresh_token_hash TEXT,
        device_fingerprint TEXT,
        ip_address INET,
        user_agent TEXT,
        location TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_activity_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Since we can't execute raw DDL, let's work with what we have
    // Check if we can at least read from the table
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('*');

    if (!sessionError) {
      console.log(`Found ${sessions?.length || 0} existing sessions\n`);
    }

    // Method 3: Work around by creating a view
    console.log('Alternative solution: Creating a compatible view...\n');
    
    // Since we can't alter tables directly, provide the SQL for manual execution
    const fixSQL = `
-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Add missing column to user_sessions
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND column_name = 'last_activity_at';
    `;

    console.log('❗ MANUAL ACTION REQUIRED\n');
    console.log('Supabase client libraries cannot directly execute ALTER TABLE commands.');
    console.log('This is a security feature to prevent accidental schema changes.\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/diukkmrrepjnibzhxebd/sql');
    console.log('2. Click "New query"');
    console.log('3. Copy and paste this SQL:\n');
    console.log('----------------------------------------');
    console.log(fixSQL);
    console.log('----------------------------------------\n');
    console.log('4. Click "Run" to execute\n');
    
    // Save the SQL to a file for convenience
    const fs = require('fs').promises;
    await fs.writeFile('RUN-THIS-SQL.sql', fixSQL);
    console.log('💾 SQL also saved to: RUN-THIS-SQL.sql\n');

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('========================================');
  console.log('Alternative: Test Without the Column');
  console.log('========================================\n');
  console.log('While you run the SQL, I can also modify the session manager');
  console.log('to work without the last_activity_at column temporarily.\n');
}

fixTablesDirectly().catch(console.error);