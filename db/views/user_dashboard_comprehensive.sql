-- Comprehensive User Dashboard View
-- This is the most complete view of user data, combining all aspects of user activity and engagement.
-- Aggregates data from multiple tables to provide:
-- - Complete profile and account information
-- - Comprehensive idea statistics (total, completed, public)
-- - Voting activity and reward earnings
-- - Activity metrics (last activity, weekly activity count)
-- - Social features (favorites)
-- - Personalization preferences
-- Used for main user dashboards and profile analytics.
--
-- Example usage:
-- SELECT name, total_ideas, completed_ideas, weekly_activities
-- FROM user_dashboard_comprehensive
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | name  | total_ideas | completed_ideas | weekly_activities |
-- |-------|-------------|-----------------|-------------------|
-- | Alice | 15          | 8               | 23                |
CREATE OR REPLACE VIEW user_dashboard_comprehensive AS
SELECT
  p.user_id,
  p.name,
  p.avatar_url,
  p.credit_balance,
  p.total_earned,
  p.total_spent,
  p.package_type,
  p.package_status,
  p.created_at as member_since,
  -- Idea statistics
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
  COUNT(DISTINCT CASE WHEN i.privacy = 'public' THEN i.id END) as public_ideas,
  -- Voting statistics
  COUNT(DISTINCT v.id) as total_votes_given,
  COUNT(DISTINCT vr.id) as total_rewards_earned,
  COALESCE(SUM(vr.reward_amount), 0) as rewards_amount,
  -- Recent activity
  MAX(al.created_at) as last_activity_at,
  COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) as weekly_activities,
  -- Favorite statistics
  COUNT(DISTINCT f.id) as total_favorites,
  -- Preferences
  COALESCE(p.preferences->>'language', 'en') as preferred_language,
  COALESCE(p.preferences->>'theme', 'light') as preferred_theme
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON p.user_id = v.user_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
LEFT JOIN activity_log al ON p.user_id = al.user_id
LEFT JOIN user_favorites f ON p.user_id = f.user_id
GROUP BY p.user_id, p.name, p.avatar_url, p.credit_balance, p.total_earned,
         p.total_spent, p.package_type, p.package_status, p.created_at, p.preferences;