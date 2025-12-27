-- Business Logic Functions
-- Core functions for idea completion, voting, credit management, etc.

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
CREATE OR REPLACE FUNCTION complete_model_section_void(p_section_id UUID, p_user_id UUID) RETURNS VOID AS $$
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