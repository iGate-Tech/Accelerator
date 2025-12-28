-- Completion Percentage Accuracy View
-- Purpose: Verifies that idea completion percentages are correctly calculated by triggers.
-- Tests: Trigger that updates completion_percentage when model sections are completed.
-- Use Case: Ensure progress tracking accuracy, detect calculation errors.
--
-- What it does:
-- - Recalculates completion percentage as: (completed_models / total_models) * 100
-- - Compares with stored completion_percentage in ideas table
-- - Flags discrepancies that indicate trigger failures
--
-- Example Usage:
-- SELECT * FROM completion_percentage_accuracy WHERE status = 'INVALID' LIMIT 5;
--
-- Example Output:
-- | id     | title        | stored_percentage | calculated_percentage | difference | status  |
-- |--------|--------------|-------------------|----------------------|------------|---------|
-- | idea-1 | My App       | 75.0              | 66.7                 | 8.3        | INVALID |
--
-- This shows the stored percentage (75%) doesn't match the calculated one (66.7%),
-- indicating the completion update trigger may have failed or calculated incorrectly.
CREATE OR REPLACE VIEW completion_percentage_accuracy AS
SELECT
  i.id,
  i.title,
  i.completion_percentage as stored_percentage,
  CASE
    WHEN COUNT(mi.id) > 0 THEN ROUND((COUNT(CASE WHEN mi.status = 'completed' THEN 1 END)::decimal / COUNT(mi.id)) * 100, 1)
    ELSE 0
  END as calculated_percentage,
  ABS(i.completion_percentage - CASE
    WHEN COUNT(mi.id) > 0 THEN ROUND((COUNT(CASE WHEN mi.status = 'completed' THEN 1 END)::decimal / COUNT(mi.id)) * 100, 1)
    ELSE 0
  END) as difference,
  CASE WHEN ABS(i.completion_percentage - CASE
    WHEN COUNT(mi.id) > 0 THEN ROUND((COUNT(CASE WHEN mi.status = 'completed' THEN 1 END)::decimal / COUNT(mi.id)) * 100, 1)
    ELSE 0
  END) < 0.1 THEN 'VALID' ELSE 'INVALID' END as status
FROM ideas i
LEFT JOIN model_instances mi ON i.id = mi.idea_id
GROUP BY i.id, i.title, i.completion_percentage;