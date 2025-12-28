-- Core Functions Setup
-- Fundamental utility functions used throughout the application
-- These provide the basic building blocks for all other functionality
--
-- FUNCTIONS INCLUDED (10 total):
-- - calculate_completion_percentage: Progress calculation for ideas
-- - cast_vote: Voting system with validation
-- - deduct_credits_for_generation: Credit debit for AI usage
-- - add_credits: Credit addition for rewards/purchases
-- - create_notification: User notification system
-- - log_activity: Audit trail and activity tracking
-- - distribute_voting_rewards: Reward distribution logic
-- - complete_model_section: Progress tracking updates
-- - create_idea: Idea creation with validation
-- - update_idea_status: Workflow state management
--
-- DEPENDENCY LEVEL: Foundational
-- These functions are used by almost all other functions and triggers

-- Include individual core function files
\i db/functions/calculate_completion_percentage.sql
\i db/functions/cast_vote.sql
\i db/functions/deduct_credits_for_generation.sql
\i db/functions/add_credits.sql
\i db/functions/create_notification.sql
\i db/functions/log_activity.sql
\i db/functions/distribute_voting_rewards.sql
\i db/functions/complete_model_section.sql
\i db/functions/create_idea.sql
\i db/functions/update_idea_status.sql