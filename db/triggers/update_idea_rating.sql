-- Idea Rating Update Trigger
-- Purpose: Automatically updates idea ratings whenever votes are cast, changed, or removed.
-- What it does: Recalculates the average rating for an idea from all its votes and updates the idea's rating field.
-- When it fires: AFTER INSERT, UPDATE, or DELETE on votes table.
-- Dependencies: None - uses built-in AVG() aggregation.
--
-- Example Scenario 1: New vote added
-- Before: idea-123 has 2 votes with average rating 4.0
-- Action: User votes 5.0 on idea-123
-- After: Trigger fires, rating updated to ((4.0 + 4.0 + 5.0) / 3) = 4.33
--
-- Example Scenario 2: Vote removed
-- Before: idea-123 has 3 votes with average rating 4.33
-- Action: User removes their 3.0 vote
-- After: Trigger fires, rating updated to ((4.0 + 4.0 + 5.0) / 3) = 4.33 (wait, that doesn't change)
-- Better example: Remove 3.0 vote, new average ((4.0 + 5.0) / 2) = 4.5
--
-- Example Scenario 3: Vote rating changed
-- Before: idea-123 has vote rating 3.0 from user
-- Action: User changes their vote from 3.0 to 5.0
-- After: Trigger fires, rating recalculated with new vote value
--
-- Business Logic: Ensures idea ratings always reflect current community sentiment,
-- supporting accurate ranking and recommendation algorithms.
CREATE OR REPLACE FUNCTION update_idea_rating() RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate average rating for the idea
  SELECT ROUND(AVG(rating)::numeric, 2) INTO avg_rating FROM votes WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id);

  -- Update the idea's rating
  UPDATE ideas SET rating = avg_rating WHERE id = COALESCE(NEW.idea_id, OLD.idea_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_idea_rating
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_idea_rating();