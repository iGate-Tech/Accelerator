import express from "express";
import { requireAuth } from "../../session.js";

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

  // Load translations for the current language
  const lng = req.language || "en";
  let translations = {};

  try {
    const fs = await import("fs");
    const path = await import("path");

    // Load main translation file
    const mainTranslationPath = path.join(
      process.cwd(),
      "locales",
      lng,
      "translation.json",
    );
    if (fs.existsSync(mainTranslationPath)) {
      const mainTranslations = JSON.parse(
        fs.readFileSync(mainTranslationPath, "utf8"),
      );
      translations = { ...translations, ...mainTranslations };
    }

    // Load specific translation files used by the package page
    const translationFiles = ["package", "billing", "buy-credits"];
    for (const file of translationFiles) {
      const filePath = path.join(process.cwd(), "locales", lng, `${file}.json`);
      if (fs.existsSync(filePath)) {
        const fileTranslations = JSON.parse(fs.readFileSync(filePath, "utf8"));
        translations = { ...translations, ...fileTranslations };
      }
    }
  } catch (error) {
    console.error("Error loading translations:", error);
  }

  res.render("auth/package", {
    title: "Onboarding - Package Selection",
    bodyClass: "onboarding-package-page",
    layout: "auth",
    user: req.user,
    packages: packages || [],
    currentBalance: userProfile?.credit_balance || 0,
    lng: lng,
    translations: translations,
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

    res.redirect("/onboarding/profile");
  } catch (error) {
    console.error("Package selection error:", error);
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
    profile: profile || {},
    lng: req.language || "en",
  });
});

// Handle profile setup
router.post("/onboarding/profile", requireAuth, async (req, res) => {
  try {
    const { name, role, bio, location, website } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.redirect("/onboarding/profile");
    }

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

    // Mark onboarding as completed in user preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("user_id", req.user.id)
      .single();

    const updatedPreferences = {
      ...profile.preferences,
      tutorial_completed: true,
      tutorial_completed_at: new Date().toISOString(),
      onboarding_complete: true,
    };

    await supabase
      .from("profiles")
      .update({ preferences: updatedPreferences })
      .eq("user_id", req.user.id);

    // Create profile completion notification
    await supabase.from("notifications").insert({
      user_id: req.user.id,
      type: "profile_complete",
      message:
        "✅ Profile setup complete! You're now ready to create and validate your first idea.",
      is_read: false,
    });

    res.redirect("/new-idea");
  } catch (error) {
    console.error("Profile setup error:", error);
    res.redirect("/onboarding/profile");
  }
});

export default router;
