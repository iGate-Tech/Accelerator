-- Reset Triggers Script
-- Drops all custom triggers and their functions

DROP TRIGGER IF EXISTS update_completion_on_section_change ON model_sections;
DROP TRIGGER IF EXISTS update_idea_rating ON votes;
DROP TRIGGER IF EXISTS check_credit_balance ON credit_transactions;
DROP TRIGGER IF EXISTS check_package_type ON profiles;
DROP TRIGGER IF EXISTS prevent_negative_credit_transaction ON credit_transactions;
DROP TRIGGER IF EXISTS notify_on_vote ON votes;
DROP TRIGGER IF EXISTS log_idea_changes ON ideas;
DROP TRIGGER IF EXISTS update_credit_balance ON credit_transactions;
DROP TRIGGER IF EXISTS log_section_completion ON model_sections;
DROP TRIGGER IF EXISTS auto_log_activities ON ideas;
DROP TRIGGER IF EXISTS auto_create_notifications ON credit_transactions;
DROP TRIGGER IF EXISTS auto_reward_vote_credits ON votes;
DROP TRIGGER IF EXISTS auto_reward_daily_first_vote ON votes;
DROP TRIGGER IF EXISTS auto_unlock_models ON model_sections;
DROP TRIGGER IF EXISTS auto_milestone_achievements ON profiles;

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