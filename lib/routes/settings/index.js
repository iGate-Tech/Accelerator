import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// Settings page
router.get("/settings", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", req.user.id)
    .single();

  // Get user settings
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", req.user.id);

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }

  if (settingsError) {
    console.error("Error fetching settings:", settingsError);
  }

  // Convert settings array to object
  const settingsObj = {};
  if (settings) {
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });
  }

  res.render("dashboard/settings", {
    title: "Settings - Accelerator",
    bodyClass: "settings-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    profile: profile || {},
    settings: settingsObj,
  });
});

// Update profile settings
router.post("/settings/profile", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { name, role, bio, location, website, social_links } = req.body;
    const updateData = { name, role };

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      const avatarFile = req.files.avatar;
      const fileName = `${req.user.id}_${Date.now()}_${avatarFile.name}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile.data, {
          contentType: avatarFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        req.session.flash.error.push("Failed to upload avatar");
      } else {
        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        updateData.avatar_url = publicUrl;
      }
    }

    // Build preferences object
    const preferences = {};
    if (bio !== undefined) preferences.bio = bio;
    if (location !== undefined) preferences.location = location;
    if (website !== undefined) preferences.website = website;
    if (social_links !== undefined) {
      try {
        preferences.social_links = JSON.parse(social_links);
      } catch {
        preferences.social_links = social_links;
      }
    }

    if (Object.keys(preferences).length > 0) {
      updateData.preferences = preferences;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Error updating profile:", error);
      req.session.flash.error.push("Failed to update profile");
    } else {
      req.session.flash.success.push("Profile updated successfully");
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Profile update error:", error);
    req.session.flash.error.push("An error occurred while updating profile");
    res.redirect("/settings");
  }
});

// Notification page
router.get("/notification", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false);

  res.render("notifications/notification", {
    title: "Notifications - Accelerator",
    bodyClass: "notification-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    unreadCount: unreadCount || 0,
  });
});

// User Activity page
router.get("/user-activity", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Fetch user activity
  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching user activity:", error);
  }

  // Group activities by date
  const groupedActivities = {};
  (activities || []).forEach((activity) => {
    const date = new Date(activity.created_at).toDateString();
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  res.render("dashboard/user-activity", {
    title: "User Activity - Accelerator",
    bodyClass: "user-activity-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    activities: activities || [],
    groupedActivities,
  });
});

// Update package
router.post("/settings/package", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { package_type } = req.body;

    // Validate package type
    if (!["free", "student", "enterprise"].includes(package_type)) {
      req.session.flash.error.push("Invalid package type");
      return res.redirect("/settings");
    }

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching current profile:", fetchError);
      req.session.flash.error.push("Failed to update package");
      return res.redirect("/settings");
    }

    // Calculate credit allocation based on package
    const creditAllocations = {
      free: 50,
      student: 500,
      enterprise: 2000,
    };

    const newCredits = creditAllocations[package_type];
    const creditDifference = newCredits - (currentProfile.credit_balance || 0);

    // Update package and credits
    const updateData = {
      package_type,
      package_status: "active",
      package_started: new Date().toISOString(),
      credit_balance: newCredits,
    };

    // Set expiration for paid packages (30 days from now)
    if (package_type !== "free") {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      updateData.package_expires = expires.toISOString();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", req.user.id);

    if (updateError) {
      console.error("Error updating package:", updateError);
      req.session.flash.error.push("Failed to update package");
    } else {
      // Log credit transaction if credits changed
      if (creditDifference !== 0) {
        await supabase.from("credit_transactions").insert({
          user_id: req.user.id,
          transaction_type: "credit_purchase",
          amount: creditDifference,
          metadata: { reason: `Package change to ${package_type}` },
        });
      }

      req.session.flash.success.push(
        `Package updated to ${package_type.charAt(0).toUpperCase() + package_type.slice(1)}`,
      );
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Package update error:", error);
    req.session.flash.error.push("An error occurred while updating package");
    res.redirect("/settings");
  }
});

export default router;
