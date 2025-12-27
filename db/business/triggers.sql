-- Database Triggers
-- All automated triggers for the application

-- Trigger to update completion percentage on section changes
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

-- Automatic Credit Reward Triggers

-- Reward credits for receiving votes (idea owner gets rewarded)
CREATE OR REPLACE FUNCTION auto_reward_vote_credits() RETURNS TRIGGER AS $$
DECLARE
  idea_owner UUID;
  reward_amount INTEGER := 5; -- 5 credits per vote received
BEGIN
  -- Get idea owner
  SELECT user_id INTO idea_owner FROM ideas WHERE id = NEW.idea_id;

  -- Don't reward self-votes
  IF idea_owner != NEW.user_id THEN
    -- Award credits to idea owner
    PERFORM process_credit_transaction(
      idea_owner,
      'vote_received',
      reward_amount,
      json_build_object(
        'voter_id', NEW.user_id,
        'idea_id', NEW.idea_id,
        'rating', NEW.rating
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reward credits for giving first vote of the day
CREATE OR REPLACE FUNCTION auto_reward_daily_first_vote() RETURNS TRIGGER AS $$
DECLARE
  has_voted_today BOOLEAN;
BEGIN
  -- Check if user has voted today already
  SELECT EXISTS(
    SELECT 1 FROM votes
    WHERE user_id = NEW.user_id
    AND DATE(created_at) = CURRENT_DATE
    AND id != NEW.id -- Exclude current vote
  ) INTO has_voted_today;

  -- If first vote today, give bonus credits
  IF NOT has_voted_today THEN
    PERFORM process_credit_transaction(
      NEW.user_id,
      'daily_first_vote',
      10, -- 10 bonus credits for first daily vote
      json_build_object('date', CURRENT_DATE)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatic Model Unlocking Trigger
CREATE OR REPLACE FUNCTION auto_unlock_models() RETURNS TRIGGER AS $$
DECLARE
  total_votes INTEGER;
  avg_rating DECIMAL(3,2);
  should_unlock BOOLEAN := FALSE;
BEGIN
  -- Check if validation threshold is met
  IF NEW.validation_threshold_met THEN
    -- Get current vote statistics
    SELECT
      COUNT(*),
      COALESCE(AVG(rating), 0)
    INTO total_votes, avg_rating
    FROM votes
    WHERE idea_id = NEW.id;

    -- Unlock models based on criteria
    CASE
      WHEN total_votes >= 50 AND avg_rating >= 4.0 THEN
        -- Unlock all models for highly validated ideas
        UPDATE ideas SET unlocked_models = ARRAY['idea', 'canvas', 'financial', 'pitch', 'market']
        WHERE id = NEW.id;
        should_unlock := TRUE;

      WHEN total_votes >= 25 AND avg_rating >= 3.5 THEN
        -- Unlock advanced models
        UPDATE ideas SET unlocked_models = ARRAY['idea', 'canvas', 'financial']
        WHERE id = NEW.id;
        should_unlock := TRUE;

      WHEN total_votes >= 10 AND avg_rating >= 3.0 THEN
        -- Unlock basic additional models
        UPDATE ideas SET unlocked_models = ARRAY['idea', 'canvas']
        WHERE id = NEW.id;
        should_unlock := TRUE;
    END CASE;

    -- Log model unlocking if it happened
    IF should_unlock THEN
      PERFORM log_user_activity(
        NEW.user_id,
        'update',
        'idea',
        NEW.id,
        json_build_object(
          'action', 'models_unlocked',
          'total_votes', total_votes,
          'average_rating', avg_rating,
          'unlocked_models', NEW.unlocked_models
        )
      );

      -- Notify user of unlocked models
      PERFORM create_user_notification(
        NEW.user_id,
        'models_unlocked',
        format('🎉 Congratulations! Your idea "%s" has met validation criteria and unlocked new models!', NEW.title)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatic Milestone Achievement Tracking
CREATE OR REPLACE FUNCTION auto_milestone_achievements() RETURNS TRIGGER AS $$
DECLARE
  current_stats RECORD;
  new_achievements TEXT[] := ARRAY[]::TEXT[];
  achievement TEXT;
BEGIN
  -- Get current user statistics
  SELECT
    COUNT(DISTINCT i.id) as total_ideas,
    COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
    COUNT(DISTINCT v.id) as total_votes_given,
    COUNT(DISTINCT vr.id) as total_rewards_earned,
    COALESCE(SUM(vr.reward_amount), 0) as total_rewards_amount
  INTO current_stats
  FROM profiles p
  LEFT JOIN ideas i ON p.user_id = NEW.user_id
  LEFT JOIN votes v ON p.user_id = NEW.user_id
  LEFT JOIN voting_rewards vr ON p.user_id = NEW.user_id
  WHERE p.user_id = NEW.user_id;

  -- Check for new achievements
  CASE
    WHEN current_stats.total_ideas >= 10 AND current_stats.total_ideas < 25 THEN
      new_achievements := array_append(new_achievements, 'idea_creator_10');
    WHEN current_stats.total_ideas >= 25 THEN
      new_achievements := array_append(new_achievements, 'idea_creator_25');
    WHEN current_stats.completed_ideas >= 5 THEN
      new_achievements := array_append(new_achievements, 'project_finisher');
    WHEN current_stats.total_votes_given >= 50 THEN
      new_achievements := array_append(new_achievements, 'active_voter');
    WHEN current_stats.total_rewards_amount >= 1000 THEN
      new_achievements := array_append(new_achievements, 'reward_earner');
  END CASE;

  -- Create achievement notifications for new milestones
  FOREACH achievement IN ARRAY new_achievements LOOP
    CASE achievement
      WHEN 'idea_creator_10' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Idea Creator (10 ideas)!');
      WHEN 'idea_creator_25' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Pro Creator (25 ideas)!');
      WHEN 'project_finisher' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Project Finisher (5 completed)!');
      WHEN 'active_voter' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Active Voter (50 votes given)!');
      WHEN 'reward_earner' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Reward Earner (1000 credits earned)!');
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply advanced automation triggers
CREATE TRIGGER trigger_auto_vote_rewards
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_reward_vote_credits();

CREATE TRIGGER trigger_daily_first_vote_bonus
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_reward_daily_first_vote();

CREATE TRIGGER trigger_auto_model_unlocking
  AFTER UPDATE OF validation_threshold_met ON ideas
  FOR EACH ROW EXECUTE FUNCTION auto_unlock_models();

CREATE TRIGGER trigger_milestone_achievements
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type IN ('vote_received', 'daily_first_vote'))
  EXECUTE FUNCTION auto_milestone_achievements();