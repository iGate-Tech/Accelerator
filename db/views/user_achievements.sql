-- User Achievements View
-- This view calculates and tracks user achievements based on various activity thresholds.
-- Achievement categories:
-- - Idea creation milestones (first idea, 5, 10, 25, 50 ideas)
-- - Project completion achievements
-- - Voting participation levels
-- - Social engagement (favorites, public ideas)
-- - Reward earning tiers
-- - Activity frequency achievements
-- Used for gamification, badges, and user engagement incentives.
--
-- Example usage:
-- SELECT achievement_first_idea, achievement_idea_creator_5, total_ideas
-- FROM user_achievements
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | achievement_first_idea | achievement_idea_creator_5 | total_ideas |
-- |------------------------|----------------------------|-------------|
-- | first_idea            | idea_creator_5             | 8           |
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