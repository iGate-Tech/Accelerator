-- Accelerator Application Schema SQL - RLS Policies
-- Generated based on PRD.md (Product Requirements Document)
-- This file provides the RLS policies for all tables
-- Upload to Supabase SQL Query Runner for deployment
-- Reference for future schema updates and migrations

-- RLS Policies (detailed user-owned access)
-- Profiles: Allow authenticated users to read all profiles (for public profile viewing)
-- Users can manage their own profiles fully, service role has full access
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own profile" ON profiles
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to manage profiles" ON profiles
FOR ALL USING (auth.role() = 'service_role');

-- Service role policies for full project coverage (admin access)
CREATE POLICY "Service role can manage ideas" ON ideas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage votes" ON votes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage model_instances" ON model_instances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage model_sections" ON model_sections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage team_members" ON team_members FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage reports" ON reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage credit_transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage activity_log" ON activity_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_favorites" ON user_favorites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage voting_rewards" ON voting_rewards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_settings" ON user_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage billing_history" ON billing_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage credit_packages" ON credit_packages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage packages" ON packages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage rewards" ON rewards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage portfolios" ON portfolios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage portfolio_ideas" ON portfolio_ideas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage portfolio_members" ON portfolio_members FOR ALL USING (auth.role() = 'service_role');

-- Ideas: Public read for public ideas, full management for own, read for team members
CREATE POLICY "Allow public read of public ideas" ON ideas
FOR SELECT USING (privacy = 'public');

CREATE POLICY "Allow users to read own ideas" ON ideas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can read ideas" ON ideas
FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE idea_id = ideas.id AND user_id = auth.uid()));

CREATE POLICY "Allow users to insert own ideas" ON ideas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own ideas" ON ideas
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own ideas" ON ideas
FOR DELETE USING (auth.uid() = user_id);
-- Votes: Users can manage their own votes on public ideas
CREATE POLICY "Users can read own votes" ON votes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert votes on public ideas" ON votes
FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND privacy = 'public'));

CREATE POLICY "Users can update own votes" ON votes
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND privacy = 'public'));

CREATE POLICY "Users can delete own votes" ON votes
FOR DELETE USING (auth.uid() = user_id);
-- Model instances: Full management for own, read for team members
CREATE POLICY "Users can read own model instances" ON model_instances
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can read model instances" ON model_instances
FOR SELECT USING (EXISTS (SELECT 1 FROM ideas i JOIN team_members tm ON i.id = tm.idea_id WHERE i.id = model_instances.idea_id AND tm.user_id = auth.uid()));

CREATE POLICY "Users can insert own model instances" ON model_instances
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own model instances" ON model_instances
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own model instances" ON model_instances
FOR DELETE USING (auth.uid() = user_id);
-- Model sections: Full management for own via model instance, read for team members
CREATE POLICY "Users can read own model sections" ON model_sections
FOR SELECT USING (EXISTS (SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = auth.uid()));

CREATE POLICY "Team members can read model sections" ON model_sections
FOR SELECT USING (EXISTS (SELECT 1 FROM model_instances mi JOIN ideas i ON mi.idea_id = i.id JOIN team_members tm ON i.id = tm.idea_id WHERE mi.id = model_sections.model_instance_id AND tm.user_id = auth.uid()));

CREATE POLICY "Users can insert own model sections" ON model_sections
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own model sections" ON model_sections
FOR UPDATE USING (EXISTS (SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own model sections" ON model_sections
FOR DELETE USING (EXISTS (SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = auth.uid()));
-- Team members: Users can manage their own team member entries
CREATE POLICY "Users can read own team member entries" ON team_members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team member entries" ON team_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team member entries" ON team_members
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own team member entries" ON team_members
FOR DELETE USING (auth.uid() = user_id);
-- Reports: Full management for own, read for team members
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
-- Notifications: Users can manage their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);
-- Credit transactions: Users can manage their own transactions
CREATE POLICY "Users can read own credit transactions" ON credit_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit transactions" ON credit_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit transactions" ON credit_transactions
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit transactions" ON credit_transactions
FOR DELETE USING (auth.uid() = user_id);
-- Activity log: Users can manage their own activity log
CREATE POLICY "Users can read own activity log" ON activity_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON activity_log
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity log" ON activity_log
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity log" ON activity_log
FOR DELETE USING (auth.uid() = user_id);

-- User favorites: Users can manage their own favorites
CREATE POLICY "Users can read own favorites" ON user_favorites
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON user_favorites
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
FOR DELETE USING (auth.uid() = user_id);
-- Voting rewards: Users can manage their own voting rewards
CREATE POLICY "Users can read own voting rewards" ON voting_rewards
FOR SELECT USING (auth.uid() = voter_id);

CREATE POLICY "Users can insert own voting rewards" ON voting_rewards
FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update own voting rewards" ON voting_rewards
FOR UPDATE USING (auth.uid() = voter_id) WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can delete own voting rewards" ON voting_rewards
FOR DELETE USING (auth.uid() = voter_id);
-- User settings: Users can manage their own settings
CREATE POLICY "Users can read own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
FOR DELETE USING (auth.uid() = user_id);
-- Billing history: Users can manage their own billing history
CREATE POLICY "Users can read own billing history" ON billing_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing history" ON billing_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing history" ON billing_history
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own billing history" ON billing_history
FOR DELETE USING (auth.uid() = user_id);
-- Rewards: Users can manage their own rewards
CREATE POLICY "Users can read own rewards" ON rewards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON rewards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards" ON rewards
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rewards" ON rewards
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow all users to read credit packages" ON credit_packages FOR SELECT USING (true);

CREATE POLICY "Allow all users to read packages" ON packages FOR SELECT USING (true);

-- RLS Policies for portfolios
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Portfolio members can view shared portfolios" ON portfolios FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM portfolio_members
        WHERE portfolio_id = portfolios.id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage portfolio-idea associations for own portfolios" ON portfolio_ideas FOR ALL USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Portfolio members can view portfolio ideas" ON portfolio_ideas FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM portfolio_members
        WHERE portfolio_id = portfolio_ideas.portfolio_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can view their own portfolio memberships" ON portfolio_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage portfolio memberships for own portfolios insert" ON portfolio_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can manage portfolio memberships for own portfolios update" ON portfolio_members FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can manage portfolio memberships for own portfolios delete" ON portfolio_members FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);

-- Bucket Policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for session table (allow service role access)
CREATE POLICY "Service role can manage sessions" ON session FOR ALL USING (auth.role() = 'service_role');