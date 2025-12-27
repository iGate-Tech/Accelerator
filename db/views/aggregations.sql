-- Database Views for Simplified Queries
-- These views consolidate common data patterns to reduce complex JOINs in application code

-- User dashboard summary view
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT
  p.user_id,
  p.name,
  p.avatar_url,
  p.credit_balance,
  p.total_earned,
  p.total_spent,
  p.package_type,
  p.package_status,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
  ROUND(AVG(i.rating), 2) as average_rating,
  COUNT(DISTINCT v.id) as total_votes_given,
  COUNT(DISTINCT vr.id) as total_rewards_earned,
  COALESCE(SUM(vr.reward_amount), 0) as rewards_amount
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON p.user_id = v.user_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
GROUP BY p.user_id, p.name, p.avatar_url, p.credit_balance, p.total_earned, p.total_spent, p.package_type, p.package_status;

-- Ideas with comprehensive stats view
CREATE OR REPLACE VIEW ideas_with_stats AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.category,
  i.description,
  i.tags,
  i.privacy,
  i.rating,
  i.completion_percentage,
  i.overall_status,
  i.created_at,
  i.updated_at,
  p.name as user_name,
  COUNT(DISTINCT v.id) as vote_count,
  ROUND(AVG(v.rating), 2) as average_vote_rating,
  COUNT(DISTINCT vr.id) as reward_count,
  COALESCE(SUM(vr.reward_amount), 0) as total_rewards
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN voting_rewards vr ON i.id = vr.idea_id
GROUP BY i.id, i.user_id, i.title, i.category, i.description, i.tags, i.privacy, i.rating, i.completion_percentage, i.overall_status, i.created_at, i.updated_at, p.name;

-- User activity feed view
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

-- Voting dashboard view
CREATE OR REPLACE VIEW voting_dashboard AS
SELECT
  p.user_id,
  p.name,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT v.id) as total_votes_received,
  ROUND(AVG(i.rating), 2) as overall_rating,
  COUNT(DISTINCT vr.id) as rewards_earned,
  COALESCE(SUM(vr.reward_amount), 0) as total_earned_from_rewards,
  COUNT(DISTINCT v_given.id) as votes_given,
  (SELECT credit_balance FROM profiles WHERE user_id = p.user_id) as current_credits
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
LEFT JOIN votes v_given ON p.user_id = v_given.user_id
GROUP BY p.user_id, p.name;

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  i.id as idea_id,
  i.title,
  p.name as user_name,
  i.rating,
  COUNT(DISTINCT v.id) as vote_count,
  COALESCE(SUM(vr.reward_amount), 0) as total_rewards
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN voting_rewards vr ON i.id = vr.idea_id
WHERE i.privacy = 'public'
GROUP BY i.id, i.title, p.name, i.rating
ORDER BY total_rewards DESC, i.rating DESC, vote_count DESC;

-- Portfolio summary view
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  po.id,
  po.user_id,
  po.name,
  po.description,
  po.color,
  po.is_default,
  COUNT(DISTINCT pi.idea_id) as total_ideas,
  COUNT(DISTINCT pm.user_id) as total_members,
  ROUND(AVG(i.completion_percentage), 1) as avg_completion
FROM portfolios po
LEFT JOIN portfolio_ideas pi ON po.id = pi.portfolio_id
LEFT JOIN ideas i ON pi.idea_id = i.id
LEFT JOIN portfolio_members pm ON po.id = pm.portfolio_id
GROUP BY po.id, po.user_id, po.name, po.description, po.color, po.is_default;

-- Model progress view (pre-computed progress percentages)
CREATE OR REPLACE VIEW user_model_progress AS
SELECT
  mi.user_id,
  mi.model_type,
  COUNT(*) as total_sections,
  COUNT(CASE WHEN ms.is_completed THEN 1 END) as completed_sections,
  ROUND(
    (COUNT(CASE WHEN ms.is_completed THEN 1 END) * 100.0) / COUNT(*),
    1
  ) as completion_percentage,
  COUNT(DISTINCT mi.id) as total_instances,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_instances
FROM model_instances mi
JOIN model_sections ms ON mi.id = ms.model_instance_id
GROUP BY mi.user_id, mi.model_type;

-- Idea completion progress view
CREATE OR REPLACE VIEW idea_progress_view AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.completion_percentage,
  CASE
    WHEN i.completion_percentage >= 100 THEN 'completed'
    WHEN i.completion_percentage > 0 THEN 'in_progress'
    ELSE 'draft'
  END as progress_status,
  COUNT(DISTINCT mi.id) as total_models,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_models
FROM ideas i
LEFT JOIN model_instances mi ON i.id = mi.idea_id
GROUP BY i.id, i.user_id, i.title, i.completion_percentage;

-- Enhanced User Preferences View
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

-- User Activity Feed View with Entity Details
CREATE OR REPLACE VIEW user_activity_feed AS
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

-- Enhanced Ideas with Comprehensive Stats View
CREATE OR REPLACE VIEW ideas_with_full_stats AS
SELECT
  i.*,
  -- Author information
  p.name as author_name,
  p.avatar_url as author_avatar,
  -- Statistics
  COUNT(DISTINCT v.id) as vote_count,
  ROUND(AVG(v.rating), 2) as average_rating,
  COUNT(DISTINCT f.id) as favorite_count,
  COUNT(DISTINCT mi.id) as total_models,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_models,
  -- Model progress percentage
  CASE
    WHEN COUNT(mi.id) > 0 THEN ROUND((COUNT(CASE WHEN mi.status = 'completed' THEN 1 END)::decimal / COUNT(mi.id)) * 100, 1)
    ELSE 0
  END as model_completion_percentage,
  -- Recent activity
  MAX(al.created_at) as last_activity_at
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN user_favorites f ON i.id = f.idea_id
LEFT JOIN model_instances mi ON i.id = mi.idea_id
LEFT JOIN activity_log al ON i.id = al.entity_id AND al.entity_type = 'idea'
GROUP BY i.id, p.name, p.avatar_url;

-- User Dashboard Comprehensive View
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

-- Advanced Automated Views for Maximum Automation

-- User Achievement Progress View
CREATE OR REPLACE VIEW user_achievements AS
SELECT
  p.user_id,
  p.name,
  -- Idea creation achievements
  CASE WHEN COUNT(DISTINCT i.id) >= 1 THEN 'first_idea' ELSE NULL END as achievement_first_idea,
  CASE WHEN COUNT(DISTINCT i.id) >= 5 THEN 'idea_creator_5' ELSE NULL END as achievement_idea_creator_5,
  CASE WHEN COUNT(DISTINCT i.id) >= 10 THEN 'idea_creator_10' ELSE NULL END as achievement_idea_creator_10,
  CASE WHEN COUNT(DISTINCT i.id) >= 25 THEN 'idea_creator_25' ELSE NULL END as achievement_idea_creator_25,
  CASE WHEN COUNT(DISTINCT i.id) >= 50 THEN 'idea_creator_50' ELSE NULL END as achievement_idea_creator_50,

  -- Completion achievements
  CASE WHEN COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) >= 1 THEN 'first_completion' ELSE NULL END as achievement_first_completion,
  CASE WHEN COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) >= 5 THEN 'project_finisher' ELSE NULL END as achievement_project_finisher,
  CASE WHEN COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) >= 10 THEN 'completion_master' ELSE NULL END as achievement_completion_master,

  -- Voting achievements
  CASE WHEN COUNT(DISTINCT v.id) >= 10 THEN 'first_voter' ELSE NULL END as achievement_first_voter,
  CASE WHEN COUNT(DISTINCT v.id) >= 50 THEN 'active_voter' ELSE NULL END as achievement_active_voter,
  CASE WHEN COUNT(DISTINCT v.id) >= 100 THEN 'voting_expert' ELSE NULL END as achievement_voting_expert,

  -- Social achievements
  CASE WHEN COUNT(DISTINCT f.id) >= 10 THEN 'social_butterfly' ELSE NULL END as achievement_social_butterfly,
  CASE WHEN COUNT(DISTINCT CASE WHEN i.privacy = 'public' THEN i.id END) >= 5 THEN 'public_figure' ELSE NULL END as achievement_public_figure,

  -- Reward achievements
  CASE WHEN COALESCE(SUM(vr.reward_amount), 0) >= 100 THEN 'reward_novice' ELSE NULL END as achievement_reward_novice,
  CASE WHEN COALESCE(SUM(vr.reward_amount), 0) >= 500 THEN 'reward_earner' ELSE NULL END as achievement_reward_earner,
  CASE WHEN COALESCE(SUM(vr.reward_amount), 0) >= 1000 THEN 'reward_master' ELSE NULL END as achievement_reward_master,

  -- Activity achievements
  CASE WHEN COUNT(DISTINCT al.id) >= 100 THEN 'active_user' ELSE NULL END as achievement_active_user,
  CASE WHEN COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) >= 10 THEN 'weekly_active' ELSE NULL END as achievement_weekly_active,

  -- Statistics for calculations
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
  COUNT(DISTINCT v.id) as total_votes_given,
  COUNT(DISTINCT f.id) as total_favorites,
  COUNT(DISTINCT CASE WHEN i.privacy = 'public' THEN i.id END) as public_ideas,
  COALESCE(SUM(vr.reward_amount), 0) as total_rewards_earned,
  COUNT(DISTINCT al.id) as total_activities,
  COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) as weekly_activities
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON p.user_id = v.user_id
LEFT JOIN user_favorites f ON p.user_id = f.user_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
LEFT JOIN activity_log al ON p.user_id = al.user_id
GROUP BY p.user_id, p.name;

-- Automated Leaderboard View
CREATE OR REPLACE VIEW automated_leaderboards AS
SELECT
  'most_ideas' as leaderboard_type,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT i.id) DESC) as rank,
  p.user_id,
  p.name,
  COUNT(DISTINCT i.id) as score,
  'ideas created' as score_label
FROM profiles p
JOIN ideas i ON p.user_id = i.user_id
GROUP BY p.user_id, p.name
HAVING COUNT(DISTINCT i.id) > 0

UNION ALL

SELECT
  'most_completed' as leaderboard_type,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) DESC) as rank,
  p.user_id,
  p.name,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as score,
  'projects completed' as score_label
FROM profiles p
JOIN ideas i ON p.user_id = i.user_id
GROUP BY p.user_id, p.name
HAVING COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) > 0

UNION ALL

SELECT
  'most_helpful' as leaderboard_type,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(vr.reward_amount), 0) DESC) as rank,
  p.user_id,
  p.name,
  COALESCE(SUM(vr.reward_amount), 0) as score,
  'reward points earned' as score_label
FROM profiles p
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
GROUP BY p.user_id, p.name
HAVING COALESCE(SUM(vr.reward_amount), 0) > 0

UNION ALL

SELECT
  'most_active_voter' as leaderboard_type,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT v.id) DESC) as rank,
  p.user_id,
  p.name,
  COUNT(DISTINCT v.id) as score,
  'votes given' as score_label
FROM profiles p
JOIN votes v ON p.user_id = v.user_id
GROUP BY p.user_id, p.name
HAVING COUNT(DISTINCT v.id) > 0

ORDER BY leaderboard_type, rank;

-- Automated Recommendation Engine View
CREATE OR REPLACE VIEW idea_recommendations AS
SELECT
  i.id as idea_id,
  i.title,
  i.category,
  i.description,
  p.name as author_name,
  i.created_at,
  -- Recommendation score based on multiple factors
  (
    -- Recency score (newer ideas get higher scores)
    (EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 86400.0) * -0.1 +
    -- Vote score (more votes = higher score)
    COUNT(DISTINCT v.id) * 2.0 +
    -- Average rating score
    COALESCE(AVG(v.rating), 0) * 1.5 +
    -- Completion percentage bonus
    (i.completion_percentage / 100.0) * 1.0 +
    -- Public visibility bonus
    CASE WHEN i.privacy = 'public' THEN 3.0 ELSE 0.0 END
  ) as recommendation_score,
  COUNT(DISTINCT v.id) as vote_count,
  ROUND(AVG(v.rating), 2) as average_rating,
  i.completion_percentage,
  i.privacy
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
WHERE i.privacy = 'public'
  AND i.created_at >= NOW() - INTERVAL '30 days' -- Only recent ideas
GROUP BY i.id, i.title, i.category, i.description, p.name, i.created_at, i.completion_percentage, i.privacy
HAVING COUNT(DISTINCT v.id) >= 1 -- Must have at least 1 vote
ORDER BY recommendation_score DESC;

-- Automated System Health Monitoring View
CREATE OR REPLACE VIEW system_health_dashboard AS
SELECT
  'user_engagement' as metric_category,
  'total_active_users_24h' as metric_name,
  COUNT(DISTINCT al.user_id) as metric_value,
  'users' as metric_unit
FROM activity_log al
WHERE al.created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'user_engagement' as metric_category,
  'total_active_users_7d' as metric_name,
  COUNT(DISTINCT al.user_id) as metric_value,
  'users' as metric_unit
FROM activity_log al
WHERE al.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'content_creation' as metric_category,
  'ideas_created_24h' as metric_name,
  COUNT(*) as metric_value,
  'ideas' as metric_unit
FROM ideas
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'content_creation' as metric_category,
  'ideas_completed_24h' as metric_name,
  COUNT(*) as metric_value,
  'ideas' as metric_unit
FROM ideas
WHERE overall_status = 'completed'
  AND updated_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'voting_activity' as metric_category,
  'votes_cast_24h' as metric_name,
  COUNT(*) as metric_value,
  'votes' as metric_unit
FROM votes
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'credit_system' as metric_category,
  'credits_transacted_24h' as metric_name,
  COALESCE(SUM(ABS(amount)), 0) as metric_value,
  'credits' as metric_unit
FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'credit_system' as metric_category,
  'average_credit_balance' as metric_name,
  ROUND(AVG(credit_balance), 2) as metric_value,
  'credits' as metric_unit
FROM profiles

UNION ALL

SELECT
  'system_performance' as metric_category,
  'database_connection_pool_usage' as metric_name,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as metric_value,
  'connections' as metric_unit;

-- Automated User Onboarding Status View
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