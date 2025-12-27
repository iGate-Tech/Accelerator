import express from "express";
import { requireAuth } from "../../session.js";
import metricsService from "../../services/metrics.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// Dashboard Home - simplified dashboard view
router.get("/dashboard/home", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    // Get package details
    let packageDetails = null;
    if (profile && profile.package_type) {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("name")
        .eq("type", profile.package_type)
        .single();
      packageDetails = pkgData;
    }

    // Get basic stats
    const { data: ideas } = await supabase
      .from("ideas")
      .select("id, completion_percentage, overall_status, rating, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select(
        `
        id,
        action_type,
        entity_type,
        created_at,
        details
      `,
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    // Get portfolio overview for enterprise users
    let portfolioOverview = null;
    if (profile?.package_type === "enterprise") {
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select(
          `
          id,
          name,
          portfolio_ideas (
            idea_id,
            ideas (
              completion_percentage,
              overall_status
            )
          )
        `,
        )
        .eq("user_id", req.user.id)
        .limit(3);

      if (portfolios && portfolios.length > 0) {
        portfolioOverview = portfolios.map((portfolio) => ({
          id: portfolio.id,
          name: portfolio.name,
          ideaCount: portfolio.portfolio_ideas?.length || 0,
          completedIdeas:
            portfolio.portfolio_ideas?.filter(
              (pi) => pi.ideas?.overall_status === "completed",
            ).length || 0,
          avgCompletion:
            portfolio.portfolio_ideas?.length > 0
              ? Math.round(
                  portfolio.portfolio_ideas.reduce(
                    (sum, pi) => sum + (pi.ideas?.completion_percentage || 0),
                    0,
                  ) / portfolio.portfolio_ideas.length,
                )
              : 0,
        }));
      }
    }

    // Calculate quick stats
    const totalIdeas = ideas?.length || 0;
    const completedIdeas =
      ideas?.filter((idea) => idea.overall_status === "completed").length || 0;
    const completionRate =
      totalIdeas > 0 ? Math.round((completedIdeas / totalIdeas) * 100) : 0;

    res.render("dashboard/home", {
      title: "Home - Accelerator",
      bodyClass: "dashboard-home-page",
      layout: "main",
      user: { ...req.user, profile },
      lng: req.language || "en",
      packageDetails,
      stats: {
        ideas: {
          total: totalIdeas,
          completed: completedIdeas,
          completionRate,
          recent: ideas?.slice(0, 3) || [],
        },
        credits: {
          currentBalance: profile?.credit_balance || 0,
        },
        activity: recentActivity || [],
        portfolios: portfolioOverview,
      },
    });
  } catch (error) {
    logger.error("Dashboard home error:", error);
    res.render("dashboard/home", {
      title: "Home - Accelerator",
      bodyClass: "dashboard-home-page",
      layout: "main",
      user: req.user,
      lng: req.language || "en",
      stats: {
        ideas: { total: 0, completed: 0, completionRate: 0, recent: [] },
        credits: { currentBalance: 0 },
        activity: [],
        portfolios: null,
      },
    });
  }
});

// Dashboard (protected)
router.get("/dashboard", requireAuth, async (req, res) => {
  // Track user activity
  await metricsService.trackUserActivity(req.user.id, "dashboard_visit");

  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  try {
    // Get enhanced dashboard data using comprehensive function
    const { data: dashboardData, error } = await supabase.rpc(
      "get_enhanced_dashboard_data",
      {
        p_user_id: req.user.id,
      },
    );

    if (error) {
      logger.error("Enhanced dashboard data fetch error:", error);
      return res.status(500).render("error", {
        title: "Error",
        message: "Failed to load dashboard data",
      });
    }

    // Attach profile to user for nav rendering
    if (dashboardData?.stats?.profile) {
      req.user.profile = dashboardData.stats.profile;
    }

    // Get portfolio stats for enterprise users (simplified)
    let portfolioStats = null;
    if (req.user.profile?.package_type === "enterprise") {
      const { data: portfolios } = await supabase
        .from("portfolio_summary")
        .select("*")
        .eq("user_id", req.user.id);

      if (portfolios && portfolios.length > 0) {
        portfolioStats = {
          total: portfolios.length,
          totalIdeas: portfolios.reduce((sum, p) => sum + p.total_ideas, 0),
          avgCompletion: Math.round(
            portfolios.reduce((sum, p) => sum + p.avg_completion, 0) /
              portfolios.length,
          ),
          totalTeamMembers: portfolios.reduce(
            (sum, p) => sum + p.total_members,
            0,
          ),
        };
      }
    }

    res.render("dashboard/dashboard", {
      title: "Dashboard - Accelerator",
      bodyClass: "dashboard-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      lng: req.language || "en",
      activeNav: "dashboard",
      projects: res.locals.projects,
      stats: {
        ...dashboardData.stats,
        portfolios: portfolioStats || {
          total: 0,
          totalIdeas: 0,
          avgCompletion: 0,
          totalTeamMembers: 0,
        },
        activity: dashboardData.recent_activity || [],
        votes: {
          totalGiven: dashboardData.stats?.votes?.total_given || 0,
          recent: dashboardData.recent_votes || [],
        },
      },
    });
  } catch (error) {
    logger.error("Dashboard error:", error);
    res.render("dashboard/dashboard", {
      title: "Dashboard - Accelerator",
      bodyClass: "dashboard-page",
      layout: "main",
      user: req.user,
      activeNav: "dashboard",
      lng: req.language || "en",
      projects: res.locals.projects,
      stats: {
        profile: {},
        ideas: { total: 0, completed: 0, completionRate: 0, averageRating: 0 },
        credits: {
          currentBalance: 0,
          earned30d: 0,
          spent30d: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
        activity: [],
        models: {},
        votes: { totalGiven: 0, recent: [] },
        portfolios: {
          total: 0,
          totalIdeas: 0,
          avgCompletion: 0,
          totalTeamMembers: 0,
        },
      },
    });
  }
});

// Portfolios page (Enterprise only)
router.get("/portfolios", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", req.user.id)
    .single();

  // Attach profile to user for nav conditional rendering
  req.user.profile = profile;

  if (profile?.package_type !== "enterprise") {
    return res.redirect("/dashboard");
  }

  // Get user's portfolios with aggregated data (owned + member portfolios)
  const { data: ownedPortfolios } = await supabase
    .from("portfolios")
    .select(
      `
       *,
       portfolio_ideas (
         idea_id,
         ideas (
           id,
           title,
           completion_percentage,
           overall_status,
           rating,
           category,
           created_at
         )
       ),
       portfolio_members (
         user_id,
         role
       )
     `,
    )
    .eq("user_id", req.user.id);

  const { data: memberPortfolios } = await supabase
    .from("portfolios")
    .select(
      `
       *,
       portfolio_ideas (
         idea_id,
         ideas (
           id,
           title,
           completion_percentage,
           overall_status,
           rating,
           category,
           created_at
         )
       ),
       portfolio_members!inner (
         user_id,
         role
       )
     `,
    )
    .eq("portfolio_members.user_id", req.user.id);

  // Combine and deduplicate portfolios
  const portfolioMap = new Map();
  [...(ownedPortfolios || []), ...(memberPortfolios || [])].forEach(
    (portfolio) => {
      if (!portfolioMap.has(portfolio.id)) {
        portfolioMap.set(portfolio.id, {
          ...portfolio,
          isOwner: portfolio.user_id === req.user.id,
          memberRole: portfolio.portfolio_members?.find(
            (m) => m.user_id === req.user.id,
          )?.role,
        });
      }
    },
  );
  const portfolios = Array.from(portfolioMap.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  // Calculate overall portfolio stats
  const portfolioStats = {
    total: 0,
    totalIdeas: 0,
    avgCompletion: 0,
    totalTeamMembers: 0,
  };

  let formattedPortfolios = [];
  if (portfolios) {
    portfolioStats.total = portfolios.length;

    formattedPortfolios = portfolios.map((portfolio) => {
      const ideas =
        portfolio.portfolio_ideas?.map((pi) => pi.ideas).filter(Boolean) || [];
      const members = portfolio.portfolio_members || [];

      const stats = {
        totalIdeas: ideas.length,
        completedIdeas: ideas.filter(
          (idea) => idea.overall_status === "completed",
        ).length,
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

      // Update global stats
      portfolioStats.totalIdeas += stats.totalIdeas;
      portfolioStats.totalTeamMembers += stats.totalMembers;

      return {
        ...portfolio,
        ideaCount: stats.totalIdeas,
        completionRate: Math.round(stats.averageCompletion),
        teamMembers: members.map((member) => ({
          name: member.profiles?.name || "Unknown",
          avatar: member.profiles?.avatar_url,
          role: member.role,
        })),
        ideas,
        members,
      };
    });

    // Calculate average completion across all portfolios
    portfolioStats.avgCompletion =
      portfolioStats.totalIdeas > 0
        ? Math.round(
            formattedPortfolios.reduce(
              (sum, p) => sum + (p.completionRate || 0),
              0,
            ) / formattedPortfolios.length,
          )
        : 0;
  }

  res.render("dashboard/portfolios", {
    title: "Portfolios - Accelerator",
    bodyClass: "portfolios-page",
    layout: "main",
    user: req.user,
    lng: req.language || "en",
    portfolios: formattedPortfolios,
    stats: { portfolios: portfolioStats },
  });
});

// Rewards page
router.get("/rewards", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  try {
    // Get user's rewards
    const { data: rewards, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching rewards:", error);
    }

    // Calculate totals
    const totalRewards = (rewards || []).reduce((sum, r) => sum + r.amount, 0);

    res.render("dashboard/rewards", {
      title: "Rewards - Accelerator",
      bodyClass: "rewards-page",
      layout: "main",
      user: req.user,
      rewards: rewards || [],
      totalRewards,
      lng: req.language || "en",
      projects: res.locals.projects,
    });
  } catch (error) {
    logger.error("Rewards page error:", error);
    res.status(500).render("error", {
      message: "Failed to load rewards",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

export default router;
