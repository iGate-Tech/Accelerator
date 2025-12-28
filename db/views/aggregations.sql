-- Database Views for Simplified Queries
-- These views consolidate common data patterns to reduce complex JOINs in application code

\i db/views/user_dashboard_summary.sql
\i db/views/ideas_with_stats.sql
\i db/views/user_activity_feed.sql
\i db/views/voting_dashboard.sql
\i db/views/leaderboard.sql
\i db/views/portfolio_summary.sql
\i db/views/user_model_progress.sql
\i db/views/idea_progress_view.sql
\i db/views/user_preferences.sql
\i db/views/user_activity_feed_enhanced.sql
\i db/views/ideas_with_full_stats.sql
\i db/views/user_dashboard_comprehensive.sql
\i db/views/user_achievements.sql
\i db/views/automated_leaderboards.sql
\i db/views/idea_recommendations.sql
\i db/views/system_health_dashboard.sql
\i db/views/query_performance_monitoring.sql
\i db/views/user_onboarding_status.sql

-- Testing Views for System Validation and Monitoring
-- These views provide comprehensive testing and monitoring of all triggers, workflows, and automations

-- Data Validation Views
\i db/views/testing-views/credit_balance_validation.sql
\i db/views/testing-views/package_type_validation.sql
\i db/views/testing-views/completion_percentage_accuracy.sql
\i db/views/testing-views/rating_calculation_check.sql

-- Trigger Effect Verification Views
\i db/views/testing-views/activity_logging_verification.sql
\i db/views/testing-views/notification_creation_check.sql
\i db/views/testing-views/credit_transaction_effects.sql
\i db/views/testing-views/model_section_completion_tracking.sql
\i db/views/testing-views/vote_rating_updates.sql

-- Automation Test Views
\i db/views/testing-views/reward_distribution_monitor.sql
\i db/views/testing-views/model_unlocking_status.sql
\i db/views/testing-views/daily_first_vote_tracking.sql
\i db/views/testing-views/validation_threshold_progress.sql

-- Workflow Status Views
\i db/views/testing-views/user_onboarding_pipeline.sql
\i db/views/testing-views/idea_development_workflow.sql
\i db/views/testing-views/voting_system_health.sql
\i db/views/testing-views/portfolio_management_status.sql

-- System Integrity Views
\i db/views/testing-views/referential_integrity_check.sql
\i db/views/testing-views/trigger_firing_counts.sql
\i db/views/testing-views/automation_success_rates.sql
\i db/views/testing-views/data_consistency_cross_check.sql

-- Testing Dashboard - Comprehensive System Health Overview
\i db/views/testing-views/testing_dashboard.sql