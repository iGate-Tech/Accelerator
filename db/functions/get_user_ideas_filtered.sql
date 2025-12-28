-- Get User Ideas Filtered Function
-- Purpose: Advanced idea retrieval with multiple filtering options and pagination.
-- What it does: Provides comprehensive filtering by status, category, search terms with pagination.
-- When to use: Called for complex idea queries in management interfaces.
-- Dependencies: Requires ideas table.
--
-- Example Scenario 1: Filter by status and category
-- Action: get_user_ideas_filtered('user-123', 'completed', 'Technology', null, 10, 0)
-- Result: Returns first 10 completed tech ideas
--
-- Example Scenario 2: Search functionality
-- Action: get_user_ideas_filtered('user-123', null, null, 'mobile app', 20, 10)
-- Result: Returns ideas 11-30 containing 'mobile app'
--
-- Example Scenario 3: Combined filters
-- Action: get_user_ideas_filtered('user-123', 'in_progress', 'Design', 'wireframe', 5, 0)
-- Result: Returns first 5 in-progress design ideas containing 'wireframe'
--
-- Business Logic: Flexible querying with multiple filter combinations for advanced idea management.
CREATE OR REPLACE FUNCTION get_user_ideas_filtered(p_user_id UUID, p_status TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL, p_search TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    privacy TEXT,
    overall_status TEXT,
    completion_percentage INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id, i.title, i.description, i.category, i.tags, i.privacy,
        i.overall_status, i.completion_percentage, i.created_at, i.updated_at
    FROM ideas i
    WHERE i.user_id = p_user_id
        AND (p_status IS NULL OR i.overall_status = p_status)
        AND (p_category IS NULL OR i.category = p_category)
        AND (p_search IS NULL OR
            i.title ILIKE '%' || p_search || '%' OR
            i.description ILIKE '%' || p_search || '%' OR
            EXISTS (SELECT 1 FROM unnest(i.tags) t WHERE t ILIKE '%' || p_search || '%')
        )
    ORDER BY i.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;