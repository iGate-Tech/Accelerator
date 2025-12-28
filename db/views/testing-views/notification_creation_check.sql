-- Notification Creation Check View
-- Purpose: Verifies that notifications are being created by automation triggers.
-- Tests: Triggers that create notifications for votes, favorites, and other events.
-- Use Case: Monitor notification system health, ensure users receive alerts.
--
-- What it does:
-- - Shows all notifications with user details
-- - Helps verify notification triggers are working for events like:
--   - Vote received on user's idea
--   - Idea favorited by others
--   - Credit earned/spent
--
-- Example Usage:
-- SELECT type, COUNT(*) as count FROM notification_creation_check GROUP BY type;
--
-- Example Output:
-- | type           | count |
-- |----------------|-------|
-- | vote_received  | 45    |
-- | idea_favorited | 23    |
-- | credits_earned | 12    |
--
-- Low or zero counts for expected notification types indicate trigger failures.
CREATE OR REPLACE VIEW notification_creation_check AS
SELECT
  n.id,
  n.user_id,
  p.name as user_name,
  n.type,
  n.message,
  n.is_read,
  n.created_at
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.user_id
ORDER BY n.created_at DESC;