-- User Activity Feed View
-- This view creates a chronological feed of user activities from the activity_log table.
-- It displays:
-- - Action types and entities involved
-- - Timestamps for sorting (newest first)
-- - Associated idea titles and user names for context
-- Used for activity timelines, notification feeds, and user engagement tracking.
--
-- Example usage:
-- SELECT action_type, entity_type, idea_title, created_at
-- FROM user_activity_feed
-- WHERE user_id = 'user-123'
-- ORDER BY created_at DESC
-- LIMIT 10;
--
-- Example output:
-- | action_type | entity_type | idea_title     | created_at          |
-- |-------------|-------------|----------------|---------------------|
-- | created     | idea        | New App Idea   | 2024-01-15 10:30:00 |
-- | voted       | idea        | AI Assistant   | 2024-01-15 09:15:00 |
CREATE OR REPLACE VIEW user_activity_feed AS
SELECT
  al.id,
  al.user_id,
  al.action_type,
  al.entity_type,
  al.entity_id,
  al.details,
  al.created_at,
  i.title as idea_title,
  p.name as user_name
FROM activity_log al
LEFT JOIN ideas i ON al.entity_id = i.id AND al.entity_type = 'idea'
LEFT JOIN profiles p ON al.user_id = p.user_id
ORDER BY al.created_at DESC;