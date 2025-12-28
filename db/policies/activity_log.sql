-- Activity Log Table RLS Policies
-- Purpose: Controls access to user activity audit trail
-- Security Model: Users can view and create their own activity records
--
-- Policy Details:
-- 1. Self-managed activity tracking
--
-- Security Rationale:
-- - Activity logs contain personal usage data
-- - Users can view their own activity
-- - System processes create activity records
--
-- Business Impact:
-- - Enables user activity insights
-- - Supports analytics and personalization
CREATE POLICY "Users can read own activity log" ON activity_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON activity_log
FOR INSERT WITH CHECK (auth.uid() = user_id);