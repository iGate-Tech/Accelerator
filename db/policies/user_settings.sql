-- User Settings Table RLS Policies
-- Purpose: Controls access to user configuration and preferences
-- Security Model: Complete self-management of settings
--
-- Policy Details:
-- 1. Full CRUD access to own settings
--
-- Security Rationale:
-- - Settings contain personal configuration data
-- - Users control their own preferences
-- - Prevents unauthorized setting manipulation
--
-- Business Impact:
-- - Enables personalized user experience
-- - Supports user customization features
CREATE POLICY "Users can read own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
FOR DELETE USING (auth.uid() = user_id);