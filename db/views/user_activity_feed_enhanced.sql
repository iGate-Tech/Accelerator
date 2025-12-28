-- Enhanced User Activity Feed View
-- This enhanced version of the activity feed provides richer context for activities.
-- Improvements over basic feed:
-- - Dynamic entity display names (idea titles, user names, package names)
-- - User avatar information for better UX
-- - Support for multiple entity types (ideas, profiles, packages)
-- - Better formatting for activity display components
-- Used for detailed activity streams and social features.
--
-- Example usage:
-- SELECT action_type, idea_title, user_name, user_avatar
-- FROM user_activity_feed_enhanced
-- WHERE user_id = 'user-123'
-- LIMIT 5;
--
-- Example output:
-- | action_type | idea_title     | user_name | user_avatar       |
-- |-------------|----------------|-----------|-------------------|
-- | created     | New Project    | Alice     | avatar_alice.jpg  |
-- | voted       | AI Assistant   | Bob       | avatar_bob.jpg    |
CREATE OR REPLACE VIEW user_activity_feed_enhanced AS
SELECT
  al.id,
  al.user_id,
  al.action_type,
  al.entity_type,
  al.entity_id,
  al.details,
  al.created_at,
  -- Add entity display names for better UX
  CASE
    WHEN al.entity_type = 'idea' THEN i.title
    WHEN al.entity_type = 'profile' THEN p.name
    WHEN al.entity_type = 'package' THEN pkg.name
    ELSE NULL
   END as idea_title,
  -- Add user info
  up.name as user_name,
  up.avatar_url as user_avatar
FROM activity_log al
LEFT JOIN ideas i ON al.entity_id = i.id AND al.entity_type = 'idea'
LEFT JOIN profiles p ON al.entity_id = p.user_id AND al.entity_type = 'profile'
LEFT JOIN packages pkg ON al.entity_id::text = pkg.type AND al.entity_type = 'package'
LEFT JOIN profiles up ON al.user_id = up.user_id
ORDER BY al.created_at DESC;