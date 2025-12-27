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
  AFTER INSERT OR UPDATE ON model_sections
  FOR EACH ROW EXECUTE FUNCTION log_section_completion();

-- Advanced Automation Triggers

-- Automatic Activity Logging Trigger
CREATE OR REPLACE FUNCTION auto_log_activities() RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  entity_type TEXT;
  entity_id UUID;
BEGIN
  -- Determine entity type from table
  CASE TG_TABLE_NAME
    WHEN 'ideas' THEN
      entity_type := 'idea';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'votes' THEN
      entity_type := 'vote';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'user_favorites' THEN
      entity_type := 'favorite';
      entity_id := COALESCE(NEW.idea_id, OLD.idea_id);
    WHEN 'credit_transactions' THEN
      entity_type := 'credit';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'profiles' THEN
      entity_type := 'profile';
      entity_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSE
      entity_type := TG_TABLE_NAME;
      entity_id := COALESCE(NEW.id, OLD.id);
  END CASE;

  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN action_type := 'create';
    WHEN 'UPDATE' THEN action_type := 'update';
    WHEN 'DELETE' THEN action_type := 'delete';
  END CASE;

  -- Auto-log the activity if we have a user_id
  IF (COALESCE(NEW.user_id, OLD.user_id) IS NOT NULL) THEN
    PERFORM log_user_activity(
      COALESCE(NEW.user_id, OLD.user_id),
      action_type,
      entity_type,
      entity_id
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply auto-logging to key tables
CREATE TRIGGER trigger_auto_log_ideas
  AFTER INSERT OR UPDATE OR DELETE ON ideas
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();

CREATE TRIGGER trigger_auto_log_votes
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();

CREATE TRIGGER trigger_auto_log_favorites
  AFTER INSERT OR DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();

-- Automatic Notification Creation Trigger
CREATE OR REPLACE FUNCTION auto_create_notifications() RETURNS TRIGGER AS $$
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'votes' THEN
      -- Notify idea owner of new vote (but not self-votes)
      IF NEW.user_id != (SELECT user_id FROM ideas WHERE id = NEW.idea_id) THEN
        PERFORM create_user_notification(
          (SELECT user_id FROM ideas WHERE id = NEW.idea_id),
          'vote_received',
          format('Someone voted %s on your idea!', NEW.rating)
        );
      END IF;

    WHEN 'user_favorites' THEN
      -- Notify idea owner of favorite (but not self-favorites)
      IF NEW.user_id != (SELECT user_id FROM ideas WHERE id = NEW.idea_id) THEN
        PERFORM create_user_notification(
          (SELECT user_id FROM ideas WHERE id = NEW.idea_id),
          'idea_favorited',
          'Someone favorited your idea!'
        );
      END IF;

    WHEN 'credit_transactions' THEN
      -- Notify of significant credit changes
      IF NEW.amount > 50 THEN
        PERFORM create_user_notification(
          NEW.user_id,
          'credits_earned',
          format('You earned %s credits!', NEW.amount)
        );
      ELSIF NEW.amount < -50 THEN
        PERFORM create_user_notification(
          NEW.user_id,
          'credits_spent',
          format('You spent %s credits.', abs(NEW.amount))
        );
      END IF;

    WHEN 'ideas' THEN
      -- Notify followers when idea is updated significantly
      IF TG_OP = 'UPDATE' AND NEW.overall_status != OLD.overall_status THEN
        -- Could notify package subscribers or followers here
        NULL; -- Placeholder for future enhancement
      END IF;
  END CASE;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply notification triggers
CREATE TRIGGER trigger_auto_notifications_votes
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_create_notifications();

CREATE TRIGGER trigger_auto_notifications_favorites
  AFTER INSERT ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION auto_create_notifications();

CREATE TRIGGER trigger_auto_notifications_credits
  AFTER INSERT ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION auto_create_notifications();

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
            'notifications', json_build_object('email', true, 'push', true)
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
