-- System Health Dashboard View
-- This view provides real-time monitoring metrics for system health and performance.
-- Tracks multiple categories of metrics:
-- - User Engagement: Active users over 24h and 7d periods
-- - Content Creation: Ideas created and completed in last 24h
-- - Voting Activity: Votes cast in last 24h
-- - Credit System: Transaction volume and average balances
-- - System Performance: Database connection pool usage
-- Used for operational monitoring, alerting, and performance analytics.
--
-- Example usage:
-- SELECT metric_category, metric_name, metric_value
-- FROM system_health_dashboard
-- WHERE metric_category = 'user_engagement';
--
-- Example output:
-- | metric_category | metric_name          | metric_value |
-- |-----------------|----------------------|--------------|
-- | user_engagement | total_active_users_24h | 145          |
-- | user_engagement | total_active_users_7d  | 892          |
CREATE OR REPLACE VIEW system_health_dashboard AS
SELECT
  'user_engagement' as metric_category,
  'total_active_users_24h' as metric_name,
  COUNT(DISTINCT al.user_id) as metric_value,
  'users' as metric_unit
FROM activity_log al
WHERE al.created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'user_engagement' as metric_category,
  'total_active_users_7d' as metric_name,
  COUNT(DISTINCT al.user_id) as metric_value,
  'users' as metric_unit
FROM activity_log al
WHERE al.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'content_creation' as metric_category,
  'ideas_created_24h' as metric_name,
  COUNT(*) as metric_value,
  'ideas' as metric_unit
FROM ideas
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'content_creation' as metric_category,
  'ideas_completed_24h' as metric_name,
  COUNT(*) as metric_value,
  'ideas' as metric_unit
FROM ideas
WHERE overall_status = 'completed'
  AND updated_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'voting_activity' as metric_category,
  'votes_cast_24h' as metric_name,
  COUNT(*) as metric_value,
  'votes' as metric_unit
FROM votes
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'credit_system' as metric_category,
  'credits_transacted_24h' as metric_name,
  COALESCE(SUM(ABS(amount)), 0) as metric_value,
  'credits' as metric_unit
FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'credit_system' as metric_category,
  'average_credit_balance' as metric_name,
  ROUND(AVG(credit_balance), 2) as metric_value,
  'credits' as metric_unit
FROM profiles

UNION ALL

SELECT
  'system_performance' as metric_category,
  'database_connection_pool_usage' as metric_name,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as metric_value,
  'connections' as metric_unit;