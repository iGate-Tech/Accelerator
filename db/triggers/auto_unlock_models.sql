-- Automatic Model Unlocking Trigger
-- Purpose: Automatically unlocks advanced models for ideas that meet validation criteria.
-- What it does: Checks vote statistics when validation threshold is met, unlocks appropriate models.
-- When it fires: AFTER UPDATE OF validation_threshold_met on ideas table.
-- Dependencies: Requires create_user_notification() and log_user_activity() functions.
--
-- Unlock Thresholds:
-- - 50+ votes AND 4.0+ avg rating: Unlock ALL models (idea, canvas, financial, pitch, market)
-- - 25+ votes AND 3.5+ avg rating: Unlock advanced models (idea, canvas, financial)
-- - 10+ votes AND 3.0+ avg rating: Unlock basic models (idea, canvas)
--
-- Example Scenario 1: Highly validated idea (ALL MODELS UNLOCKED)
-- Before: idea-123 has 65 votes, 4.2 avg rating, validation_threshold_met = false
-- Action: Admin sets validation_threshold_met = true
-- After: unlocked_models set to ['idea', 'canvas', 'financial', 'pitch', 'market']
--       Notification sent to user, activity logged
--
-- Example Scenario 2: Moderately validated idea (ADVANCED MODELS UNLOCKED)
-- Before: idea-123 has 30 votes, 3.6 avg rating, validation_threshold_met = false
-- Action: validation_threshold_met = true
-- After: unlocked_models set to ['idea', 'canvas', 'financial']
--
-- Business Logic: Progressive unlocking based on community validation,
-- ensuring only high-quality ideas access advanced tools.
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

CREATE TRIGGER trigger_auto_model_unlocking
  AFTER UPDATE OF validation_threshold_met ON ideas
  FOR EACH ROW EXECUTE FUNCTION auto_unlock_models();