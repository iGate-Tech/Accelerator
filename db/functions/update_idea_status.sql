-- Update Idea Status Function
-- Purpose: Updates the overall status of an idea with access control and activity logging.
-- What it does: Changes idea status and logs the status change.
-- When to use: Called when users update their idea status (draft, in_progress, completed).
-- Dependencies: Requires ideas table and log_activity function.
--
-- Example Scenario 1: Status progression
-- Before: Idea is in 'draft' status
-- Action: update_idea_status('550e8400-e29b-41d4-a716-446655440000', 'user-123', 'in_progress')
-- Result: Status updated to 'in_progress', activity logged with new status
--
-- Example Scenario 2: Completion
-- Before: Idea is in 'in_progress' status
-- Action: update_idea_status('550e8400-e29b-41d4-a716-446655440001', 'user-123', 'completed')
-- Result: Status updated to 'completed', activity logged
--
-- Example Scenario 3: Unauthorized update (no effect)
-- Before: User tries to update another user's idea
-- Action: update_idea_status('550e8400-e29b-41d4-a716-446655440002', 'user-456', 'completed')
-- Result: No update (user_id check fails)
--
-- Business Logic: Includes ownership validation and activity logging for status changes.
CREATE OR REPLACE FUNCTION update_idea_status(p_idea_id UUID, p_user_id UUID, p_status TEXT) RETURNS VOID AS $$
BEGIN
  UPDATE ideas SET overall_status = p_status, updated_at = NOW()
  WHERE id = p_idea_id AND user_id = p_user_id;

  -- Log activity
  PERFORM log_activity(p_user_id, 'update_status', 'idea', p_idea_id, jsonb_build_object('new_status', p_status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;