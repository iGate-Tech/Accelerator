-- Query Performance Monitoring View
-- This view provides database performance metrics and query statistics
-- Tracks performance indicators for optimization and monitoring
--
-- CATEGORIES TRACKED:
-- - Connection Pool: Active/idle connections and usage patterns
-- - Transaction Metrics: Commit/rollback rates and throughput
-- - Cache Performance: Buffer cache hit ratios and efficiency
-- - Query Statistics: Top queries by execution time/calls (requires pg_stat_statements)
--
-- DEPENDENCY NOTES:
-- - Uses pg_stat_database for basic metrics
-- - For detailed query performance, install pg_stat_statements extension:
--   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
--
-- RECOMMENDED SETUP:
-- Add to extensions/uuid-ossp.sql:
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
--
-- Example usage:
-- SELECT metric_category, metric_name, metric_value, metric_unit
-- FROM query_performance_monitoring
-- ORDER BY metric_category, metric_name;
--
-- Performance alerts:
-- SELECT * FROM query_performance_monitoring
-- WHERE metric_category = 'cache_performance'
--   AND metric_name = 'cache_hit_ratio'
--   AND metric_value < 0.95; -- Alert if cache hit ratio below 95%

CREATE OR REPLACE VIEW query_performance_monitoring AS

-- Connection Pool Metrics
SELECT
  'connection_pool' as metric_category,
  'active_connections' as metric_name,
  COUNT(*)::numeric as metric_value,
  'connections' as metric_unit
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT
  'connection_pool' as metric_category,
  'idle_connections' as metric_name,
  COUNT(*)::numeric as metric_value,
  'connections' as metric_unit
FROM pg_stat_activity
WHERE state = 'idle'

UNION ALL

SELECT
  'connection_pool' as metric_category,
  'total_connections' as metric_name,
  COUNT(*)::numeric as metric_value,
  'connections' as metric_unit
FROM pg_stat_activity

UNION ALL

-- Transaction Metrics
SELECT
  'transaction_metrics' as metric_category,
  'total_transactions' as metric_name,
  SUM(xact_commit + xact_rollback)::numeric as metric_value,
  'transactions' as metric_unit
FROM pg_stat_database

UNION ALL

SELECT
  'transaction_metrics' as metric_category,
  'successful_transactions' as metric_name,
  SUM(xact_commit)::numeric as metric_value,
  'transactions' as metric_unit
FROM pg_stat_database

UNION ALL

SELECT
  'transaction_metrics' as metric_category,
  'failed_transactions' as metric_name,
  SUM(xact_rollback)::numeric as metric_value,
  'transactions' as metric_unit
FROM pg_stat_database

UNION ALL

-- Cache Performance
SELECT
  'cache_performance' as metric_category,
  'cache_hit_ratio' as metric_name,
  CASE
    WHEN SUM(blks_hit + blks_read) > 0
    THEN ROUND(SUM(blks_hit)::numeric / SUM(blks_hit + blks_read), 4)
    ELSE 0
  END as metric_value,
  'ratio' as metric_unit
FROM pg_stat_database

UNION ALL

SELECT
  'cache_performance' as metric_category,
  'total_blocks_hit' as metric_name,
  SUM(blks_hit)::numeric as metric_value,
  'blocks' as metric_unit
FROM pg_stat_database

UNION ALL

SELECT
  'cache_performance' as metric_category,
  'total_blocks_read' as metric_name,
  SUM(blks_read)::numeric as metric_value,
  'blocks' as metric_unit
FROM pg_stat_database

UNION ALL

-- Database Size Metrics
SELECT
  'database_size' as metric_category,
  'total_database_size' as metric_name,
  pg_database_size(current_database())::numeric as metric_value,
  'bytes' as metric_unit

UNION ALL

-- Query Performance (requires pg_stat_statements extension)
-- This section will only work if pg_stat_statements is installed
SELECT
  'query_performance' as metric_category,
  'top_queries_by_calls' as metric_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
    THEN (SELECT COUNT(*) FROM pg_stat_statements WHERE calls > 100)::numeric
    ELSE 0
  END as metric_value,
  'queries' as metric_unit

-- Query performance metrics require pg_stat_statements extension
-- Uncomment below after installing: CREATE EXTENSION pg_stat_statements;
--
-- UNION ALL
--
-- SELECT
--   'query_performance' as metric_category,
--   'avg_query_time_ms' as metric_name,
--   CASE
--     WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
--     THEN COALESCE((
--       SELECT ROUND(AVG(mean_time), 2)
--       FROM pg_stat_statements
--       WHERE calls > 10
--     ), 0)
--     ELSE 0
--   END as metric_value,
--   'milliseconds' as metric_unit
--
-- UNION ALL
--
-- SELECT
--   'query_performance' as metric_category,
--   'slow_queries_count' as metric_name,
--   CASE
--     WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
--     THEN (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_time > 1000)::numeric -- queries > 1 second
--     ELSE 0
--   END as metric_value,
--   'queries' as metric_unit;