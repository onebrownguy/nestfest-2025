-- ============================================================================
-- FINAL AUTHENTICATION FIX FOR NESTFEST
-- Run this in Supabase SQL Editor to complete authentication setup
-- ============================================================================

-- 1. Add missing column to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure login_attempts has proper email column
ALTER TABLE login_attempts 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 3. Update test user passwords one more time (using the secure password)
-- The hash below is for 'NestFest2024!Secure'
UPDATE users 
SET password = '$2b$10$a6opPnhQHfF6w6hC2Lcup.tFVK6G0DQ1lZG2QZn9Y8SLxr5pAbg7m',
    updated_at = NOW()
WHERE email IN ('admin@nestfest.com', 'judge@nestfest.com', 'participant@nestfest.com');

-- 4. Verify all columns exist
SELECT 
    'user_sessions columns' as table_check,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'user_sessions'
AND column_name IN ('id', 'user_id', 'session_token_hash', 'refresh_token_hash', 
                     'ip_address', 'user_agent', 'is_active', 'expires_at', 
                     'created_at', 'last_activity_at');

-- 5. Verify test users are ready
SELECT 
    email,
    role,
    status,
    email_verified,
    CASE 
        WHEN password IS NOT NULL THEN 'Password Set'
        ELSE 'No Password'
    END as password_status
FROM users
WHERE email IN ('admin@nestfest.com', 'judge@nestfest.com', 'participant@nestfest.com');

-- 6. Final verification
SELECT 
    'Authentication System Status' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE email IN ('admin@nestfest.com', 'judge@nestfest.com', 'participant@nestfest.com')) = 3
        AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'last_activity_at') = 1
        THEN '✅ READY - All systems configured'
        ELSE '❌ INCOMPLETE - Review errors above'
    END as result;