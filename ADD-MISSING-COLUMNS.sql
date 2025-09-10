-- ============================================================================
-- ADD ALL MISSING COLUMNS TO user_sessions TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add device_fingerprint column if it doesn't exist
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add location column if it doesn't exist  
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add revoked_at column if it doesn't exist
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Add revoked_reason column if it doesn't exist
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- Verify all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Show final confirmation
SELECT 
    'user_sessions Table Status' as check_name,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name IN (
        'id', 'user_id', 'session_token_hash', 'refresh_token_hash',
        'device_fingerprint', 'ip_address', 'user_agent', 'location',
        'is_active', 'last_activity_at', 'expires_at', 'created_at',
        'updated_at', 'revoked_at', 'revoked_reason'
    ) THEN 1 END) as required_columns,
    CASE 
        WHEN COUNT(CASE WHEN column_name IN (
            'device_fingerprint', 'last_activity_at'
        ) THEN 1 END) = 2 
        THEN '✅ All required columns present'
        ELSE '❌ Some columns still missing'
    END as status
FROM information_schema.columns
WHERE table_name = 'user_sessions';