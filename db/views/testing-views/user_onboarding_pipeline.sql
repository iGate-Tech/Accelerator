-- User Onboarding Pipeline View
-- Purpose: Tracks complete user onboarding journey and engagement milestones.
-- Tests: Overall user activation workflow and milestone triggers.
-- Use Case: Monitor user onboarding success, identify drop-off points.
--
-- What it does:
-- - Shows all users with their onboarding progress
-- - Tracks key milestones: profile setup, first idea, first vote, first favorite
-- - Categorizes users by onboarding stage
-- - Shows recent activity levels
--
-- Example Usage:
-- SELECT onboarding_stage, COUNT(*) as user_count
-- FROM user_onboarding_pipeline
-- GROUP BY onboarding_stage
-- ORDER BY user_count DESC;
--
-- Example Output:
-- | onboarding_stage | user_count |
-- |------------------|------------|
-- | FULLY_ONBOARDED | 45         |
-- | IDEA_CREATED    | 23         |
-- | PROFILE_SETUP   | 12         |
-- | JUST_SIGNED_UP  | 8          |
--
-- Helps identify bottlenecks in user activation.
CREATE OR REPLACE VIEW user_onboarding_pipeline AS
SELECT
  p.user_id,
  p.name,
  p.created_at as account_created,
  EXTRACT(DAY FROM (NOW() - p.created_at)) as days_since_signup,
  -- Profile setup
  CASE WHEN p.name IS NOT NULL AND LENGTH(p.name) > 0 THEN 'COMPLETED' ELSE 'PENDING' END as profile_setup,
  -- First idea creation
  CASE WHEN EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id) THEN 'COMPLETED' ELSE 'PENDING' END as first_idea_created,
  -- First vote given
  CASE WHEN EXISTS(SELECT 1 FROM votes WHERE user_id = p.user_id) THEN 'COMPLETED' ELSE 'PENDING' END as first_vote_given,
  -- First favorite
  CASE WHEN EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p.user_id) THEN 'COMPLETED' ELSE 'PENDING' END as first_favorite_added,
  -- Activity in last 7 days
  COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) as weekly_activities,
  -- Overall stage
  CASE
    WHEN EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id)
         AND EXISTS(SELECT 1 FROM votes WHERE user_id = p.user_id)
         AND p.name IS NOT NULL THEN 'FULLY_ONBOARDED'
    WHEN EXISTS(SELECT 1 FROM ideas WHERE user_id = p.user_id) THEN 'IDEA_CREATED'
    WHEN p.name IS NOT NULL THEN 'PROFILE_SETUP'
    ELSE 'JUST_SIGNED_UP'
  END as onboarding_stage
FROM profiles p
LEFT JOIN activity_log al ON p.user_id = al.user_id
GROUP BY p.user_id, p.name, p.created_at;