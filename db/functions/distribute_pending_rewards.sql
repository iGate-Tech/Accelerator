-- Distribute Pending Rewards Function
-- Purpose: Processes and distributes accumulated voting rewards to users.
-- What it does: Finds pending rewards and credits them to user accounts.
-- When to use: Called by scheduled jobs or after idea milestones.
-- Dependencies: Requires voting_rewards table, add_credits function.
--
-- Example Scenario 1: Process pending rewards
-- Before: 15 pending voting rewards in queue
-- Action: distribute_pending_rewards()
-- Result: Credits distributed to users, rewards marked as distributed
--
-- Business Logic: Batch processes reward distribution to avoid real-time performance issues.
CREATE OR REPLACE FUNCTION distribute_pending_rewards()
RETURNS JSON AS $$
DECLARE
    processed_count INTEGER := 0;
    total_amount INTEGER := 0;
    reward_record RECORD;
BEGIN
    FOR reward_record IN
        SELECT * FROM voting_rewards
        WHERE distributed_at IS NULL
        ORDER BY created_at ASC
    LOOP
        -- Add credits to voter
        PERFORM add_credits(
            reward_record.voter_id,
            reward_record.reward_amount,
            'reward_earned',
            json_build_object('source', 'voting', 'idea_id', reward_record.idea_id)
        );

        -- Mark as distributed
        UPDATE voting_rewards
        SET distributed_at = NOW()
        WHERE id = reward_record.id;

        processed_count := processed_count + 1;
        total_amount := total_amount + reward_record.reward_amount;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'rewards_processed', processed_count,
        'total_amount_distributed', total_amount,
        'message', format('Processed %s rewards totaling %s credits', processed_count, total_amount)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;