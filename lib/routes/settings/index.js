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

  // Get package details if profile exists
  let packageDetails = null;
  if (profile && profile.package_type) {
    const { data: pkgData } = await supabase
      .from("packages")
      .select("name")
      .eq("type", profile.package_type)
      .single();
    packageDetails = pkgData;
  }

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

  // Set default theme if not set
  if (!settingsObj.theme) {
    settingsObj.theme = "light";
  }

  // Set default language if not set
  if (!settingsObj.language) {
    settingsObj.language = "en";
  }

  res.render("dashboard/settings", {
    title: "Settings - Accelerator",
    bodyClass: "settings-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    profile: profile || {},
    settings: settingsObj,
    packageDetails: packageDetails,
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
router.get("/notifications", requireAuth, async (req, res) => {
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

  // Get notifications for SSR
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Set for nav dropdown SSR
  res.locals.notifications = notifications || [];
  res.locals.unreadCount = unreadCount || 0;

  res.render("notifications/notification", {
    title: "Notifications - Accelerator",
    bodyClass: "notification-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    unreadCount: unreadCount || 0,
    notifications: notifications || [],
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

// Update password
router.post("/settings/password", requireAuth, async (req, res) => {
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

    const { current_password, new_password, confirm_password } = req.body;

    // Validate passwords
    if (!current_password || !new_password || !confirm_password) {
      req.session.flash.error.push("All password fields are required");
      return res.redirect("/settings");
    }

    if (new_password !== confirm_password) {
      req.session.flash.error.push("New passwords do not match");
      return res.redirect("/settings");
    }

    if (new_password.length < 8) {
      req.session.flash.error.push(
        "Password must be at least 8 characters long",
      );
      return res.redirect("/settings");
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) {
      console.error("Error updating password:", error);
      req.session.flash.error.push("Failed to update password");
    } else {
      req.session.flash.success.push("Password updated successfully");
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Password update error:", error);
    req.session.flash.error.push("An error occurred while updating password");
    res.redirect("/settings");
  }
});

// Update theme setting
router.post("/settings/theme", requireAuth, async (req, res) => {
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

    const { theme } = req.body;

    // Validate theme
    if (!["light", "dark"].includes(theme)) {
      req.session.flash.error.push("Invalid theme");
      return res.redirect("/settings");
    }

    // Update theme setting
    const { error: deleteError } = await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", req.user.id)
      .eq("key", "theme");

    if (deleteError) {
      console.error("Error deleting existing theme:", deleteError);
    }

    const { error } = await supabase.from("user_settings").insert({
      user_id: req.user.id,
      key: "theme",
      value: theme,
    });

    if (error) {
      console.error("Error updating theme:", error);
      req.session.flash.error.push("Failed to update theme");
    } else {
      req.session.flash.success.push("Theme updated successfully");
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Theme update error:", error);
    req.session.flash.error.push("An error occurred while updating theme");
    res.redirect("/settings");
  }
});

// Update language setting
router.post("/settings/language", requireAuth, async (req, res) => {
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

    const { language } = req.body;

    // Validate language
    if (!["en", "ar"].includes(language)) {
      req.session.flash.error.push("Invalid language");
      return res.redirect("/settings");
    }

    // Update language setting
    const { error: deleteError } = await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", req.user.id)
      .eq("key", "language");

    if (deleteError) {
      console.error("Error deleting existing language:", deleteError);
    }

    const { error } = await supabase.from("user_settings").insert({
      user_id: req.user.id,
      key: "language",
      value: language,
    });

    if (error) {
      console.error("Error updating language:", error);
      req.session.flash.error.push("Failed to update language");
    } else {
      req.session.flash.success.push("Language updated successfully");
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Language update error:", error);
    req.session.flash.error.push("An error occurred while updating language");
    res.redirect("/settings");
  }
});

// Update notification settings
router.post("/settings/notifications", requireAuth, async (req, res) => {
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

    // Extract notification preferences
    const notificationSettings = {};
    const emailSettings = {};
    const pushSettings = {};

    // Email settings
    if (req.body.email_project_updates !== undefined)
      emailSettings.project_updates = true;
    if (req.body.email_billing !== undefined) emailSettings.billing = true;
    if (req.body.email_marketing !== undefined) emailSettings.marketing = true;

    // Push settings
    if (req.body.push_messages !== undefined) pushSettings.messages = true;
    if (req.body.push_reminders !== undefined) pushSettings.reminders = true;

    notificationSettings.email = emailSettings;
    notificationSettings.push = pushSettings;

    // Update user settings
    const settingsToUpdate = [
      {
        key: "notifications_email_project_updates",
        value: emailSettings.project_updates || false,
      },
      {
        key: "notifications_email_billing",
        value: emailSettings.billing || false,
      },
      {
        key: "notifications_email_marketing",
        value: emailSettings.marketing || false,
      },
      {
        key: "notifications_push_messages",
        value: pushSettings.messages || false,
      },
      {
        key: "notifications_push_reminders",
        value: pushSettings.reminders || false,
      },
    ];

    // Delete existing settings
    await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", req.user.id)
      .in(
        "key",
        settingsToUpdate.map((s) => s.key),
      );

    // Insert new settings
    const { error } = await supabase.from("user_settings").insert(
      settingsToUpdate.map((setting) => ({
        user_id: req.user.id,
        key: setting.key,
        value: setting.value,
      })),
    );

    if (error) {
      console.error("Error updating notification settings:", error);
      req.session.flash.error.push("Failed to update notification settings");
    } else {
      req.session.flash.success.push(
        "Notification settings updated successfully",
      );
    }

    res.redirect("/settings");
  } catch (error) {
    console.error("Notification settings update error:", error);
    req.session.flash.error.push(
      "An error occurred while updating notification settings",
    );
    res.redirect("/settings");
  }
});

export default router;
