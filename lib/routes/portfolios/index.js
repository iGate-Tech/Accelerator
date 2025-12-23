import express from "express";
import { requireAuth } from "../../session.js";

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
    return res.redirect("/dashboard/home");
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
    console.error("Error fetching portfolios:", error);
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

  console.log("Portfolio detail:", portfolio, "Error:", portfolioError);

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

  const { data: availableIdeas, error: ideasError } = await query.order(
    "updated_at",
    { ascending: false },
  );

  const { data: allUserIdeas } = await supabase
    .from("ideas")
    .select("id, title")
    .eq("user_id", userId);
  console.log("All user ideas:", allUserIdeas);
  console.log("Portfolio idea IDs:", portfolioIdeaIds);
  console.log("Available ideas:", availableIdeas, "Error:", ideasError);

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
    console.error("Portfolio creation error:", error);
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
    console.error("Portfolio update error:", error);
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
    console.error("Portfolio deletion error:", error);
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
  const { ideaId } = req.body;

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
    return res.redirect(`/portfolios/${portfolioId}/ideas`);
  }

  // Add idea to portfolio
  const { error } = await supabase.from("portfolio_ideas").insert({
    portfolio_id: portfolioId,
    idea_id: ideaId,
  });

  if (error) {
    console.error("Add idea to portfolio error:", error);
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
    console.error("Remove idea from portfolio error:", error);
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
      console.error("Error listing users:", userError);
      return res.redirect(`/portfolios/${portfolioId}`);
    }

    const user = users.users.find((u) => u.email === email);
    if (user) {
      invitedUserId = user.id;
    }
  } catch (error) {
    console.error("Error finding user by email:", error);
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
    console.error("Add portfolio member error:", error);
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
    console.error("Update portfolio member error:", error);
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
      return res.redirect(`/portfolios/${portfolioId}`);
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
      console.error("Remove portfolio member error:", error);
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
