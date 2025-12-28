-- User Preferences View
-- This view provides easy access to user preference settings, including both structured and custom preferences.
-- It extracts and flattens JSON preference data into individual columns:
-- - Language and theme settings for UI customization
-- - Notification preferences as JSON object
-- - Aggregated user settings from the user_settings table as JSON
-- Used for user personalization and settings management interfaces.
--
-- Example usage:
-- SELECT language, theme, notifications
-- FROM user_preferences
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | language | theme | notifications                          |
-- |----------|-------|----------------------------------------|
-- | en       | dark  | {"push": true, "email": false}         |
CREATE OR REPLACE VIEW user_preferences AS
SELECT
  p.user_id,
  p.preferences,
  -- Extract individual preference fields for easy access
  COALESCE(p.preferences->>'language', 'en') as language,
  COALESCE(p.preferences->>'theme', 'light') as theme,
   COALESCE((p.preferences->'notifications')::jsonb, json_build_object('push', true)::jsonb) as notifications,
  -- User settings as aggregated JSON
  COALESCE(us.settings, '{}'::jsonb) as user_settings
FROM profiles p
LEFT JOIN (
  SELECT user_id, jsonb_object_agg(key, value) as settings
  FROM user_settings
  GROUP BY user_id
) us ON p.user_id = us.user_id;