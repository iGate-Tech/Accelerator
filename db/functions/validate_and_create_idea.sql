-- Validate and Create Idea Function
-- Purpose: Creates a new idea with comprehensive validation and automatic slug generation.
-- What it does: Validates input, generates unique slug, creates idea with all metadata.
-- When to use: Called for new idea creation with full validation requirements.
-- Dependencies: Requires generate_idea_slug function.
--
-- Example Scenario 1: Valid idea creation
-- Action: validate_and_create_idea('user-123', 'My Great App', 'An amazing app', 'Technology', '{web,mobile}', 'public')
-- Result: Returns JSON with success and new idea details
--
-- Example Scenario 2: Missing required fields
-- Action: validate_and_create_idea('user-123', '', 'Description here', 'Tech', '{}', 'private')
-- Result: Returns error JSON: 'Title cannot be empty'
--
-- Example Scenario 3: Duplicate slug handling
-- Action: validate_and_create_idea('user-123', 'My App', 'Desc', 'Tech', '{}', 'private')
-- Result: Creates idea with slug 'my-app' (or 'my-app-1' if exists)
--
-- Business Logic: Ensures data integrity with validation, automatic slug generation, and proper defaults.
CREATE OR REPLACE FUNCTION validate_and_create_idea(p_user_id UUID, p_title TEXT, p_description TEXT, p_category TEXT DEFAULT 'Other', p_tags TEXT[] DEFAULT '{}', p_privacy TEXT DEFAULT 'private')
RETURNS JSON AS $$
DECLARE
    new_idea_id UUID;
    slug_text TEXT;
BEGIN
    -- Validate required fields
    IF p_title IS NULL OR trim(p_title) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Title cannot be empty');
    END IF;

    IF p_description IS NULL OR trim(p_description) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Description cannot be empty');
    END IF;

    -- Validate privacy setting
    IF p_privacy NOT IN ('public', 'private') THEN
        RETURN json_build_object('success', false, 'error', 'Privacy must be public or private');
    END IF;

    -- Generate unique slug
    slug_text := generate_idea_slug(p_title);

    -- Create idea
    INSERT INTO ideas (
        user_id, title, description, category, tags, privacy, slug
    ) VALUES (
        p_user_id, trim(p_title), trim(p_description), p_category, p_tags, p_privacy, slug_text
    ) RETURNING id INTO new_idea_id;

    -- Log activity
    PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id,
        json_build_object('title', p_title, 'category', p_category, 'privacy', p_privacy));

    RETURN json_build_object(
        'success', true,
        'idea_id', new_idea_id,
        'slug', slug_text,
        'message', 'Idea created successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;