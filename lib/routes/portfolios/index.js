import express from "express";
import { requireAuth } from "../../session.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// List user's portfolios
router.get("/", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const userId = req.user.id;

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", userId)
    .single();

  if (profile?.package_type !== "enterprise") {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.enterprise_required")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Enterprise package required to create portfolios.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect("/dashboard");
  }

  // Get user's portfolios
  const { data: portfolios, error } = await supabase
    .from("portfolios")
    .select(
      `
      id,
      name,
      description,
      color,
      created_at,
      updated_at,
      portfolio_ideas (
        idea_id,
        ideas (
          id,
          completion_percentage,
          overall_status
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    logger.error("Error fetching portfolios:", error);
  }

  // Calculate stats for each portfolio
  const portfoliosWithStats =
    portfolios?.map((portfolio) => {
      const ideas =
        portfolio.portfolio_ideas?.map((pi) => pi.ideas).filter(Boolean) || [];
      const stats = {
        totalIdeas: ideas.length,
        completedIdeas: ideas.filter(
          (idea) => idea.overall_status === "completed",
        ).length,
        averageCompletion:
          ideas.length > 0
            ? ideas.reduce(
                (sum, idea) => sum + (idea.completion_percentage || 0),
                0,
              ) / ideas.length
            : 0,
      };

      return {
        ...portfolio,
        stats,
      };
    }) || [];

  res.render("portfolios/portfolios", {
    title: "My Portfolios - Accelerator",
    bodyClass: "portfolios-page",
    layout: "main",
    user: req.user,
    portfolios: portfoliosWithStats,
    hasPortfolios: portfoliosWithStats.length > 0,
    activeNav: "portfolios",
  });
});

// Portfolio detail view
router.get("/:portfolioId", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", userId)
    .single();

  if (profile?.package_type !== "enterprise") {
    return res.redirect("/dashboard");
  }

  // Get portfolio details
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select(
      `
      *,
      portfolio_ideas (
        idea_id,
        ideas (
          id,
          title,
          description,
          category,
          completion_percentage,
          overall_status,
          rating,
          created_at,
          updated_at
        )
      ),
      portfolio_members (
        user_id,
        role
      )
    `,
    )
    .eq("id", portfolioId)
    .single();

  if (portfolioError || !portfolio) {
    return res.redirect("/portfolios");
  }

  // Check if user owns this portfolio or is a member
  const isOwner = portfolio.user_id === userId;
  const isMember = portfolio.portfolio_members?.some(
    (member) => member.user_id === userId,
  );

  if (!isOwner && !isMember) {
    return res.redirect("/portfolios");
  }

  // Format portfolio data
  const ideas =
    portfolio.portfolio_ideas?.map((pi) => pi.ideas).filter(Boolean) || [];
  const members = portfolio.portfolio_members || [];

  const stats = {
    totalIdeas: ideas.length,
    completedIdeas: ideas.filter((idea) => idea.overall_status === "completed")
      .length,
    averageRating:
      ideas.length > 0
        ? ideas.reduce((sum, idea) => sum + (idea.rating || 0), 0) /
          ideas.length
        : 0,
    averageCompletion:
      ideas.length > 0
        ? ideas.reduce(
            (sum, idea) => sum + (idea.completion_percentage || 0),
            0,
          ) / ideas.length
        : 0,
    totalMembers: members.length,
  };

  res.render("portfolios/detail", {
    title: `${portfolio.name} - Portfolios`,
    bodyClass: "portfolio-detail-page",
    layout: "main",
    user: req.user,
    portfolio: {
      ...portfolio,
      ideas,
      members: members.map((member) => ({
        ...member,
        name: member.profiles?.name || "Unknown",
        avatar: member.profiles?.avatar_url,
      })),
      stats,
      isOwner,
      canEdit:
        isOwner || members.find((m) => m.user_id === userId)?.role === "editor",
    },
  });
});

// Add idea to portfolio page
router.get("/:portfolioId/ideas", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", userId)
    .single();

  if (profile?.package_type !== "enterprise") {
    return res.redirect("/dashboard");
  }

  // Get portfolio details
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .single();

  if (portfolioError || !portfolio) {
    return res.redirect("/portfolios");
  }

  // Get user's ideas that are not already in this portfolio
  const { data: portfolioIdeas } = await supabase
    .from("portfolio_ideas")
    .select("idea_id")
    .eq("portfolio_id", portfolioId);

  const portfolioIdeaIds = portfolioIdeas?.map((pi) => pi.idea_id) || [];

  let query = supabase
    .from("ideas")
    .select(
      "id, title, category, completion_percentage, overall_status, rating, created_at",
    )
    .eq("user_id", userId);

  if (portfolioIdeaIds.length > 0) {
    query = query.not("id", "in", `(${portfolioIdeaIds.join(",")})`);
  }

  const { data: availableIdeas } = await query.order("updated_at", {
    ascending: false,
  });

  res.render("portfolios/add-ideas", {
    title: `Add Ideas to ${portfolio.name}`,
    bodyClass: "add-ideas-page",
    layout: "main",
    user: req.user,
    portfolio,
    availableIdeas: availableIdeas || [],
    hasIdeas: (availableIdeas && availableIdeas.length > 0) || false,
  });
});

// Create new portfolio
router.post("/", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  const userId = req.user.id;
  const { name, description, color } = req.body;

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", userId)
    .single();

  if (profile?.package_type !== "enterprise") {
    return res.redirect("/dashboard");
  }

  // Validate input
  if (!name || name.trim().length === 0) {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.name_required")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Portfolio name is required.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect("/portfolios");
  }

  if (name.trim().length > 100) {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.name_too_long")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Portfolio name must be less than 100 characters.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect("/portfolios");
  }

  if (name.trim().length > 100) {
    return res.redirect("/portfolios");
  }

  // Create portfolio
  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#3B82F6",
    })
    .select()
    .single();

  if (error) {
    logger.error("Portfolio creation error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.portfolio_creation_failed")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to create portfolio. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect("/portfolios");
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_created",
    entity_type: "portfolio",
    entity_id: portfolio.id,
    details: { name: portfolio.name },
  });

  if (req.isHtmx) {
    return res.send(`
      <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
        <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.portfolio_created")}</div>
        <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Portfolio "${portfolio.name}" created successfully.</div>
      </div>
      <script>
        // Small delay to ensure alert is shown
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      </script>
    `);
  }
  res.redirect("/portfolios");
});

// Update portfolio
router.put("/:portfolioId", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;
  const { name, description, color } = req.body;

  // Check ownership
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("user_id, name")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .single();

  if (!portfolio) {
    return res.redirect("/portfolios");
  }

  // Validate input
  if (!name || name.trim().length === 0) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Update portfolio
  const { error } = await supabase
    .from("portfolios")
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#3B82F6",
      updated_at: new Date().toISOString(),
    })
    .eq("id", portfolioId);

  if (error) {
    logger.error("Portfolio update error:", error);
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_updated",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { old_name: portfolio.name, new_name: name.trim() },
  });

  res.redirect(`/portfolios/${portfolioId}`);
});

// Delete portfolio
router.delete("/:portfolioId", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;

  // Check ownership
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("user_id, name")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .single();

  if (!portfolio) {
    return res.redirect("/portfolios");
  }

  // Delete portfolio (cascade will handle related records)
  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", portfolioId);

  if (error) {
    logger.error("Portfolio deletion error:", error);
    return res.redirect("/portfolios");
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_deleted",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { name: portfolio.name },
  });

  res.redirect("/portfolios");
});

// Add idea to portfolio
router.post("/:portfolioId/ideas", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;
  const { ideaIds } = req.body;

  if (
    !ideaIds ||
    (Array.isArray(ideaIds) && ideaIds.length === 0) ||
    (!Array.isArray(ideaIds) && !ideaIds)
  ) {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">No ideas selected</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please select at least one idea to add.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect(`/portfolios/${portfolioId}/ideas`);
  }

  const ideaIdArray = Array.isArray(ideaIds) ? ideaIds : [ideaIds];

  // Check if user owns portfolio or is a member with edit permissions
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select(
      `
      user_id,
      portfolio_members (
        user_id,
        role
      )
    `,
    )
    .eq("id", portfolioId)
    .single();

  if (!portfolio) {
    return res.redirect("/portfolios");
  }

  const isOwner = portfolio.user_id === userId;
  const memberRole = portfolio.portfolio_members?.find(
    (m) => m.user_id === userId,
  )?.role;

  if (!isOwner && memberRole !== "editor") {
    return res.redirect("/portfolios");
  }

  // Check if idea exists and belongs to user
  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, user_id")
    .eq("id", ideaId)
    .eq("user_id", userId)
    .single();

  if (!idea) {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.idea_not_found")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Idea not found or access denied.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect(`/portfolios/${portfolioId}/ideas`);
  }

  // Check if idea is already in portfolio
  const { data: existing } = await supabase
    .from("portfolio_ideas")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("idea_id", ideaId)
    .single();

  if (existing) {
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.idea_already_in_portfolio")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Idea is already in this portfolio.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect(`/portfolios/${portfolioId}/ideas`);
  }

  // Add idea to portfolio
  const { error } = await supabase.from("portfolio_ideas").insert({
    portfolio_id: portfolioId,
    idea_id: ideaId,
  });

  if (error) {
    logger.error("Add idea to portfolio error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.add_idea_failed")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to add idea to portfolio. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.redirect(`/portfolios/${portfolioId}/ideas`);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_idea_added",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { idea_id: ideaId, idea_title: idea.title },
  });

  if (req.isHtmx) {
    return res.send(`
       <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
           <circle cx="12" cy="12" r="10"></circle>
           <path d="m9 12 2 2 4-4"></path>
         </svg>
         <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.idea_added_to_portfolio")}</div>
         <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Idea "${idea.title}" added to portfolio successfully.</div>
       </div>
       <script>
         // Small delay to ensure alert is shown
         setTimeout(() => {
           window.location.href = '/portfolios/${portfolioId}';
         }, 1000);
       </script>
     `);
  }
  res.redirect(`/portfolios/${portfolioId}`);
});

// Remove idea from portfolio
router.delete("/:portfolioId/ideas/:ideaId", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId, ideaId } = req.params;
  const userId = req.user.id;

  // Check permissions
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select(
      `
      user_id,
      portfolio_members (
        user_id,
        role
      )
    `,
    )
    .eq("id", portfolioId)
    .single();

  if (!portfolio) {
    return res.redirect("/portfolios");
  }

  const isOwner = portfolio.user_id === userId;
  const memberRole = portfolio.portfolio_members?.find(
    (m) => m.user_id === userId,
  )?.role;

  if (!isOwner && memberRole !== "editor") {
    return res.redirect("/portfolios");
  }

  // Remove idea from portfolio
  const { error } = await supabase
    .from("portfolio_ideas")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("idea_id", ideaId);

  if (error) {
    logger.error("Remove idea from portfolio error:", error);
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_idea_removed",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { idea_id: ideaId },
  });

  res.redirect(`/portfolios/${portfolioId}`);
});

// Invite member to portfolio
router.post("/:portfolioId/members", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId } = req.params;
  const userId = req.user.id;
  const { email, role = "viewer" } = req.body;

  // Check if user owns the portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("user_id, name")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .single();

  if (!portfolio) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Validate role
  if (!["owner", "editor", "viewer"].includes(role)) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Find user by email using admin auth API
  let invitedUserId = null;
  try {
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    const { data: users, error: userError } =
      await adminSupabase.auth.admin.listUsers();

    if (userError) {
      logger.error("Error listing users:", userError);
      return res.redirect(`/portfolios/${portfolioId}`);
    }

    const user = users.users.find((u) => u.email === email);
    if (user) {
      invitedUserId = user.id;
    }
  } catch (error) {
    logger.error("Error finding user by email:", error);
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  if (!invitedUserId) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("portfolio_members")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("user_id", invitedUserId)
    .single();

  if (existing) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Add member
  const { error } = await supabase.from("portfolio_members").insert({
    portfolio_id: portfolioId,
    user_id: invitedUserId,
    role: role,
    invited_by: userId,
  });

  if (error) {
    logger.error("Add portfolio member error:", error);
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_member_invited",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { invited_user_id: invitedUserId, role: role },
  });

  res.redirect(`/portfolios/${portfolioId}`);
});

// Update member role
router.put("/:portfolioId/members/:memberId", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { portfolioId, memberId } = req.params;
  const userId = req.user.id;
  const { role } = req.body;

  // Check if user owns the portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("user_id, name")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .single();

  if (!portfolio) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Validate role
  if (!["owner", "editor", "viewer"].includes(role)) {
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Update member role
  const { error } = await supabase
    .from("portfolio_members")
    .update({ role: role })
    .eq("portfolio_id", portfolioId)
    .eq("user_id", memberId);

  if (error) {
    logger.error("Update portfolio member error:", error);
    return res.redirect(`/portfolios/${portfolioId}`);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    action_type: "portfolio_member_role_updated",
    entity_type: "portfolio",
    entity_id: portfolioId,
    details: { member_user_id: memberId, new_role: role },
  });

  res.redirect(`/portfolios/${portfolioId}`);
});

// Remove member from portfolio
router.delete(
  "/:portfolioId/members/:memberId",
  requireAuth,
  async (req, res) => {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { portfolioId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user owns the portfolio
    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("user_id, name")
      .eq("id", portfolioId)
      .eq("user_id", userId)
      .single();

    if (!portfolio) {
      if (req.isHtmx) {
        return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.portfolio_not_found")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Portfolio not found.</div>
        </div>
        <script>hideLoading();</script>
      `);
      }
      return res.redirect("/portfolios");
    }

    // Cannot remove yourself if you're the owner
    if (memberId === userId) {
      return res.redirect(`/portfolios/${portfolioId}`);
    }

    // Remove member
    const { error } = await supabase
      .from("portfolio_members")
      .delete()
      .eq("portfolio_id", portfolioId)
      .eq("user_id", memberId);

    if (error) {
      logger.error("Remove portfolio member error:", error);
      return res.redirect(`/portfolios/${portfolioId}`);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "portfolio_member_removed",
      entity_type: "portfolio",
      entity_id: portfolioId,
      details: { removed_user_id: memberId },
    });

    res.redirect(`/portfolios/${portfolioId}`);
  },
);

export default router;
