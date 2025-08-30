/**
 * Database Authentication Tables Inspector
 * This script checks the current state of authentication tables in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Use service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthTables() {
  console.log('🔍 Checking Authentication Tables in Supabase Database');
  console.log('Database URL:', supabaseUrl);
  console.log('=' .repeat(60));

  try {
    // 1. Check what tables exist in the database
    console.log('\n📊 CHECKING EXISTING TABLES');
    console.log('-' .repeat(40));
    
    const { data: tables, error: tablesError } = await supabase.rpc('sql', {
      query: `
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      
      // Alternative method - try to query specific tables
      console.log('\n🔄 Trying alternative method...');
      const authTables = ['users', 'login_attempts', 'user_sessions'];
      
      for (const tableName of authTables) {
        console.log(`\n🔍 Checking ${tableName} table:`);
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`   ❌ ${tableName}: ${error.message}`);
          } else {
            console.log(`   ✅ ${tableName}: EXISTS (${count || 0} records)`);
          }
        } catch (err) {
          console.log(`   ❌ ${tableName}: ${err.message}`);
        }
      }
    } else {
      console.log(`Found ${tables?.length || 0} tables:`);
      tables?.forEach(table => {
        const icon = ['users', 'login_attempts', 'user_sessions'].includes(table.table_name) ? '🔐' : '📋';
        console.log(`   ${icon} ${table.table_name}`);
      });
    }

    // 2. Check Users table structure
    console.log('\n👥 USERS TABLE ANALYSIS');
    console.log('-' .repeat(40));
    
    try {
      const { data: usersSchema, error: usersSchemaError } = await supabase.rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      });

      if (usersSchemaError) {
        console.log('❌ Cannot fetch users table schema:', usersSchemaError.message);
      } else if (!usersSchema || usersSchema.length === 0) {
        console.log('❌ Users table does not exist');
      } else {
        console.log('✅ Users table structure:');
        usersSchema.forEach(col => {
          console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
        });
      }

      // Check users count and sample data
      const { count: userCount, error: userCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (!userCountError) {
        console.log(`   📊 Total users: ${userCount || 0}`);
        
        if (userCount > 0) {
          const { data: sampleUsers } = await supabase
            .from('users')
            .select('id, email, name, role, status, created_at')
            .limit(3);
          
          console.log('   📋 Sample users:');
          sampleUsers?.forEach(user => {
            console.log(`      • ${user.email} (${user.role}) - ${user.status}`);
          });
        }
      }

    } catch (usersError) {
      console.log('❌ Users table error:', usersError.message);
    }

    // 3. Check Login Attempts table
    console.log('\n🔐 LOGIN_ATTEMPTS TABLE ANALYSIS');
    console.log('-' .repeat(40));
    
    try {
      const { count: loginAttemptsCount, error: loginAttemptsError } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true });

      if (loginAttemptsError) {
        console.log('❌ Login attempts table does not exist:', loginAttemptsError.message);
      } else {
        console.log('✅ Login attempts table exists');
        console.log(`   📊 Total login attempts: ${loginAttemptsCount || 0}`);
        
        // Get schema
        const { data: loginSchema } = await supabase.rpc('sql', {
          query: `
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'login_attempts'
            ORDER BY ordinal_position;
          `
        });
        
        if (loginSchema) {
          console.log('   📋 Columns:');
          loginSchema.forEach(col => {
            console.log(`      • ${col.column_name}: ${col.data_type}`);
          });
        }
      }
    } catch (loginError) {
      console.log('❌ Login attempts table error:', loginError.message);
    }

    // 4. Check User Sessions table
    console.log('\n🎫 USER_SESSIONS TABLE ANALYSIS');
    console.log('-' .repeat(40));
    
    try {
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      if (sessionsError) {
        console.log('❌ User sessions table does not exist:', sessionsError.message);
      } else {
        console.log('✅ User sessions table exists');
        console.log(`   📊 Total sessions: ${sessionsCount || 0}`);
        
        // Check for active sessions
        const { count: activeSessions } = await supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('expires_at', new Date().toISOString());
        
        console.log(`   ⏰ Active sessions: ${activeSessions || 0}`);
      }
    } catch (sessionError) {
      console.log('❌ User sessions table error:', sessionError.message);
    }

    // 5. Check Supabase Auth tables (built-in)
    console.log('\n🔑 SUPABASE AUTH TABLES');
    console.log('-' .repeat(40));
    
    try {
      const { data: authUsers, error: authUsersError } = await supabase.rpc('sql', {
        query: 'SELECT COUNT(*) as count FROM auth.users;'
      });

      if (authUsersError) {
        console.log('❌ Cannot access auth.users:', authUsersError.message);
      } else {
        console.log(`✅ auth.users: ${authUsers[0]?.count || 0} users`);
      }
    } catch (authError) {
      console.log('❌ Auth tables error:', authError.message);
    }

    // 6. Check RLS policies
    console.log('\n🛡️ ROW LEVEL SECURITY POLICIES');
    console.log('-' .repeat(40));
    
    try {
      const { data: policies } = await supabase.rpc('sql', {
        query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND tablename IN ('users', 'login_attempts', 'user_sessions')
          ORDER BY tablename, policyname;
        `
      });

      if (policies && policies.length > 0) {
        console.log('✅ RLS Policies found:');
        policies.forEach(policy => {
          console.log(`   • ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('⚠️ No RLS policies found for auth tables');
      }
    } catch (policyError) {
      console.log('❌ Cannot check RLS policies:', policyError.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✨ Authentication Tables Inspection Complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the inspection
checkAuthTables().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});