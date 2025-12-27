// Ultra-minimal server-side API - everything automated by database
import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

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
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Dashboard - uses automated views
router.get("/dashboard", async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// Ideas - ultra-minimal
router.get("/ideas", async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });
  res.json(data);
});

router.post("/ideas", async (req, res) => {
  const { data } = await supabase.rpc("validate_and_create_idea", req.body);
  res.json(data);
});

// Votes - automated
router.post("/votes", async (req, res) => {
  const { data } = await supabase.rpc("validate_and_cast_vote", {
    p_idea_id: req.body.idea_id,
    p_user_id: req.user.id,
    p_rating: req.body.rating,
  });
  res.json(data);
});

// Settings - uses automated functions
router.get("/settings", async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: "get",
  });
  res.json(data);
});

router.post("/settings", async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: req.body.action || "update",
    p_settings: req.body,
  });
  res.json(data);
});

// Leaderboards - automated
router.get("/leaderboards", async (req, res) => {
  const { data } = await supabase.rpc("get_automated_leaderboards", {
    p_type: req.query.type,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Recommendations - automated
router.get("/recommendations", async (req, res) => {
  const { data } = await supabase.rpc("get_idea_recommendations", {
    p_user_id: req.user.id,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Achievements - automated
router.get("/achievements", async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// System health - automated
router.get("/health", async (req, res) => {
  const { data } = await supabase.rpc("get_system_health_dashboard");
  res.json(data);
});

export default router;
