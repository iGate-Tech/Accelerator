-- Model Instances and Sections RLS Policies
-- Purpose: Controls access to AI model usage and progress tracking
-- Security Model: Owner full access, team member read access for collaboration
--
-- Policy Details:
-- 1. Owner full management of own model instances
-- 2. Team member read access for collaboration
-- 3. Model sections follow same pattern through instance ownership
--
-- Security Rationale:
-- - Model instances contain sensitive AI usage data
-- - Owner control ensures privacy and resource management
-- - Team access enables collaborative AI workflows
--
-- Example Access Patterns:
-- - Owner managing models: Full CRUD on own model instances and sections
-- - Team collaboration: Team members can view progress but not modify
-- - Resource protection: Prevents unauthorized AI usage
--
-- Business Impact:
-- - Enables collaborative AI-powered workflows
-- - Protects AI resource usage and costs
-- - Supports team productivity with AI tools

-- Model Instances Policies
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

-- Model Sections Policies (follows instance ownership)
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