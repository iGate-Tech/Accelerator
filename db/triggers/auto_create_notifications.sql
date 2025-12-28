-- Automatic Notification Creation Triggers
-- Purpose: Automatically creates notifications for social interactions and credit events.
-- What it does: Sends notifications to users for votes on their ideas, favorites, and significant credit changes.
-- When it fires: AFTER INSERT on votes, user_favorites, and credit_transactions tables.
-- Dependencies: Requires create_user_notification() function and notifications table.
--
-- Example Scenario 1: Vote notification
-- Action: user-B votes on user-A's idea (not self-vote)
-- After: Notification created for user-A: type='vote_received', message='Someone voted X on your idea!'
--
-- Example Scenario 2: Favorite notification
-- Action: user-B favorites user-A's idea (not self-favorite)
-- After: Notification created for user-A: type='idea_favorited', message='Someone favorited your idea!'
--
-- Example Scenario 3: Large credit earning
-- Action: user-A earns 75 credits (above 50 threshold)
-- After: Notification created: type='credits_earned', message='You earned 75 credits!'
--
-- Example Scenario 4: Large credit spending
-- Action: user-A spends 60 credits (above 50 threshold in absolute value)
-- After: Notification created: type='credits_spent', message='You spent 60 credits.'
--
-- Business Logic: Keeps users engaged by notifying them of community interactions and credit changes.
-- Prevents notification spam by excluding self-interactions and having thresholds for credit changes.
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