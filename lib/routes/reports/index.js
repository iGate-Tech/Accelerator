import express from "express";
import { requireAuth } from "../../session.js";
import { requirePackage } from "../../middleware/package.js";
import { getUserCredits, deductCredits } from "../../utils/credits.js";

const router = express.Router();

// API Endpoints for Reports

// POST /api/reports/business-plan - Generate business plan report
router.post("/api/reports/business-plan", requireAuth, async (req, res) => {
  try {
    const { idea_id } = req.body;
    const userId = req.user.id;

    if (!idea_id) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.idea_required")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please select an idea to generate the business plan.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.status(400).json({
        success: false,
        error: "Idea ID is required",
      });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Check package access
    const { data: profile } = await supabase
      .from("profiles")
      .select("package_type")
      .eq("user_id", userId)
      .single();

    if (!profile || !["student", "enterprise"].includes(profile.package_type)) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.package_required")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Business plan generation requires Student or Enterprise package.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.status(403).json({
        success: false,
        error:
          "Business plan generation requires Student or Enterprise package",
      });
    }

    // Check credit balance
    const { balance } = await getUserCredits(userId);
    if (balance < 50) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.insufficient_credits")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Insufficient credits. Report generation costs 50 credits. Current balance: ${balance}.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.status(402).json({
        success: false,
        error: "Insufficient credits. Report generation costs 50 credits.",
        required_credits: 50,
        current_balance: balance,
      });
    }

    // Get idea and model data
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", idea_id)
      .eq("user_id", userId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found or access denied",
      });
    }
  } catch (error) {
    console.error("Download report API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download report",
    });
  }
});

// Business Plan report
router.get(
  "/reports/business-plan",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from("ideas")
      .select("id, title, completion_percentage, validation_threshold_met")
      .eq("user_id", req.user.id)
      .eq("validation_threshold_met", true)
      .order("updated_at", { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", req.user.id)
      .single();

    res.render("reports/business-plan", {
      title: "Business Plan Generator - Accelerator",
      bodyClass: "business-plan-report-page",
      layout: "main",
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Pitch Deck report
router.get(
  "/reports/pitch-deck",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from("ideas")
      .select("id, title, completion_percentage, validation_threshold_met")
      .eq("user_id", req.user.id)
      .eq("validation_threshold_met", true)
      .order("updated_at", { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", req.user.id)
      .single();

    res.render("reports/pitch-deck", {
      title: "Pitch Deck Generator - Accelerator",
      bodyClass: "pitch-deck-report-page",
      layout: "main",
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Valuation report
router.get(
  "/reports/valuation",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from("ideas")
      .select("id, title, completion_percentage, validation_threshold_met")
      .eq("user_id", req.user.id)
      .eq("validation_threshold_met", true)
      .order("updated_at", { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", req.user.id)
      .single();

    res.render("reports/valuation", {
      title: "Valuation Report Generator - Accelerator",
      bodyClass: "valuation-report-page",
      layout: "main",
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Generate Business Plan
router.post(
  "/reports/business-plan",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect("/reports/business-plan");
      }

      // Get idea data
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect("/reports/business-plan");
      }

      // Get completed model data
      const { data: modelData } = await supabase
        .from("model_instances")
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq("idea_id", ideaId)
        .eq("user_id", userId)
        .eq("status", "completed");

      // Generate report using AI
      const { generateBusinessPlan } = await import(
        "../../services/report-generator.js"
      );
      const reportContent = await generateBusinessPlan(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        "../../services/report-storage.js"
      );

      const reportTitle = "Business Plan - " + idea.title;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        "business-plan",
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        "business-plan-" + idea.id,
        "reports",
      );

      if (!pdfResult.success) {
        console.error("PDF generation failed:", pdfResult.error);
        return res.redirect("/reports/business-plan");
      }

      // Deduct credits
      await deductCredits(userId, 50, "report_generation", {
        idea_id: ideaId,
        report_type: "business-plan",
      });

      // Save report
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: "business-plan",
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      if (reportError) {
        console.error("Error saving report:", reportError);
        return res.redirect("/reports/business-plan");
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: userId,
        action_type: "report_generated",
        entity_type: "report",
        entity_id: report.id,
        details: { report_type: "business-plan", idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error("Business plan generation error:", error);
      res.redirect("/reports/business-plan");
    }
  },
);

// Generate Pitch Deck
router.post(
  "/reports/pitch-deck",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect("/reports/pitch-deck");
      }

      // Get idea and model data (similar to business plan)
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect("/reports/pitch-deck");
      }

      const { data: modelData } = await supabase
        .from("model_instances")
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq("idea_id", ideaId)
        .eq("user_id", userId)
        .eq("status", "completed");

      // Generate pitch deck
      const { generatePitchDeck } = await import(
        "../../services/report-generator.js"
      );
      const reportContent = await generatePitchDeck(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        "../../services/report-storage.js"
      );

      const reportTitle = "Pitch Deck - " + idea.title;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        "pitch-deck",
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        "pitch-deck-" + idea.id,
        "reports",
      );

      if (!pdfResult.success) {
        console.error("PDF generation failed:", pdfResult.error);
        return res.redirect("/reports/pitch-deck");
      }

      // Deduct credits and save report
      await deductCredits(userId, 50, "report_generation", {
        idea_id: ideaId,
        report_type: "pitch-deck",
      });

      const { data: report } = await supabase
        .from("reports")
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: "pitch-deck",
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: userId,
        action_type: "report_generated",
        entity_type: "report",
        entity_id: report.id,
        details: { report_type: "pitch-deck", idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error("Pitch deck generation error:", error);
      res.redirect("/reports/pitch-deck");
    }
  },
);

// Generate Valuation Report
router.post(
  "/reports/valuation",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect("/reports/valuation");
      }

      // Get idea and model data
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect("/reports/valuation");
      }

      const { data: modelData } = await supabase
        .from("model_instances")
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq("idea_id", ideaId)
        .eq("user_id", userId)
        .eq("status", "completed");

      // Generate valuation
      const { generateValuation } = await import(
        "../../services/report-generator.js"
      );
      const reportContent = await generateValuation(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        "../../services/report-storage.js"
      );

      const reportTitle = "Valuation Report - " + idea.title;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        "valuation",
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        "valuation-" + idea.id,
        "reports",
      );

      if (!pdfResult.success) {
        console.error("PDF generation failed:", pdfResult.error);
        return res.redirect("/reports/valuation");
      }

      // Deduct credits and save report
      await deductCredits(userId, 50, "report_generation", {
        idea_id: ideaId,
        report_type: "valuation",
      });

      const { data: report } = await supabase
        .from("reports")
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: "valuation",
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: userId,
        action_type: "report_generated",
        entity_type: "report",
        entity_id: report.id,
        details: { report_type: "valuation", idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error("Valuation generation error:", error);
      res.redirect("/reports/valuation");
    }
  },
);

// View generated report
router.get("/reports/view/:reportId", requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: report, error } = await supabase
      .from("reports")
      .select(
        `
        *,
        ideas (
          title,
          description
        )
      `,
      )
      .eq("id", reportId)
      .eq("user_id", userId)
      .single();

    if (error || !report) {
      return res.redirect("/dashboard");
    }

    res.render("reports/view", {
      title:
        report.report_type
          .replace("-", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) + " Report - Accelerator",
      bodyClass: "report-view-page",
      layout: "main",
      user: req.user,
      report: report,
    });
  } catch (error) {
    console.error("View report error:", error);
    res.redirect("/dashboard");
  }
});

export default router;
