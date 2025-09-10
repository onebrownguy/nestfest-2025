-- FIX FOR MISSING TABLES IN NESTFEST APPLICATION
-- Run this SQL in your Supabase SQL Editor to fix the "login_attempts table not found" error

-- ============================================================================
-- 1. CREATE LOGIN_ATTEMPTS TABLE (Critical - fixes the immediate error)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON public.login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success);

-- ============================================================================
-- 2. CREATE RATE LIMITING TABLE (Prevents spam/abuse)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    rule_key TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rule_key ON public.rate_limit_attempts(rule_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_timestamp ON public.rate_limit_attempts(timestamp);

-- ============================================================================
-- 3. CREATE BRUTE FORCE PROTECTION TABLE (Security feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.brute_force_protection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL UNIQUE,
    failed_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    lockout_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_brute_force_identifier ON public.brute_force_protection(identifier);
CREATE INDEX IF NOT EXISTS idx_brute_force_locked_until ON public.brute_force_protection(locked_until);

-- ============================================================================
-- 4. GRANT PERMISSIONS (Allow the app to access these tables)
-- ============================================================================
GRANT ALL ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO anon;
GRANT ALL ON public.login_attempts TO service_role;

GRANT ALL ON public.rate_limit_attempts TO authenticated;
GRANT ALL ON public.rate_limit_attempts TO anon;
GRANT ALL ON public.rate_limit_attempts TO service_role;

GRANT ALL ON public.brute_force_protection TO authenticated;
GRANT ALL ON public.brute_force_protection TO anon;
GRANT ALL ON public.brute_force_protection TO service_role;

-- ============================================================================
-- 5. CREATE CLEANUP FUNCTION (Maintains database performance)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_auth_records()
RETURNS void AS $$
BEGIN
    -- Delete login attempts older than 30 days
    DELETE FROM public.login_attempts 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete rate limit attempts older than 7 days
    DELETE FROM public.rate_limit_attempts 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Reset brute force protection for unlocked accounts
    UPDATE public.brute_force_protection
    SET failed_attempts = 0, lockout_count = 0
    WHERE locked_until < NOW() 
    AND last_attempt_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm tables were created
-- ============================================================================
-- Check if tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('login_attempts', 'rate_limit_attempts', 'brute_force_protection');

-- Check row counts:
SELECT 'login_attempts' as table_name, COUNT(*) as row_count FROM public.login_attempts
UNION ALL
SELECT 'rate_limit_attempts', COUNT(*) FROM public.rate_limit_attempts
UNION ALL
SELECT 'brute_force_protection', COUNT(*) FROM public.brute_force_protection;