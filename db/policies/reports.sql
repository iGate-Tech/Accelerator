-- Reports Table RLS Policies
-- Purpose: Controls access to AI-generated business reports
-- Security Model: Owner full access, team member read access
--
-- Policy Details:
-- 1. Owner full management of own reports
-- 2. Team member read access for collaboration
--
-- Security Rationale:
-- - Reports contain sensitive business analysis
-- - Owner control ensures data protection
-- - Team access enables collaborative review
--
-- Business Impact:
-- - Protects valuable AI-generated insights
-- - Supports team decision-making processes
CREATE POLICY "Users can read own reports" ON reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can read reports" ON reports
FOR SELECT USING (EXISTS (SELECT 1 FROM ideas i JOIN team_members tm ON i.id = tm.idea_id WHERE i.id = reports.idea_id AND tm.user_id = auth.uid()));

CREATE POLICY "Users can insert own reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON reports
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON reports
FOR DELETE USING (auth.uid() = user_id);