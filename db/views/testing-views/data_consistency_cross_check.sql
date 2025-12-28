-- Data Consistency Cross Check View
-- Purpose: Verifies consistency between related data across different views/tables.
-- Tests: Data synchronization between summary views and underlying data.
-- Use Case: Detect view calculation errors, ensure reporting accuracy.
--
-- What it does:
-- - Compares data from summary views against raw calculations
-- - Identifies inconsistencies between different data representations
-- - Helps ensure all views show consistent information
--
-- Example Usage:
-- SELECT * FROM data_consistency_cross_check WHERE status = 'INCONSISTENT';
--
-- Example Output:
-- | check_type         | user_id | name  | actual_ideas_count | reported_ideas_count | status       |
-- |--------------------|---------|-------|-------------------|----------------------|--------------|
-- | user_stats_consistency | user-1 | Alice | 15                | 12                  | INCONSISTENT |
--
-- Inconsistent records indicate problems with summary calculations.
CREATE OR REPLACE VIEW data_consistency_cross_check AS
-- User stats consistency
SELECT
  'user_stats_consistency' as check_type,
  p.user_id,
  p.name,
  COUNT(DISTINCT i.id) as actual_ideas_count,
  (SELECT total_ideas FROM user_dashboard_summary uds WHERE uds.user_id = p.user_id) as reported_ideas_count,
  COUNT(DISTINCT v.id) as actual_votes_given,
  (SELECT total_votes_given FROM user_dashboard_summary uds WHERE uds.user_id = p.user_id) as reported_votes_given,
  CASE WHEN COUNT(DISTINCT i.id) = (SELECT total_ideas FROM user_dashboard_summary uds WHERE uds.user_id = p.user_id)
           AND COUNT(DISTINCT v.id) = (SELECT total_votes_given FROM user_dashboard_summary uds WHERE uds.user_id = p.user_id)
       THEN 'CONSISTENT' ELSE 'INCONSISTENT' END as status
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON p.user_id = v.user_id
GROUP BY p.user_id, p.name
HAVING (SELECT total_ideas FROM user_dashboard_summary uds WHERE uds.user_id = p.user_id) IS NOT NULL;