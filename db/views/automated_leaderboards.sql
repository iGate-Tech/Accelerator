-- Automated Leaderboards View
-- This view generates multiple types of community leaderboards automatically.
-- Leaderboard types:
-- - Most Ideas: Users ranked by number of ideas created
-- - Most Completed: Users ranked by completed projects
-- - Most Helpful: Users ranked by rewards earned (community contribution)
-- - Most Active Voter: Users ranked by votes given
-- Each leaderboard includes rank, user info, score, and descriptive labels.
-- Used for community recognition and competitive features.
--
-- Example usage:
-- SELECT leaderboard_type, rank, name, score, score_label
-- FROM automated_leaderboards
-- WHERE leaderboard_type = 'most_helpful'
-- LIMIT 3;
--
-- Example output:
-- | leaderboard_type | rank | name  | score | score_label      |
-- |------------------|------|-------|-------|------------------|
-- | most_helpful     | 1    | Alice | 450   | reward points    |
-- | most_helpful     | 2    | Bob   | 380   | reward points    |
-- | most_helpful     | 3    | Carol | 295   | reward points    |
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