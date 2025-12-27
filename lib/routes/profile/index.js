// ULTRA-MINIMAL PROFILE ROUTES - Uses automated views and functions
import express from "express";
import { requireAuth } from "../../session.js";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Profile view - Uses user_achievements and user_onboarding_status views
router.get("/:userId", requireAuth, async (req, res) => {
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
