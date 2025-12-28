-- Portfolio Tables RLS Policies
-- Purpose: Controls access to enterprise portfolio features
-- Security Model: Owner full access, member access based on sharing permissions
--
-- Policy Details:
-- 1. Portfolio owner full management
-- 2. Shared access for portfolio members
-- 3. Portfolio-idea relationship management
-- 4. Member management by portfolio owners
--
-- Security Rationale:
-- - Portfolios contain sensitive business collections
-- - Owner control ensures data protection
-- - Granular sharing enables collaboration
--
-- Business Impact:
-- - Enables enterprise team collaboration
-- - Supports organized idea management
-- - Protects intellectual property

-- Portfolio management
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Portfolio members can view shared portfolios" ON portfolios FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM portfolio_members
        WHERE portfolio_id = portfolios.id AND user_id = auth.uid()
    )
);

-- Portfolio-idea associations
CREATE POLICY "Users can manage portfolio-idea associations for own portfolios" ON portfolio_ideas FOR ALL USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Portfolio members can view portfolio ideas" ON portfolio_ideas FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM portfolio_members
        WHERE portfolio_id = portfolio_ideas.portfolio_id AND user_id = auth.uid()
    )
);

-- Portfolio membership management
CREATE POLICY "Users can view their own portfolio memberships" ON portfolio_members FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage portfolio memberships for own portfolios insert" ON portfolio_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage portfolio memberships for own portfolios update" ON portfolio_members FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage portfolio memberships for own portfolios delete" ON portfolio_members FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM portfolios
        WHERE id = portfolio_id AND user_id = auth.uid()
    )
);