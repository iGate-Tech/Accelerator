-- Portfolio Management Functions
-- Functions for managing portfolios and enterprise features

-- Function to manage portfolios
CREATE OR REPLACE FUNCTION manage_portfolio(p_user_id UUID, p_action TEXT, p_portfolio_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    portfolio_id UUID;
    portfolio_record RECORD;
    member_count INTEGER;
BEGIN
    CASE p_action
       WHEN 'create' THEN
          -- Validate required fields
          IF p_portfolio_data->>'name' IS NULL OR trim(p_portfolio_data->>'name') = '' THEN
             RETURN json_build_object('success', false, 'error', 'Portfolio name is required');
          END IF;

          -- Check package for enterprise features
          IF NOT EXISTS(
             SELECT 1 FROM profiles
             WHERE user_id = p_user_id AND package_type = 'enterprise'
          ) THEN
             RETURN json_build_object('success', false, 'error', 'Enterprise package required for portfolios');
          END IF;

          -- Create portfolio
          INSERT INTO portfolios (
             user_id,
             name,
             description,
             color,
             is_default
          ) VALUES (
             p_user_id,
             trim(p_portfolio_data->>'name'),
             COALESCE(trim(p_portfolio_data->>'description'), ''),
             COALESCE(p_portfolio_data->>'color', '#3B82F6'),
             COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false)
          ) RETURNING id INTO portfolio_id;

          -- If this is the default portfolio, unset others
          IF COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false) THEN
             UPDATE portfolios SET is_default = false
             WHERE user_id = p_user_id AND id != portfolio_id;
          END IF;

          -- Log activity
          PERFORM log_activity(p_user_id, 'portfolio_created', 'portfolio', portfolio_id,
             json_build_object('name', p_portfolio_data->>'name'));

          RETURN json_build_object(
             'success', true,
             'portfolio_id', portfolio_id,
             'message', 'Portfolio created successfully'
          );

       WHEN 'update' THEN
          -- Validate ownership
          SELECT * INTO portfolio_record FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;
          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Portfolio not found');
          END IF;

          IF portfolio_record.user_id != p_user_id THEN
             RETURN json_build_object('success', false, 'error', 'Access denied');
          END IF;

          -- Update portfolio
          UPDATE portfolios SET
             name = COALESCE(trim(p_portfolio_data->>'name'), name),
             description = COALESCE(trim(p_portfolio_data->>'description'), description),
             color = COALESCE(p_portfolio_data->>'color', color),
             is_default = COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, is_default),
             updated_at = NOW()
          WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;

          -- Handle default portfolio logic
          IF COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, false) THEN
             UPDATE portfolios SET is_default = false
             WHERE user_id = p_user_id AND id != (p_portfolio_data->>'portfolio_id')::UUID;
          END IF;

          -- Log activity
          PERFORM log_activity(p_user_id, 'portfolio_updated', 'portfolio', (p_portfolio_data->>'portfolio_id')::UUID,
             json_build_object('changes', 'portfolio updated'));

          RETURN json_build_object('success', true, 'message', 'Portfolio updated successfully');

       WHEN 'delete' THEN
          -- Validate ownership
          SELECT * INTO portfolio_record FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;
          IF NOT FOUND THEN
             RETURN json_build_object('success', false, 'error', 'Portfolio not found');
          END IF;

          IF portfolio_record.user_id != p_user_id THEN
             RETURN json_build_object('success', false, 'error', 'Access denied');
          END IF;

          -- Check if portfolio has ideas
          SELECT COUNT(*) INTO member_count FROM portfolio_ideas WHERE portfolio_id = (p_portfolio_data->>'portfolio_id')::UUID;
          IF member_count > 0 THEN
             RETURN json_build_object('success', false, 'error', 'Cannot delete portfolio with ideas. Remove all ideas first.');
          END IF;

          -- Delete portfolio
          DELETE FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID;

          -- Log activity
          PERFORM log_activity(p_user_id, 'portfolio_deleted', 'portfolio', (p_portfolio_data->>'portfolio_id')::UUID,
             json_build_object('name', portfolio_record.name));

          RETURN json_build_object('success', true, 'message', 'Portfolio deleted successfully');

       ELSE
          RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;