-- Reset Views Script
-- Drops all custom views

-- Production views
DROP VIEW IF EXISTS user_dashboard_summary;
DROP VIEW IF EXISTS ideas_with_stats;
DROP VIEW IF EXISTS user_activity_feed;
DROP VIEW IF EXISTS voting_dashboard;
DROP VIEW IF EXISTS leaderboard;
DROP VIEW IF EXISTS portfolio_summary;
DROP VIEW IF EXISTS user_model_progress;
DROP VIEW IF EXISTS idea_progress_view;
DROP VIEW IF EXISTS user_preferences;
DROP VIEW IF EXISTS user_activity_feed_enhanced;
DROP VIEW IF EXISTS ideas_with_full_stats;
DROP VIEW IF EXISTS user_dashboard_comprehensive;
DROP VIEW IF EXISTS user_achievements;
DROP VIEW IF EXISTS automated_leaderboards;
DROP VIEW IF EXISTS idea_recommendations;
DROP VIEW IF EXISTS system_health_dashboard;
DROP VIEW IF EXISTS query_performance_monitoring;
DROP VIEW IF EXISTS user_onboarding_status;

-- Testing views
DROP VIEW IF EXISTS credit_balance_validation;
DROP VIEW IF EXISTS package_type_validation;
DROP VIEW IF EXISTS completion_percentage_accuracy;
DROP VIEW IF EXISTS rating_calculation_check;
DROP VIEW IF EXISTS activity_logging_verification;
DROP VIEW IF EXISTS notification_creation_check;
DROP VIEW IF EXISTS credit_transaction_effects;
DROP VIEW IF EXISTS model_section_completion_tracking;
DROP VIEW IF EXISTS vote_rating_updates;
DROP VIEW IF EXISTS reward_distribution_monitor;
DROP VIEW IF EXISTS model_unlocking_status;
DROP VIEW IF EXISTS daily_first_vote_tracking;
DROP VIEW IF EXISTS validation_threshold_progress;
DROP VIEW IF EXISTS user_onboarding_pipeline;
DROP VIEW IF EXISTS idea_development_workflow;
DROP VIEW IF EXISTS voting_system_health;
DROP VIEW IF EXISTS portfolio_management_status;
DROP VIEW IF EXISTS referential_integrity_check;
DROP VIEW IF EXISTS trigger_firing_counts;
DROP VIEW IF EXISTS automation_success_rates;
DROP VIEW IF EXISTS data_consistency_cross_check;
DROP VIEW IF EXISTS testing_dashboard;