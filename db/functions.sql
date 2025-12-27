-- Accelerator Application Schema SQL - Functions and Triggers
-- Generated based on PRD.md (Product Requirements Document)
-- This file provides the database functions and triggers
-- Upload to Supabase SQL Query Runner for deployment
-- Reference for future schema updates and migrations

-- Database Functions (PRD 5.9) - Business Logic Functions
-- Function to calculate idea completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(idea_uuid UUID) RETURNS INTEGER AS $$
DECLARE
    total_sections INTEGER;
    completed_sections INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_sections FROM model_sections ms
    JOIN model_instances mi ON ms.model_instance_id = mi.id
    WHERE mi.idea_id = idea_uuid AND mi.status = 'completed';
    
    SELECT COUNT(*) INTO completed_sections FROM model_sections ms
    JOIN model_instances mi ON ms.model_instance_id = mi.id
    WHERE mi.idea_id = idea_uuid AND mi.status = 'completed' AND ms.is_completed = TRUE;
    
    IF total_sections = 0 THEN RETURN 0; END IF;
    RETURN (completed_sections * 100) / total_sections;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updates
CREATE OR REPLACE FUNCTION update_completion_on_section_change() RETURNS TRIGGER AS $$
BEGIN
    UPDATE ideas SET completion_percentage = calculate_completion_percentage(idea_id)
    FROM model_instances mi WHERE mi.id = NEW.model_instance_id AND ideas.id = mi.idea_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completion
AFTER INSERT OR UPDATE ON model_sections
FOR EACH ROW EXECUTE FUNCTION update_completion_on_section_change();

-- Trigger to update idea rating on vote changes
CREATE OR REPLACE FUNCTION update_idea_rating() RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate average rating for the idea
  SELECT ROUND(AVG(rating)::numeric, 2) INTO avg_rating FROM votes WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id);

  -- Update the idea's rating
  UPDATE ideas SET rating = avg_rating WHERE id = COALESCE(NEW.idea_id, OLD.idea_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_idea_rating
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_idea_rating();

-- Function to update idea rating (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION update_idea_rating_func(p_idea_id UUID, p_rating DECIMAL) RETURNS VOID AS $$
BEGIN
  UPDATE ideas SET rating = p_rating WHERE id = p_idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database Validation Triggers

-- Trigger to validate credit balance is not negative
CREATE OR REPLACE FUNCTION check_credit_balance() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credit_balance < 0 THEN
    RAISE EXCEPTION 'Credit balance cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_credit_balance
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_credit_balance();

-- Trigger to validate package type exists
CREATE OR REPLACE FUNCTION check_package_type() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.package_type NOT IN ('free', 'student', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid package type';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_package_type
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_package_type();

-- Trigger to prevent credit deduction below zero
CREATE OR REPLACE FUNCTION prevent_negative_credit_transaction() RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF NEW.transaction_type IN ('ai_generation', 'report_generation') AND NEW.amount < 0 THEN
    SELECT credit_balance INTO current_balance FROM profiles WHERE user_id = NEW.user_id;
    IF current_balance + NEW.amount < 0 THEN
      RAISE EXCEPTION 'Insufficient credits for transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_negative_credit_transaction
BEFORE INSERT ON credit_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_negative_credit_transaction();

-- Business Logic Functions to handle server-side processes in DB

-- Function to cast a vote on an idea (inserts vote and updates rating)
CREATE OR REPLACE FUNCTION cast_vote(p_idea_id UUID, p_user_id UUID, p_rating INTEGER) RETURNS VOID AS $$
BEGIN
  -- Insert vote
  INSERT INTO votes (idea_id, user_id, rating) VALUES (p_idea_id, p_user_id, p_rating)
  ON CONFLICT (idea_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;

  -- Rating update is handled by trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits for AI generation
CREATE OR REPLACE FUNCTION deduct_credits_for_generation(p_user_id UUID, p_amount INTEGER, p_metadata JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  -- Insert transaction
  INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
  VALUES (p_user_id, 'ai_generation', -p_amount, p_metadata, 'active');

  -- Update profile balance (handled by app logic, but trigger validates)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases or rewards)
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER, p_transaction_type TEXT, p_metadata JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
  VALUES (p_user_id, p_transaction_type, p_amount, p_metadata, 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(p_user_id UUID, p_type TEXT, p_message TEXT) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message) VALUES (p_user_id, p_type, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(p_user_id UUID, p_action_type TEXT, p_entity_type TEXT, p_entity_id UUID, p_details JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, details)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute voting rewards
CREATE OR REPLACE FUNCTION distribute_voting_rewards(p_idea_id UUID) RETURNS VOID AS $$
DECLARE
  reward_amount INTEGER := 10; -- Fixed reward per vote
  voter_record RECORD;
BEGIN
  FOR voter_record IN SELECT user_id FROM votes WHERE idea_id = p_idea_id LOOP
    INSERT INTO voting_rewards (idea_id, voter_id, reward_amount) VALUES (p_idea_id, voter_record.user_id, reward_amount);
    -- Add credits via function
    PERFORM add_credits(voter_record.user_id, reward_amount, 'reward_earned', jsonb_build_object('source', 'voting', 'idea_id', p_idea_id));
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a model section
CREATE OR REPLACE FUNCTION complete_model_section(p_section_id UUID, p_user_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE model_sections SET is_completed = TRUE, updated_at = NOW()
  WHERE id = p_section_id AND EXISTS (
    SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an idea (with defaults)
CREATE OR REPLACE FUNCTION create_idea(p_user_id UUID, p_title TEXT, p_category TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL) RETURNS UUID AS $$
DECLARE
  new_idea_id UUID;
BEGIN
  INSERT INTO ideas (user_id, title, category, description)
  VALUES (p_user_id, p_title, p_category, p_description)
  RETURNING id INTO new_idea_id;

  -- Log activity
  PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id);

  RETURN new_idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update idea status
CREATE OR REPLACE FUNCTION update_idea_status(p_idea_id UUID, p_user_id UUID, p_status TEXT) RETURNS VOID AS $$
BEGIN
  UPDATE ideas SET overall_status = p_status, updated_at = NOW()
  WHERE id = p_idea_id AND user_id = p_user_id;

  -- Log activity
  PERFORM log_activity(p_user_id, 'update_status', 'idea', p_idea_id, jsonb_build_object('new_status', p_status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional Triggers for Automation

-- Trigger to create notification on new vote
CREATE OR REPLACE FUNCTION notify_on_vote() RETURNS TRIGGER AS $$
BEGIN
  -- Notify idea owner of new vote
  PERFORM create_notification(
    (SELECT user_id FROM ideas WHERE id = NEW.idea_id),
    'vote',
    'Someone voted on your idea'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_vote
AFTER INSERT ON votes
FOR EACH ROW EXECUTE FUNCTION notify_on_vote();

-- Trigger to log activity on idea updates
CREATE OR REPLACE FUNCTION log_idea_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(NEW.user_id, 'update', 'idea', NEW.id, jsonb_build_object('changes', 'idea updated'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_idea_changes
AFTER UPDATE ON ideas
FOR EACH ROW EXECUTE FUNCTION log_idea_changes();

-- Trigger to update profile credit balance on transactions
CREATE OR REPLACE FUNCTION update_credit_balance() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type IN ('credit_purchase', 'reward_earned') THEN
    UPDATE profiles SET credit_balance = credit_balance + NEW.amount, last_credit_update = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.transaction_type IN ('ai_generation', 'report_generation') THEN
    UPDATE profiles SET credit_balance = credit_balance + NEW.amount, last_credit_update = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_balance
AFTER INSERT ON credit_transactions
FOR EACH ROW EXECUTE FUNCTION update_credit_balance();

-- Trigger to create activity log on model section completion
CREATE OR REPLACE FUNCTION log_section_completion() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed AND (OLD.is_completed IS NULL OR NOT OLD.is_completed) THEN
    PERFORM log_activity(
      (SELECT mi.user_id FROM model_instances mi WHERE mi.id = NEW.model_instance_id),
      'complete_section',
      'model_section',
      NEW.id,
      jsonb_build_object('section_name', NEW.section_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_section_completion
AFTER UPDATE ON model_sections
FOR EACH ROW EXECUTE FUNCTION log_section_completion();

-- Advanced Business Logic Functions for API Unification

-- Function to get filtered user ideas with ratings and stats
CREATE OR REPLACE FUNCTION get_user_ideas_filtered(p_user_id UUID, p_status TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL, p_search TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  tags TEXT[],
  category TEXT,
  privacy TEXT,
  rating DECIMAL(3,2),
  overall_status TEXT,
  completion_percentage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  validation_threshold_met BOOLEAN,
  unlocked_models TEXT[],
  vote_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.description,
    i.tags,
    i.category,
    i.privacy,
    i.rating,
    i.overall_status,
    i.completion_percentage,
    i.created_at,
    i.updated_at,
    i.validation_threshold_met,
    i.unlocked_models,
    COUNT(v.*) as vote_count
  FROM ideas i
  LEFT JOIN votes v ON i.id = v.idea_id
  WHERE i.user_id = p_user_id
    AND (p_status IS NULL OR i.overall_status = p_status)
    AND (p_category IS NULL OR i.category = p_category)
    AND (p_search IS NULL OR i.title ILIKE '%' || p_search || '%' OR i.description ILIKE '%' || p_search || '%')
  GROUP BY i.id, i.title, i.description, i.tags, i.category, i.privacy, i.rating, i.overall_status, i.completion_percentage, i.created_at, i.updated_at, i.validation_threshold_met, i.unlocked_models
  ORDER BY i.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified dashboard data function using views
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   dashboard_data JSON;
   recent_activity JSON;
   recent_votes JSON;
BEGIN
   -- Get main dashboard data from view
   SELECT json_build_object(
     'profile', json_build_object(
       'name', uds.name,
       'avatar_url', uds.avatar_url,
       'credit_balance', uds.credit_balance,
       'total_earned', uds.total_earned,
       'total_spent', uds.total_spent,
       'package_type', uds.package_type,
       'package_status', uds.package_status
     ),
     'ideas', json_build_object(
       'total', uds.total_ideas,
       'completed', uds.completed_ideas,
       'completion_rate', CASE WHEN uds.total_ideas > 0 THEN ROUND((uds.completed_ideas::decimal / uds.total_ideas) * 100) ELSE 0 END,
       'average_rating', uds.average_rating
     ),
     'credits', json_build_object(
       'current_balance', uds.credit_balance,
       'total_earned', uds.total_earned,
       'total_spent', uds.total_spent
     ),
     'votes', json_build_object(
       'total_given', uds.total_votes_given
     ),
     'rewards', json_build_object(
       'earned', uds.total_rewards_earned,
       'amount', uds.rewards_amount
     )
   ) INTO dashboard_data
   FROM user_dashboard_summary uds
   WHERE uds.user_id = p_user_id;

   -- Get recent activity
   SELECT json_agg(
     json_build_object(
       'id', id,
       'action_type', action_type,
       'entity_type', entity_type,
       'created_at', created_at,
       'idea_title', idea_title,
       'details', details
     )
   ) INTO recent_activity
   FROM user_activity_feed
   WHERE user_id = p_user_id
   LIMIT 10;

   -- Get recent votes given
   SELECT json_agg(
     json_build_object(
       'id', v.id,
       'rating', v.rating,
       'created_at', v.created_at,
       'idea_title', i.title
     )
   ) INTO recent_votes
   FROM votes v
   JOIN ideas i ON v.idea_id = i.id
   WHERE v.user_id = p_user_id
   ORDER BY v.created_at DESC
   LIMIT 5;

   RETURN json_build_object(
     'stats', dashboard_data,
     'recent_activity', recent_activity,
     'recent_votes', recent_votes
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified voting dashboard function using views
CREATE OR REPLACE FUNCTION get_voting_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   stats JSON;
   ideas_data JSON;
   votable_ideas JSON;
BEGIN
   -- Get stats from voting dashboard view
   SELECT json_build_object(
     'ideas_count', total_ideas,
     'total_votes_received', total_votes_received,
     'overall_rating', overall_rating,
     'rewards_earned', rewards_earned,
     'total_earned_from_rewards', total_earned_from_rewards,
     'votes_given', votes_given,
     'current_credits', current_credits
   ) INTO stats
   FROM voting_dashboard
   WHERE user_id = p_user_id;

   -- Get user's ideas with stats
   SELECT json_agg(
     json_build_object(
       'id', id,
       'title', title,
       'completion_percentage', completion_percentage,
       'overall_status', overall_status,
       'rating', rating,
       'vote_count', vote_count,
       'reward_count', reward_count
     )
   ) INTO ideas_data
   FROM ideas_with_stats
   WHERE user_id = p_user_id;

   -- Get votable ideas
   SELECT json_agg(
     json_build_object(
       'id', id,
       'title', title,
       'user_name', user_name,
       'rating', rating,
       'vote_count', vote_count,
       'total_rewards', total_rewards
     )
   ) INTO votable_ideas
   FROM ideas_with_stats
   WHERE user_id != p_user_id AND privacy = 'public'
   ORDER BY created_at DESC
   LIMIT 10;

   RETURN json_build_object(
     'stats', stats,
     'ideas', ideas_data,
     'votable_ideas', votable_ideas
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit information
CREATE OR REPLACE FUNCTION get_user_credit_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  profile_data JSON;
  transactions_data JSON;
BEGIN
  -- Get profile data
  SELECT json_build_object(
    'credit_balance', credit_balance,
    'total_spent', total_spent,
    'total_earned', total_earned,
    'last_credit_update', last_credit_update
  ) INTO profile_data
  FROM profiles WHERE user_id = p_user_id;

  -- Get recent transactions (last 20)
  SELECT json_agg(
    json_build_object(
      'id', id,
      'transaction_type', transaction_type,
      'amount', amount,
      'metadata', metadata,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO transactions_data
  FROM (
    SELECT * FROM credit_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'profile', profile_data,
    'transactions', transactions_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard_data()
RETURNS TABLE (
  idea_id UUID,
  title TEXT,
  user_name TEXT,
  rating DECIMAL(3,2),
  vote_count BIGINT,
  reward_amount INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    p.name,
    i.rating,
    COUNT(v.*) as vote_count,
    COALESCE(SUM(vr.reward_amount), 0)::INTEGER as reward_amount
  FROM ideas i
  JOIN profiles p ON i.user_id = p.user_id
  LEFT JOIN votes v ON i.id = v.idea_id
  LEFT JOIN voting_rewards vr ON i.id = vr.idea_id
  WHERE i.privacy = 'public'
  GROUP BY i.id, i.title, p.name, i.rating
  ORDER BY reward_amount DESC, rating DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and create idea
CREATE OR REPLACE FUNCTION validate_and_create_idea(p_user_id UUID, p_title TEXT, p_description TEXT, p_category TEXT DEFAULT 'Other', p_tags TEXT[] DEFAULT '{}', p_privacy TEXT DEFAULT 'private')
RETURNS JSON AS $$
DECLARE
  new_idea_id UUID;
  validation_errors TEXT[] := '{}';
BEGIN
  -- Validation
  IF p_title IS NULL OR trim(p_title) = '' THEN
    validation_errors := validation_errors || 'Title is required';
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    validation_errors := validation_errors || 'Description is required';
  END IF;

  IF array_length(validation_errors, 1) > 0 THEN
    RETURN json_build_object(
      'success', false,
      'errors', validation_errors
    );
  END IF;

  -- Create idea
  INSERT INTO ideas (
    user_id, title, description, category, tags, privacy,
    overall_status, completion_percentage, validation_threshold_met, unlocked_models
  ) VALUES (
    p_user_id, trim(p_title), trim(p_description), p_category, p_tags, p_privacy,
    'draft', 0, false, ARRAY['idea']
  ) RETURNING id INTO new_idea_id;

  -- Log activity
  PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id, jsonb_build_object('title', p_title));

  RETURN json_build_object(
    'success', true,
    'idea_id', new_idea_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and cast vote
CREATE OR REPLACE FUNCTION validate_and_cast_vote(p_idea_id UUID, p_user_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
  idea_data RECORD;
BEGIN
  -- Get idea data
  SELECT * INTO idea_data FROM ideas WHERE id = p_idea_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Idea not found');
  END IF;

  IF idea_data.privacy != 'public' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot vote on private ideas');
  END IF;

  IF idea_data.user_id = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot vote on your own ideas');
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('success', false, 'error', 'Rating must be between 1 and 5');
  END IF;

  -- Cast vote
  PERFORM cast_vote(p_idea_id, p_user_id, p_rating);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process AI generation with credit deduction
CREATE OR REPLACE FUNCTION process_ai_generation(p_user_id UUID, p_cost INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check balance
  SELECT credit_balance INTO current_balance FROM profiles WHERE user_id = p_user_id;

  IF current_balance < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Deduct credits
  PERFORM deduct_credits_for_generation(p_user_id, p_cost, p_metadata);

  RETURN json_build_object('success', true, 'new_balance', current_balance - p_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process credit purchase
CREATE OR REPLACE FUNCTION process_credit_purchase(p_user_id UUID, p_amount INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
BEGIN
  PERFORM add_credits(p_user_id, p_amount, 'credit_purchase', p_metadata);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete section workflow
CREATE OR REPLACE FUNCTION complete_section_workflow(p_section_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  section_data RECORD;
BEGIN
  -- Check ownership
  SELECT ms.* INTO section_data
  FROM model_sections ms
  JOIN model_instances mi ON ms.model_instance_id = mi.id
  WHERE ms.id = p_section_id AND mi.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Section not found or access denied');
  END IF;

  -- Complete section
  PERFORM complete_model_section(p_section_id, p_user_id);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update idea workflow
CREATE OR REPLACE FUNCTION update_idea_workflow(p_idea_id UUID, p_user_id UUID, p_status TEXT DEFAULT NULL, p_updates JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   idea_data RECORD;
BEGIN
   -- Check ownership
   SELECT * INTO idea_data FROM ideas WHERE id = p_idea_id AND user_id = p_user_id;

   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Idea not found or access denied');
   END IF;

   -- Update status if provided
   IF p_status IS NOT NULL THEN
      PERFORM update_idea_status(p_idea_id, p_user_id, p_status);
   END IF;

   -- Apply other updates
   IF p_updates != '{}' THEN
      UPDATE ideas SET
         title = COALESCE(p_updates->>'title', title),
         description = COALESCE(p_updates->>'description', description),
         category = COALESCE(p_updates->>'category', category),
         tags = COALESCE((p_updates->'tags')::TEXT[], tags),
         privacy = COALESCE(p_updates->>'privacy', privacy),
         updated_at = NOW()
      WHERE id = p_idea_id;
   END IF;

   RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive User Management Functions

-- Function to manage user profile operations
CREATE OR REPLACE FUNCTION manage_user_profile(p_user_id UUID, p_action TEXT, p_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   result JSON;
   profile_exists BOOLEAN;
BEGIN
   -- Check if profile exists
   SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) INTO profile_exists;

   CASE p_action
      WHEN 'create' THEN
         IF profile_exists THEN
            RETURN json_build_object('success', false, 'error', 'Profile already exists');
         END IF;

         -- Create profile with defaults
         INSERT INTO profiles (
            user_id,
            name,
            avatar_url,
            credit_balance,
            preferences
         ) VALUES (
            p_user_id,
            COALESCE(p_data->>'name', ''),
            COALESCE(p_data->>'avatar_url', ''),
            COALESCE((p_data->>'initial_credits')::INTEGER, 1000),
            COALESCE(p_data->'preferences', '{}'::JSONB)
         );

         result := json_build_object('success', true, 'message', 'Profile created');

      WHEN 'update' THEN
         IF NOT profile_exists THEN
            RETURN json_build_object('success', false, 'error', 'Profile not found');
         END IF;

         -- Update profile fields
         UPDATE profiles SET
            name = COALESCE(p_data->>'name', name),
            avatar_url = COALESCE(p_data->>'avatar_url', avatar_url),
            preferences = COALESCE(p_data->'preferences', preferences),
            updated_at = NOW()
         WHERE user_id = p_user_id;

         result := json_build_object('success', true, 'message', 'Profile updated');

      WHEN 'get' THEN
         IF NOT profile_exists THEN
            RETURN json_build_object('success', false, 'error', 'Profile not found');
         END IF;

         -- Get profile with package info
         SELECT json_build_object(
            'success', true,
            'profile', json_build_object(
               'user_id', p.user_id,
               'name', p.name,
               'avatar_url', p.avatar_url,
               'credit_balance', p.credit_balance,
               'total_earned', p.total_earned,
               'total_spent', p.total_spent,
               'package_type', p.package_type,
               'package_status', p.package_status,
               'preferences', p.preferences
            ),
            'package', json_build_object(
               'name', pkg.name,
               'features', pkg.features,
               'price_monthly', pkg.price_monthly
            )
         ) INTO result
         FROM profiles p
         LEFT JOIN packages pkg ON p.package_type = pkg.type
         WHERE p.user_id = p_user_id;

      WHEN 'delete' THEN
         IF NOT profile_exists THEN
            RETURN json_build_object('success', false, 'error', 'Profile not found');
         END IF;

         -- Soft delete or anonymize profile
         UPDATE profiles SET
            name = '[Deleted User]',
            avatar_url = NULL,
            preferences = '{}'::JSONB
         WHERE user_id = p_user_id;

         result := json_build_object('success', true, 'message', 'Profile deleted');

      ELSE
         result := json_build_object('success', false, 'error', 'Invalid action');
   END CASE;

   RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_user_registration(p_user_id UUID, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   profile_result JSON;
   package_type TEXT;
BEGIN
   -- Determine initial package based on metadata
   package_type := COALESCE(p_metadata->>'initial_package', 'free');

   -- Validate package type
   IF package_type NOT IN ('free', 'student', 'enterprise') THEN
      package_type := 'free';
   END IF;

   -- Create profile
   SELECT manage_user_profile(p_user_id, 'create',
      json_build_object(
         'name', COALESCE(p_metadata->>'name', ''),
         'avatar_url', COALESCE(p_metadata->>'avatar_url', ''),
         'initial_credits', CASE
            WHEN package_type = 'free' THEN 1000
            WHEN package_type = 'student' THEN 1500
            WHEN package_type = 'enterprise' THEN 5000
            ELSE 1000
         END,
         'package_type', package_type,
         'preferences', json_build_object(
            'language', COALESCE(p_metadata->>'language', 'en'),
            'theme', 'light',
            'notifications', json_build_object('push', true)
         )
      )
   ) INTO profile_result;

   IF NOT (profile_result->>'success')::BOOLEAN THEN
      RETURN profile_result;
   END IF;

   -- Create welcome notification
   PERFORM create_notification(
      p_user_id,
      'welcome',
      'Welcome to Accelerator! You have ' ||
      CASE
         WHEN package_type = 'free' THEN '1000'
         WHEN package_type = 'student' THEN '1500'
         WHEN package_type = 'enterprise' THEN '5000'
         ELSE '1000'
      END || ' credits to start building your ideas.'
   );

   -- Log registration activity
   PERFORM log_activity(p_user_id, 'register', 'user', p_user_id,
      json_build_object('package_type', package_type, 'source', p_metadata->>'source'));

   RETURN json_build_object(
      'success', true,
      'user_id', p_user_id,
      'package_type', package_type,
      'initial_credits', CASE
         WHEN package_type = 'free' THEN 1000
         WHEN package_type = 'student' THEN 1500
         WHEN package_type = 'enterprise' THEN 5000
         ELSE 1000
      END
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user package
CREATE OR REPLACE FUNCTION update_user_package(p_user_id UUID, p_package_type TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   current_package TEXT;
   credit_bonus INTEGER := 0;
   profile_exists BOOLEAN;
BEGIN
   -- Check if profile exists
   SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) INTO profile_exists;
   IF NOT profile_exists THEN
      RETURN json_build_object('success', false, 'error', 'Profile not found');
   END IF;

   -- Validate package type
   IF p_package_type NOT IN ('free', 'student', 'enterprise') THEN
      RETURN json_build_object('success', false, 'error', 'Invalid package type');
   END IF;

   -- Get current package
   SELECT package_type INTO current_package FROM profiles WHERE user_id = p_user_id;

   -- Calculate credit bonus for upgrades
   IF p_package_type = 'student' AND current_package = 'free' THEN
      credit_bonus := 500;
   ELSIF p_package_type = 'enterprise' AND current_package IN ('free', 'student') THEN
      credit_bonus := 4000;
   END IF;

   -- Update package
   UPDATE profiles SET
      package_type = p_package_type,
      package_status = 'active',
      package_started = NOW(),
      package_expires = CASE
         WHEN p_package_type = 'free' THEN NULL
         ELSE NOW() + INTERVAL '1 month'
      END,
      credit_balance = credit_balance + credit_bonus,
      total_earned = total_earned + credit_bonus,
      last_credit_update = NOW()
   WHERE user_id = p_user_id;

   -- Add credit transaction if bonus given
   IF credit_bonus > 0 THEN
      INSERT INTO credit_transactions (
         user_id,
         transaction_type,
         amount,
         metadata,
         status
      ) VALUES (
         p_user_id,
         'package_upgrade',
         credit_bonus,
         json_build_object('from_package', current_package, 'to_package', p_package_type),
         'active'
      );
   END IF;

   -- Create notification
   PERFORM create_notification(
      p_user_id,
      'package_upgrade',
      'Your package has been upgraded to ' || p_package_type ||
      CASE WHEN credit_bonus > 0 THEN ' with ' || credit_bonus || ' bonus credits!' ELSE '!' END
   );

   -- Log activity
   PERFORM log_activity(p_user_id, 'upgrade_package', 'user', p_user_id,
      json_build_object('from_package', current_package, 'to_package', p_package_type, 'credit_bonus', credit_bonus));

   RETURN json_build_object(
      'success', true,
      'previous_package', current_package,
      'new_package', p_package_type,
      'credit_bonus', credit_bonus,
      'expires_at', CASE
         WHEN p_package_type = 'free' THEN NULL
         ELSE (NOW() + INTERVAL '1 month')::TEXT
      END
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to load user context (replaces middleware logic)
CREATE OR REPLACE FUNCTION load_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   user_data JSON;
   profile_data JSON;
   projects_data JSON;
   stats_data JSON;
BEGIN
   -- Get profile data
   SELECT json_build_object(
      'user_id', p.user_id,
      'name', p.name,
      'avatar_url', p.avatar_url,
      'credit_balance', p.credit_balance,
      'package_type', p.package_type,
      'package_status', p.package_status,
      'preferences', p.preferences
   ) INTO profile_data
   FROM profiles p
   WHERE p.user_id = p_user_id;

   -- Get user's recent projects
   SELECT json_agg(
      json_build_object(
         'id', i.id,
         'title', i.title,
         'completion_percentage', i.completion_percentage,
         'updated_at', i.updated_at
      )
   ) INTO projects_data
   FROM ideas i
   WHERE i.user_id = p_user_id
   ORDER BY i.updated_at DESC, i.created_at DESC
   LIMIT 10;

   -- Get quick stats
   SELECT json_build_object(
      'total_ideas', COUNT(*),
      'completed_ideas', COUNT(CASE WHEN overall_status = 'completed' THEN 1 END),
      'total_votes', COALESCE(SUM(vote_count), 0),
      'current_credits', (SELECT credit_balance FROM profiles WHERE user_id = p_user_id)
   ) INTO stats_data
   FROM ideas_with_stats
   WHERE user_id = p_user_id;

   RETURN json_build_object(
      'user', profile_data,
      'projects', COALESCE(projects_data, '[]'::JSON),
      'stats', stats_data,
      'success', true
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete Credit System Migration to Database

-- Function to process credit transactions (unified credit management)
CREATE OR REPLACE FUNCTION process_credit_transaction(p_user_id UUID, p_type TEXT, p_amount INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   current_balance INTEGER;
   new_balance INTEGER;
   transaction_id UUID;
BEGIN
   -- Validate transaction type
   IF p_type NOT IN ('credit_purchase', 'ai_generation', 'report_generation', 'reward_earned', 'reward_given', 'package_upgrade', 'admin_adjustment') THEN
      RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
   END IF;

   -- Get current balance
   SELECT credit_balance INTO current_balance
   FROM profiles WHERE user_id = p_user_id;

   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'User profile not found');
   END IF;

   -- For debit transactions, validate sufficient balance
   IF p_amount < 0 AND current_balance + p_amount < 0 THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient credits', 'current_balance', current_balance, 'required', -p_amount);
   END IF;

   -- Calculate new balance
   new_balance := current_balance + p_amount;

   -- Insert transaction
   INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      amount,
      metadata,
      status
   ) VALUES (
      p_user_id,
      p_type,
      p_amount,
      p_metadata,
      'active'
   ) RETURNING id INTO transaction_id;

   -- Update profile balance and totals
   UPDATE profiles SET
      credit_balance = new_balance,
      total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
      total_spent = CASE WHEN p_amount < 0 THEN total_spent - p_amount ELSE total_spent END,
      last_credit_update = NOW()
   WHERE user_id = p_user_id;

   -- Create notification for significant transactions
   IF p_type IN ('credit_purchase', 'package_upgrade') AND p_amount > 0 THEN
      PERFORM create_notification(
         p_user_id,
         'credit_earned',
         'You received ' || p_amount || ' credits for ' || p_type
      );
   ELSIF p_type IN ('ai_generation', 'report_generation') AND p_amount < 0 THEN
      PERFORM create_notification(
         p_user_id,
         'credit_spent',
         'You spent ' || -p_amount || ' credits for ' || p_type
      );
   END IF;

   -- Log activity for credit changes
   PERFORM log_activity(p_user_id, 'credit_transaction', 'credit', transaction_id,
      json_build_object('type', p_type, 'amount', p_amount, 'new_balance', new_balance));

   RETURN json_build_object(
      'success', true,
      'transaction_id', transaction_id,
      'previous_balance', current_balance,
      'new_balance', new_balance,
      'amount', p_amount,
      'type', p_type
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current credit balance (for validation)
CREATE OR REPLACE FUNCTION calculate_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
   balance INTEGER;
BEGIN
   SELECT credit_balance INTO balance
   FROM profiles WHERE user_id = p_user_id;

   IF NOT FOUND THEN
      RETURN 0;
   END IF;

   RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate credit operation
CREATE OR REPLACE FUNCTION validate_credit_operation(p_user_id UUID, p_amount INTEGER)
RETURNS JSON AS $$
DECLARE
   current_balance INTEGER;
BEGIN
   SELECT credit_balance INTO current_balance
   FROM profiles WHERE user_id = p_user_id;

   IF NOT FOUND THEN
      RETURN json_build_object('valid', false, 'error', 'User profile not found');
   END IF;

   IF p_amount < 0 AND current_balance + p_amount < 0 THEN
      RETURN json_build_object(
         'valid', false,
         'error', 'Insufficient credits',
         'current_balance', current_balance,
         'required', -p_amount,
         'shortfall', -(current_balance + p_amount)
      );
   END IF;

   RETURN json_build_object(
      'valid', true,
      'current_balance', current_balance,
      'projected_balance', current_balance + p_amount
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get credit history with pagination
CREATE OR REPLACE FUNCTION get_credit_history(p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
   transactions_data JSON;
   summary_data JSON;
BEGIN
   -- Get paginated transactions
   SELECT json_agg(
      json_build_object(
         'id', id,
         'transaction_type', transaction_type,
         'amount', amount,
         'metadata', metadata,
         'created_at', created_at,
         'status', status
      ) ORDER BY created_at DESC
   ) INTO transactions_data
   FROM (
      SELECT * FROM credit_transactions
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset
   ) t;

   -- Get summary stats
   SELECT json_build_object(
      'total_transactions', COUNT(*),
      'total_earned', COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0),
      'total_spent', COALESCE(SUM(CASE WHEN amount < 0 THEN -amount END), 0),
      'current_balance', (SELECT credit_balance FROM profiles WHERE user_id = p_user_id),
      'last_transaction', MAX(created_at)
   ) INTO summary_data
   FROM credit_transactions
   WHERE user_id = p_user_id;

   RETURN json_build_object(
      'transactions', COALESCE(transactions_data, '[]'::JSON),
      'summary', summary_data,
      'pagination', json_build_object(
         'limit', p_limit,
         'offset', p_offset,
         'has_more', (SELECT COUNT(*) > p_offset + p_limit FROM credit_transactions WHERE user_id = p_user_id)
      )
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Idea Management Migration to Database Functions

-- Function to generate unique slug for ideas
CREATE OR REPLACE FUNCTION generate_idea_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
   base_slug TEXT;
   final_slug TEXT;
   counter INTEGER := 1;
BEGIN
   -- Create base slug from title
   base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p_title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));

   -- Ensure it's not empty
   IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'idea';
   END IF;

   -- Find unique slug
   final_slug := base_slug;

   WHILE EXISTS(SELECT 1 FROM ideas WHERE slug = final_slug) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
   END LOOP;

   RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to manage idea operations
CREATE OR REPLACE FUNCTION manage_idea(p_user_id UUID, p_action TEXT, p_idea_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   new_idea_id UUID;
   slug_text TEXT;
   idea_record RECORD;
BEGIN
   CASE p_action
      WHEN 'create' THEN
         -- Validate required fields
         IF p_idea_data->>'title' IS NULL OR trim(p_idea_data->>'title') = '' THEN
            RETURN json_build_object('success', false, 'error', 'Title is required');
         END IF;

         IF p_idea_data->>'description' IS NULL OR trim(p_idea_data->>'description') = '' THEN
            RETURN json_build_object('success', false, 'error', 'Description is required');
         END IF;

         -- Generate slug
         slug_text := generate_idea_slug(p_idea_data->>'title');

         -- Create idea
         INSERT INTO ideas (
            user_id,
            title,
            description,
            category,
            tags,
            privacy,
            slug,
            overall_status,
            completion_percentage,
            validation_threshold_met,
            unlocked_models
         ) VALUES (
            p_user_id,
            trim(p_idea_data->>'title'),
            trim(p_idea_data->>'description'),
            COALESCE(p_idea_data->>'category', 'Other'),
            COALESCE(p_idea_data->>'tags', '{}')::TEXT[],
            COALESCE(p_idea_data->>'privacy', 'private'),
            slug_text,
            'draft',
            0,
            false,
            ARRAY['idea']
         ) RETURNING id INTO new_idea_id;

         -- Log activity
         PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id,
            json_build_object('title', p_idea_data->>'title', 'slug', slug_text));

         RETURN json_build_object(
            'success', true,
            'idea_id', new_idea_id,
            'slug', slug_text,
            'message', 'Idea created successfully'
         );

      WHEN 'update' THEN
         -- Validate idea ownership
         SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Idea not found');
         END IF;

         IF idea_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Access denied');
         END IF;

         -- Update idea
         UPDATE ideas SET
            title = COALESCE(trim(p_idea_data->>'title'), title),
            description = COALESCE(trim(p_idea_data->>'description'), description),
            category = COALESCE(p_idea_data->>'category', category),
            tags = COALESCE(p_idea_data->>'tags', tags),
            privacy = COALESCE(p_idea_data->>'privacy', privacy),
            updated_at = NOW()
         WHERE id = (p_idea_data->>'idea_id')::UUID;

         -- Log activity
         PERFORM log_activity(p_user_id, 'update', 'idea', (p_idea_data->>'idea_id')::UUID,
            json_build_object('changes', 'idea updated'));

         RETURN json_build_object('success', true, 'message', 'Idea updated successfully');

      WHEN 'delete' THEN
         -- Validate idea ownership
         SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Idea not found');
         END IF;

         IF idea_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Access denied');
         END IF;

         -- Soft delete (archive)
         UPDATE ideas SET
            overall_status = 'archived',
            privacy = 'private',
            updated_at = NOW()
         WHERE id = (p_idea_data->>'idea_id')::UUID;

         -- Log activity
         PERFORM log_activity(p_user_id, 'archive', 'idea', (p_idea_data->>'idea_id')::UUID,
            json_build_object('reason', 'user_deleted'));

         RETURN json_build_object('success', true, 'message', 'Idea archived successfully');

      WHEN 'publish' THEN
         -- Validate idea ownership
         SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Idea not found');
         END IF;

         IF idea_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Access denied');
         END IF;

         -- Publish idea
         UPDATE ideas SET
            privacy = 'public',
            updated_at = NOW()
         WHERE id = (p_idea_data->>'idea_id')::UUID;

         -- Log activity
         PERFORM log_activity(p_user_id, 'publish', 'idea', (p_idea_data->>'idea_id')::UUID,
            json_build_object('previous_privacy', idea_record.privacy));

         RETURN json_build_object('success', true, 'message', 'Idea published successfully');

      ELSE
         RETURN json_build_object('success', false, 'error', 'Invalid action');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate idea access
CREATE OR REPLACE FUNCTION validate_idea_access(p_user_id UUID, p_idea_id UUID)
RETURNS JSON AS $$
DECLARE
   idea_record RECORD;
BEGIN
   SELECT * INTO idea_record FROM ideas WHERE id = p_idea_id;

   IF NOT FOUND THEN
      RETURN json_build_object('valid', false, 'error', 'Idea not found');
   END IF;

   -- Check ownership
   IF idea_record.user_id = p_user_id THEN
      RETURN json_build_object('valid', true, 'access_level', 'owner');
   END IF;

   -- Check privacy
   IF idea_record.privacy = 'private' THEN
      RETURN json_build_object('valid', false, 'error', 'Access denied');
   END IF;

   -- Public idea
   RETURN json_build_object('valid', true, 'access_level', 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user ideas with filtering and pagination
CREATE OR REPLACE FUNCTION get_user_ideas(p_user_id UUID, p_filters JSONB DEFAULT '{}', p_pagination JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   ideas_data JSON;
   total_count INTEGER;
   limit_val INTEGER := COALESCE((p_pagination->>'limit')::INTEGER, 50);
   offset_val INTEGER := COALESCE((p_pagination->>'offset')::INTEGER, 0);
BEGIN
   -- Get total count
   SELECT COUNT(*) INTO total_count FROM ideas WHERE user_id = p_user_id;

   -- Get filtered and paginated ideas
   SELECT json_agg(
      json_build_object(
         'id', i.id,
         'title', i.title,
         'description', i.description,
         'category', i.category,
         'tags', i.tags,
         'privacy', i.privacy,
         'rating', i.rating,
         'completion_percentage', i.completion_percentage,
         'overall_status', i.overall_status,
         'created_at', i.created_at,
         'updated_at', i.updated_at,
         'slug', i.slug,
         'vote_count', COALESCE(stats.vote_count, 0),
         'reward_count', COALESCE(stats.reward_count, 0)
      ) ORDER BY i.updated_at DESC
   ) INTO ideas_data
   FROM ideas i
   LEFT JOIN ideas_with_stats stats ON i.id = stats.id
   WHERE i.user_id = p_user_id
     AND (p_filters->>'status' IS NULL OR i.overall_status = p_filters->>'status')
     AND (p_filters->>'category' IS NULL OR i.category = p_filters->>'category')
     AND (p_filters->>'privacy' IS NULL OR i.privacy = p_filters->>'privacy')
     AND (p_filters->>'search' IS NULL OR
          i.title ILIKE '%' || (p_filters->>'search') || '%' OR
          i.description ILIKE '%' || (p_filters->>'search') || '%')
   ORDER BY i.updated_at DESC
   LIMIT limit_val OFFSET offset_val;

   RETURN json_build_object(
      'ideas', COALESCE(ideas_data, '[]'::JSON),
      'pagination', json_build_object(
         'total', total_count,
         'limit', limit_val,
         'offset', offset_val,
         'has_more', (offset_val + limit_val) < total_count
      ),
      'filters', p_filters
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Voting & Rewards System in Database

-- Function to process vote transaction (atomic vote + reward distribution)
CREATE OR REPLACE FUNCTION process_vote_transaction(p_user_id UUID, p_idea_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
   idea_owner UUID;
   voter_count INTEGER;
   reward_threshold INTEGER := 5; -- Reward every 5 votes
   reward_amount INTEGER := 10;
BEGIN
   -- Validate rating
   IF p_rating < 1 OR p_rating > 5 THEN
      RETURN json_build_object('success', false, 'error', 'Rating must be between 1 and 5');
   END IF;

   -- Check if user already voted
   IF EXISTS(SELECT 1 FROM votes WHERE idea_id = p_idea_id AND user_id = p_user_id) THEN
      RETURN json_build_object('success', false, 'error', 'You have already voted on this idea');
   END IF;

   -- Get idea details
   SELECT user_id INTO idea_owner FROM ideas WHERE id = p_idea_id;
   IF idea_owner IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Idea not found');
   END IF;

   -- Check if idea is public
   IF NOT EXISTS(SELECT 1 FROM ideas WHERE id = p_idea_id AND privacy = 'public') THEN
      RETURN json_build_object('success', false, 'error', 'Cannot vote on private ideas');
   END IF;

   -- Prevent self-voting
   IF idea_owner = p_user_id THEN
      RETURN json_build_object('success', false, 'error', 'Cannot vote on your own ideas');
   END IF;

   -- Insert vote
   INSERT INTO votes (idea_id, user_id, rating) VALUES (p_idea_id, p_user_id, p_rating);

   -- Get updated vote count
   SELECT COUNT(*) INTO voter_count FROM votes WHERE idea_id = p_idea_id;

   -- Check if reward threshold is met
   IF voter_count % reward_threshold = 0 THEN
      -- Distribute rewards to all voters
      INSERT INTO voting_rewards (idea_id, voter_id, reward_amount, distributed_at)
      SELECT p_idea_id, user_id, reward_amount, NOW()
      FROM votes
      WHERE idea_id = p_idea_id;

      -- Add credits to each voter
      UPDATE profiles SET
         credit_balance = credit_balance + reward_amount,
         total_earned = total_earned + reward_amount,
         last_credit_update = NOW()
      WHERE user_id IN (
         SELECT user_id FROM votes WHERE idea_id = p_idea_id
      );

      -- Create credit transactions
      INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
      SELECT
         v.user_id,
         'reward_earned',
         reward_amount,
         json_build_object('idea_id', p_idea_id, 'source', 'voting'),
         'active'
      FROM votes v
      WHERE v.idea_id = p_idea_id;

      -- Notify voters
      INSERT INTO notifications (user_id, type, message)
      SELECT
         v.user_id,
         'reward_earned',
         'You earned ' || reward_amount || ' credits for voting on an idea!'
      FROM votes v
      WHERE v.idea_id = p_idea_id;

      -- Log activity
      PERFORM log_activity(p_user_id, 'vote_reward_distributed', 'idea', p_idea_id,
         json_build_object('voters_rewarded', voter_count, 'reward_amount', reward_amount));
   END IF;

   -- Log the vote
   PERFORM log_activity(p_user_id, 'vote_cast', 'idea', p_idea_id,
      json_build_object('rating', p_rating));

   RETURN json_build_object(
      'success', true,
      'vote_count', voter_count,
      'rewards_distributed', CASE WHEN voter_count % reward_threshold = 0 THEN voter_count ELSE 0 END,
      'reward_amount', CASE WHEN voter_count % reward_threshold = 0 THEN reward_amount ELSE 0 END
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate voting rewards for an idea
CREATE OR REPLACE FUNCTION calculate_voting_rewards(p_idea_id UUID)
RETURNS JSON AS $$
DECLARE
   reward_amount INTEGER := 10;
   voter_count INTEGER;
   total_rewards INTEGER;
BEGIN
   -- Count voters
   SELECT COUNT(*) INTO voter_count FROM votes WHERE idea_id = p_idea_id;

   IF voter_count = 0 THEN
      RETURN json_build_object('success', false, 'error', 'No votes found');
   END IF;

   total_rewards := voter_count * reward_amount;

   -- Insert rewards (if not already exist)
   INSERT INTO voting_rewards (idea_id, voter_id, reward_amount, distributed_at)
   SELECT p_idea_id, user_id, reward_amount, NOW()
   FROM votes
   WHERE idea_id = p_idea_id
   ON CONFLICT (idea_id, voter_id) DO NOTHING;

   -- Add credits
   UPDATE profiles SET
      credit_balance = credit_balance + reward_amount,
      total_earned = total_earned + reward_amount,
      last_credit_update = NOW()
   WHERE user_id IN (
      SELECT user_id FROM votes WHERE idea_id = p_idea_id
   );

   -- Create transactions
   INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
   SELECT
      v.user_id,
      'reward_earned',
      reward_amount,
      json_build_object('idea_id', p_idea_id, 'source', 'voting'),
      'active'
   FROM votes v
   WHERE v.idea_id = p_idea_id
   ON CONFLICT DO NOTHING;

   RETURN json_build_object(
      'success', true,
      'voters_rewarded', voter_count,
      'total_rewards', total_rewards,
      'reward_per_voter', reward_amount
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute rewards (can be called by scheduled job)
CREATE OR REPLACE FUNCTION distribute_pending_rewards()
RETURNS JSON AS $$
DECLARE
   processed_count INTEGER := 0;
   total_rewards INTEGER := 0;
BEGIN
   -- Find ideas that need reward distribution
   -- This is a simplified version - in practice, you'd have more complex logic

   -- For now, just return success
   RETURN json_build_object(
      'success', true,
      'processed_ideas', processed_count,
      'total_rewards_distributed', total_rewards
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Model Management Migration to Database Functions

-- Function to manage model instances
CREATE OR REPLACE FUNCTION manage_model_instance(p_user_id UUID, p_idea_id UUID, p_model_type TEXT, p_action TEXT)
RETURNS JSON AS $$
DECLARE
   model_id UUID;
   idea_record RECORD;
   model_count INTEGER;
   default_sections JSONB;
BEGIN
   -- Validate idea ownership
   SELECT * INTO idea_record FROM ideas WHERE id = p_idea_id;
   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Idea not found');
   END IF;

   IF idea_record.user_id != p_user_id THEN
      RETURN json_build_object('success', false, 'error', 'Access denied');
   END IF;

   -- Validate model type
   IF p_model_type NOT IN ('idea', 'business', 'financial', 'funding', 'legal', 'marketing', 'team') THEN
      RETURN json_build_object('success', false, 'error', 'Invalid model type');
   END IF;

   CASE p_action
      WHEN 'create' THEN
         -- Check if model is unlocked for this idea
         IF NOT (p_model_type = ANY(idea_record.unlocked_models)) THEN
            RETURN json_build_object('success', false, 'error', 'Model not unlocked for this idea');
         END IF;

         -- Check if model instance already exists
         SELECT COUNT(*) INTO model_count
         FROM model_instances
         WHERE idea_id = p_idea_id AND model_type = p_model_type;

         IF model_count > 0 THEN
            RETURN json_build_object('success', false, 'error', 'Model instance already exists');
         END IF;

         -- Create model instance
         INSERT INTO model_instances (idea_id, user_id, model_type, status)
         VALUES (p_idea_id, p_user_id, p_model_type, 'draft')
         RETURNING id INTO model_id;

         -- Create default sections based on model type
         CASE p_model_type
            WHEN 'business' THEN
               INSERT INTO model_sections (model_instance_id, section_name, section_data)
               VALUES
               (model_id, 'Executive Summary', '{}'::JSONB),
               (model_id, 'Market Analysis', '{}'::JSONB),
               (model_id, 'Product/Service', '{}'::JSONB),
               (model_id, 'Marketing Strategy', '{}'::JSONB),
               (model_id, 'Financial Projections', '{}'::JSONB),
               (model_id, 'Operations Plan', '{}'::JSONB);
            WHEN 'financial' THEN
               INSERT INTO model_sections (model_instance_id, section_name, section_data)
               VALUES
               (model_id, 'Revenue Model', '{}'::JSONB),
               (model_id, 'Cost Structure', '{}'::JSONB),
               (model_id, 'Funding Requirements', '{}'::JSONB),
               (model_id, 'Financial Projections', '{}'::JSONB),
               (model_id, 'Break-even Analysis', '{}'::JSONB);
            WHEN 'marketing' THEN
               INSERT INTO model_sections (model_instance_id, section_name, section_data)
               VALUES
               (model_id, 'Target Audience', '{}'::JSONB),
               (model_id, 'Value Proposition', '{}'::JSONB),
               (model_id, 'Marketing Channels', '{}'::JSONB),
               (model_id, 'Brand Strategy', '{}'::JSONB),
               (model_id, 'Content Strategy', '{}'::JSONB);
            ELSE
               -- Default single section for other models
               INSERT INTO model_sections (model_instance_id, section_name, section_data)
               VALUES (model_id, 'Main Content', '{}'::JSONB);
         END CASE;

         -- Log activity
         PERFORM log_activity(p_user_id, 'model_created', 'model_instance', model_id,
            json_build_object('model_type', p_model_type, 'idea_id', p_idea_id));

         RETURN json_build_object(
            'success', true,
            'model_id', model_id,
            'model_type', p_model_type,
            'sections_created', CASE
               WHEN p_model_type = 'business' THEN 6
               WHEN p_model_type = 'financial' THEN 5
               WHEN p_model_type = 'marketing' THEN 5
               ELSE 1
            END
         );

      WHEN 'delete' THEN
         -- Find model instance
         SELECT id INTO model_id
         FROM model_instances
         WHERE idea_id = p_idea_id AND model_type = p_model_type AND user_id = p_user_id;

         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Model instance not found');
         END IF;

         -- Delete sections first (cascade should handle this, but explicit)
         DELETE FROM model_sections WHERE model_instance_id = model_id;
         DELETE FROM model_instances WHERE id = model_id;

         -- Log activity
         PERFORM log_activity(p_user_id, 'model_deleted', 'model_instance', model_id,
            json_build_object('model_type', p_model_type));

         RETURN json_build_object('success', true, 'message', 'Model deleted');

      ELSE
         RETURN json_build_object('success', false, 'error', 'Invalid action');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate model access
CREATE OR REPLACE FUNCTION validate_model_access(p_user_id UUID, p_model_id UUID)
RETURNS JSON AS $$
DECLARE
   model_record RECORD;
BEGIN
   SELECT mi.*, i.user_id as idea_owner, i.unlocked_models
   INTO model_record
   FROM model_instances mi
   JOIN ideas i ON mi.idea_id = i.id
   WHERE mi.id = p_model_id;

   IF NOT FOUND THEN
      RETURN json_build_object('valid', false, 'error', 'Model not found');
   END IF;

   -- Check ownership
   IF model_record.idea_owner = p_user_id THEN
      RETURN json_build_object('valid', true, 'access_level', 'owner');
   END IF;

   -- Check if model is publicly accessible (if idea is public)
   IF EXISTS(
      SELECT 1 FROM ideas
      WHERE id = model_record.idea_id
      AND privacy = 'public'
   ) THEN
      RETURN json_build_object('valid', true, 'access_level', 'viewer');
   END IF;

   RETURN json_build_object('valid', false, 'error', 'Access denied');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete model section
CREATE OR REPLACE FUNCTION complete_model_section(p_user_id UUID, p_section_id UUID)
RETURNS JSON AS $$
DECLARE
   section_record RECORD;
   model_id UUID;
   total_sections INTEGER;
   completed_sections INTEGER;
   completion_percentage INTEGER;
BEGIN
   -- Get section and validate access
   SELECT ms.*, mi.idea_id, mi.model_type, i.user_id as idea_owner
   INTO section_record
   FROM model_sections ms
   JOIN model_instances mi ON ms.model_instance_id = mi.id
   JOIN ideas i ON mi.idea_id = i.id
   WHERE ms.id = p_section_id;

   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Section not found');
   END IF;

   IF section_record.idea_owner != p_user_id THEN
      RETURN json_build_object('success', false, 'error', 'Access denied');
   END IF;

   -- Mark section as completed
   UPDATE model_sections
   SET is_completed = true, updated_at = NOW()
   WHERE id = p_section_id;

   -- Calculate completion percentage for the model
   SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN is_completed THEN 1 END) as completed
   INTO total_sections, completed_sections
   FROM model_sections
   WHERE model_instance_id = section_record.model_instance_id;

   completion_percentage := (completed_sections * 100) / total_sections;

   -- Update model's status if fully completed
   IF completion_percentage = 100 THEN
      UPDATE model_instances
      SET status = 'completed', updated_at = NOW()
      WHERE id = section_record.model_instance_id;
   END IF;

   -- Update idea's overall completion percentage
   UPDATE ideas SET
      completion_percentage = (
         SELECT ROUND(AVG(completion_percentage), 0)
         FROM (
            SELECT
               CASE
                  WHEN COUNT(*) = 0 THEN 0
                  ELSE (COUNT(CASE WHEN ms.is_completed THEN 1 END) * 100.0) / COUNT(*)
               END as completion_percentage
            FROM model_instances mi
            LEFT JOIN model_sections ms ON mi.id = ms.model_instance_id
            WHERE mi.idea_id = section_record.idea_id
            GROUP BY mi.id
         ) model_completions
      ),
      updated_at = NOW()
   WHERE id = section_record.idea_id;

   -- Log activity
   PERFORM log_activity(p_user_id, 'section_completed', 'model_section', p_section_id,
      json_build_object('model_type', section_record.model_type, 'completion_percentage', completion_percentage));

   RETURN json_build_object(
      'success', true,
      'section_completed', true,
      'model_completion_percentage', completion_percentage,
      'idea_updated', true
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get model progress for user
CREATE OR REPLACE FUNCTION get_model_progress(p_user_id UUID, p_model_type TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
   progress_data JSON;
BEGIN
   SELECT json_agg(
      json_build_object(
         'model_type', model_type,
         'total_instances', total_instances,
         'completed_instances', completed_instances,
         'total_sections', total_sections,
         'completed_sections', completed_sections,
         'completion_percentage', ROUND(
            CASE
               WHEN total_sections > 0 THEN (completed_sections * 100.0) / total_sections
               ELSE 0
            END, 1
         )
      )
   ) INTO progress_data
   FROM (
      SELECT
         mi.model_type,
         COUNT(DISTINCT mi.id) as total_instances,
         COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_instances,
         COUNT(ms.id) as total_sections,
         COUNT(CASE WHEN ms.is_completed THEN 1 END) as completed_sections
      FROM model_instances mi
      LEFT JOIN model_sections ms ON mi.id = ms.model_instance_id
      WHERE mi.user_id = p_user_id
        AND (p_model_type IS NULL OR mi.model_type = p_model_type)
      GROUP BY mi.model_type
   ) progress;

   RETURN json_build_object(
      'user_id', p_user_id,
      'model_progress', COALESCE(progress_data, '[]'::JSON)
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Portfolio Management Migration to Database

-- Function to manage portfolios
CREATE OR REPLACE FUNCTION manage_portfolio(p_user_id UUID, p_action TEXT, p_portfolio_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   portfolio_id UUID;
   portfolio_record RECORD;
   member_count INTEGER;
BEGIN
   CASE p_action
      WHEN 'create' THEN
         -- Validate required fields
         IF p_portfolio_data->>'name' IS NULL OR trim(p_portfolio_data->>'name') = '' THEN
            RETURN json_build_object('success', false, 'error', 'Portfolio name is required');
         END IF;

         -- Check package for enterprise features
         IF NOT EXISTS(
            SELECT 1 FROM profiles
            WHERE user_id = p_user_id AND package_type = 'enterprise'
         ) THEN
            RETURN json_build_object('success', false, 'error', 'Enterprise package required for portfolios');
         END IF;

         -- Create portfolio
         INSERT INTO portfolios (
            user_id,
            name,
            description,
            color,
            is_default
         ) VALUES (
            p_user_id,
            trim(p_portfolio_data->>'name'),
            COALESCE(trim(p_portfolio_data->>'description'), ''),
            COALESCE(p_portfolio_data->>'color', '#3B82F6'),
            COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false)
         ) RETURNING id INTO portfolio_id;

         -- If this is the default portfolio, unset others
         IF COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false) THEN
            UPDATE portfolios SET is_default = false
            WHERE user_id = p_user_id AND id != portfolio_id;
         END IF;

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_created', 'portfolio', portfolio_id,
            json_build_object('name', p_portfolio_data->>'name'));

         RETURN json_build_object(
            'success', true,
            'portfolio_id', portfolio_id,
            'message', 'Portfolio created successfully'
         );

      WHEN 'update' THEN
         -- Validate ownership
         SELECT * INTO portfolio_record FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;
         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Portfolio not found');
         END IF;

         IF portfolio_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Access denied');
         END IF;

         -- Update portfolio
         UPDATE portfolios SET
            name = COALESCE(trim(p_portfolio_data->>'name'), name),
            description = COALESCE(trim(p_portfolio_data->>'description'), description),
            color = COALESCE(p_portfolio_data->>'color', color),
            is_default = COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, is_default),
            updated_at = NOW()
         WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;

         -- Handle default portfolio logic
         IF COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false) THEN
            UPDATE portfolios SET is_default = false
            WHERE user_id = p_user_id AND id != (p_portfolio_data->>'portfolio_id')::UUID;
         END IF;

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_updated', 'portfolio', (p_portfolio_data->>'portfolio_id')::UUID,
            json_build_object('changes', 'portfolio updated'));

         RETURN json_build_object('success', true, 'message', 'Portfolio updated successfully');

      WHEN 'delete' THEN
         -- Validate ownership
         SELECT * INTO portfolio_record FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;
         IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Portfolio not found');
         END IF;

         IF portfolio_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Access denied');
         END IF;

         -- Check if portfolio has ideas
         SELECT COUNT(*) INTO member_count FROM portfolio_ideas WHERE portfolio_id = (p_portfolio_data->>'portfolio_id')::UUID;
         IF member_count > 0 THEN
            RETURN json_build_object('success', false, 'error', 'Cannot delete portfolio with ideas. Remove all ideas first.');
         END IF;

         -- Delete portfolio members first
         DELETE FROM portfolio_members WHERE portfolio_id = (p_portfolio_data->>'portfolio_id')::UUID;

         -- Delete portfolio
         DELETE FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_deleted', 'portfolio', (p_portfolio_data->>'portfolio_id')::UUID,
            json_build_object('name', portfolio_record.name));

         RETURN json_build_object('success', true, 'message', 'Portfolio deleted successfully');

      ELSE
         RETURN json_build_object('success', false, 'error', 'Invalid action');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manage portfolio members
CREATE OR REPLACE FUNCTION manage_portfolio_members(p_portfolio_id UUID, p_user_id UUID, p_action TEXT, p_target_user_id UUID DEFAULT NULL, p_role TEXT DEFAULT 'viewer')
RETURNS JSON AS $$
DECLARE
   portfolio_record RECORD;
   current_user_role TEXT;
BEGIN
   -- Validate portfolio exists and user has access
   SELECT p.*, pm.role as current_role INTO portfolio_record
   FROM portfolios p
   LEFT JOIN portfolio_members pm ON p.id = pm.portfolio_id AND pm.user_id = p_user_id
   WHERE p.id = p_portfolio_id;

   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Portfolio not found');
   END IF;

   -- Check permissions (owner or editor can manage members)
   IF portfolio_record.user_id != p_user_id AND portfolio_record.current_role NOT IN ('owner', 'editor') THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
   END IF;

   CASE p_action
      WHEN 'add' THEN
         -- Validate target user
         IF p_target_user_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'Target user is required');
         END IF;

         -- Check if user is already a member
         IF EXISTS(SELECT 1 FROM portfolio_members WHERE portfolio_id = p_portfolio_id AND user_id = p_target_user_id) THEN
            RETURN json_build_object('success', false, 'error', 'User is already a member');
         END IF;

         -- Validate role
         IF p_role NOT IN ('owner', 'editor', 'viewer') THEN
            p_role := 'viewer';
         END IF;

         -- Add member
         INSERT INTO portfolio_members (
            portfolio_id,
            user_id,
            role,
            invited_by
         ) VALUES (
            p_portfolio_id,
            p_target_user_id,
            p_role,
            p_user_id
         );

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_member_added', 'portfolio', p_portfolio_id,
            json_build_object('target_user', p_target_user_id, 'role', p_role));

         RETURN json_build_object('success', true, 'message', 'Member added successfully');

      WHEN 'update_role' THEN
         -- Only owners can change roles
         IF portfolio_record.user_id != p_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Only portfolio owners can change roles');
         END IF;

         -- Validate role
         IF p_role NOT IN ('owner', 'editor', 'viewer') THEN
            RETURN json_build_object('success', false, 'error', 'Invalid role');
         END IF;

         -- Update role
         UPDATE portfolio_members SET
            role = p_role,
            updated_at = NOW()
         WHERE portfolio_id = p_portfolio_id AND user_id = p_target_user_id;

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_member_role_updated', 'portfolio', p_portfolio_id,
            json_build_object('target_user', p_target_user_id, 'new_role', p_role));

         RETURN json_build_object('success', true, 'message', 'Member role updated successfully');

      WHEN 'remove' THEN
         -- Cannot remove the owner
         IF p_target_user_id = portfolio_record.user_id THEN
            RETURN json_build_object('success', false, 'error', 'Cannot remove portfolio owner');
         END IF;

         -- Remove member
         DELETE FROM portfolio_members
         WHERE portfolio_id = p_portfolio_id AND user_id = p_target_user_id;

         -- Log activity
         PERFORM log_activity(p_user_id, 'portfolio_member_removed', 'portfolio', p_portfolio_id,
            json_build_object('target_user', p_target_user_id));

         RETURN json_build_object('success', true, 'message', 'Member removed successfully');

      ELSE
         RETURN json_build_object('success', false, 'error', 'Invalid action');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get portfolio statistics
CREATE OR REPLACE FUNCTION get_portfolio_stats(p_portfolio_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   portfolio_data RECORD;
   stats_data JSON;
BEGIN
   -- Validate access
   SELECT p.*, pm.role INTO portfolio_data
   FROM portfolios p
   LEFT JOIN portfolio_members pm ON p.id = pm.portfolio_id AND pm.user_id = p_user_id
   WHERE p.id = p_portfolio_id;

   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Portfolio not found');
   END IF;

   IF portfolio_data.user_id != p_user_id AND portfolio_data.role IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Access denied');
   END IF;

   -- Get statistics
   SELECT json_build_object(
      'portfolio_id', p_portfolio_id,
      'total_ideas', COUNT(DISTINCT pi.idea_id),
      'completed_ideas', COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END),
      'in_progress_ideas', COUNT(DISTINCT CASE WHEN i.overall_status = 'in_progress' THEN i.id END),
      'draft_ideas', COUNT(DISTINCT CASE WHEN i.overall_status = 'draft' THEN i.id END),
      'average_completion', ROUND(AVG(i.completion_percentage), 1),
      'total_members', COUNT(DISTINCT pm.user_id) + 1, -- +1 for owner
      'owner_id', portfolio_data.user_id,
      'user_role', COALESCE(portfolio_data.role, 'owner')
   ) INTO stats_data
   FROM portfolios p
   LEFT JOIN portfolio_ideas pi ON p.id = pi.portfolio_id
   LEFT JOIN ideas i ON pi.idea_id = i.id
   LEFT JOIN portfolio_members pm ON p.id = pm.portfolio_id
   WHERE p.id = p_portfolio_id
   GROUP BY p.id;

   RETURN json_build_object(
      'success', true,
      'stats', stats_data
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Payment Processing Functions (Basic Implementation)

-- Function to process payment webhook (placeholder for Stripe integration)
CREATE OR REPLACE FUNCTION process_payment_webhook(p_webhook_data JSONB)
RETURNS JSON AS $$
DECLARE
   event_type TEXT;
   user_id UUID;
   amount INTEGER;
   package_type TEXT;
BEGIN
   -- Extract event type
   event_type := p_webhook_data->>'type';

   CASE event_type
      WHEN 'payment_intent.succeeded' THEN
         -- Extract user and amount from webhook data
         user_id := (p_webhook_data->'data'->'object'->'metadata'->>'user_id')::UUID;
         amount := (p_webhook_data->'data'->'object'->'amount')::INTEGER;

         IF user_id IS NULL OR amount IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'Missing user_id or amount in webhook');
         END IF;

         -- Add credits for successful payment
         PERFORM process_credit_transaction(
            user_id,
            'credit_purchase',
            amount / 100, -- Convert from cents
            json_build_object('source', 'stripe', 'payment_intent_id', p_webhook_data->'data'->'object'->>'id')
         );

         -- Log payment
         PERFORM log_activity(user_id, 'payment_completed', 'payment',
            (p_webhook_data->'data'->'object'->>'id')::UUID,
            json_build_object('amount', amount, 'currency', 'usd'));

         RETURN json_build_object('success', true, 'processed', true, 'event_type', event_type);

      WHEN 'invoice.payment_failed' THEN
         -- Handle failed payments
         user_id := (p_webhook_data->'data'->'object'->'customer_metadata'->>'user_id')::UUID;

         -- Create notification for failed payment
         PERFORM create_notification(
            COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::UUID),
            'payment_failed',
            'Your payment failed. Please update your payment method.'
         );

         RETURN json_build_object('success', true, 'processed', true, 'event_type', event_type);

      ELSE
         -- Unknown event type - log but don't fail
         RETURN json_build_object('success', true, 'processed', false, 'event_type', event_type, 'message', 'Unknown event type');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manage subscription lifecycle
CREATE OR REPLACE FUNCTION manage_subscription(p_user_id UUID, p_action TEXT, p_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   current_package TEXT;
   new_package TEXT;
BEGIN
   -- Get current package
   SELECT package_type INTO current_package FROM profiles WHERE user_id = p_user_id;
   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'User profile not found');
   END IF;

   CASE p_action
      WHEN 'upgrade' THEN
         new_package := p_data->>'package_type';

         -- Validate package type
         IF new_package NOT IN ('student', 'enterprise') THEN
            RETURN json_build_object('success', false, 'error', 'Invalid package type');
         END IF;

         -- Perform upgrade
         PERFORM update_user_package(p_user_id, new_package, p_data);

         RETURN json_build_object(
            'success', true,
            'action', 'upgrade',
            'from_package', current_package,
            'to_package', new_package
         );

      WHEN 'cancel' THEN
         -- Mark subscription for cancellation at end of period
         UPDATE profiles SET
            package_status = 'cancelled',
            updated_at = NOW()
         WHERE user_id = p_user_id;

         -- Create notification
         PERFORM create_notification(
            p_user_id,
            'subscription_cancelled',
            'Your subscription has been cancelled and will end at the current billing period.'
         );

         RETURN json_build_object('success', true, 'action', 'cancel');

      WHEN 'reactivate' THEN
         -- Reactivate cancelled subscription
         UPDATE profiles SET
            package_status = 'active',
            updated_at = NOW()
         WHERE user_id = p_user_id;

         -- Create notification
         PERFORM create_notification(
            p_user_id,
            'subscription_reactivated',
            'Your subscription has been reactivated.'
         );

         RETURN json_build_object('success', true, 'action', 'reactivate');

      ELSE
         RETURN json_build_object('success', false, 'error', 'Invalid action');
   END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle payment failures
CREATE OR REPLACE FUNCTION handle_payment_failure(p_user_id UUID, p_payment_data JSONB)
RETURNS JSON AS $$
BEGIN
   -- Create payment failure notification
   PERFORM create_notification(
      p_user_id,
      'payment_failed',
      'Your recent payment failed. Please update your payment method to continue using premium features.'
   );

   -- Log the failure
   PERFORM log_activity(p_user_id, 'payment_failed', 'payment',
      (p_payment_data->>'payment_intent_id')::UUID,
      p_payment_data);

   -- Could implement grace period logic here
   -- For now, just downgrade to free if subscription is cancelled
   UPDATE profiles SET
      package_type = 'free',
      package_status = 'cancelled'
   WHERE user_id = p_user_id AND package_status = 'cancelled';

   RETURN json_build_object(
      'success', true,
      'action_taken', 'downgraded_to_free',
      'notification_sent', true
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reporting & Analytics Functions

-- Function to generate user activity report
CREATE OR REPLACE FUNCTION generate_user_report(p_user_id UUID, p_report_type TEXT, p_period JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   start_date DATE;
   end_date DATE;
   report_data JSON;
BEGIN
   -- Set date range
   start_date := COALESCE((p_period->>'start_date')::DATE, CURRENT_DATE - INTERVAL '30 days');
   end_date := COALESCE((p_period->>'end_date')::DATE, CURRENT_DATE);

   CASE p_report_type
      WHEN 'activity_summary' THEN
         SELECT json_build_object(
            'period', json_build_object('start', start_date, 'end', end_date),
            'total_activities', COUNT(*),
            'activities_by_type', json_object_agg(action_type, count),
            'most_active_day', (
               SELECT created_at::DATE
               FROM activity_log
               WHERE user_id = p_user_id AND created_at >= start_date AND created_at <= end_date
               GROUP BY created_at::DATE
               ORDER BY COUNT(*) DESC
               LIMIT 1
            ),
            'top_entity_types', (
               SELECT json_agg(json_build_object('type', entity_type, 'count', count))
               FROM (
                  SELECT entity_type, COUNT(*) as count
                  FROM activity_log
                  WHERE user_id = p_user_id AND created_at >= start_date AND created_at <= end_date
                  GROUP BY entity_type
                  ORDER BY count DESC
                  LIMIT 5
               ) top_types
            )
         ) INTO report_data
         FROM activity_log
         WHERE user_id = p_user_id AND created_at >= start_date AND created_at <= end_date;

      WHEN 'idea_progress' THEN
         SELECT json_build_object(
            'period', json_build_object('start', start_date, 'end', end_date),
            'ideas_summary', json_build_object(
               'total_ideas', COUNT(*),
               'completed_ideas', COUNT(CASE WHEN overall_status = 'completed' THEN 1 END),
               'in_progress_ideas', COUNT(CASE WHEN overall_status = 'in_progress' THEN 1 END),
               'average_completion', ROUND(AVG(completion_percentage), 1)
            ),
            'completion_trend', (
               SELECT json_agg(json_build_object('date', date, 'completed', completed_count))
               FROM (
                  SELECT
                     DATE_TRUNC('day', created_at) as date,
                     COUNT(CASE WHEN overall_status = 'completed' THEN 1 END) as completed_count
                  FROM ideas
                  WHERE user_id = p_user_id AND created_at >= start_date AND created_at <= end_date
                  GROUP BY DATE_TRUNC('day', created_at)
                  ORDER BY date
               ) trend
            )
         ) INTO report_data
         FROM ideas
         WHERE user_id = p_user_id;

      WHEN 'credit_usage' THEN
         SELECT json_build_object(
            'period', json_build_object('start', start_date, 'end', end_date),
            'credit_summary', json_build_object(
               'starting_balance', (
                  SELECT credit_balance FROM profiles WHERE user_id = p_user_id
               ),
               'total_earned', COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0),
               'total_spent', COALESCE(SUM(CASE WHEN amount < 0 THEN -amount END), 0),
               'net_change', COALESCE(SUM(amount), 0)
            ),
            'transactions_by_type', json_object_agg(transaction_type, count)
         ) INTO report_data
         FROM credit_transactions
         WHERE user_id = p_user_id AND created_at >= start_date AND created_at <= end_date
         GROUP BY user_id;

      ELSE
         RETURN json_build_object('success', false, 'error', 'Unknown report type');
   END CASE;

   RETURN json_build_object(
      'success', true,
      'report_type', p_report_type,
      'generated_at', NOW(),
      'data', report_data
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate system-wide analytics
CREATE OR REPLACE FUNCTION generate_system_analytics(p_period TEXT DEFAULT '30d')
RETURNS JSON AS $$
DECLARE
   days_interval INTERVAL;
   analytics_data JSON;
BEGIN
   -- Parse period
   CASE p_period
      WHEN '7d' THEN days_interval := INTERVAL '7 days';
      WHEN '30d' THEN days_interval := INTERVAL '30 days';
      WHEN '90d' THEN days_interval := INTERVAL '90 days';
      ELSE days_interval := INTERVAL '30 days';
   END CASE;

   SELECT json_build_object(
      'period', p_period,
      'generated_at', NOW(),
      'user_metrics', json_build_object(
         'total_users', (SELECT COUNT(*) FROM profiles),
         'active_users_7d', (
            SELECT COUNT(DISTINCT user_id) FROM activity_log
            WHERE created_at >= NOW() - INTERVAL '7 days'
         ),
         'new_users', (
            SELECT COUNT(*) FROM profiles
            WHERE created_at >= NOW() - days_interval
         ),
         'package_distribution', (
            SELECT json_object_agg(package_type, count)
            FROM (SELECT package_type, COUNT(*) as count FROM profiles GROUP BY package_type) pkg
         )
      ),
      'idea_metrics', json_build_object(
         'total_ideas', (SELECT COUNT(*) FROM ideas),
         'public_ideas', (SELECT COUNT(*) FROM ideas WHERE privacy = 'public'),
         'completed_ideas', (SELECT COUNT(*) FROM ideas WHERE overall_status = 'completed'),
         'average_completion_rate', (
            SELECT ROUND(AVG(completion_percentage), 1) FROM ideas
         ),
         'popular_categories', (
            SELECT json_agg(json_build_object('category', category, 'count', count))
            FROM (
               SELECT category, COUNT(*) as count
               FROM ideas
               WHERE category IS NOT NULL
               GROUP BY category
               ORDER BY count DESC
               LIMIT 5
            ) cats
         )
      ),
      'engagement_metrics', json_build_object(
         'total_votes', (SELECT COUNT(*) FROM votes),
         'total_rewards_distributed', (SELECT COALESCE(SUM(reward_amount), 0) FROM voting_rewards),
         'average_rating', (SELECT ROUND(AVG(rating), 2) FROM ideas WHERE rating IS NOT NULL),
         'credit_transactions', (SELECT COUNT(*) FROM credit_transactions WHERE created_at >= NOW() - days_interval)
      ),
      'system_health', json_build_object(
         'total_credits_in_circulation', (SELECT SUM(credit_balance) FROM profiles),
         'average_credits_per_user', (SELECT ROUND(AVG(credit_balance), 1) FROM profiles),
         'most_active_users', (
            SELECT json_agg(json_build_object('user_id', user_id, 'activities', count))
            FROM (
               SELECT user_id, COUNT(*) as count
               FROM activity_log
               WHERE created_at >= NOW() - days_interval
               GROUP BY user_id
               ORDER BY count DESC
               LIMIT 10
            ) active
         )
      )
   ) INTO analytics_data;

   RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   export_data JSON;
BEGIN
   -- Validate user exists
   IF NOT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) THEN
      RETURN json_build_object('success', false, 'error', 'User not found');
   END IF;

   SELECT json_build_object(
      'export_timestamp', NOW(),
      'user_profile', json_build_object(
         'user_id', p.user_id,
         'name', p.name,
         'avatar_url', p.avatar_url,
         'credit_balance', p.credit_balance,
         'total_earned', p.total_earned,
         'total_spent', p.total_spent,
         'package_type', p.package_type,
         'created_at', p.created_at
      ),
      'ideas', (
         SELECT json_agg(
            json_build_object(
               'id', i.id,
               'title', i.title,
               'description', i.description,
               'category', i.category,
               'privacy', i.privacy,
               'rating', i.rating,
               'completion_percentage', i.completion_percentage,
               'created_at', i.created_at,
               'updated_at', i.updated_at
            )
         )
         FROM ideas i WHERE i.user_id = p_user_id
      ),
      'credit_transactions', (
         SELECT json_agg(
            json_build_object(
               'id', ct.id,
               'type', ct.transaction_type,
               'amount', ct.amount,
               'created_at', ct.created_at,
               'metadata', ct.metadata
            )
         )
         FROM credit_transactions ct WHERE ct.user_id = p_user_id
      ),
      'activity_log', (
         SELECT json_agg(
            json_build_object(
               'id', al.id,
               'action_type', al.action_type,
               'entity_type', al.entity_type,
               'created_at', al.created_at,
               'details', al.details
            )
         )
         FROM activity_log al WHERE al.user_id = p_user_id
      ),
      'votes_cast', (
         SELECT json_agg(
            json_build_object(
               'idea_id', v.idea_id,
               'rating', v.rating,
               'created_at', v.created_at
            )
         )
         FROM votes v WHERE v.user_id = p_user_id
      ),
      'rewards_earned', (
         SELECT json_agg(
            json_build_object(
               'idea_id', vr.idea_id,
               'reward_amount', vr.reward_amount,
               'distributed_at', vr.distributed_at
            )
         )
         FROM voting_rewards vr WHERE vr.voter_id = p_user_id
      )
   ) INTO export_data
   FROM profiles p
   WHERE p.user_id = p_user_id;

   RETURN json_build_object(
      'success', true,
      'export_data', export_data
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring functions
CREATE OR REPLACE FUNCTION log_function_performance(
  p_function_name TEXT,
  p_execution_time INTERVAL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
    'function_performance',
    'system',
    NULL,
    json_build_object(
      'function_name', p_function_name,
      'execution_time_ms', EXTRACT(epoch FROM p_execution_time) * 1000,
      'timestamp', NOW(),
      'metadata', p_metadata
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Error logging function
CREATE OR REPLACE FUNCTION log_function_error(
  p_function_name TEXT,
  p_error_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
    'function_error',
    'system',
    NULL,
    json_build_object(
      'function_name', p_function_name,
      'error_message', p_error_message,
      'context', p_context,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;

-- System health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS JSON AS $$
DECLARE
   health_data JSON;
BEGIN
   SELECT json_build_object(
      'timestamp', NOW(),
      'database_status', 'healthy',
      'active_connections', (
         SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'
      ),
      'total_users', (SELECT COUNT(*) FROM profiles),
      'total_ideas', (SELECT COUNT(*) FROM ideas),
      'recent_activities_last_hour', (
         SELECT COUNT(*) FROM activity_log
         WHERE created_at >= NOW() - INTERVAL '1 hour'
      ),
      'credit_transactions_last_hour', (
         SELECT COUNT(*) FROM credit_transactions
         WHERE created_at >= NOW() - INTERVAL '1 hour'
      ),
      'function_performance_avg_ms', (
         SELECT AVG((details->>'execution_time_ms')::NUMERIC)
         FROM activity_log
         WHERE action_type = 'function_performance'
         AND created_at >= NOW() - INTERVAL '1 hour'
      )
   ) INTO health_data;

   RETURN health_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional Business Logic Functions for Route Migration

-- Function to create user notifications with duplicate prevention
CREATE OR REPLACE FUNCTION create_user_notification(p_user_id UUID, p_type TEXT, p_message TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS VOID AS $$
DECLARE
   notification_exists BOOLEAN;
BEGIN
   -- Check if similar notification exists in last hour to prevent spam
   SELECT EXISTS(
      SELECT 1 FROM notifications
      WHERE user_id = p_user_id
      AND type = p_type
      AND message = p_message
      AND created_at >= NOW() - INTERVAL '1 hour'
   ) INTO notification_exists;

   IF NOT notification_exists THEN
      INSERT INTO notifications (user_id, type, message) VALUES (p_user_id, p_type, p_message);
   END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity with metadata validation
CREATE OR REPLACE FUNCTION log_user_activity(p_user_id UUID, p_action_type TEXT, p_entity_type TEXT, p_entity_id UUID DEFAULT NULL, p_details JSONB DEFAULT '{}')
RETURNS VOID AS $$
DECLARE
   valid_action_types TEXT[] := ARRAY['create', 'update', 'delete', 'view', 'vote', 'favorite', 'unfavorite', 'share', 'export', 'import', 'login', 'logout', 'signup', 'payment', 'upgrade', 'downgrade'];
   valid_entity_types TEXT[] := ARRAY['idea', 'model', 'profile', 'account', 'payment', 'notification', 'credit', 'portfolio', 'vote'];
BEGIN
   -- Validate inputs
   IF p_action_type NOT IN (SELECT unnest(valid_action_types)) THEN
      RAISE EXCEPTION 'Invalid action type: %', p_action_type;
   END IF;

   IF p_entity_type NOT IN (SELECT unnest(valid_entity_types)) THEN
      RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
   END IF;

   -- Insert activity log
   INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, details)
   VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile with validation
CREATE OR REPLACE FUNCTION update_user_profile_safe(p_user_id UUID, p_updates JSONB)
RETURNS JSON AS $$
DECLARE
   profile_record RECORD;
BEGIN
   -- Get current profile
   SELECT * INTO profile_record FROM profiles WHERE user_id = p_user_id;
   IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Profile not found');
   END IF;

   -- Update profile fields safely
   UPDATE profiles SET
      name = COALESCE(p_updates->>'name', name),
      avatar_url = COALESCE(p_updates->>'avatar_url', avatar_url),
      preferences = COALESCE(p_updates->'preferences', preferences),
      updated_at = NOW()
   WHERE user_id = p_user_id;

   -- Log activity
   PERFORM log_user_activity(p_user_id, 'update', 'profile', p_user_id,
      json_build_object('fields_updated', array(select jsonb_object_keys(p_updates))));

   RETURN json_build_object('success', true, 'message', 'Profile updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user preferences (language, theme, etc.)
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   profile_data JSON;
BEGIN
   SELECT json_build_object(
      'language', COALESCE(p.preferences->>'language', 'en'),
      'theme', COALESCE(p.preferences->>'theme', 'light'),
       'notifications', COALESCE(p.preferences->'notifications',
          json_build_object('push', true))
   ) INTO profile_data
   FROM profiles p
   WHERE p.user_id = p_user_id;

   IF NOT FOUND THEN
      -- Return defaults if no profile
      RETURN json_build_object(
         'language', 'en',
         'theme', 'light',
          'notifications', json_build_object('push', true)
      );
   END IF;

   RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;