-- Daily First Vote Bonus Trigger
-- Purpose: Awards bonus credits to users for casting their first vote each day.
-- What it does: Checks if user has voted today, awards 10 bonus credits if it's their first vote.
-- When it fires: AFTER INSERT on votes table.
-- Dependencies: Requires process_credit_transaction() function.
--
-- Example Scenario 1: First vote of the day (BONUS AWARDED)
-- Before: user-123 has not voted today, has 25 credits
-- Action: user-123 casts first vote at 9:00 AM
-- After: Bonus transaction created: user-123 gains 10 credits, balance becomes 35
--
-- Example Scenario 2: Second vote of the day (NO BONUS)
-- Before: user-123 voted once today, has 35 credits
-- Action: user-123 casts second vote at 2:00 PM
-- After: No bonus (already received daily bonus)
--
-- Example Scenario 3: Vote on next day (BONUS AWARDED)
-- Before: user-123 last voted yesterday, has 35 credits
-- Action: user-123 votes first time today
-- After: Bonus transaction created: user-123 gains another 10 credits, balance becomes 45
--
-- Business Logic: Encourages daily engagement by rewarding consistent participation.
-- The bonus applies only to the first vote each calendar day, promoting regular activity.
CREATE OR REPLACE FUNCTION auto_reward_daily_first_vote() RETURNS TRIGGER AS $$
DECLARE
  has_voted_today BOOLEAN;
BEGIN
  -- Check if user has voted today already
  SELECT EXISTS(
    SELECT 1 FROM votes
    WHERE user_id = NEW.user_id
    AND DATE(created_at) = CURRENT_DATE
    AND id != NEW.id -- Exclude current vote
  ) INTO has_voted_today;

  -- If first vote today, give bonus credits
  IF NOT has_voted_today THEN
    PERFORM process_credit_transaction(
      NEW.user_id,
      'daily_first_vote',
      10, -- 10 bonus credits for first daily vote
      json_build_object('date', CURRENT_DATE)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_first_vote_bonus
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_reward_daily_first_vote();