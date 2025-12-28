-- Idea Recommendations View
-- This view implements an automated recommendation system for ideas based on multiple engagement factors.
-- Recommendation scoring algorithm combines:
-- - Recency (newer ideas score higher, but with diminishing returns)
-- - Community votes (more votes = higher score)
-- - Average rating quality
-- - Completion percentage (finished projects score higher)
-- - Public visibility bonus
-- Filters for recent public ideas with at least one vote.
-- Used for "recommended for you" features and discovery algorithms.
--
-- Example usage:
-- SELECT title, author_name, recommendation_score, vote_count
-- FROM idea_recommendations
-- ORDER BY recommendation_score DESC
-- LIMIT 5;
--
-- Example output:
-- | title          | author_name | recommendation_score | vote_count |
-- |----------------|-------------|----------------------|------------|
-- | AI Assistant   | Bob         | 15.8                 | 45         |
-- | Smart Home Hub | Alice       | 12.3                 | 32         |
-- | Mobile App     | Carol       | 10.9                 | 28         |
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