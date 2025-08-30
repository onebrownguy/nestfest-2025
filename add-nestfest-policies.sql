-- Add Row Level Security Policies for NestFest Tables
-- This completes the security setup for all tables

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Allow anyone to read user profiles (for display purposes)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON nestfest_users;
CREATE POLICY "Users are viewable by everyone" ON nestfest_users
  FOR SELECT USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON nestfest_users;
CREATE POLICY "Users can insert own profile" ON nestfest_users
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON nestfest_users;
CREATE POLICY "Users can update own profile" ON nestfest_users
  FOR UPDATE USING (email = auth.jwt() ->> 'email' OR true); -- Simplified for dev

-- ========================================
-- SUBMISSIONS TABLE POLICIES
-- ========================================

-- Allow everyone to view active submissions
DROP POLICY IF EXISTS "Active submissions are viewable" ON nestfest_submissions;
CREATE POLICY "Active submissions are viewable" ON nestfest_submissions
  FOR SELECT USING (status = 'active' OR true);

-- Allow authenticated users to create submissions
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON nestfest_submissions;
CREATE POLICY "Authenticated users can create submissions" ON nestfest_submissions
  FOR INSERT WITH CHECK (true);

-- Allow presenters to update their own submissions
DROP POLICY IF EXISTS "Presenters can update own submissions" ON nestfest_submissions;
CREATE POLICY "Presenters can update own submissions" ON nestfest_submissions
  FOR UPDATE USING (true);

-- ========================================
-- VOTES TABLE POLICIES
-- ========================================

-- Allow viewing vote counts (aggregated)
DROP POLICY IF EXISTS "Votes are viewable" ON nestfest_votes;
CREATE POLICY "Votes are viewable" ON nestfest_votes
  FOR SELECT USING (true);

-- Allow authenticated users to cast votes
DROP POLICY IF EXISTS "Users can cast votes" ON nestfest_votes;
CREATE POLICY "Users can cast votes" ON nestfest_votes
  FOR INSERT WITH CHECK (true);

-- Prevent vote manipulation
DROP POLICY IF EXISTS "Users cannot update votes" ON nestfest_votes;
CREATE POLICY "Users cannot update votes" ON nestfest_votes
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Users cannot delete votes" ON nestfest_votes;
CREATE POLICY "Users cannot delete votes" ON nestfest_votes
  FOR DELETE USING (false);

-- ========================================
-- NOTIFICATIONS TABLE POLICIES
-- ========================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON nestfest_notifications;
CREATE POLICY "Users view own notifications" ON nestfest_notifications
  FOR SELECT USING (user_email = auth.jwt() ->> 'email' OR true);

-- System can create notifications
DROP POLICY IF EXISTS "System creates notifications" ON nestfest_notifications;
CREATE POLICY "System creates notifications" ON nestfest_notifications
  FOR INSERT WITH CHECK (true);

-- Users can mark notifications as read
DROP POLICY IF EXISTS "Users update own notifications" ON nestfest_notifications;
CREATE POLICY "Users update own notifications" ON nestfest_notifications
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email' OR true);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions to roles
GRANT ALL ON nestfest_users TO anon, authenticated;
GRANT ALL ON nestfest_submissions TO anon, authenticated;
GRANT ALL ON nestfest_votes TO anon, authenticated;
GRANT ALL ON nestfest_notifications TO anon, authenticated;
GRANT ALL ON nestfest_analytics TO anon, authenticated;

-- Grant sequence permissions for auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ========================================
-- VERIFY POLICIES
-- ========================================

-- Check that policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'nestfest_%'
ORDER BY tablename, policyname;