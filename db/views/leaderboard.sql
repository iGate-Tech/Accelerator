-- Leaderboard View
-- This view creates a ranked list of public ideas based on community engagement and rewards.
-- Ranking factors (in order):
-- 1. Total rewards earned (primary ranking)
-- 2. Average rating (secondary ranking)
-- 3. Vote count (tertiary ranking)
-- Only includes public ideas to maintain privacy.
-- Used for community leaderboards and trending idea displays.
--
-- Example usage:
-- SELECT rank, title, user_name, total_rewards
-- FROM leaderboard
-- LIMIT 5;
--
-- Example output:
-- | rank | title          | user_name | total_rewards |
-- |------|----------------|-----------|---------------|
-- | 1    | AI Assistant   | Bob       | 250.00        |
-- | 2    | Smart Home Hub | Alice     | 180.50        |
-- | 3    | Mobile App     | Carol     | 145.25        |
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