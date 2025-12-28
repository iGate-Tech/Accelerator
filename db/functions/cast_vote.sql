-- Cast Vote Function
-- Purpose: Allows users to vote on ideas, handling both new votes and vote updates.
-- What it does: Inserts or updates a vote record, with rating recalculation handled by triggers.
-- When to use: Called when users submit votes through the UI.
-- Dependencies: Requires votes table, triggers handle rating updates.
--
-- Example Scenario 1: New vote on an idea
-- Before: User has never voted on idea-123
-- Action: cast_vote('550e8400-e29b-41d4-a716-446655440000', 'user-456', 4)
-- Result: New vote record created with rating 4, idea rating updated by trigger
--
-- Example Scenario 2: Changing existing vote
-- Before: User previously voted 3 on idea-123
-- Action: cast_vote('550e8400-e29b-41d4-a716-446655440000', 'user-456', 5)
-- Result: Existing vote updated to rating 5, idea rating recalculated
--
-- Business Logic: Uses ON CONFLICT to handle vote updates, ensuring one vote per user per idea.
-- Rating recalculation is deferred to triggers for consistency.
CREATE OR REPLACE FUNCTION cast_vote(p_idea_id UUID, p_user_id UUID, p_rating INTEGER) RETURNS VOID AS $$
BEGIN
  -- Insert vote
  INSERT INTO votes (idea_id, user_id, rating) VALUES (p_idea_id, p_user_id, p_rating)
  ON CONFLICT (idea_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;

  -- Rating update is handled by trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;