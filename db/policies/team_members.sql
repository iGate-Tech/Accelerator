-- Team Members Table RLS Policies
-- Purpose: Controls access to team member information for collaboration
-- Security Model: Self-management with idea owner permission for adding members
--
-- Policy Details:
-- 1. Users manage their own team member entries
-- 2. Idea owners can add team members to their ideas
--
-- Security Rationale:
-- - Users control their own participation
-- - Idea owners manage team composition
-- - Prevents unauthorized team manipulation
--
-- Example Access Patterns:
-- - View own memberships: SELECT * FROM team_members WHERE user_id = auth.uid()
-- - Add team member: INSERT INTO team_members (idea_id, user_id) VALUES (123, user456)
-- - Leave team: DELETE FROM team_members WHERE user_id = auth.uid()
--
-- Business Impact:
-- - Enables collaborative idea development
-- - Supports team formation and management
-- - Protects against unwanted team additions

CREATE POLICY "Users can read own team member entries" ON team_members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Idea owners can insert team member entries" ON team_members
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own team member entries" ON team_members
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own team member entries" ON team_members
FOR DELETE USING (auth.uid() = user_id);