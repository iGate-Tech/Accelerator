-- Profiles Table RLS Policies
-- Purpose: Controls access to user profile data with comprehensive security
-- Security Model: Users can read all profiles, manage only their own, service role has full access
--
-- Policy Details:
-- 1. Public read access for authenticated users (for profile browsing)
-- 2. Self-management policies (insert/update/delete own profile)
-- 3. Service role admin access (for system operations)
--
-- Security Rationale:
-- - Public profile reading enables social features and collaboration
-- - Self-management ensures users control their own data
-- - Service role access allows automated processes and admin functions
--
-- Example Access Patterns:
-- - User browsing profiles: SELECT * FROM profiles (authenticated users only)
-- - User updating profile: UPDATE profiles SET name = 'New Name' WHERE user_id = auth.uid()
-- - Service role operations: Full CRUD access for system processes
--
-- Business Impact:
-- - Enables user discovery and networking features
-- - Protects user privacy while allowing necessary access
-- - Supports automated profile management workflows

-- Allow authenticated users to read all profiles (public profile browsing)
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to manage their own profiles
CREATE POLICY "Allow users to insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own profile" ON profiles
FOR DELETE USING (auth.uid() = user_id);

-- Service role admin access for system operations
CREATE POLICY "Allow service role to manage profiles" ON profiles
FOR ALL USING (auth.role() = 'service_role');