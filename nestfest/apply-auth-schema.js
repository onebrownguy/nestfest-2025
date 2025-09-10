/**
 * Script to apply authentication database schema to Supabase
 * This creates the missing login_attempts table and other auth-related tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function applySchema() {
  try {
    console.log('🔄 Starting database schema application...\n');
    
    // Create login_attempts table (the critical missing table)
    const loginAttemptsQuery = `
      CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        ip_address INET NOT NULL,
        user_agent TEXT,
        success BOOLEAN DEFAULT FALSE,
        failure_reason TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
    `;
    
    console.log('📋 Creating login_attempts table...');
    const { error: loginAttemptsError } = await supabase.rpc('exec_sql', {
      sql: loginAttemptsQuery
    }).single();
    
    if (loginAttemptsError) {
      // If RPC doesn't exist, try direct approach
      console.log('⚠️  RPC method not available, please run the following SQL manually in Supabase SQL Editor:\n');
      console.log(loginAttemptsQuery);
    } else {
      console.log('✅ login_attempts table created successfully');
    }
    
    // Create other essential auth tables
    const otherTablesQuery = `
      -- Rate limiting table
      CREATE TABLE IF NOT EXISTS rate_limit_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        rule_key TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        success BOOLEAN DEFAULT TRUE,
        metadata JSONB DEFAULT '{}'
      );
      
      CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_attempts(identifier);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_rule_key ON rate_limit_attempts(rule_key);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_timestamp ON rate_limit_attempts(timestamp);
      
      -- Brute force protection table
      CREATE TABLE IF NOT EXISTS brute_force_protection (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL UNIQUE,
        failed_attempts INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
        locked_until TIMESTAMPTZ,
        lockout_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}'
      );
      
      CREATE INDEX IF NOT EXISTS idx_brute_force_identifier ON brute_force_protection(identifier);
      CREATE INDEX IF NOT EXISTS idx_brute_force_locked_until ON brute_force_protection(locked_until);
    `;
    
    console.log('\n📋 Creating rate limiting and brute force protection tables...');
    console.log('⚠️  Please run the following SQL in Supabase SQL Editor:\n');
    console.log(otherTablesQuery);
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 MANUAL STEPS REQUIRED:');
    console.log('='.repeat(60));
    console.log('\n1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL queries shown above');
    console.log('4. Click "Run" to execute the queries');
    console.log('5. Verify tables are created in Table Editor');
    console.log('\n' + '='.repeat(60));
    
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      if (error.message.includes('users')) {
        console.log('\n⚠️  The users table might not exist. Please ensure your base schema is set up.');
      }
    } else {
      console.log('✅ Database connection successful');
      console.log(`📊 Found ${data || 0} users in the database`);
    }
    
    console.log('\n✨ Schema application process complete!');
    console.log('🔄 Please restart your development server after applying the SQL queries.');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

// Run the schema application
applySchema();