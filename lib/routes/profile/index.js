import express from "express";
import { optionalAuth, requireAuth } from "../../session.js";
import { initializeUserProfile } from "../../utils/profile-init.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// Profile page - public view
router.get("/:userId", optionalAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session?.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  try {
    const { userId } = req.params;

    // Check if viewing own profile
    const isOwnProfile = !!(req.user?.id && req.user.id === userId);

    // Get user profile
    let { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, user_id, name, bio, location, avatar_url, credit_balance, package_type, created_at, updated_at",
      )
      .eq("user_id", userId)
      .single();

    // If profile exists but has missing data, update it with user metadata
    if (profile && req.user) {
      const updates = {};

      if (!profile.name || profile.name === "User") {
        const updatedName =
          req.user.user_metadata?.firstName && req.user.user_metadata?.lastName
            ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
            : req.user.email?.split("@")[0] || "User";
        if (updatedName && updatedName !== profile.name) {
          updates.name = updatedName;
          profile.name = updatedName;
        }
      }

      if (!profile.avatar_url && req.user.user_metadata?.avatar_url) {
        updates.avatar_url = req.user.user_metadata.avatar_url;
        profile.avatar_url = req.user.user_metadata.avatar_url;
      }

      if (Object.keys(updates).length > 0) {
        // Update in database
        await supabase.from("profiles").update(updates).eq("user_id", userId);
      }
    }

    // If profile doesn't exist, try to create it for the user's own profile
    if (!profile) {
      if (req.user && req.user.id === userId) {
        // User is accessing their own profile - try to create it
        try {
          const profileName =
            req.user.user_metadata?.firstName &&
            req.user.user_metadata?.lastName
              ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
              : req.user.email?.split("@")[0] || "User";

          const { data: newProfile, error } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              name: profileName,
              package_type: "free",
              credit_balance: 1000,
            })
            .select(
              "id, user_id, name, bio, location, avatar_url, credit_balance, package_type, created_at, updated_at",
            )
            .single();

          if (!error && newProfile) {
            profile = newProfile;
          }
        } catch (err) {
          logger.error("Failed to create profile:", err);
        }
      } else {
        // User is accessing someone else's profile - don't create if doesn't exist
        return res.status(404).render("error", {
          title: "User Not Found",
          message: "The user you're looking for doesn't exist.",
        });
      }
    }

    // Get user's public ideas
    const { data: ideas } = await supabase
      .from("ideas")
      .select(
        "id, title, description, completion_percentage, overall_status, rating, category, created_at, privacy",
      )
      .eq("user_id", userId)
      .eq("privacy", "public");

    // Calculate stats
    const totalIdeas = ideas?.length || 0;
    const completedIdeas =
      ideas?.filter((idea) => idea.overall_status === "completed").length || 0;
    const averageRating =
      ideas?.length > 0
        ? ideas.reduce((sum, idea) => sum + (idea.rating || 0), 0) /
          ideas.length
        : 0;

    // Get recent public activity
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select("id, action_type, entity_type, created_at, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Ensure we have a profile object even if creation failed
    // Merge profile data with user metadata
    const profileData = profile
      ? {
          ...profile,
          // Override with user metadata if available
          name:
            profile.name ||
            (req.user &&
            req.user.user_metadata?.firstName &&
            req.user.user_metadata?.lastName
              ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
              : req.user?.email?.split("@")[0] || "User"),
          avatar_url:
            profile.avatar_url ||
            req.user?.user_metadata?.avatar_url ||
            "/images/avatar.png",
        }
      : {
          id: null,
          user_id: userId,
          name:
            req.user &&
            req.user.user_metadata?.firstName &&
            req.user.user_metadata?.lastName
              ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
              : req.user?.email?.split("@")[0] || "User",
          bio: null,
          location: null,
          avatar_url:
            req.user?.user_metadata?.avatar_url || "/images/avatar.png",
          credit_balance: 0,
          package_type: "free",
          created_at: new Date().toISOString(),
        };

    // Get projects for sidebar (only if logged in)
    let projects = [];
    if (req.user) {
      const { data: projectsData } = await supabase
        .from("ideas")
        .select("id, title, completion_percentage")
        .eq("user_id", req.user.id)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });
      projects = projectsData || [];
    }

    // Get package details
    const { data: packages } = await supabase
      .from("packages")
      .select("type, name")
      .order("price_monthly", { ascending: true });

    const packageDetails =
      profileData && profileData.package_type
        ? packages?.find((p) => p.type === profileData.package_type)
        : null;

    // Fallback package names if packages table is not available
    const fallbackPackageNames = {
      free: "Free Plan",
      student: "Student Plan",
      enterprise: "Enterprise Plan",
    };

    res.render("profile/view", {
      title: `${profileData.name || "User"}'s Profile - Accelerator`,
      bodyClass: "profile-page",
      layout: "main",
      user: req.user,
      profile: profileData,
      profileUser: {
        id: userId,
        ...profileData,
        packageName:
          packageDetails?.name ||
          fallbackPackageNames[profileData.package_type] ||
          profileData.package_type,
      },
      projects: projects,
      publicIdeas: ideas || [],
      isOwnProfile,
      stats: {
        ideas: {
          total: totalIdeas,
          completed: completedIdeas,
          completionRate:
            totalIdeas > 0
              ? Math.round((completedIdeas / totalIdeas) * 100)
              : 0,
          averageRating: averageRating.toFixed(1),
        },
        activity: recentActivity || [],
      },
      lng: req.language || "en",
      activeNav: isOwnProfile ? "dashboard" : "",
    });
  } catch (error) {
    logger.error("Profile page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load profile",
    });
  }
});

export default router;
