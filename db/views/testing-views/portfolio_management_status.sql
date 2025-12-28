-- Portfolio Management Status View
-- Purpose: Monitors portfolio creation and team collaboration workflows.
-- Tests: Portfolio management and member invitation system.
-- Use Case: Track team formation, project organization.
--
-- What it does:
-- - Shows all portfolios with their composition
-- - Tracks member counts and idea completion within portfolios
-- - Categorizes portfolio development status
--
-- Example Usage:
-- SELECT portfolio_status, COUNT(*) as portfolio_count
-- FROM portfolio_management_status
-- GROUP BY portfolio_status;
--
-- Example Output:
-- | portfolio_status | portfolio_count |
-- |------------------|-----------------|
-- | ALL_COMPLETED   | 3               |
-- | MOSTLY_COMPLETE | 7               |
-- | IN_PROGRESS     | 12              |
-- | JUST_STARTED    | 8               |
-- | EMPTY           | 2               |
--
-- Helps understand team productivity and project completion rates.
CREATE OR REPLACE VIEW portfolio_management_status AS
SELECT
  po.id,
  po.name,
  po.user_id,
  p.name as owner_name,
  po.created_at,
  COUNT(DISTINCT pi.idea_id) as total_ideas,
  COUNT(DISTINCT pm.user_id) as total_members,
  ROUND(AVG(i.completion_percentage), 1) as avg_idea_completion,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
  CASE
    WHEN COUNT(DISTINCT pi.idea_id) = 0 THEN 'EMPTY'
    WHEN COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) = COUNT(DISTINCT pi.idea_id) THEN 'ALL_COMPLETED'
    WHEN ROUND(AVG(i.completion_percentage), 1) >= 75 THEN 'MOSTLY_COMPLETE'
    WHEN ROUND(AVG(i.completion_percentage), 1) >= 50 THEN 'IN_PROGRESS'
    ELSE 'JUST_STARTED'
  END as portfolio_status
FROM portfolios po
JOIN profiles p ON po.user_id = p.user_id
LEFT JOIN portfolio_ideas pi ON po.id = pi.portfolio_id
LEFT JOIN ideas i ON pi.idea_id = i.id
LEFT JOIN portfolio_members pm ON po.id = pm.portfolio_id
GROUP BY po.id, po.name, po.user_id, p.name, po.created_at
ORDER BY po.created_at DESC;