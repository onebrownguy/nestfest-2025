-- Add missing last_activity_at column to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND column_name = 'last_activity_at';