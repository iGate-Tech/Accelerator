-- User Onboarding Status View
-- This view tracks user progress through the onboarding journey and engagement milestones.
-- Monitors key onboarding actions:
-- - Profile completion percentage based on name/avatar
-- - First idea creation and timestamp
-- - First vote given and timestamp
-- - First favorite added and timestamp
-- - Notification receipt status
-- - Overall onboarding stage classification
-- - Time-based metrics (days since signup, weekly activity)
-- Used for onboarding flows, user activation campaigns, and retention analytics.
--
-- Example usage:
-- SELECT onboarding_stage, profile_completion_percentage, has_created_first_idea
-- FROM user_onboarding_status
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | onboarding_stage | profile_completion_percentage | has_created_first_idea |
-- |------------------|------------------------------|------------------------|
-- | idea_created     | 100                          | true                   |
CREATE OR REPLACE VIEW user_onboarding_status AS
SELECT
  p.user_id,
  p.name,
  p.created_at as account_created_at,
  -- Profile completion score
  CASE
    WHEN p.name IS NOT NULL AND p.avatar_url IS NOT NULL THEN 100
    WHEN p.name IS NOT NULL THEN 75
    ELSE 25
  END as profile_completion_percentage,

  -- First idea created
  EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id) as has_created_first_idea,
  (SELECT MIN(created_at) FROM ideas WHERE user_id = p.user_id) as first_idea_created_at,

  -- First vote given
  EXISTS(SELECT 1 FROM votes WHERE user_id = p.user_id) as has_given_first_vote,
  (SELECT MIN(created_at) FROM votes WHERE user_id = p.user_id) as first_vote_given_at,

  -- First favorite
  EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p.user_id) as has_favorited_first_idea,
  (SELECT MIN(created_at) FROM user_favorites WHERE user_id = p.user_id) as first_favorite_at,

  -- Welcome notifications received
  EXISTS(SELECT 1 FROM notifications WHERE user_id = p.user_id AND type = 'welcome') as received_welcome_notification,
  EXISTS(SELECT 1 FROM notifications WHERE user_id = p.user_id AND type = 'getting_started') as received_getting_started_notification,

  -- Overall onboarding completion
  CASE
    WHEN EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id)
         AND EXISTS(SELECT 1 FROM votes WHERE user_id = p.user_id)
         AND p.name IS NOT NULL THEN 'completed'
    WHEN EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id) THEN 'idea_created'
    WHEN p.name IS NOT NULL THEN 'profile_setup'
    ELSE 'just_signed_up'
  END as onboarding_stage,

  -- Days since signup
  EXTRACT(DAY FROM (NOW() - p.created_at)) as days_since_signup,

  -- Activity in last 7 days
  COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) as weekly_activity_count
FROM profiles p
LEFT JOIN activity_log al ON p.user_id = al.user_id
GROUP BY p.user_id, p.name, p.avatar_url, p.created_at;