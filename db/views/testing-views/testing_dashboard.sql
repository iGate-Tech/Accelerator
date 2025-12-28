-- Testing Dashboard View
-- Purpose: Comprehensive dashboard aggregating all testing view results for system health monitoring.
-- Tests: Overall system functionality through consolidated testing metrics.
-- Use Case: Quick system health check, identify areas needing attention, monitor automation effectiveness.
--
-- What it does:
-- - Aggregates key metrics from all testing views
-- - Provides system health scores and status indicators
-- - Shows counts of issues, success rates, and activity levels
-- - Categorizes results by testing area for easy analysis
--
-- Dashboard Sections:
-- 1. Data Validation Status - Balance/rating/completion accuracy
-- 2. Trigger Activity - Firing counts and recent activity
-- 3. Automation Health - Success rates and reward distribution
-- 4. Workflow Status - User onboarding and idea development progress
-- 5. System Integrity - Referential integrity and consistency checks
-- 6. Overall Health Score - Calculated system health percentage
--
-- Example Usage:
-- SELECT category, metric_name, metric_value, status
-- FROM testing_dashboard
-- ORDER BY category, metric_name;
--
-- Example Output:
-- | category          | metric_name              | metric_value | status      |
-- |-------------------|--------------------------|--------------|-------------|
-- | Data Validation  | Credit Balance Issues    | 0            | HEALTHY     |
-- | Trigger Activity | Activity Logs Today      | 45           | ACTIVE      |
-- | Automation Health| Average Success Rate     | 98.5         | EXCELLENT   |
-- | Workflow Status  | Fully Onboarded Users    | 67%          | GOOD        |
-- | System Integrity | Integrity Violations     | 0            | HEALTHY     |
--
-- Status indicators: HEALTHY (0 issues), ACTIVE (>0 activity), EXCELLENT (>95%), GOOD (80-95%), WARNING (50-80%), CRITICAL (<50%)
CREATE OR REPLACE VIEW testing_dashboard AS
-- Data Validation Status
SELECT
  'Data Validation' as category,
  'Credit Balance Issues' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'CRITICAL' END as status
FROM credit_balance_validation
WHERE status = 'INVALID'
UNION ALL
SELECT
  'Data Validation' as category,
  'Invalid Package Types' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'CRITICAL' END as status
FROM package_type_validation
UNION ALL
SELECT
  'Data Validation' as category,
  'Completion Calc Errors' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' WHEN COUNT(*) < 5 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM completion_percentage_accuracy
WHERE status = 'INVALID'
UNION ALL
SELECT
  'Data Validation' as category,
  'Rating Calc Errors' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' WHEN COUNT(*) < 5 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM rating_calculation_check
WHERE status = 'INVALID'

-- Trigger Activity
UNION ALL
SELECT
  'Trigger Activity' as category,
  'Activity Logs Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 10 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM activity_logging_verification
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT
  'Trigger Activity' as category,
  'Notifications Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 5 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM notification_creation_check
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT
  'Trigger Activity' as category,
  'Credit Transactions Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 10 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM credit_transaction_effects
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT
  'Trigger Activity' as category,
  'Section Completions Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 5 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM model_section_completion_tracking
WHERE completed_at >= CURRENT_DATE

-- Automation Health
UNION ALL
SELECT
  'Automation Health' as category,
  'Average Success Rate' as metric_name,
  ROUND(AVG(success_rate)::numeric, 1)::text || '%' as metric_value,
  CASE WHEN AVG(success_rate) >= 95 THEN 'EXCELLENT' WHEN AVG(success_rate) >= 80 THEN 'GOOD' WHEN AVG(success_rate) >= 50 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM automation_success_rates
UNION ALL
SELECT
  'Automation Health' as category,
  'Rewards Distributed Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 5 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM reward_distribution_monitor
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT
  'Automation Health' as category,
  'Models Unlocked Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 0 THEN 'ACTIVE' ELSE 'QUIET' END as status
FROM model_unlocking_status
WHERE validation_threshold_met = true
UNION ALL
SELECT
  'Automation Health' as category,
  'Daily Bonuses Today' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 0 THEN 'ACTIVE' ELSE 'QUIET' END as status
FROM daily_first_vote_tracking
WHERE received_bonus = true AND vote_date = CURRENT_DATE

-- Workflow Status
UNION ALL
SELECT
  'Workflow Status' as category,
  'Fully Onboarded Users' as metric_name,
  ROUND((COUNT(CASE WHEN onboarding_stage = 'FULLY_ONBOARDED' THEN 1 END)::decimal / COUNT(*) * 100), 1)::text || '%' as metric_value,
  CASE WHEN (COUNT(CASE WHEN onboarding_stage = 'FULLY_ONBOARDED' THEN 1 END)::decimal / COUNT(*)) >= 0.8 THEN 'EXCELLENT'
       WHEN (COUNT(CASE WHEN onboarding_stage = 'FULLY_ONBOARDED' THEN 1 END)::decimal / COUNT(*)) >= 0.6 THEN 'GOOD'
       WHEN (COUNT(CASE WHEN onboarding_stage = 'FULLY_ONBOARDED' THEN 1 END)::decimal / COUNT(*)) >= 0.3 THEN 'WARNING'
       ELSE 'CRITICAL' END as status
FROM user_onboarding_pipeline
UNION ALL
SELECT
  'Workflow Status' as category,
  'Completed Ideas' as metric_name,
  ROUND((COUNT(CASE WHEN development_stage = 'COMPLETED' THEN 1 END)::decimal / COUNT(*) * 100), 1)::text || '%' as metric_value,
  CASE WHEN (COUNT(CASE WHEN development_stage = 'COMPLETED' THEN 1 END)::decimal / COUNT(*)) >= 0.5 THEN 'GOOD'
       WHEN (COUNT(CASE WHEN development_stage = 'COMPLETED' THEN 1 END)::decimal / COUNT(*)) >= 0.2 THEN 'WARNING'
       ELSE 'CRITICAL' END as status
FROM idea_development_workflow
UNION ALL
SELECT
  'Workflow Status' as category,
  'Active Voters Today' as metric_name,
  (SELECT COUNT(DISTINCT total_voters) FROM voting_system_health WHERE metric_type = 'daily_stats')::text as metric_value,
  CASE WHEN (SELECT COUNT(DISTINCT total_voters) FROM voting_system_health WHERE metric_type = 'daily_stats') > 10 THEN 'ACTIVE'
       WHEN (SELECT COUNT(DISTINCT total_voters) FROM voting_system_health WHERE metric_type = 'daily_stats') > 0 THEN 'MODERATE'
       ELSE 'QUIET' END as status
FROM (SELECT 1) dummy -- Dummy table for single row
UNION ALL
SELECT
  'Workflow Status' as category,
  'Active Portfolios' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) > 5 THEN 'ACTIVE' WHEN COUNT(*) > 0 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM portfolio_management_status
WHERE portfolio_status != 'EMPTY'

-- System Integrity
UNION ALL
SELECT
  'System Integrity' as category,
  'Referential Integrity Violations' as metric_name,
  SUM(count)::text as metric_value,
  CASE WHEN SUM(count) = 0 THEN 'HEALTHY' WHEN SUM(count) < 10 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM referential_integrity_check
UNION ALL
SELECT
  'System Integrity' as category,
  'Triggers Fired Today' as metric_name,
  SUM(firing_count)::text as metric_value,
  CASE WHEN SUM(firing_count) > 50 THEN 'ACTIVE' WHEN SUM(firing_count) > 10 THEN 'MODERATE' ELSE 'QUIET' END as status
FROM trigger_firing_counts
WHERE last_fired >= CURRENT_DATE
UNION ALL
SELECT
  'System Integrity' as category,
  'Data Consistency Issues' as metric_name,
  COUNT(*)::text as metric_value,
  CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' WHEN COUNT(*) < 5 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM data_consistency_cross_check
WHERE status = 'INCONSISTENT'
UNION ALL
SELECT
  'System Integrity' as category,
  'Average Automation Success' as metric_name,
  ROUND(AVG(success_rate)::numeric, 1)::text || '%' as metric_value,
  CASE WHEN AVG(success_rate) >= 95 THEN 'EXCELLENT' WHEN AVG(success_rate) >= 80 THEN 'GOOD' WHEN AVG(success_rate) >= 50 THEN 'WARNING' ELSE 'CRITICAL' END as status
FROM automation_success_rates

-- Overall Health Score
UNION ALL
SELECT
  'Overall Health' as category,
  'System Health Score' as metric_name,
   ROUND(
    (
      -- Data validation (weighted 25%)
      CASE WHEN (SELECT COUNT(*) FROM credit_balance_validation WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM package_type_validation) = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM completion_percentage_accuracy WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM rating_calculation_check WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      -- Automation success (weighted 30%)
      (SELECT COALESCE(AVG(success_rate) * 0.3, 0) FROM automation_success_rates) +
      -- Trigger activity (weighted 20%)
      CASE WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 20 THEN 20
           WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 5 THEN 10
           ELSE 0 END +
      -- Integrity (weighted 15%)
      CASE WHEN (SELECT SUM(count) FROM referential_integrity_check) = 0 THEN 15 ELSE 0 END +
      -- Workflow health (weighted 10%)
      CASE WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.5 THEN 10
           WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.2 THEN 5
           ELSE 0 END
    )::numeric, 1)::text || '%' as metric_value,
   CASE WHEN ROUND(
    (
      CASE WHEN (SELECT COUNT(*) FROM credit_balance_validation WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM package_type_validation) = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM completion_percentage_accuracy WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM rating_calculation_check WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      (SELECT COALESCE(AVG(success_rate) * 0.3, 0) FROM automation_success_rates) +
      CASE WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 20 THEN 20
           WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 5 THEN 10
           ELSE 0 END +
      CASE WHEN (SELECT SUM(count) FROM referential_integrity_check) = 0 THEN 15 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.5 THEN 10
           WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.2 THEN 5
           ELSE 0 END
    )::numeric, 1) >= 85 THEN 'EXCELLENT'
  WHEN ROUND(
    (
      CASE WHEN (SELECT COUNT(*) FROM credit_balance_validation WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM package_type_validation) = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM completion_percentage_accuracy WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM rating_calculation_check WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      (SELECT COALESCE(AVG(success_rate) * 0.3, 0) FROM automation_success_rates) +
      CASE WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 20 THEN 20
           WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 5 THEN 10
           ELSE 0 END +
      CASE WHEN (SELECT SUM(count) FROM referential_integrity_check) = 0 THEN 15 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.5 THEN 10
           WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.2 THEN 5
           ELSE 0 END
    )::numeric, 1) >= 70 THEN 'GOOD'
  WHEN ROUND(
    (
      CASE WHEN (SELECT COUNT(*) FROM credit_balance_validation WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM package_type_validation) = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM completion_percentage_accuracy WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM rating_calculation_check WHERE status = 'INVALID') = 0 THEN 25 ELSE 0 END +
      (SELECT COALESCE(AVG(success_rate) * 0.3, 0) FROM automation_success_rates) +
      CASE WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 20 THEN 20
           WHEN (SELECT COUNT(*) FROM activity_logging_verification WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') > 5 THEN 10
           ELSE 0 END +
      CASE WHEN (SELECT SUM(count) FROM referential_integrity_check) = 0 THEN 15 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.5 THEN 10
           WHEN (SELECT COUNT(*) FROM user_onboarding_pipeline WHERE onboarding_stage = 'FULLY_ONBOARDED')::decimal /
                 NULLIF((SELECT COUNT(*) FROM user_onboarding_pipeline), 0) >= 0.2 THEN 5
           ELSE 0 END
    )::numeric, 1) >= 50 THEN 'WARNING'
  ELSE 'CRITICAL' END as status
FROM (SELECT 1) dummy;