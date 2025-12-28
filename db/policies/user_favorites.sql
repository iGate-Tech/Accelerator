-- User Favorites Table RLS Policies
-- Purpose: Controls access to user bookmark/favorite preferences
-- Security Model: Complete self-management of favorites
--
-- Policy Details:
-- 1. Full CRUD access to own favorites
--
-- Security Rationale:
-- - Favorites are personal preferences
-- - Users control their own bookmarks
-- - Prevents manipulation of user preferences
--
-- Business Impact:
-- - Enables personalized content discovery
-- - Supports user engagement and retention
CREATE POLICY "Users can read own favorites" ON user_favorites
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON user_favorites
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
FOR DELETE USING (auth.uid() = user_id);