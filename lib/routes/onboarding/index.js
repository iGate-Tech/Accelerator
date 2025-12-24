import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// Plan selection page
router.get("/onboarding/plan", requireAuth, async (req, res) => {
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

  // Add yearly pricing
  if (packages) {
    packages.forEach((pkg) => {
      pkg.price_yearly = pkg.price_monthly * 10; // Assuming 2 months free
      pkg.credits_yearly = pkg.credits_monthly * 12;
    });
  }

  // Load translations for the current language
  const lng = req.language || "en";

  res.render("auth/plan", {
    title: "Onboarding - Choose Plan",
    bodyClass: "onboarding-plan-page",
    layout: "auth",
    user: req.user,
    packages: packages || [],
    lng: lng,
  });
});

// Handle plan selection
router.post("/onboarding/plan", requireAuth, (req, res) => {
  try {
    const { package_type } = req.body;

    if (!package_type) {
      return res.redirect("/onboarding/plan");
    }

    // Store selected package in session
    req.session.selectedPackage = package_type;
    res.redirect("/onboarding/payment");
  } catch (error) {
    console.error("Plan selection error:", error);
    res.redirect("/onboarding/plan");
  }
});

// Payment method page
router.get("/onboarding/payment", requireAuth, async (req, res) => {
  if (!req.session.selectedPackage) {
    return res.redirect("/onboarding/plan");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get selected package details
  const { data: selectedPackage, error } = await supabase
    .from("packages")
    .select("*")
    .eq("type", req.session.selectedPackage)
    .single();

  if (error || !selectedPackage) {
    return res.redirect("/onboarding/plan");
  }

  // Load translations for the current language
  const lng = req.language || "en";

  res.render("auth/payment", {
    title: "Onboarding - Add Payment Method",
    bodyClass: "onboarding-payment-page",
    layout: "auth",
    user: req.user,
    selectedPackage: selectedPackage,
    lng: lng,
  });
});

// Handle payment method addition
router.post("/onboarding/payment", requireAuth, async (req, res) => {
  try {
    const {
      cardType,
      cardNumber,
      expiryDate,
      cardholderName,
      address,
      city,
      zipCode,
      country,
      state,
    } = req.body;

    if (!req.session.selectedPackage) {
      return res.redirect("/onboarding/plan");
    }

    const package_type = req.session.selectedPackage;
    delete req.session.selectedPackage; // Clear session

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
      return res.redirect("/onboarding/plan");
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
      return res.redirect("/onboarding/plan");
    }

    // Store payment method reference (in real app, store tokenized card info)
    const paymentMethodData = {
      type: cardType,
      last4: cardNumber.slice(-4),
      expiry: expiryDate,
      cardholder_name: cardholderName,
      billing_address: {
        address,
        city,
        zipCode,
        country,
        state,
      },
    };

    console.log("Payment method added:", {
      userId: req.user.id,
      ...paymentMethodData,
    });

    // Log activities
    await supabase.from("activity_log").insert([
      {
        user_id: req.user.id,
        action_type: "package_selected",
        entity_type: "package",
        entity_id: packageData.id,
        details: {
          package_type: packageData.type,
          credits_allocated: packageData.credits_monthly,
        },
      },
      {
        user_id: req.user.id,
        action_type: "payment_method_added",
        entity_type: "payment_method",
        entity_id: null,
        details: { type: cardType, last4: cardNumber.slice(-4) },
      },
    ]);

    res.redirect("/onboarding/profile");
  } catch (error) {
    console.error("Payment method addition error:", error);
    res.redirect("/onboarding/payment");
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

  // Load translations for the current language
  const lng = req.language || "en";

  res.render("auth/profile", {
    title: "Complete Your Profile - Accelerator",
    bodyClass: "onboarding-page",
    layout: "auth",
    user: req.user,
    profile: profile || {},
    lng: lng,
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
