-- Manage Idea Function
-- Purpose: Comprehensive idea management with support for create, read, update, delete operations.
-- What it does: Routes different idea operations (CRUD) with proper validation and logging.
-- When to use: Called for all idea management operations through the application.
-- Dependencies: Requires ideas table, generate_idea_slug, validate_idea_access, log_activity functions.
--
-- Example Scenario 1: Create new idea
-- Action: manage_idea('user-123', 'create', '{"title": "My App", "description": "Great app", "category": "Tech"}')
-- Result: Returns JSON with new idea details and success status
--
-- Example Scenario 2: Update existing idea
-- Action: manage_idea('user-123', 'update', '{"id": "idea-456", "title": "Updated Title"}')
-- Result: Updates idea if user has access, logs activity
--
-- Example Scenario 3: Delete idea
-- Action: manage_idea('user-123', 'delete', '{"id": "idea-456"}')
-- Result: Deletes idea if user owns it, logs deletion
--
-- Business Logic: Centralized idea management with access control and comprehensive logging.
CREATE OR REPLACE FUNCTION manage_idea(p_user_id UUID, p_action TEXT, p_idea_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    new_idea_id UUID;
    slug_text TEXT;
    idea_record RECORD;
BEGIN
    CASE p_action
        WHEN 'create' THEN
            -- Validate required fields
            IF p_idea_data->>'title' IS NULL OR trim(p_idea_data->>'title') = '' THEN
                RETURN json_build_object('success', false, 'error', 'Title is required');
            END IF;

            IF p_idea_data->>'description' IS NULL OR trim(p_idea_data->>'description') = '' THEN
                RETURN json_build_object('success', false, 'error', 'Description is required');
            END IF;

            -- Generate slug
            slug_text := generate_idea_slug(p_idea_data->>'title');

            -- Insert idea
            INSERT INTO ideas (
                user_id,
                title,
                description,
                category,
                tags,
                privacy,
                slug
            ) VALUES (
                p_user_id,
                trim(p_idea_data->>'title'),
                trim(p_idea_data->>'description'),
                COALESCE(p_idea_data->>'category', 'Other'),
                COALESCE(p_idea_data->>'tags', '{}')::TEXT[],
                COALESCE(p_idea_data->>'privacy', 'private'),
                slug_text
            ) RETURNING id INTO new_idea_id;

            -- Log activity
            PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id, p_idea_data);

            RETURN json_build_object(
                'success', true,
                'idea_id', new_idea_id,
                'slug', slug_text,
                'action', 'created'
            );

        WHEN 'read' THEN
            -- Get idea by ID or slug
            IF p_idea_data->>'id' IS NOT NULL THEN
                SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'id')::UUID;
            ELSIF p_idea_data->>'slug' IS NOT NULL THEN
                SELECT * INTO idea_record FROM ideas WHERE slug = p_idea_data->>'slug';
            END IF;

            IF NOT FOUND THEN
                RETURN json_build_object('success', false, 'error', 'Idea not found');
            END IF;

            -- Check access for private ideas
            IF idea_record.privacy = 'private' AND idea_record.user_id != p_user_id THEN
                RETURN json_build_object('success', false, 'error', 'Access denied');
            END IF;

            RETURN json_build_object(
                'success', true,
                'idea', json_build_object(
                    'id', idea_record.id,
                    'title', idea_record.title,
                    'description', idea_record.description,
                    'category', idea_record.category,
                    'tags', idea_record.tags,
                    'privacy', idea_record.privacy,
                    'status', idea_record.overall_status,
                    'completion_percentage', idea_record.completion_percentage,
                    'created_at', idea_record.created_at,
                    'updated_at', idea_record.updated_at
                )
            );

        WHEN 'update' THEN
            -- Validate access
            IF NOT validate_idea_access(p_user_id, (p_idea_data->>'id')::UUID) THEN
                RETURN json_build_object('success', false, 'error', 'Access denied');
            END IF;

            -- Update idea
            UPDATE ideas SET
                title = COALESCE(p_idea_data->>'title', title),
                description = COALESCE(p_idea_data->>'description', description),
                category = COALESCE(p_idea_data->>'category', category),
                tags = COALESCE(p_idea_data->>'tags', tags)::TEXT[],
                privacy = COALESCE(p_idea_data->>'privacy', privacy),
                updated_at = NOW()
            WHERE id = (p_idea_data->>'id')::UUID;

            -- Log activity
            PERFORM log_activity(p_user_id, 'update', 'idea', (p_idea_data->>'id')::UUID, p_idea_data);

            RETURN json_build_object('success', true, 'action', 'updated');

        WHEN 'delete' THEN
            -- Validate access
            IF NOT validate_idea_access(p_user_id, (p_idea_data->>'id')::UUID) THEN
                RETURN json_build_object('success', false, 'error', 'Access denied');
            END IF;

            -- Delete idea
            DELETE FROM ideas WHERE id = (p_idea_data->>'id')::UUID AND user_id = p_user_id;

            -- Log activity
            PERFORM log_activity(p_user_id, 'delete', 'idea', (p_idea_data->>'id')::UUID, p_idea_data);

            RETURN json_build_object('success', true, 'action', 'deleted');

        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;