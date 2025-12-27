-- Model Management Functions
-- Functions for managing model instances and sections

-- Function to manage model instances
CREATE OR REPLACE FUNCTION manage_model_instance(p_user_id UUID, p_idea_id UUID, p_model_type TEXT, p_action TEXT)
RETURNS JSON AS $$
DECLARE
    model_id UUID;
    idea_record RECORD;
    model_count INTEGER;
    default_sections JSONB;
BEGIN
    -- Validate idea ownership
    SELECT * INTO idea_record FROM ideas WHERE id = p_idea_id;
    IF NOT FOUND THEN
       RETURN json_build_object('success', false, 'error', 'Idea not found');
    END IF;

    IF idea_record.user_id != p_user_id THEN
       RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;

    -- Validate model type
    IF p_model_type NOT IN ('idea', 'business', 'financial', 'funding', 'legal', 'marketing', 'team') THEN
       RETURN json_build_object('success', false, 'error', 'Invalid model type');
    END IF;

    CASE p_action
       WHEN 'create' THEN
          -- Check if model is unlocked for this idea
          IF NOT (p_model_type = ANY(idea_record.unlocked_models)) THEN
             RETURN json_build_object('success', false, 'error', 'Model not unlocked for this idea');
          END IF;

          -- Check if model instance already exists
          SELECT COUNT(*) INTO model_count
          FROM model_instances
          WHERE idea_id = p_idea_id AND model_type = p_model_type;

          IF model_count > 0 THEN
             RETURN json_build_object('success', false, 'error', 'Model instance already exists');
          END IF;

          -- Create model instance
          INSERT INTO model_instances (idea_id, user_id, model_type, status)
          VALUES (p_idea_id, p_user_id, p_model_type, 'draft')
          RETURNING id INTO model_id;

          -- Create default sections based on model type
          CASE p_model_type
             WHEN 'business' THEN
                INSERT INTO model_sections (model_instance_id, section_name, section_data)
                VALUES
                (model_id, 'Executive Summary', '{}'::JSONB),
                (model_id, 'Market Analysis', '{}'::JSONB),
                (model_id, 'Product/Service', '{}'::JSONB),
                (model_id, 'Marketing Strategy', '{}'::JSONB),
                (model_id, 'Financial Projections', '{}'::JSONB),
                (model_id, 'Operations Plan', '{}'::JSONB);
             WHEN 'financial' THEN
                INSERT INTO model_sections (model_instance_id, section_name, section_data)
                VALUES
                (model_id, 'Revenue Model', '{}'::JSONB),
                (model_id, 'Cost Structure', '{}'::JSONB),
                (model_id, 'Funding Requirements', '{}'::JSONB),
                (model_id, 'Financial Projections', '{}'::JSONB),
                (model_id, 'Break-even Analysis', '{}'::JSONB);
             WHEN 'marketing' THEN
                INSERT INTO model_sections (model_instance_id, section_name, section_data)
                VALUES
                (model_id, 'Target Audience', '{}'::JSONB),
                (model_id, 'Value Proposition', '{}'::JSONB),
                (model_id, 'Marketing Channels', '{}'::JSONB),
                (model_id, 'Brand Strategy', '{}'::JSONB),
                (model_id, 'Content Strategy', '{}'::JSONB);
             ELSE
                -- Default single section for other models
                INSERT INTO model_sections (model_instance_id, section_name, section_data)
                VALUES (model_id, 'Main Content', '{}'::JSONB);
          END CASE;

          -- Log activity
          PERFORM log_activity(p_user_id, 'model_created', 'model_instance', model_id,
             json_build_object('model_type', p_model_type, 'idea_id', p_idea_id));

          RETURN json_build_object(
             'success', true,
             'model_id', model_id,
             'model_type', p_model_type,
             'sections_created', CASE
                WHEN p_model_type = 'business' THEN 6
                WHEN p_model_type = 'financial' THEN 5
                WHEN p_model_type = 'marketing' THEN 5
                ELSE 1
             END
          );

       WHEN 'delete' THEN
          -- Find model instance
          SELECT id INTO model_id
          FROM model_instances
          WHERE idea_id = p_idea_id AND model_type = p_model_type AND user_id = p_user_id;

          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Model instance not found');
          END IF;

          -- Delete sections first (cascade should handle this, but explicit)
          DELETE FROM model_sections WHERE model_instance_id = model_id;
          DELETE FROM model_instances WHERE id = model_id;

          -- Log activity
          PERFORM log_activity(p_user_id, 'model_deleted', 'model_instance', model_id,
             json_build_object('model_type', p_model_type));

          RETURN json_build_object('success', true, 'message', 'Model deleted');

       ELSE
          RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate model access
CREATE OR REPLACE FUNCTION validate_model_access(p_user_id UUID, p_model_id UUID)
RETURNS JSON AS $$
DECLARE
    model_record RECORD;
BEGIN
    SELECT mi.*, i.user_id as idea_owner, i.unlocked_models
    INTO model_record
    FROM model_instances mi
    JOIN ideas i ON mi.idea_id = i.id
    WHERE mi.id = p_model_id;

    IF NOT FOUND THEN
       RETURN json_build_object('valid', false, 'error', 'Model not found');
    END IF;

    -- Check ownership
    IF model_record.idea_owner = p_user_id THEN
       RETURN json_build_object('valid', true, 'access_level', 'owner');
    END IF;

    -- Check if model is publicly accessible (if idea is public)
    IF EXISTS(
       SELECT 1 FROM ideas
       WHERE id = model_record.idea_id
       AND privacy = 'public'
    ) THEN
       RETURN json_build_object('valid', true, 'access_level', 'viewer');
    END IF;

    RETURN json_build_object('valid', false, 'error', 'Access denied');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete model section
CREATE OR REPLACE FUNCTION complete_model_section(p_user_id UUID, p_section_id UUID)
RETURNS JSON AS $$
DECLARE
    section_record RECORD;
    model_id UUID;
    total_sections INTEGER;
    completed_sections INTEGER;
    completion_percentage INTEGER;
BEGIN
    -- Get section and validate access
    SELECT ms.*, mi.idea_id, mi.model_type, i.user_id as idea_owner
    INTO section_record
    FROM model_sections ms
    JOIN model_instances mi ON ms.model_instance_id = mi.id
    JOIN ideas i ON mi.idea_id = i.id
    WHERE ms.id = p_section_id;

    IF NOT FOUND THEN
       RETURN json_build_object('success', false, 'error', 'Section not found');
    END IF;

    IF section_record.idea_owner != p_user_id THEN
       RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;

    -- Mark section as completed
    UPDATE model_sections
    SET is_completed = true, updated_at = NOW()
    WHERE id = p_section_id;

    -- Calculate completion percentage for the model
    SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN is_completed THEN 1 END) as completed
    INTO total_sections, completed_sections
    FROM model_sections
    WHERE model_instance_id = section_record.model_instance_id;

    completion_percentage := (completed_sections * 100) / total_sections;

    -- Update model's status if fully completed
    IF completion_percentage = 100 THEN
       UPDATE model_instances
       SET status = 'completed', updated_at = NOW()
       WHERE id = section_record.model_instance_id;
    END IF;

    -- Update idea's overall completion percentage
    UPDATE ideas SET
       completion_percentage = (
          SELECT ROUND(AVG(completion_percentage), 0)
          FROM (
             SELECT
                CASE
                   WHEN COUNT(*) = 0 THEN 0
                   ELSE (COUNT(CASE WHEN ms.is_completed THEN 1 END) * 100.0) / COUNT(*)
                END as completion_percentage
             FROM model_instances mi
             LEFT JOIN model_sections ms ON mi.id = ms.model_instance_id
             WHERE mi.idea_id = section_record.idea_id
             GROUP BY mi.id
          ) model_completions
       ),
       updated_at = NOW()
    WHERE id = section_record.idea_id;

    -- Log activity
    PERFORM log_activity(p_user_id, 'section_completed', 'model_section', p_section_id,
       json_build_object('model_type', section_record.model_type, 'completion_percentage', completion_percentage));

    RETURN json_build_object(
       'success', true,
       'section_completed', true,
       'model_completion_percentage', completion_percentage,
       'idea_updated', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get model progress for user
CREATE OR REPLACE FUNCTION get_model_progress(p_user_id UUID, p_model_type TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    progress_data JSON;
BEGIN
    SELECT json_agg(
       json_build_object(
          'model_type', model_type,
          'total_instances', total_instances,
          'completed_instances', completed_instances,
          'total_sections', total_sections,
          'completed_sections', completed_sections,
          'completion_percentage', ROUND(
             CASE
                WHEN total_sections > 0 THEN (completed_sections * 100.0) / total_sections
                ELSE 0
             END, 1
          )
       )
    ) INTO progress_data
    FROM (
       SELECT
          mi.model_type,
          COUNT(DISTINCT mi.id) as total_instances,
          COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_instances,
          COUNT(ms.id) as total_sections,
          COUNT(CASE WHEN ms.is_completed THEN 1 END) as completed_sections
       FROM model_instances mi
       LEFT JOIN model_sections ms ON mi.id = ms.model_instance_id
       WHERE mi.user_id = p_user_id
         AND (p_model_type IS NULL OR mi.model_type = p_model_type)
       GROUP BY mi.model_type
    ) progress;

    RETURN json_build_object(
       'user_id', p_user_id,
       'model_progress', COALESCE(progress_data, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete section workflow
CREATE OR REPLACE FUNCTION complete_section_workflow(p_section_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   section_data RECORD;
BEGIN
   -- Check ownership
   SELECT ms.* INTO section_data
   FROM model_sections ms
   JOIN model_instances mi ON ms.model_instance_id = mi.id
   WHERE ms.id = p_section_id AND mi.user_id = p_user_id;

   IF NOT FOUND THEN
     RETURN json_build_object('success', false, 'error', 'Section not found or access denied');
   END IF;

   -- Complete section
   PERFORM complete_model_section_void(p_section_id, p_user_id);

   RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;