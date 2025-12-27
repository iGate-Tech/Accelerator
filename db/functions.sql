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

-- Function to get voting dashboard data
CREATE OR REPLACE FUNCTION get_voting_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a complex function that returns all dashboard data
  -- Implementation would aggregate user ideas, votes, rewards, etc.
  -- For now, return basic structure
  RETURN json_build_object(
    'user_id', p_user_id,
    'ideas_count', (SELECT COUNT(*) FROM ideas WHERE user_id = p_user_id),
    'total_votes_received', (SELECT COUNT(*) FROM votes v JOIN ideas i ON v.idea_id = i.id WHERE i.user_id = p_user_id),
    'total_rewards_earned', (SELECT COALESCE(SUM(reward_amount), 0) FROM voting_rewards WHERE voter_id = p_user_id),
    'current_credits', (SELECT credit_balance FROM profiles WHERE user_id = p_user_id)
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