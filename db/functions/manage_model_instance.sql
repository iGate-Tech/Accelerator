-- Manage Model Instance Function
-- Purpose: Handles model instance lifecycle (create, start, complete).
-- What it does: Manages AI model instances for users with access validation.
-- When to use: Called for model workflow operations.
-- Dependencies: Requires model_instances, ideas tables.
--
-- Example Scenario 1: Start new model
-- Action: manage_model_instance('user-123', 'idea-456', 'canvas', 'create')
-- Result: Creates new model instance for user
--
-- Business Logic: Controls access to different AI models based on user permissions.
CREATE OR REPLACE FUNCTION manage_model_instance(p_user_id UUID, p_idea_id UUID, p_model_type TEXT, p_action TEXT)
RETURNS JSON AS $$
DECLARE
    model_id UUID;
BEGIN
    CASE p_action
        WHEN 'create' THEN
            -- Validate access
            IF NOT EXISTS(SELECT 1 FROM ideas WHERE id = p_idea_id AND user_id = p_user_id) THEN
                RETURN json_build_object('success', false, 'error', 'Access denied');
            END IF;

            -- Create model instance
            INSERT INTO model_instances (user_id, idea_id, model_type, status)
            VALUES (p_user_id, p_idea_id, p_model_type, 'active')
            RETURNING id INTO model_id;

            RETURN json_build_object('success', true, 'model_id', model_id, 'action', 'created');

        WHEN 'complete' THEN
            UPDATE model_instances
            SET status = 'completed', completed_at = NOW()
            WHERE id = p_idea_id AND user_id = p_user_id;

            RETURN json_build_object('success', true, 'action', 'completed');

        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;