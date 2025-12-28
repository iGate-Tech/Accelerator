-- Reset Triggers Script
-- Drops all custom triggers and their functions

-- Core validation triggers
DROP TRIGGER IF EXISTS trigger_update_completion ON model_sections;
DROP TRIGGER IF EXISTS trigger_update_idea_rating ON votes;
DROP TRIGGER IF EXISTS trigger_check_credit_balance ON profiles;
DROP TRIGGER IF EXISTS trigger_check_package_type ON profiles;
DROP TRIGGER IF EXISTS trigger_prevent_negative_credit_transaction ON credit_transactions;
DROP TRIGGER IF EXISTS trigger_notify_on_vote ON votes;
DROP TRIGGER IF EXISTS trigger_log_idea_changes ON ideas;
DROP TRIGGER IF EXISTS trigger_update_credit_balance ON credit_transactions;
DROP TRIGGER IF EXISTS trigger_log_section_completion ON model_sections;

-- Auto-logging triggers
DROP TRIGGER IF EXISTS trigger_auto_log_ideas ON ideas;
DROP TRIGGER IF EXISTS trigger_auto_log_votes ON votes;
DROP TRIGGER IF EXISTS trigger_auto_log_favorites ON user_favorites;

-- Auto-notification triggers
DROP TRIGGER IF EXISTS trigger_auto_notifications_votes ON votes;
DROP TRIGGER IF EXISTS trigger_auto_notifications_favorites ON user_favorites;
DROP TRIGGER IF EXISTS trigger_auto_notifications_credits ON credit_transactions;

-- Reward and automation triggers
DROP TRIGGER IF EXISTS trigger_auto_vote_rewards ON votes;
DROP TRIGGER IF EXISTS trigger_daily_first_vote_bonus ON votes;
DROP TRIGGER IF EXISTS trigger_auto_model_unlocking ON ideas;
DROP TRIGGER IF EXISTS trigger_milestone_achievements ON credit_transactions;

-- Drop all trigger functions
DROP FUNCTION IF EXISTS update_completion_on_section_change();
DROP FUNCTION IF EXISTS update_idea_rating();
DROP FUNCTION IF EXISTS check_credit_balance();
DROP FUNCTION IF EXISTS check_package_type();
DROP FUNCTION IF EXISTS prevent_negative_credit_transaction();
DROP FUNCTION IF EXISTS notify_on_vote();
DROP FUNCTION IF EXISTS log_idea_changes();
DROP FUNCTION IF EXISTS update_credit_balance();
DROP FUNCTION IF EXISTS log_section_completion();
DROP FUNCTION IF EXISTS auto_log_activities();
DROP FUNCTION IF EXISTS auto_create_notifications();
DROP FUNCTION IF EXISTS auto_reward_vote_credits();
DROP FUNCTION IF EXISTS auto_reward_daily_first_vote();
DROP FUNCTION IF EXISTS auto_unlock_models();
DROP FUNCTION IF EXISTS auto_milestone_achievements();