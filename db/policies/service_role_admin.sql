-- Service Role Admin Policies
-- Purpose: Grants full administrative access to service role for system operations
-- Security Model: Service role bypasses all RLS restrictions for automated processes
--
-- Policy Scope:
-- - All major application tables get service role full access
-- - Enables automated data operations, imports, exports, and maintenance
-- - Supports background jobs, migrations, and admin tools
--
-- Security Rationale:
-- - Service role is used only by trusted backend systems
-- - Not accessible from client applications
-- - Required for system administration and data management
--
-- Business Impact:
-- - Enables reliable automated operations
-- - Supports data migration and maintenance tasks
-- - Allows admin tools and reporting systems
--
-- Tables Covered:
-- - Core business entities (ideas, votes, model_instances, etc.)
-- - System tables (notifications, activity_log, credit_transactions)
-- - Configuration tables (user_settings, packages, rewards)
-- - Enterprise features (portfolios, portfolio_ideas, portfolio_members)

-- Core business tables
CREATE POLICY "Service role can manage ideas" ON ideas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage votes" ON votes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage model_instances" ON model_instances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage model_sections" ON model_sections FOR ALL USING (auth.role() = 'service_role');

-- Collaboration features
CREATE POLICY "Service role can manage team_members" ON team_members FOR ALL USING (auth.role() = 'service_role');

-- Generated content
CREATE POLICY "Service role can manage reports" ON reports FOR ALL USING (auth.role() = 'service_role');

-- System communication
CREATE POLICY "Service role can manage notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- Financial tracking
CREATE POLICY "Service role can manage credit_transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage billing_history" ON billing_history FOR ALL USING (auth.role() = 'service_role');

-- Activity tracking
CREATE POLICY "Service role can manage activity_log" ON activity_log FOR ALL USING (auth.role() = 'service_role');

-- Social features
CREATE POLICY "Service role can manage user_favorites" ON user_favorites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage voting_rewards" ON voting_rewards FOR ALL USING (auth.role() = 'service_role');

-- User preferences
CREATE POLICY "Service role can manage user_settings" ON user_settings FOR ALL USING (auth.role() = 'service_role');

-- Product catalog
CREATE POLICY "Service role can manage credit_packages" ON credit_packages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage packages" ON packages FOR ALL USING (auth.role() = 'service_role');

-- Legacy rewards
CREATE POLICY "Service role can manage rewards" ON rewards FOR ALL USING (auth.role() = 'service_role');

-- Enterprise features
CREATE POLICY "Service role can manage portfolios" ON portfolios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage portfolio_ideas" ON portfolio_ideas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage portfolio_members" ON portfolio_members FOR ALL USING (auth.role() = 'service_role');

-- Session management
CREATE POLICY "Service role can manage sessions" ON session FOR ALL USING (auth.role() = 'service_role');