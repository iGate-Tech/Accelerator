-- Complete Model Section Function
-- Purpose: Marks individual model sections as completed.
-- What it does: Updates section completion status with validation.
-- When to use: Called when users complete sections within models.
-- Dependencies: Requires model_sections, model_instances tables.
--
-- Example Scenario 1: Complete section
-- Action: complete_model_section('user-123', 'section-456')
-- Result: Marks section as completed if user has access
--
-- Business Logic: Tracks granular progress within model workflows.
CREATE OR REPLACE FUNCTION complete_model_section(p_user_id UUID, p_section_id UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE model_sections
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = p_section_id
    AND EXISTS(
        SELECT 1 FROM model_instances mi
        WHERE mi.id = model_sections.model_instance_id
        AND mi.user_id = p_user_id
    );

    IF FOUND THEN
        RETURN json_build_object('success', true, 'section_id', p_section_id);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Section not found or access denied');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;