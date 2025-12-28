-- Vote Rating Updates View
-- Purpose: Verifies that idea ratings are updated correctly after votes.
-- Tests: Trigger that recalculates idea rating on vote insert/update/delete.
-- Use Case: Ensure voting system accuracy, detect rating calculation issues.
--
-- What it does:
-- - Shows individual votes with current idea rating
-- - Recalculates what the rating should be after each vote
-- - Helps identify if rating updates are happening correctly
--
-- Example Usage:
-- SELECT idea_title, vote_rating, current_idea_rating, recalculated_avg
-- FROM vote_rating_updates
-- WHERE ABS(current_idea_rating - recalculated_avg) > 0.01
-- LIMIT 5;
--
-- Example Output:
-- | idea_title   | vote_rating | current_idea_rating | recalculated_avg |
-- |--------------|-------------|---------------------|------------------|
-- | Smart Watch  | 4           | 3.8                 | 3.9              |
--
-- Significant differences indicate the rating update trigger failed.
CREATE OR REPLACE VIEW vote_rating_updates AS
SELECT
  v.id as vote_id,
  v.user_id as voter_id,
  vp.name as voter_name,
  v.idea_id,
  i.title as idea_title,
  v.rating as vote_rating,
  i.rating as current_idea_rating,
  ROUND(AVG(vv.rating), 2) as recalculated_avg,
  v.created_at
FROM votes v
JOIN profiles vp ON v.user_id = vp.user_id
JOIN ideas i ON v.idea_id = i.id
LEFT JOIN votes vv ON vv.idea_id = i.id
GROUP BY v.id, vp.name, i.title, i.rating, v.user_id, v.idea_id, v.rating, v.created_at
ORDER BY v.created_at DESC;