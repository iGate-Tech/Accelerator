-- Update Idea Workflow Function
-- Purpose: Updates idea status and related fields as part of workflow progression.
-- What it does: Handles status changes with optional additional field updates and validation.
-- When to use: Called during idea workflow transitions (draft → in_progress → completed).
-- Dependencies: Requires ideas table, validate_idea_access function.
--
-- Example Scenario 1: Status progression
-- Action: update_idea_workflow('idea-123', 'user-456', 'in_progress', '{"completion_percentage": 25}')
-- Result: Updates status to in_progress and completion to 25%
--
-- Example Scenario 2: Completion
-- Action: update_idea_workflow('idea-123', 'user-456', 'completed')
-- Result: Marks idea as completed, triggers may unlock models
--
-- Example Scenario 3: Unauthorized update
-- Action: update_idea_workflow('idea-789', 'user-wrong', 'completed')
-- Result: Returns error: 'Access denied'
--
-- Business Logic: Manages idea lifecycle with access control and workflow validation.
CREATE OR REPLACE FUNCTION update_idea_workflow(p_idea_id UUID, p_user_id UUID, p_status TEXT DEFAULT NULL, p_updates JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    current_status TEXT;
BEGIN
    -- Validate access
    IF NOT validate_idea_access(p_user_id, p_idea_id) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;

    -- Get current status
    SELECT overall_status INTO current_status FROM ideas WHERE id = p_idea_id;

    -- Validate status transition (optional business rule)
    IF p_status IS NOT NULL AND p_status NOT IN ('draft', 'in_progress', 'completed', 'archived') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid status');
    END IF;

    -- Update idea
    UPDATE ideas SET
        overall_status = COALESCE(p_status, overall_status),
        completion_percentage = COALESCE((p_updates->>'completion_percentage')::INTEGER, completion_percentage),
        updated_at = NOW()
    WHERE id = p_idea_id;

    -- Log activity
    PERFORM log_activity(p_user_id, 'workflow_update', 'idea', p_idea_id,
        json_build_object('old_status', current_status, 'new_status', p_status, 'updates', p_updates));

    RETURN json_build_object(
        'success', true,
        'idea_id', p_idea_id,
        'old_status', current_status,
        'new_status', p_status,
        'message', 'Idea workflow updated'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;