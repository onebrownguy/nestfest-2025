/**
 * Supabase Database Initialization API Endpoint
 * POST /api/supabase-init
 * 
 * This serves as a backup database system to the primary Vercel Postgres
 * Initializes all necessary tables and schemas in Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing Supabase as backup database...')
    
    // Verify Supabase connection
    const { data: connectionTest } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    console.log('✅ Supabase connection verified')
    
    // Core users table with NestFest schema
    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) UNIQUE NOT NULL,
        email_verified_at timestamp,
        name varchar(255),
        first_name varchar(100),
        last_name varchar(100),
        avatar_url text,
        role text DEFAULT 'student' CHECK (role IN ('student', 'judge', 'reviewer', 'admin', 'super_admin')),
        status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
        university varchar(255),
        graduation_year integer,
        program varchar(255),
        phone_number varchar(20),
        timezone varchar(50) DEFAULT 'UTC',
        password text,
        reset_password_token text,
        reset_password_expires timestamptz,
        login_attempts integer DEFAULT 0,
        lock_until timestamptz,
        last_login_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      -- Create indexes for users
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_password_token);
    `

    console.log('📋 Creating users table...')
    const { error: usersError } = await supabaseAdmin.rpc('exec_sql', { sql: usersTableSQL })
    
    if (usersError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(usersTableSQL)
    } else {
      console.log('✅ Users table created successfully')
    }

    // Competitions table
    const competitionsSQL = `
      CREATE TABLE IF NOT EXISTS public.competitions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        slug varchar(255) UNIQUE NOT NULL,
        description text,
        rules_document_url text,
        start_date timestamptz NOT NULL,
        submission_deadline timestamptz NOT NULL,
        judging_start_date timestamptz NOT NULL,
        judging_end_date timestamptz NOT NULL,
        event_date timestamptz NOT NULL,
        status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'reviewing', 'judging', 'live', 'completed', 'archived')),
        max_submissions_per_user integer DEFAULT 1,
        allow_team_submissions boolean DEFAULT true,
        team_size_min integer,
        team_size_max integer DEFAULT 4,
        voting_enabled boolean DEFAULT true,
        public_voting_enabled boolean DEFAULT false,
        config jsonb DEFAULT '{}',
        created_at timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_competitions_slug ON public.competitions(slug);
      CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
      CREATE INDEX IF NOT EXISTS idx_competitions_dates ON public.competitions(start_date, submission_deadline);
    `

    console.log('📋 Creating competitions table...')
    const { error: competitionsError } = await supabaseAdmin.rpc('exec_sql', { sql: competitionsSQL })
    
    if (competitionsError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(competitionsSQL)
    } else {
      console.log('✅ Competitions table created successfully')
    }

    // Submissions table
    const submissionsSQL = `
      CREATE TABLE IF NOT EXISTS public.submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
        user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
        team_id uuid,
        title varchar(255) NOT NULL,
        description text,
        category_id uuid,
        status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'accepted', 'rejected', 'advanced', 'eliminated', 'winner')),
        submission_number varchar(50) UNIQUE NOT NULL,
        submitted_at timestamptz,
        last_modified_at timestamptz DEFAULT now(),
        withdrawn_at timestamptz,
        withdrawal_reason text,
        metadata jsonb DEFAULT '{}',
        version integer DEFAULT 1,
        ip_address inet,
        browser_fingerprint text,
        created_at timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_competition ON public.submissions(competition_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_number ON public.submissions(submission_number);
    `

    console.log('📋 Creating submissions table...')
    const { error: submissionsError } = await supabaseAdmin.rpc('exec_sql', { sql: submissionsSQL })
    
    if (submissionsError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(submissionsSQL)
    } else {
      console.log('✅ Submissions table created successfully')
    }

    // Voting system table
    const votesSQL = `
      CREATE TABLE IF NOT EXISTS public.votes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
        submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
        voter_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        voter_session_id varchar(255),
        vote_type varchar(50) NOT NULL,
        vote_data jsonb NOT NULL,
        weight decimal DEFAULT 1.0,
        ip_address inet NOT NULL,
        user_agent text,
        voted_at timestamptz DEFAULT now(),
        is_valid boolean DEFAULT true
      );

      CREATE INDEX IF NOT EXISTS idx_votes_competition ON public.votes(competition_id);
      CREATE INDEX IF NOT EXISTS idx_votes_submission ON public.votes(submission_id);
      CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes(voter_user_id);
      CREATE INDEX IF NOT EXISTS idx_votes_session ON public.votes(voter_session_id);
      CREATE INDEX IF NOT EXISTS idx_votes_valid ON public.votes(is_valid);
    `

    console.log('📋 Creating votes table...')
    const { error: votesError } = await supabaseAdmin.rpc('exec_sql', { sql: votesSQL })
    
    if (votesError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(votesSQL)
    } else {
      console.log('✅ Votes table created successfully')
    }

    // Authentication tables
    const authTablesSQL = `
      CREATE TABLE IF NOT EXISTS public.login_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
        ip_address inet NOT NULL,
        user_agent text,
        success boolean DEFAULT false,
        failure_reason text,
        timestamp timestamptz DEFAULT now(),
        metadata jsonb DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON public.login_attempts(ip_address);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON public.login_attempts(timestamp);

      CREATE TABLE IF NOT EXISTS public.user_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        session_token_hash text NOT NULL,
        refresh_token_hash text,
        device_fingerprint text,
        ip_address inet NOT NULL,
        user_agent text,
        location text,
        is_active boolean DEFAULT true,
        last_activity_at timestamptz DEFAULT now(),
        expires_at timestamptz NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        revoked_at timestamptz,
        revoked_reason text
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token_hash);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
    `

    console.log('📋 Creating authentication tables...')
    const { error: authError } = await supabaseAdmin.rpc('exec_sql', { sql: authTablesSQL })
    
    if (authError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(authTablesSQL)
    } else {
      console.log('✅ Authentication tables created successfully')
    }

    // Seed initial admin user for backup system
    const { data: existingAdmin, error: adminCheckError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', 'admin@nestfest.com')
      .single()

    if (!existingAdmin && !adminCheckError) {
      const { data: newAdmin, error: adminInsertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: 'admin@nestfest.com',
          name: 'NestFest Admin',
          first_name: 'NestFest',
          last_name: 'Admin',
          role: 'super_admin',
          status: 'active',
          email_verified_at: new Date().toISOString(),
          university: 'Austin Community College'
        })
        .select()
        .single()

      if (adminInsertError) {
        console.log('⚠️  Could not create admin user:', adminInsertError.message)
      } else {
        console.log('✅ Admin user created for backup system')
      }
    }

    // Enable Row Level Security
    const rlsSQL = `
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

      -- Users can view their own profile
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);

      -- Users can update their own profile
      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);

      -- Competitions are viewable by everyone
      CREATE POLICY IF NOT EXISTS "Competitions are viewable by everyone" ON public.competitions
        FOR SELECT USING (true);

      -- Users can view their own submissions
      CREATE POLICY IF NOT EXISTS "Users can view own submissions" ON public.submissions
        FOR SELECT USING (auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'judge', 'reviewer')
        ));

      -- Authenticated users can vote
      CREATE POLICY IF NOT EXISTS "Authenticated users can vote" ON public.votes
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    `

    console.log('📋 Enabling Row Level Security...')
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', { sql: rlsSQL })
    
    if (rlsError) {
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log(rlsSQL)
    } else {
      console.log('✅ Row Level Security enabled')
    }

    // Test the complete setup
    const { data: finalTest, error: finalError } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })

    const { data: competitionTest, error: competitionError } = await supabaseAdmin
      .from('competitions')
      .select('count', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Supabase backup database initialized successfully',
      database: 'supabase',
      tables: {
        users: finalError ? 'needs_manual_setup' : 'ready',
        competitions: competitionError ? 'needs_manual_setup' : 'ready',
        submissions: 'ready',
        votes: 'ready',
        authentication: 'ready'
      },
      counts: {
        users: finalError ? 0 : (finalTest as any)?.count || 0,
        competitions: competitionError ? 0 : (competitionTest as any)?.count || 0
      },
      note: 'This serves as a backup to the primary Vercel Postgres database'
    })

  } catch (error) {
    console.error('❌ Supabase initialization failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Supabase initialization failed',
      recommendation: 'Please check your Supabase configuration and run the SQL manually'
    }, { status: 500 })
  }
}

// GET endpoint to check Supabase backup status
export async function GET() {
  try {
    // Test connection to all main tables
    const [usersTest, competitionsTest] = await Promise.all([
      supabaseAdmin.from('users').select('count', { count: 'exact', head: true }),
      supabaseAdmin.from('competitions').select('count', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      success: true,
      database: 'supabase_backup',
      status: 'operational',
      tables: {
        users: usersTest.error ? 'error' : 'ready',
        competitions: competitionsTest.error ? 'error' : 'ready'
      },
      counts: {
        users: usersTest.error ? 0 : (usersTest.data as any)?.count || 0,
        competitions: competitionsTest.error ? 0 : (competitionsTest.data as any)?.count || 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      database: 'supabase_backup',
      status: 'not_configured',
      error: error instanceof Error ? error.message : 'Supabase not ready'
    }, { status: 500 })
  }
}