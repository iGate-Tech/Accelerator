-- Portfolio Summary View
-- This view provides aggregated information about user portfolios, showing project collections.
-- For each portfolio, it displays:
-- - Basic portfolio metadata (name, description, color, default status)
-- - Total number of ideas contained
-- - Total number of team members
-- - Average completion percentage across all ideas
-- Used for portfolio management interfaces and overview displays.
--
-- Example usage:
-- SELECT name, total_ideas, total_members, avg_completion
-- FROM portfolio_summary
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | name         | total_ideas | total_members | avg_completion |
-- |--------------|-------------|---------------|----------------|
-- | Web Projects | 8           | 3             | 65.2           |
-- | Mobile Apps  | 5           | 2             | 78.5           |
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  po.id,
  po.user_id,
  po.name,
  po.description,
  po.color,
  po.is_default,
  COUNT(DISTINCT pi.idea_id) as total_ideas,
  COUNT(DISTINCT pm.user_id) as total_members,
  ROUND(AVG(i.completion_percentage), 1) as avg_completion
FROM portfolios po
LEFT JOIN portfolio_ideas pi ON po.id = pi.portfolio_id
LEFT JOIN ideas i ON pi.idea_id = i.id
LEFT JOIN portfolio_members pm ON po.id = pm.portfolio_id
GROUP BY po.id, po.user_id, po.name, po.description, po.color, po.is_default;