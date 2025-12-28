-- Setup Voting and Rewards Functions
-- Voting system and rewards functions

-- Include individual voting function files
\i db/functions/process_vote_transaction.sql
\i db/functions/calculate_voting_rewards.sql
\i db/functions/distribute_pending_rewards.sql
\i db/functions/validate_and_cast_vote.sql
\i db/functions/get_leaderboard_data.sql