-- ============================================================================
-- SIMPLE USERS TABLE CREATION
-- Run this if you just want a working users table quickly
-- ============================================================================

-- Drop and recreate users table (WARNING: This will delete any existing users data)
DROP TABLE IF EXISTS users CASCADE;

-- Create fresh users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password TEXT,
    role VARCHAR(50) DEFAULT 'participant',
    status VARCHAR(50) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create login_attempts table
DROP TABLE IF EXISTS login_attempts CASCADE;
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table  
DROP TABLE IF EXISTS user_sessions CASCADE;
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_token_hash TEXT,
    refresh_token_hash TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test users (password is 'password123')
INSERT INTO users (email, name, password, role, status, email_verified) VALUES
('admin@nestfest.com', 'Admin User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'admin', 'active', true),
('judge@nestfest.com', 'Judge User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'judge', 'active', true),
('participant@nestfest.com', 'Participant User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'participant', 'active', true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Enable RLS with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for dev" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON login_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON user_sessions FOR ALL USING (true) WITH CHECK (true);

-- Verify creation
SELECT 'Success! Created:' as message,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM login_attempts) as login_attempts_count,
    (SELECT COUNT(*) FROM user_sessions) as sessions_count;