-- Votes Table RLS Policies
-- Purpose: Controls voting access with privacy and ownership restrictions
-- Security Model: Users can manage their own votes on public ideas only
--
-- Policy Details:
-- 1. Self-management of own votes
-- 2. Public idea restriction (cannot vote on private ideas)
--
-- Security Rationale:
-- - Vote integrity requires ownership validation
-- - Private idea protection prevents unauthorized voting
-- - One vote per user per idea enforced
--
-- Example Access Patterns:
-- - View own votes: SELECT * FROM votes WHERE user_id = auth.uid()
-- - Vote on public idea: INSERT INTO votes (idea_id, user_id, rating) VALUES (123, auth.uid(), 4)
-- - Cannot vote on private ideas (policy prevents this)
--
-- Business Impact:
-- - Enables community validation system
-- - Supports idea ranking and discovery
-- - Protects voting system integrity

-- Self-management policies
CREATE POLICY "Users can read own votes" ON votes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert votes on public ideas" ON votes
FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND privacy = 'public'));

CREATE POLICY "Users can update own votes" ON votes
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND privacy = 'public'));

CREATE POLICY "Users can delete own votes" ON votes
FOR DELETE USING (auth.uid() = user_id);