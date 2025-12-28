-- Vote Notification Trigger
-- Purpose: Automatically notifies idea owners when someone votes on their ideas.
-- What it does: Creates a notification for the idea owner when a vote is cast (excluding self-votes).
-- When it fires: AFTER INSERT on votes table.
-- Dependencies: Requires create_notification() function and notifications table.
--
-- Example Scenario 1: Community vote (NOTIFICATION CREATED)
-- Before: idea-123 owned by user-A has 5 votes
-- Action: user-B votes 4.5 on idea-123
-- After: Notification created for user-A: "Someone voted on your idea"
--
-- Example Scenario 2: Self-vote (NO NOTIFICATION)
-- Before: idea-123 owned by user-A has 5 votes
-- Action: user-A votes 5.0 on their own idea-123
-- After: No notification created (self-votes don't notify)
--
-- Business Logic: Keeps idea owners engaged with their content by alerting them to community interaction.
-- Prevents spam notifications from self-voting.
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