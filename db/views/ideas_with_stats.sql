-- Ideas with Comprehensive Stats View
-- This view provides detailed statistics for each idea, combining idea metadata with aggregated voting data.
-- It includes:
-- - All basic idea fields (title, category, description, etc.)
-- - Author information (user name)
-- - Voting statistics (vote count, average rating)
-- - Reward statistics (total rewards earned)
-- Used for idea listings, search results, and detailed idea pages.
--
-- Example usage:
-- SELECT title, user_name, vote_count, average_vote_rating, total_rewards
-- FROM ideas_with_stats
-- WHERE category = 'technology'
-- ORDER BY vote_count DESC;
--
-- Example output:
-- | title              | user_name | vote_count | average_vote_rating | total_rewards |
-- |--------------------|-----------|------------|---------------------|---------------|
-- | AI Assistant       | Bob       | 45         | 4.2                 | 180.00        |
-- | Mobile App         | Carol     | 32         | 3.8                 | 95.50         |
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