import express from "express";
import { requireAuth } from "../../session.js";
import logger from "../../utils/logger.js";

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
    logger.error("Error fetching packages:", error);
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
router.post("/onboarding/plan", requireAuth, async (req, res) => {
  try {
    const { package_type } = req.body;

    if (!package_type) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.package_required")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please select a package.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/plan?error=invalid_package");
    }

    // Validate package type exists
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: pkg, error } = await supabase
      .from("packages")
      .select("type")
      .eq("type", package_type)
      .single();

    if (error || !pkg) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.invalid_package")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Invalid package selected.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/plan?error=invalid_package");
    }

    // Store selected package in session
    req.session.selectedPackage = package_type;
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.package_selected")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Package ${package_type} selected successfully.</div>
        </div>
        <script>
          // Small delay to ensure alert is shown
          setTimeout(() => {
            window.location.href = '/onboarding/payment';
          }, 1000);
        </script>
      `);
    }
    res.redirect("/onboarding/payment");
  } catch (error) {
    logger.error("Plan selection error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Plan Selection Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/onboarding/plan?error=server_error");
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

    // Validate required fields
    if (
      !cardType ||
      !cardNumber ||
      !expiryDate ||
      !cardholderName ||
      !address ||
      !city ||
      !zipCode ||
      !country
    ) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.missing_fields")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">All fields are required.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/payment?error=missing_fields");
    }

    // Validate card number (basic check)
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    // eslint-disable-next-line no-magic-numbers
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.invalid_card_number")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please enter a valid card number.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/payment?error=invalid_card");
    }

    // Validate expiry (MM/YY)
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.invalid_expiry")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please enter a valid expiry date (MM/YY).</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/payment?error=invalid_expiry");
    }

    if (!req.session.selectedPackage) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.no_package_selected")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please select a package first.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
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
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.package_not_found")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Selected package not found.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/plan");
    }

    // TODO: Integrate Stripe for real payment processing
    // For free package, skip payment
    const paymentIntentId = null;
    if (packageData.price_monthly > 0) {
      // TODO: Install stripe package: npm install stripe
      // const stripe = require('stripe')(config.stripe.secretKey);
      // Create or retrieve Stripe customer
      // const customer = await stripe.customers.create({
      //   email: req.user.email,
      //   name: cardholderName,
      // });
      // Create payment method
      // const paymentMethod = await stripe.paymentMethods.create({
      //   type: 'card',
      //   card: {
      //     number: cardNumber,
      //     exp_month: expiryDate.split('/')[0],
      //     exp_year: expiryDate.split('/')[1],
      //     cvc: cvc,
      //   },
      //   billing_details: {
      //     name: cardholderName,
      //     address: {
      //       line1: address,
      //       city: city,
      //       postal_code: zipCode,
      //       country: country,
      //       state: state,
      //     },
      //   },
      // });
      // Attach payment method to customer
      // await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
      // Create subscription or charge
      // const subscription = await stripe.subscriptions.create({
      //   customer: customer.id,
      //   items: [{ price: packageData.stripe_price_id }],
      //   default_payment_method: paymentMethod.id,
      // });
      // paymentIntentId = subscription.id;
      // For now, mock successful payment
    }

    // Update user profile with selected package
    const updateData = {
      package_type: packageData.type,
      package_status: "active",
      package_started: new Date().toISOString(),
      credit_balance: packageData.credits_monthly,
      total_earned: packageData.credits_monthly,
    };

    if (packageData.price_monthly > 0) {
      // Set expiration for paid packages
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      updateData.package_expires = expires.toISOString();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", req.user.id);

    if (updateError) {
      logger.error("Error updating profile with package:", updateError);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.profile_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update profile. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/onboarding/plan");
    }

    // Store payment method reference (tokenized in real app)
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

    // Store in user_settings for mock
    await supabase.from("user_settings").insert([
      {
        user_id: req.user.id,
        key: "payment_card_last4",
        value: paymentMethodData.last4,
      },
      { user_id: req.user.id, key: "payment_card_brand", value: cardType },
    ]);

    // Record billing history
    await supabase.from("billing_history").insert({
      user_id: req.user.id,
      amount: packageData.price_monthly,
      currency: "USD",
      status: "completed",
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
          payment_processed: !!paymentIntentId,
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

    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.payment_completed")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Payment processed successfully. ${packageData.credits_monthly} credits added.</div>
        </div>
        <script>
          // Small delay to ensure alert is shown
          setTimeout(() => {
            window.location.href = '/onboarding/profile';
          }, 1000);
        </script>
      `);
    }
    res.redirect("/onboarding/profile");
  } catch (error) {
    logger.error("Payment method addition error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Payment Processing Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
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

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const updateData = { name, role };

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      const avatarFile = req.files.avatar;

      // Validate file type and size
      if (!avatarFile.mimetype.startsWith("image/")) {
        logger.error("Invalid file type for avatar:", avatarFile.mimetype);
      } else if (avatarFile.size > 5 * 1024 * 1024) {
        logger.error("Avatar file too large:", avatarFile.size);
      } else {
        const fileName = `${req.user.id}_${Date.now()}_${avatarFile.name}`;
        const filePath = `avatar/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("avatar")
          .upload(filePath, avatarFile.data, {
            contentType: avatarFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          logger.error("Error uploading avatar:", uploadError);
        } else {
          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatar").getPublicUrl(filePath);

          updateData.avatar_url = publicUrl;
        }
      }
    }

    // Validate required fields
    if (!name || name.trim().length < 2) {
      const errorMsg = "Name must be at least 2 characters long.";
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Validation Error</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
            <div class="col-start-2 mt-2">
              <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
            </div>
          </div>
        `);
      }
      return res.redirect("/onboarding/profile?error=name_required");
    }

    if (!role || role.trim() === "") {
      const errorMsg = "Please select your role.";
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Validation Error</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
            <div class="col-start-2 mt-2">
              <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
            </div>
          </div>
        `);
      }
      return res.redirect("/onboarding/profile?error=role_required");
    }

    // Validate optional fields
    if (website && !website.match(/^https?:\/\/.+/)) {
      const errorMsg = "Website must start with http:// or https://";
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Validation Error</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
            <div class="col-start-2 mt-2">
              <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
            </div>
          </div>
        `);
      }
      return res.redirect("/onboarding/profile?error=invalid_website");
    }

    // Build preferences object
    const preferences = {};
    if (bio !== undefined) {
      preferences.bio = bio;
    }
    if (location !== undefined) {
      preferences.location = location;
    }
    if (website !== undefined) {
      preferences.website = website;
    }

    if (Object.keys(preferences).length > 0) {
      updateData.preferences = preferences;
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", req.user.id);

    if (error) {
      logger.error("Error updating profile:", error);
      const errorMsg = "Failed to update profile. Please try again.";
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Update Failed</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
            <div class="col-start-2 mt-2">
              <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
            </div>
          </div>
        `);
      }
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

    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.profile_setup_complete")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.profile_setup_success_description")}</div>
        </div>
        <script>
          // Small delay to ensure alert is shown
          setTimeout(() => {
            window.location.href = '/new-idea';
          }, 1000);
        </script>
      `);
    }
    res.redirect("/new-idea");
  } catch (error) {
    logger.error("Profile setup error:", error);
    const errorMsg = "An unexpected error occurred. Please try again.";
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Error</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
          <div class="col-start-2 mt-2">
            <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
          </div>
        </div>
      `);
    }
    res.redirect("/onboarding/profile");
  }
});

export default router;
