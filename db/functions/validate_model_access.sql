-- Validate Model Access Function
-- Purpose: Checks if user can access specific model instances.
-- What it does: Validates ownership and access permissions for model instances.
-- When to use: Called before model operations.
-- Dependencies: Requires model_instances table.
--
-- Example Scenario 1: Owner access
-- Action: validate_model_access('user-123', 'model-456') -- user owns the model
-- Result: Returns true
--
-- Example Scenario 2: Unauthorized access
-- Action: validate_model_access('user-789', 'model-456') -- user doesn't own
-- Result: Returns false
--
-- Business Logic: Enforces model ownership and access control.
CREATE OR REPLACE FUNCTION validate_model_access(p_user_id UUID, p_model_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM model_instances
        WHERE id = p_model_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;