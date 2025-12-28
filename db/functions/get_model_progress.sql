-- Get Model Progress Function
-- Purpose: Retrieves user's progress across all or specific model types.
-- What it does: Aggregates completion statistics for model instances.
-- When to use: Called for progress tracking and dashboard displays.
-- Dependencies: Requires model_instances, model_sections tables.
--
-- Example Scenario 1: All models progress
-- Action: get_model_progress('user-123')
-- Result: Returns progress for all user's model types
--
-- Example Scenario 2: Specific model progress
-- Action: get_model_progress('user-123', 'canvas')
-- Result: Returns progress for canvas model only
--
-- Business Logic: Provides comprehensive progress tracking for learning analytics.
CREATE OR REPLACE FUNCTION get_model_progress(p_user_id UUID, p_model_type TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    progress_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'model_type', model_type,
            'total_instances', COUNT(*),
            'completed_instances', COUNT(CASE WHEN status = 'completed' THEN 1 END),
            'total_sections', SUM(total_sections),
            'completed_sections', SUM(completed_sections),
            'completion_percentage', ROUND(
                (SUM(completed_sections)::decimal / NULLIF(SUM(total_sections), 0)) * 100, 1
            )
        )
    ) INTO progress_data
    FROM (
        SELECT
            mi.model_type,
            COUNT(*) as total_sections,
            COUNT(CASE WHEN ms.is_completed THEN 1 END) as completed_sections
        FROM model_instances mi
        LEFT JOIN model_sections ms ON mi.id = ms.model_instance_id
        WHERE mi.user_id = p_user_id
        AND (p_model_type IS NULL OR mi.model_type = p_model_type)
        GROUP BY mi.id, mi.model_type
    ) progress
    GROUP BY model_type;

    RETURN json_build_object(
        'user_id', p_user_id,
        'model_type_filter', p_model_type,
        'progress', COALESCE(progress_data, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;