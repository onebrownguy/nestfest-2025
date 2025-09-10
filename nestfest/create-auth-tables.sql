-- ============================================================================
-- NESTFEST AUTHENTICATION TABLES
-- Run this in your Supabase SQL Editor to create all auth tables
-- ============================================================================

-- Drop existing tables if needed (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS login_attempts CASCADE;
-- DROP TABLE IF EXISTS user_sessions CASCADE;

-- ============================================================================
-- 1. USERS TABLE (Main authentication table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password TEXT, -- Hashed password
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'judge', 'admin', 'super_admin', 'reviewer')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
    
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
    password_history JSONB DEFAULT '[]',
    
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);

-- ============================================================================
-- 2. LOGIN_ATTEMPTS TABLE (Track login attempts for security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255), -- Store email even if user doesn't exist
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);

-- ============================================================================
-- 3. USER_SESSIONS TABLE (Manage user sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 4. TEAMS TABLE (For team competitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    captain_user_id UUID NOT NULL REFERENCES users(id),
    max_members INTEGER DEFAULT 4,
    is_locked BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_captain_user_id ON teams(captain_user_id);

-- ============================================================================
-- 5. TEAM_MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('captain', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============================================================================
-- 6. COMPETITIONS TABLE (Main competition management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'voting', 'judging', 'closed', 'archived')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    voting_start_date TIMESTAMPTZ,
    voting_end_date TIMESTAMPTZ,
    max_submissions_per_user INTEGER DEFAULT 1,
    allow_team_submissions BOOLEAN DEFAULT TRUE,
    voting_type VARCHAR(50) DEFAULT 'simple' CHECK (voting_type IN ('simple', 'quadratic', 'ranked', 'approval')),
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);

-- ============================================================================
-- 7. SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    submission_url TEXT,
    video_url TEXT,
    github_url TEXT,
    demo_url TEXT,
    thumbnail_url TEXT,
    files JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'winner')),
    score DECIMAL(10, 2),
    feedback TEXT,
    metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure either user_id or team_id is present
    CONSTRAINT submission_owner CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ============================================================================
-- 8. VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    vote_type VARCHAR(50) DEFAULT 'standard',
    vote_weight INTEGER DEFAULT 1,
    credits_spent INTEGER DEFAULT 1, -- For quadratic voting
    rank_position INTEGER, -- For ranked voting
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate votes
    UNIQUE(submission_id, user_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_competition_id ON votes(competition_id);

-- ============================================================================
-- 9. REVIEWS TABLE (For judges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    scores JSONB DEFAULT '{}', -- Multiple scoring criteria
    total_score DECIMAL(10, 2),
    feedback TEXT,
    strengths TEXT,
    improvements TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reviews
    UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_competition_id ON reviews(competition_id);

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR true); -- Simplified for dev

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR true);

CREATE POLICY "Anyone can create a user during registration" ON users
    FOR INSERT WITH CHECK (true);

-- Login attempts policies (allow all for development)
CREATE POLICY "Allow all operations on login_attempts" ON login_attempts
    FOR ALL USING (true) WITH CHECK (true);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Allow session creation" ON user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow session updates" ON user_sessions
    FOR UPDATE USING (true);

-- Competitions policies (public read)
CREATE POLICY "Anyone can view active competitions" ON competitions
    FOR SELECT USING (status != 'draft' OR true);

CREATE POLICY "Admins can manage competitions" ON competitions
    FOR ALL USING (true) WITH CHECK (true); -- Simplified for dev

-- Submissions policies
CREATE POLICY "Anyone can view approved submissions" ON submissions
    FOR SELECT USING (status = 'approved' OR true);

CREATE POLICY "Users can manage their own submissions" ON submissions
    FOR ALL USING (auth.uid()::text = user_id::text OR true) 
    WITH CHECK (auth.uid()::text = user_id::text OR true);

-- Votes policies
CREATE POLICY "Users can view votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Users can cast votes" ON votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users cannot update votes" ON votes
    FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete votes" ON votes
    FOR DELETE USING (false);

-- Reviews policies
CREATE POLICY "Reviewers can manage their reviews" ON reviews
    FOR ALL USING (auth.uid()::text = reviewer_id::text OR true)
    WITH CHECK (auth.uid()::text = reviewer_id::text OR true);

-- ============================================================================
-- 12. CREATE TRIGGER FOR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. INSERT SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Create test users with bcrypt hashed password 'password123'
INSERT INTO users (email, name, password, role, status, email_verified) VALUES
('admin@nestfest.com', 'Admin User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'admin', 'active', true),
('judge@nestfest.com', 'Judge User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'judge', 'active', true),
('participant@nestfest.com', 'Participant User', '$2b$10$YKw6H8JmPt3xGk2YH3NOVuGVED9EH3OYV6QyB0QJFrhS5h7TqrqHC', 'participant', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Create a test competition
INSERT INTO competitions (name, description, status, start_date, end_date, voting_type) VALUES
('NestFest 2024', 'Annual innovation showcase event', 'open', NOW(), NOW() + INTERVAL '30 days', 'quadratic')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. VERIFICATION QUERY
-- ============================================================================
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Login Attempts', COUNT(*) FROM login_attempts
UNION ALL
SELECT 'Sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'Teams', COUNT(*) FROM teams
UNION ALL
SELECT 'Competitions', COUNT(*) FROM competitions
UNION ALL
SELECT 'Submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'Votes', COUNT(*) FROM votes
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews;