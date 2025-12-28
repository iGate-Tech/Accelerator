-- Reset Functions Script
-- Drops all custom functions

-- Core functions
DROP FUNCTION IF EXISTS calculate_completion_percentage(uuid);
DROP FUNCTION IF EXISTS cast_vote(uuid,uuid,integer);
DROP FUNCTION IF EXISTS deduct_credits_for_generation(uuid,integer,jsonb);
DROP FUNCTION IF EXISTS add_credits(uuid,integer,text,jsonb);
DROP FUNCTION IF EXISTS create_notification(uuid,text,text);
DROP FUNCTION IF EXISTS log_activity(uuid,text,text,uuid,jsonb);
DROP FUNCTION IF EXISTS distribute_voting_rewards(uuid);
DROP FUNCTION IF EXISTS complete_model_section_void(uuid,uuid);
DROP FUNCTION IF EXISTS create_idea(uuid,text,text,text);
DROP FUNCTION IF EXISTS update_idea_status(uuid,uuid,text);

-- User management functions
DROP FUNCTION IF EXISTS manage_user_profile(uuid,text,jsonb);
DROP FUNCTION IF EXISTS handle_user_registration(uuid,jsonb);
DROP FUNCTION IF EXISTS update_user_package(uuid,text,jsonb);
DROP FUNCTION IF EXISTS load_user_context(uuid);

-- Credit system functions
DROP FUNCTION IF EXISTS process_credit_transaction(uuid,text,integer,jsonb);
DROP FUNCTION IF EXISTS calculate_credit_balance(uuid);
DROP FUNCTION IF EXISTS validate_credit_operation(uuid,integer);
DROP FUNCTION IF EXISTS get_credit_history(uuid,integer,integer);
DROP FUNCTION IF EXISTS get_user_credit_info(uuid);
DROP FUNCTION IF EXISTS process_ai_generation(uuid,integer,jsonb);
DROP FUNCTION IF EXISTS process_credit_purchase(uuid,integer,jsonb);

-- Idea management functions
DROP FUNCTION IF EXISTS generate_idea_slug(text);
DROP FUNCTION IF EXISTS manage_idea(uuid,text,jsonb);
DROP FUNCTION IF EXISTS validate_idea_access(uuid,uuid);
DROP FUNCTION IF EXISTS get_user_ideas(uuid,jsonb,jsonb);
DROP FUNCTION IF EXISTS validate_and_create_idea(uuid,text,text,text,text[],text);
DROP FUNCTION IF EXISTS update_idea_workflow(uuid,uuid,text,jsonb);
DROP FUNCTION IF EXISTS get_user_ideas_filtered(uuid,text,text,text,integer,integer);

-- Voting and rewards functions
DROP FUNCTION IF EXISTS process_vote_transaction(uuid,uuid,integer);
DROP FUNCTION IF EXISTS calculate_voting_rewards(uuid);
DROP FUNCTION IF EXISTS distribute_pending_rewards();
DROP FUNCTION IF EXISTS validate_and_cast_vote(uuid,uuid,integer);
DROP FUNCTION IF EXISTS get_leaderboard_data();

-- Model management functions
DROP FUNCTION IF EXISTS manage_model_instance(uuid,uuid,text,text);
DROP FUNCTION IF EXISTS validate_model_access(uuid,uuid);
DROP FUNCTION IF EXISTS complete_model_section(uuid,uuid);
DROP FUNCTION IF EXISTS get_model_progress(uuid,text);
DROP FUNCTION IF EXISTS complete_section_workflow(uuid,uuid);

-- Portfolio management functions
DROP FUNCTION IF EXISTS manage_portfolio(uuid,text,jsonb);