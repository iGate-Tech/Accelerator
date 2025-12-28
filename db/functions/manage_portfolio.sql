-- Manage Portfolio Function
-- Purpose: Handles portfolio creation, updates, and management operations.
-- What it does: Routes portfolio operations with access control and validation.
-- When to use: Called for all portfolio management tasks.
-- Dependencies: Requires portfolios, portfolio_ideas, portfolio_members tables.
--
-- Example Scenario 1: Create portfolio
-- Action: manage_portfolio('user-123', 'create', '{"name": "Web Projects", "description": "My web apps"}')
-- Result: Creates new portfolio for user
--
-- Example Scenario 2: Add idea to portfolio
-- Action: manage_portfolio('user-123', 'add_idea', '{"portfolio_id": "port-456", "idea_id": "idea-789"}')
-- Result: Adds idea to portfolio if user has access
--
-- Business Logic: Manages portfolio organization with proper access controls.
CREATE OR REPLACE FUNCTION manage_portfolio(p_user_id UUID, p_action TEXT, p_portfolio_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    portfolio_id UUID;
    idea_id UUID;
BEGIN
    CASE p_action
        WHEN 'create' THEN
            INSERT INTO portfolios (
                user_id,
                name,
                description,
                color,
                is_default
            ) VALUES (
                p_user_id,
                p_portfolio_data->>'name',
                p_portfolio_data->>'description',
                COALESCE(p_portfolio_data->>'color', '#3B82F6'),
                COALESCE((p_portfolio_data->>'is_default')::BOOLEAN, FALSE)
            ) RETURNING id INTO portfolio_id;

            RETURN json_build_object('success', true, 'portfolio_id', portfolio_id, 'action', 'created');

        WHEN 'add_idea' THEN
            -- Validate portfolio ownership
            IF NOT EXISTS(SELECT 1 FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID AND user_id = p_user_id) THEN
                RETURN json_build_object('success', false, 'error', 'Portfolio access denied');
            END IF;

            -- Validate idea ownership
            IF NOT EXISTS(SELECT 1 FROM ideas WHERE id = (p_portfolio_data->>'idea_id')::UUID AND user_id = p_user_id) THEN
                RETURN json_build_object('success', false, 'error', 'Idea access denied');
            END IF;

            INSERT INTO portfolio_ideas (portfolio_id, idea_id)
            VALUES ((p_portfolio_data->>'portfolio_id')::UUID, (p_portfolio_data->>'idea_id')::UUID);

            RETURN json_build_object('success', true, 'action', 'idea_added');

        WHEN 'add_member' THEN
            -- Validate portfolio ownership
            IF NOT EXISTS(SELECT 1 FROM portfolios WHERE id = (p_portfolio_data->>'portfolio_id')::UUID AND user_id = p_user_id) THEN
                RETURN json_build_object('success', false, 'error', 'Portfolio access denied');
            END IF;

            INSERT INTO portfolio_members (portfolio_id, user_id, role)
            VALUES (
                (p_portfolio_data->>'portfolio_id')::UUID,
                (p_portfolio_data->>'member_id')::UUID,
                COALESCE(p_portfolio_data->>'role', 'member')
            );

            RETURN json_build_object('success', true, 'action', 'member_added');

        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;