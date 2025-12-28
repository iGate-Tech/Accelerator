-- Complete Model Section Function
-- Purpose: Marks a model section as completed for a user.
-- What it does: Updates the section completion status with access validation.
-- When to use: Called when users complete sections in their model workflows.
-- Dependencies: Requires model_sections and model_instances tables.
--
-- Example Scenario 1: Valid section completion
-- Before: Section is not completed, user owns the model instance
-- Action: complete_model_section_void('550e8400-e29b-41d4-a716-446655440000', 'user-123')
-- Result: Section marked as completed, updated_at timestamp set
--
-- Example Scenario 2: Unauthorized access (no update)
-- Before: User tries to complete section from another user's model
-- Action: complete_model_section_void('550e8400-e29b-41d4-a716-446655440001', 'user-456')
-- Result: No update performed (access check fails)
--
-- Business Logic: Includes ownership validation to prevent users from completing others' sections.
CREATE OR REPLACE FUNCTION complete_model_section_void(p_section_id UUID, p_user_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE model_sections SET is_completed = TRUE, updated_at = NOW()
  WHERE id = p_section_id AND EXISTS (
    SELECT 1 FROM model_instances WHERE id = model_instance_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;