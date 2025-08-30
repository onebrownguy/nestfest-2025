-- ============================================================================
-- SAFE AUTH TABLE CREATION/MIGRATION SCRIPT
-- This script checks for existing tables and creates only what's missing
-- ============================================================================

-- First, let's check what tables already exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tables...';
END $$;

-- Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'nestfest_users', 'login_attempts', 'user_sessions', 'teams', 'submissions', 'votes');

-- ============================================================================
-- OPTION 1: CREATE USERS TABLE IF IT DOESN'T EXIST
-- ============================================================================

-- Check if users table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if nestfest_users exists and has an email column
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nestfest_users') THEN
            -- Create users as a view pointing to nestfest_users
            RAISE NOTICE 'Creating users view from nestfest_users...';
            
            -- First check nestfest_users structure
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'nestfest_users' AND column_name = 'email') THEN
                -- nestfest_users has email, create a proper users table
                CREATE TABLE users AS SELECT * FROM nestfest_users WHERE FALSE;
            ELSE
                -- nestfest_users doesn't have email, create fresh users table
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    password TEXT,
                    role VARCHAR(50) DEFAULT 'participant',
                    status VARCHAR(50) DEFAULT 'active',
                    email_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            END IF;
        ELSE
            -- Neither table exists, create fresh users table
            RAISE NOTICE 'Creating new users table...';
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                password TEXT,
                role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'judge', 'admin', 'super_admin', 'reviewer')),
                status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
                
                -- Profile fields
                institution VARCHAR(255),
                phone VARCHAR(50),
                avatar_url TEXT,
                bio TEXT,
                
                -- Authentication fields
                email_verified BOOLEAN DEFAULT FALSE,
                email_verified_at TIMESTAMPTZ,
                email_verification_token TEXT,
                email_verification_expires TIMESTAMPTZ,
                
                -- Password reset fields
                reset_password_token TEXT,
                reset_password_expires TIMESTAMPTZ,
                last_password_change TIMESTAMPTZ,
                
                -- Security fields
                mfa_enabled BOOLEAN DEFAULT FALSE,
                mfa_secret TEXT,
                backup_codes JSONB DEFAULT '[]',
                
                -- Account security
                login_attempts INTEGER DEFAULT 0,
                lock_until TIMESTAMPTZ,
                last_login_at TIMESTAMPTZ,
                last_login_ip INET,
                
                -- Metadata
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Create indexes
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_status ON users(status);
            CREATE INDEX idx_users_role ON users(role);
        END IF;
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- ============================================================================
-- OPTION 2: ALTERNATIVE - CREATE A MAPPING VIEW
-- If you want to keep nestfest_users and just map it
-- ============================================================================

-- Check if we need to create a view to map nestfest_users to users
DO $$
BEGIN
    -- Only create view if users doesn't exist but nestfest_users does
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nestfest_users') THEN
        
        RAISE NOTICE 'Creating users view to map nestfest_users...';
        
        -- Get columns from nestfest_users
        CREATE OR REPLACE VIEW users AS
        SELECT 
            id,
            COALESCE(email, 'user_' || id || '@nestfest.com') as email,  -- Provide default if email missing
            COALESCE(business_title, 'Participant') as name,
            NULL as password,  -- No password in nestfest_users
            COALESCE(role, 'participant') as role,
            'active' as status,
            FALSE as email_verified,
            NULL as email_verified_at,
            created_at,
            COALESCE(last_active, created_at) as updated_at
        FROM nestfest_users;
        
        RAISE NOTICE 'Created users view successfully';
    END IF;
END $$;

-- ============================================================================
-- CREATE LOGIN_ATTEMPTS TABLE (Required for auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_attempts_email') THEN
        CREATE INDEX idx_login_attempts_email ON login_attempts(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_attempts_ip_address') THEN
        CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_attempts_timestamp') THEN
        CREATE INDEX idx_login_attempts_timestamp ON login_attempts(timestamp);
    END IF;
END $$;

-- ============================================================================
-- CREATE USER_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT,
    device_fingerprint TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_sessions_user_id') THEN
        CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_sessions_token_hash') THEN
        CREATE INDEX idx_user_sessions_token_hash ON user_sessions(session_token_hash);
    END IF;
END $$;

-- ============================================================================
-- INSERT TEST USERS (Only if table is empty)
-- ============================================================================

-- Insert test users only if the users table is empty
INSERT INTO users (email, name, password, role, status, email_verified)
SELECT 
    'admin@nestfest.com',
    'Admin User',
    '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', -- password123
    'admin',
    'active',
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@nestfest.com');

INSERT INTO users (email, name, password, role, status, email_verified)
SELECT 
    'judge@nestfest.com',
    'Judge User',
    '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', -- password123
    'judge',
    'active',
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'judge@nestfest.com');

INSERT INTO users (email, name, password, role, status, email_verified)
SELECT 
    'participant@nestfest.com',
    'Participant User',
    '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', -- password123
    'participant',
    'active',
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'participant@nestfest.com');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- ENABLE RLS WITH PERMISSIVE POLICIES FOR DEVELOPMENT
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
DROP POLICY IF EXISTS "Enable all access for users table" ON users;
CREATE POLICY "Enable all access for users table" ON users
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for login_attempts" ON login_attempts;
CREATE POLICY "Enable all access for login_attempts" ON login_attempts
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for user_sessions" ON user_sessions;
CREATE POLICY "Enable all access for user_sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Check what we created
SELECT 
    'Tables Created/Verified' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'login_attempts', 'user_sessions');

-- Check if test users were created
SELECT 
    'Test Users' as type,
    COUNT(*) as count,
    string_agg(email, ', ') as emails
FROM users 
WHERE email IN ('admin@nestfest.com', 'judge@nestfest.com', 'participant@nestfest.com');

-- Show structure of users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position
LIMIT 10;