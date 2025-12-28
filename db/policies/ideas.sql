-- Ideas Table RLS Policies
-- Purpose: Controls access to ideas with public/private visibility and team collaboration
-- Security Model: Public ideas readable by all, private ideas owner-only, team member access
--
-- Policy Details:
-- 1. Public read access for public ideas (enables community features)
-- 2. Owner full access to own ideas
-- 3. Team member read access for collaboration
--
-- Security Rationale:
-- - Public ideas support community voting and discovery
-- - Private ideas protect intellectual property
-- - Team access enables collaboration workflows
--
-- Example Access Patterns:
-- - Public browsing: SELECT * FROM ideas WHERE privacy = 'public'
-- - Owner editing: UPDATE ideas SET title = 'New Title' WHERE user_id = auth.uid()
-- - Team collaboration: Team members can read ideas they're collaborating on
--
-- Business Impact:
-- - Enables idea marketplace and community features
-- - Supports team collaboration and project management
-- - Protects sensitive business ideas with privacy controls

-- Public access for public ideas (community features)
CREATE POLICY "Allow authenticated read of public ideas" ON ideas
FOR SELECT USING (privacy = 'public' AND auth.role() = 'authenticated');

-- Owner access (full CRUD)
CREATE POLICY "Allow users to read own ideas" ON ideas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own ideas" ON ideas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own ideas" ON ideas
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own ideas" ON ideas
FOR DELETE USING (auth.uid() = user_id);

-- Team collaboration access
CREATE POLICY "Team members can read ideas" ON ideas
FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE idea_id = ideas.id AND user_id = auth.uid()));