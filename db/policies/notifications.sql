-- Notifications Table RLS Policies
-- Purpose: Controls access to user notification preferences and history
-- Security Model: Users can only manage their own notifications
--
-- Policy Details:
-- 1. Complete self-management of notifications
--
-- Security Rationale:
-- - Notifications are personal communication
-- - Users control their own notification settings
-- - Prevents notification spoofing or manipulation
--
-- Business Impact:
-- - Enables personalized user communication
-- - Supports user engagement and retention
CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);