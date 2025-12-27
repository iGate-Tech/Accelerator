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
  COALESCE(p.preferences->'notifications', json_build_object('email', true, 'push', true)) as notifications,
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
  END as entity_display_name,
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
         p.total_spent, p.package_type, p.package_status, p.created_at, p.preferences;</content>
<parameter name="filePath">/home/rana/Documents/test/accelerator/db/views.sql