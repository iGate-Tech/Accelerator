import express from "express";
import { requireAuth, optionalAuth } from "../../session.js";

const router = express.Router();

// Package selection page
router.get("/onboarding/package", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get available packages
  const { data: packages, error } = await supabase
    .from("packages")
    .select("*")
    .order("price_monthly");

  if (error) {
    console.error("Error fetching packages:", error);
  }

  res.render("auth/package", {
    title: "Choose Your Plan - Accelerator",
    bodyClass: "onboarding-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    packages: packages || [],
    lng: req.language || "en",
  });
});

// Handle package selection
router.post("/onboarding/package", requireAuth, async (req, res) => {
  try {
    const { package_type } = req.body;

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("*")
      .eq("type", package_type)
      .single();

    if (packageError || !packageData) {
      req.session.flash.error.push("Invalid package selected");
      return res.redirect("/onboarding/package");
    }

    // Update user profile with selected package
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        package_type: packageData.type,
        package_status: "active",
        package_started: new Date().toISOString(),
        credit_balance: packageData.credits_monthly,
        total_earned: packageData.credits_monthly,
      })
      .eq("user_id", req.user.id);

    if (updateError) {
      console.error("Error updating profile with package:", updateError);
      req.session.flash.error.push("Failed to activate package");
      return res.redirect("/onboarding/package");
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: req.user.id,
      action_type: "package_selected",
      entity_type: "package",
      entity_id: packageData.id,
      details: {
        package_type: packageData.type,
        credits_allocated: packageData.credits_monthly,
      },
    });

    req.session.flash.success.push(
      `Welcome to Accelerator! You've been allocated ${packageData.credits_monthly} credits.`,
    );
    res.redirect("/onboarding/profile");
  } catch (error) {
    console.error("Package selection error:", error);
    req.session.flash.error.push("An error occurred while selecting package");
    res.redirect("/onboarding/package");
  }
});

// Profile setup page
router.get("/onboarding/profile", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", req.user.id)
    .single();

  res.render("auth/profile", {
    title: "Complete Your Profile - Accelerator",
    bodyClass: "onboarding-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    profile: profile || {},
    lng: req.language || "en",
  });
});

// Handle profile setup
router.post("/onboarding/profile", requireAuth, async (req, res) => {
  try {
    const { name, role, bio, location, website } = req.body;

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        role,
        preferences: {
          bio,
          location,
          website,
        },
      })
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Error updating profile:", error);
      req.session.flash.error.push("Failed to update profile");
      return res.redirect("/onboarding/profile");
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: req.user.id,
      action_type: "profile_completed",
      entity_type: "profile",
      entity_id: req.user.id,
      details: { name, role },
    });

    // Create profile completion notification
    await supabase.from("notifications").insert({
      user_id: req.user.id,
      type: "profile_complete",
      message:
        "✅ Profile setup complete! You're now ready to create and validate your first idea.",
      is_read: false,
    });

    req.session.flash.success.push(
      "Profile completed! Let's take a quick tour of the platform.",
    );
    res.redirect("/onboarding/tutorial");
  } catch (error) {
    console.error("Profile setup error:", error);
    req.session.flash.error.push("An error occurred while setting up profile");
    res.redirect("/onboarding/profile");
  }
});

// Tutorial page
router.get("/onboarding/tutorial", optionalAuth, (req, res) => {
  res.render("auth/tutorial", {
    title: "Tutorial - Accelerator",
    bodyClass: "onboarding-tutorial-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    lng: req.language || "en",
  });
});

// Complete tutorial
router.post("/onboarding/tutorial", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.key,
  );

  // Mark tutorial as completed in user preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("user_id", req.user.id)
    .single();

  const updatedPreferences = {
    ...profile.preferences,
    tutorial_completed: true,
    tutorial_completed_at: new Date().toISOString(),
  };

  await supabase
    .from("profiles")
    .update({ preferences: updatedPreferences })
    .eq("user_id", req.user.id);

  req.session.flash.success.push(
    "Tutorial completed! Welcome to Accelerator. Start by creating your first idea.",
  );
  res.redirect("/new-idea");
});

export default router;
