-- Rating Calculation Check View
-- Purpose: Validates that idea ratings are correctly calculated from vote averages.
-- Tests: Trigger that updates idea rating after votes are cast or changed.
-- Use Case: Ensure voting system integrity, detect rating calculation failures.
--
-- What it does:
-- - Recalculates average rating from all votes on each idea
-- - Compares with stored rating in ideas table
-- - Identifies rating inconsistencies
--
-- Example Usage:
-- SELECT * FROM rating_calculation_check WHERE status = 'INVALID';
--
-- Example Output:
-- | id     | title      | stored_rating | calculated_rating | difference | status  |
-- |--------|------------|---------------|-------------------|------------|---------|
-- | idea-1 | Smart App  | 4.0           | 3.8               | 0.2        | INVALID |
--
-- This indicates the stored rating (4.0) doesn't match the actual average of votes (3.8),
-- suggesting the rating update trigger failed to recalculate correctly.
CREATE OR REPLACE VIEW rating_calculation_check AS
SELECT
  i.id,
  i.title,
  i.rating as stored_rating,
  ROUND(AVG(v.rating), 2) as calculated_rating,
  i.rating - ROUND(AVG(v.rating), 2) as difference,
  CASE WHEN i.rating = ROUND(AVG(v.rating), 2) OR (i.rating IS NULL AND ROUND(AVG(v.rating), 2) IS NULL) THEN 'VALID' ELSE 'INVALID' END as status
FROM ideas i
LEFT JOIN votes v ON i.id = v.idea_id
GROUP BY i.id, i.title, i.rating;