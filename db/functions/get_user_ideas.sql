-- Get User Ideas Function
-- Purpose: Retrieves filtered and paginated list of ideas for a specific user.
-- What it does: Returns user's ideas with advanced filtering and pagination support.
-- When to use: Called for user dashboards, idea management interfaces, and API endpoints.
-- Dependencies: Requires ideas table.
--
-- Example Scenario 1: Get all user's ideas
-- Action: get_user_ideas('user-123', '{}', '{}')
-- Result: Returns JSON with all user's ideas, pagination info
--
-- Example Scenario 2: Filter by status
-- Action: get_user_ideas('user-123', '{"status": "completed"}', '{"limit": 10}')
-- Result: Returns first 10 completed ideas for user
--
-- Example Scenario 3: Search and filter
-- Action: get_user_ideas('user-123', '{"search": "mobile", "category": "Tech"}', '{"limit": 5, "offset": 0}')
-- Result: Returns 5 ideas containing "mobile" in Tech category
--
-- Business Logic: Provides flexible idea retrieval with multiple filter options and efficient pagination.
CREATE OR REPLACE FUNCTION get_user_ideas(p_user_id UUID, p_filters JSONB DEFAULT '{}', p_pagination JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    query_text TEXT;
    count_query TEXT;
    result_data JSON;
    total_count INTEGER;
    limit_val INTEGER := 50;
    offset_val INTEGER := 0;
BEGIN
    -- Parse pagination
    limit_val := COALESCE((p_pagination->>'limit')::INTEGER, 50);
    offset_val := COALESCE((p_pagination->>'offset')::INTEGER, 0);

    -- Build dynamic query
    query_text := 'SELECT json_agg(row_to_json(i)) FROM (
        SELECT id, title, description, category, tags, privacy, overall_status,
               completion_percentage, created_at, updated_at
        FROM ideas
        WHERE user_id = $1';

    -- Add filters
    IF p_filters->>'status' IS NOT NULL THEN
        query_text := query_text || ' AND overall_status = ' || quote_literal(p_filters->>'status');
    END IF;

    IF p_filters->>'category' IS NOT NULL THEN
        query_text := query_text || ' AND category = ' || quote_literal(p_filters->>'category');
    END IF;

    IF p_filters->>'privacy' IS NOT NULL THEN
        query_text := query_text || ' AND privacy = ' || quote_literal(p_filters->>'privacy');
    END IF;

    IF p_filters->>'search' IS NOT NULL THEN
        query_text := query_text || ' AND (title ILIKE ' || quote_literal('%' || p_filters->>'search' || '%') ||
                    ' OR description ILIKE ' || quote_literal('%' || p_filters->>'search' || '%') || ')';
    END IF;

    query_text := query_text || ' ORDER BY created_at DESC LIMIT ' || limit_val || ' OFFSET ' || offset_val || ') i';

    -- Execute query
    EXECUTE query_text INTO result_data USING p_user_id;

    -- Get total count
    count_query := 'SELECT COUNT(*) FROM ideas WHERE user_id = $1';

    IF p_filters->>'status' IS NOT NULL THEN
        count_query := count_query || ' AND overall_status = ' || quote_literal(p_filters->>'status');
    END IF;

    IF p_filters->>'category' IS NOT NULL THEN
        count_query := count_query || ' AND category = ' || quote_literal(p_filters->>'category');
    END IF;

    IF p_filters->>'privacy' IS NOT NULL THEN
        count_query := count_query || ' AND privacy = ' || quote_literal(p_filters->>'privacy');
    END IF;

    IF p_filters->>'search' IS NOT NULL THEN
        count_query := count_query || ' AND (title ILIKE ' || quote_literal('%' || p_filters->>'search' || '%') ||
                    ' OR description ILIKE ' || quote_literal('%' || p_filters->>'search' || '%') || ')';
    END IF;

    EXECUTE count_query INTO total_count USING p_user_id;

    RETURN json_build_object(
        'ideas', COALESCE(result_data, '[]'::JSON),
        'total_count', total_count,
        'pagination', json_build_object(
            'limit', limit_val,
            'offset', offset_val,
            'has_more', (offset_val + limit_val) < total_count
        ),
        'filters', p_filters
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;