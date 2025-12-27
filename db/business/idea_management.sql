-- Idea Management Functions
-- Functions for managing ideas, including CRUD operations and advanced features

-- Function to generate unique slug for ideas
CREATE OR REPLACE FUNCTION generate_idea_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base slug from title
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p_title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));

    -- Ensure it's not empty
    IF base_slug = '' OR base_slug IS NULL THEN
       base_slug := 'idea';
    END IF;

    -- Find unique slug
    final_slug := base_slug;

    WHILE EXISTS(SELECT 1 FROM ideas WHERE slug = final_slug) LOOP
       counter := counter + 1;
       final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to manage idea operations
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

          -- Create idea
          INSERT INTO ideas (
             user_id,
             title,
             description,
             category,
             tags,
             privacy,
             slug,
             overall_status,
             completion_percentage,
             validation_threshold_met,
             unlocked_models
          ) VALUES (
             p_user_id,
             trim(p_idea_data->>'title'),
             trim(p_idea_data->>'description'),
             COALESCE(p_idea_data->>'category', 'Other'),
             COALESCE(p_idea_data->>'tags', '{}')::TEXT[],
             COALESCE(p_idea_data->>'privacy', 'private'),
             slug_text,
             'draft',
             0,
             false,
             ARRAY['idea']
          ) RETURNING id INTO new_idea_id;

          -- Log activity
          PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id,
             json_build_object('title', p_idea_data->>'title', 'slug', slug_text));

          RETURN json_build_object(
             'success', true,
             'idea_id', new_idea_id,
             'slug', slug_text,
             'message', 'Idea created successfully'
          );

       WHEN 'update' THEN
          -- Validate idea ownership
          SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Idea not found');
          END IF;

          IF idea_record.user_id != p_user_id THEN
             RETURN json_build_object('success', false, 'error', 'Access denied');
          END IF;

          -- Update idea
          UPDATE ideas SET
             title = COALESCE(trim(p_idea_data->>'title'), title),
             description = COALESCE(trim(p_idea_data->>'description'), description),
             category = COALESCE(p_idea_data->>'category', category),
             tags = COALESCE(p_idea_data->>'tags', tags),
             privacy = COALESCE(p_idea_data->>'privacy', privacy),
             updated_at = NOW()
          WHERE id = (p_idea_data->>'idea_id')::UUID;

          -- Log activity
          PERFORM log_activity(p_user_id, 'update', 'idea', (p_idea_data->>'idea_id')::UUID,
             json_build_object('changes', 'idea updated'));

          RETURN json_build_object('success', true, 'message', 'Idea updated successfully');

       WHEN 'delete' THEN
          -- Validate idea ownership
          SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Idea not found');
          END IF;

          IF idea_record.user_id != p_user_id THEN
             RETURN json_build_object('success', false, 'error', 'Access denied');
          END IF;

          -- Soft delete (archive)
          UPDATE ideas SET
             overall_status = 'archived',
             privacy = 'private',
             updated_at = NOW()
          WHERE id = (p_idea_data->>'idea_id')::UUID;

          -- Log activity
          PERFORM log_activity(p_user_id, 'archive', 'idea', (p_idea_data->>'idea_id')::UUID,
             json_build_object('reason', 'user_deleted'));

          RETURN json_build_object('success', true, 'message', 'Idea archived successfully');

       WHEN 'publish' THEN
          -- Validate idea ownership
          SELECT * INTO idea_record FROM ideas WHERE id = (p_idea_data->>'idea_id')::UUID;
          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Idea not found');
          END IF;

          IF idea_record.user_id != p_user_id THEN
             RETURN json_build_object('success', false, 'error', 'Access denied');
          END IF;

          -- Publish idea
          UPDATE ideas SET
             privacy = 'public',
             updated_at = NOW()
          WHERE id = (p_idea_data->>'idea_id')::UUID;

          -- Log activity
          PERFORM log_activity(p_user_id, 'publish', 'idea', (p_idea_data->>'idea_id')::UUID,
             json_build_object('previous_privacy', idea_record.privacy));

          RETURN json_build_object('success', true, 'message', 'Idea published successfully');

       ELSE
          RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate idea access
CREATE OR REPLACE FUNCTION validate_idea_access(p_user_id UUID, p_idea_id UUID)
RETURNS JSON AS $$
DECLARE
    idea_record RECORD;
BEGIN
    SELECT * INTO idea_record FROM ideas WHERE id = p_idea_id;

    IF NOT FOUND THEN
       RETURN json_build_object('valid', false, 'error', 'Idea not found');
    END IF;

    -- Check ownership
    IF idea_record.user_id = p_user_id THEN
       RETURN json_build_object('valid', true, 'access_level', 'owner');
    END IF;

    -- Check privacy
    IF idea_record.privacy = 'private' THEN
       RETURN json_build_object('valid', false, 'error', 'Access denied');
    END IF;

    -- Public idea
    RETURN json_build_object('valid', true, 'access_level', 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user ideas with filtering and pagination
CREATE OR REPLACE FUNCTION get_user_ideas(p_user_id UUID, p_filters JSONB DEFAULT '{}', p_pagination JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    ideas_data JSON;
    total_count INTEGER;
    limit_val INTEGER := COALESCE((p_pagination->>'limit')::INTEGER, 50);
    offset_val INTEGER := COALESCE((p_pagination->>'offset')::INTEGER, 0);
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM ideas WHERE user_id = p_user_id;

    -- Get filtered and paginated ideas
    SELECT json_agg(
       json_build_object(
          'id', i.id,
          'title', i.title,
          'description', i.description,
          'category', i.category,
          'tags', i.tags,
          'privacy', i.privacy,
          'rating', i.rating,
          'completion_percentage', i.completion_percentage,
          'overall_status', i.overall_status,
          'created_at', i.created_at,
          'updated_at', i.updated_at,
          'slug', i.slug,
          'vote_count', COALESCE(stats.vote_count, 0),
          'reward_count', COALESCE(stats.reward_count, 0)
       ) ORDER BY i.updated_at DESC
    ) INTO ideas_data
    FROM ideas i
    LEFT JOIN ideas_with_stats stats ON i.id = stats.id
    WHERE i.user_id = p_user_id
      AND (p_filters->>'status' IS NULL OR i.overall_status = p_filters->>'status')
      AND (p_filters->>'category' IS NULL OR i.category = p_filters->>'category')
      AND (p_filters->>'privacy' IS NULL OR i.privacy = p_filters->>'privacy')
      AND (p_filters->>'search' IS NULL OR
           i.title ILIKE '%' || (p_filters->>'search') || '%' OR
           i.description ILIKE '%' || (p_filters->>'search') || '%')
    ORDER BY i.updated_at DESC
    LIMIT limit_val OFFSET offset_val;

    RETURN json_build_object(
       'ideas', COALESCE(ideas_data, '[]'::JSON),
       'pagination', json_build_object(
          'total', total_count,
          'limit', limit_val,
          'offset', offset_val,
          'has_more', (offset_val + limit_val) < total_count
       ),
       'filters', p_filters
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and create idea
CREATE OR REPLACE FUNCTION validate_and_create_idea(p_user_id UUID, p_title TEXT, p_description TEXT, p_category TEXT DEFAULT 'Other', p_tags TEXT[] DEFAULT '{}', p_privacy TEXT DEFAULT 'private')
RETURNS JSON AS $$
DECLARE
   new_idea_id UUID;
   validation_errors TEXT[] := '{}';
BEGIN
   -- Validation
   IF p_title IS NULL OR trim(p_title) = '' THEN
     validation_errors := validation_errors || 'Title is required';
   END IF;

   IF p_description IS NULL OR trim(p_description) = '' THEN
     validation_errors := validation_errors || 'Description is required';
   END IF;

   IF array_length(validation_errors, 1) > 0 THEN
     RETURN json_build_object(
       'success', false,
       'errors', validation_errors
     );
   END IF;

   -- Create idea
   INSERT INTO ideas (
     user_id, title, description, category, tags, privacy,
     overall_status, completion_percentage, validation_threshold_met, unlocked_models
   ) VALUES (
     p_user_id, trim(p_title), trim(p_description), p_category, p_tags, p_privacy,
     'draft', 0, false, ARRAY['idea']
   ) RETURNING id INTO new_idea_id;

   -- Log activity
   PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id, jsonb_build_object('title', p_title));

   RETURN json_build_object(
     'success', true,
     'idea_id', new_idea_id
   );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update idea workflow
CREATE OR REPLACE FUNCTION update_idea_workflow(p_idea_id UUID, p_user_id UUID, p_status TEXT DEFAULT NULL, p_updates JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    idea_data RECORD;
BEGIN
    -- Check ownership
    SELECT * INTO idea_data FROM ideas WHERE id = p_idea_id AND user_id = p_user_id;

    IF NOT FOUND THEN
       RETURN json_build_object('success', false, 'error', 'Idea not found or access denied');
    END IF;

    -- Update status if provided
    IF p_status IS NOT NULL THEN
       PERFORM update_idea_status(p_idea_id, p_user_id, p_status);
    END IF;

    -- Apply other updates
    IF p_updates != '{}' THEN
       UPDATE ideas SET
          title = COALESCE(p_updates->>'title', title),
          description = COALESCE(p_updates->>'description', description),
          category = COALESCE(p_updates->>'category', category),
          tags = COALESCE((p_updates->'tags')::TEXT[], tags),
          privacy = COALESCE(p_updates->>'privacy', privacy),
          updated_at = NOW()
       WHERE id = p_idea_id;
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get filtered user ideas with ratings and stats
CREATE OR REPLACE FUNCTION get_user_ideas_filtered(p_user_id UUID, p_status TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL, p_search TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  tags TEXT[],
  category TEXT,
  privacy TEXT,
  rating DECIMAL(3,2),
  overall_status TEXT,
  completion_percentage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  validation_threshold_met BOOLEAN,
  unlocked_models TEXT[],
  vote_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.description,
    i.tags,
    i.category,
    i.privacy,
    i.rating,
    i.overall_status,
    i.completion_percentage,
    i.created_at,
    i.updated_at,
    i.validation_threshold_met,
    i.unlocked_models,
    COUNT(v.*) as vote_count
  FROM ideas i
  LEFT JOIN votes v ON i.id = v.idea_id
  WHERE i.user_id = p_user_id
    AND (p_status IS NULL OR i.overall_status = p_status)
    AND (p_category IS NULL OR i.category = p_category)
    AND (p_search IS NULL OR i.title ILIKE '%' || p_search || '%' OR i.description ILIKE '%' || p_search || '%')
  GROUP BY i.id, i.title, i.description, i.tags, i.category, i.privacy, i.rating, i.overall_status, i.completion_percentage, i.created_at, i.updated_at, i.validation_threshold_met, i.unlocked_models
  ORDER BY i.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;