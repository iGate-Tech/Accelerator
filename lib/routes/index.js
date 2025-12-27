// ULTRA-MINIMAL ROUTES - Maximum Automation Achieved
// Everything is now handled by database functions and triggers
// Server-side code is reduced to HTTP routing and external API calls

import express from "express";
import { optionalAuth, requireAuth } from "../session.js";
import { createClient } from "@supabase/supabase-js";
import config from "../config.js";
import logger from "../utils/logger.js";

// Import remaining essential route modules
import profile from "./profile/index.js";
import ai from "./ai/index.js";
import api from "./api/index.js";

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

// SYSTEM HEALTH - Automated monitoring
router.get("/health", async (req, res) => {
  const { data } = await supabase.rpc("get_system_health_dashboard");
  res.json(data);
});

// MOUNT REMAINING ESSENTIAL ROUTE MODULES
// These contain specialized functionality not covered by universal API
router.use("/profile", profile);
router.use("/api/ai", ai);
router.use("/api", api);

export default router;
