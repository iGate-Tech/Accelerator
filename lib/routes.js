// ULTRA-MINIMAL ROUTES - Maximum Automation Achieved
// Everything is now handled by database functions and triggers
// Server-side code is reduced to HTTP routing and external API calls

import express from "express";
import { optionalAuth, requireAuth } from "../session.js";
import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

// Import services for AI routes
import { callOpenRouter } from "../utils.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Language prefix middleware (simplified)
router.use("/:lang(en|ar)?", (req, res, next) => {
  if (req.params.lang) {
    req.language = req.params.lang;
  }
  next();
});

// HOME PAGE - Landing page (always public)
router.get("/", optionalAuth, (req, res) => {
  res.render("auth/landingpage", {
    title: "Accelerator - Build Your Startup",
    bodyClass: "home-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: false,
  });
});

// STATIC PAGES - Terms & Privacy (public access)
router.get("/terms", optionalAuth, (req, res) => {
  res.render("auth/terms", {
    title: "Terms and Conditions - Accelerator",
    bodyClass: "terms-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
  });
});

router.get("/privacy", optionalAuth, (req, res) => {
  res.render("auth/privacy", {
    title: "Privacy Policy - Accelerator",
    bodyClass: "privacy-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
  });
});

// AUTHENTICATED PAGES - Use automated views and functions

// Dashboard - Uses get_enhanced_dashboard_data
router.get("/dashboard", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });

  res.render("dashboard/index", {
    title: "Dashboard - Accelerator",
    user: req.user,
    dashboardData: data,
    lng: req.language || "en",
  });
});

// Ideas - Uses comprehensive_idea_operations
router.get("/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });

  res.render("ideas/index", {
    title: "Ideas - Accelerator",
    user: req.user,
    ideas: data?.ideas || [],
    lng: req.language || "en",
  });
});

// Settings - Uses manage_user_settings
router.get("/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: "get",
  });

  res.render("settings/index", {
    title: "Settings - Accelerator",
    user: req.user,
    settings: data,
    lng: req.language || "en",
  });
});

// Leaderboards - Uses get_automated_leaderboards
router.get("/leaderboards", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_automated_leaderboards", {
    p_type: req.query.type,
    p_limit: req.query.limit || 10,
  });

  res.render("leaderboards/index", {
    title: "Leaderboards - Accelerator",
    user: req.user,
    leaderboards: data?.leaderboards || {},
    lng: req.language || "en",
  });
});

// Achievements - Uses get_user_achievements
router.get("/achievements", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });

  res.render("achievements/index", {
    title: "Achievements - Accelerator",
    user: req.user,
    achievements: data,
    lng: req.language || "en",
  });
});

// Voting & Rewards - Uses automated views
router.get("/voting-rewards", requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Get all voting data from automated views and functions
  const { data: votingData } = await supabase.rpc("get_voting_dashboard_data", {
    p_user_id: userId,
  });

  // Get leaderboard from automated view
  const { data: leaderboard } = await supabase
    .from("automated_leaderboards")
    .select("*")
    .limit(10);

  // Get recent notifications (still needed for display)
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  res.render("voting/rewards", {
    title: "Voting & Rewards - Accelerator",
    user: req.user,
    votingData,
    leaderboard: leaderboard || [],
    notifications: notifications || [],
    lng: req.language || "en",
  });
});

// HTMX ENDPOINTS - For dynamic content loading
router.get("/dashboard/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

router.get("/ideas/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });
  res.json(data);
});

router.get("/achievements/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// Universal API endpoint - delegates everything to database functions
router.all("/api/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const { data, error } = await supabase.rpc(action, {
      p_user_id: req.user?.id,
      p_data: req.method === "GET" ? req.query : req.body,
      p_action: req.query.action || req.body.action,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Dashboard API - uses automated views
router.get("/api/dashboard", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// Ideas API - ultra-minimal
router.get("/api/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });
  res.json(data);
});

router.post("/api/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("validate_and_create_idea", req.body);
  res.json(data);
});

// Votes - automated
router.post("/api/votes", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("validate_and_cast_vote", {
    p_idea_id: req.body.idea_id,
    p_user_id: req.user.id,
    p_rating: req.body.rating,
  });
  res.json(data);
});

// Settings - uses automated functions
router.get("/api/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: "get",
  });
  res.json(data);
});

router.post("/api/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: req.body.action || "update",
    p_settings: req.body,
  });
  res.json(data);
});

// Leaderboards - automated
router.get("/api/leaderboards", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_automated_leaderboards", {
    p_type: req.query.type,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Recommendations - automated
router.get("/api/recommendations", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_idea_recommendations", {
    p_user_id: req.user.id,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Achievements - automated
router.get("/api/achievements", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// System health - automated
router.get("/api/health", async (req, res) => {
  const { data } = await supabase.rpc("get_system_health_dashboard");
  res.json(data);
});

// AI routes - Apply authentication to all AI routes
router.use("/api/ai", requireAuth);

// Universal AI endpoint - delegates to external services
router.post("/api/ai/generate/:provider/:action", async (req, res) => {
  try {
    const { provider } = req.params;
    const { prompt, model, options } = req.body;

    // Credit validation and activity logging handled by database triggers
    // Only OpenRouter supported now
    if (provider !== "openrouter") {
      return res.status(400).json({ error: "Only OpenRouter is supported" });
    }
    const result = await callOpenRouter(prompt, { model, ...options });

    res.json(result);
  } catch {
    res.status(500).json({ error: "AI service error" });
  }
});

// GET /api/ai/models - Available models (static data)
router.get("/api/ai/models", (req, res) => {
  res.json({
    success: true,
    providers: ["openrouter"],
    models: {
      openrouter: ["google/gemma-3n-e2b-it:free"],
    },
  });
});

// Legacy endpoints - now delegate to universal endpoint
router.post("/api/ai/generate-content", async (req, res) => {
  // This now uses the universal AI endpoint above with OpenRouter
  const { model, input: prompt } = req.body;
  const provider = "openrouter";

  const response = await fetch(
    `${req.protocol}://${req.get("host")}/api/ai/generate/${provider}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization,
      },
      body: JSON.stringify({ prompt, model }),
    },
  );

  const result = await response.json();
  res.json(result);
});

// Profile routes - Profile view - Uses user_achievements and user_onboarding_status views
router.get("/profile/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const isOwnProfile = req.user?.id === userId;

  // Get comprehensive profile data from automated views
  const { data: achievements } = await supabase.rpc("get_user_achievements", {
    p_user_id: userId,
  });

  const { data: onboarding } = await supabase.rpc(
    "get_user_onboarding_status",
    {
      p_user_id: userId,
    },
  );

  // Get public ideas using the ideas view
  const { data: publicIdeas } = await supabase
    .from("ideas_with_full_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("privacy", "public")
    .limit(10);

  res.render("profile/view", {
    title: `${onboarding?.name || "User"}'s Profile - Accelerator`,
    bodyClass: "profile-page",
    layout: "main",
    user: req.user,
    profile: {
      ...onboarding,
      achievements,
      stats: achievements?.statistics,
    },
    profileUser: {
      id: userId,
      ...onboarding,
      achievements: achievements?.unlocked_achievements,
      stats: achievements?.statistics,
    },
    publicIdeas: publicIdeas || [],
    isOwnProfile,
    lng: req.language || "en",
    activeNav: isOwnProfile ? "dashboard" : "",
  });
});

export default router;
