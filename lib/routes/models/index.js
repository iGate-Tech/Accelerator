import express from "express";
import { requireAuth } from "../../session.js";
import { requirePackage } from "../../middleware/package.js";

const router = express.Router();

// Helper function to check model access
async function checkModelAccess(supabase, userId, ideaId, requiredModels) {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", userId)
    .single();

  if (profileError) return false;

  // Free users can only access idea model
  if (profile.package_type === "free" && requiredModels.length > 0) {
    return false;
  }

  // Check if idea exists and has required models unlocked
  if (ideaId && requiredModels.length > 0) {
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("validation_threshold_met, unlocked_models")
      .eq("id", ideaId)
      .eq("user_id", userId)
      .single();

    if (ideaError || !idea) return false;

    // Must have validation threshold met for non-idea models
    if (!idea.validation_threshold_met) return false;

    // Check if required models are unlocked
    return requiredModels.every((model) =>
      idea.unlocked_models?.includes(model),
    );
  }

  return true;
}

// Business Model page
router.get(
  "/models/business",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to business model (validation requirement)
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["business"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Business model requires completing the idea model first and achieving 3+ star rating",
      );
      return res.redirect("/models/idea?ideaId=" + (req.query.ideaId || ""));
    }

    // Check if idea exists and meets requirements
    let ideaAccess = false;
    if (req.query.ideaId) {
      const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .select("validation_threshold_met, unlocked_models")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (!ideaError && idea) {
        // Business model requires validation threshold met
        ideaAccess =
          idea.validation_threshold_met &&
          (idea.unlocked_models?.includes("business") ||
            profile.package_type !== "free");
      }
    }

    if (!ideaAccess) {
      req.session.flash.error.push(
        "Access to business model requires completing the idea model with 3+ star rating validation, or upgrade to premium package",
      );
      return res.redirect("/models/idea?ideaId=" + req.query.ideaId);
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Business Model";
    if (ideaTitle) {
      pageTitle = `Business Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/business", {
      title: "Business Model - Accelerator",
      bodyClass: "business-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "business",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        {
          number: 1,
          title: "Executive Summary",
          section: "executive-summary-section",
        },
        {
          number: 2,
          title: "Problem Analysis",
          section: "problem-analysis-section",
        },
        {
          number: 3,
          title: "Solution Overview",
          section: "solution-overview-section",
        },
        {
          number: 4,
          title: "Market Opportunity",
          section: "market-opportunity-section",
        },
        {
          number: 5,
          title: "Go-to-Market Strategy",
          section: "go-to-market-strategy-section",
        },
      ],
    });
  },
);

// Financial Model page
router.get(
  "/models/financial",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to financial model
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["financial"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Financial model requires Business model completion",
      );
      return res.redirect(
        "/models/business?ideaId=" + (req.query.ideaId || ""),
      );
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Financial Model";
    if (ideaTitle) {
      pageTitle = `Financial Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/financial", {
      title: "Financial Model - Accelerator",
      bodyClass: "financial-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "financial",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        {
          title: "Financial Projections",
          section: "financial-projections-section",
        },
        {
          title: "Funding Requirements",
          section: "funding-requirements-section",
        },
        { title: "Cost Structure", section: "cost-structure-section" },
        {
          title: "Profitability Analysis",
          section: "profitability-analysis-section",
        },
        { title: "Financial Risks", section: "financial-risks-section" },
      ],
    });
  },
);

// Legal Model page
router.get(
  "/models/legal",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to legal model
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["legal"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Legal model requires Team model completion",
      );
      return res.redirect("/models/team?ideaId=" + (req.query.ideaId || ""));
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Legal Model";
    if (ideaTitle) {
      pageTitle = `Legal Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/legal", {
      title: "Legal Model - Accelerator",
      bodyClass: "legal-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "legal",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        { title: "Legal Compliance", section: "legal-compliance-section" },
        {
          title: "Intellectual Property",
          section: "intellectual-property-section",
        },
        {
          title: "Regulatory Framework",
          section: "regulatory-framework-section",
        },
        {
          title: "Contracts and Agreements",
          section: "contracts-agreements-section",
        },
        { title: "Legal Risks", section: "legal-risks-section" },
      ],
    });
  },
);

// Marketing Model page
router.get(
  "/models/marketing",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to marketing model
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["marketing"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Marketing model requires Funding model completion",
      );
      return res.redirect("/models/funding?ideaId=" + (req.query.ideaId || ""));
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Marketing Model";
    if (ideaTitle) {
      pageTitle = `Marketing Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/marketing", {
      title: "Marketing Model - Accelerator",
      bodyClass: "marketing-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "marketing",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        {
          number: 1,
          title: "Team Structure",
          section: "team-structure-section",
        },
        {
          number: 2,
          title: "Key Roles",
          section: "key-roles-section",
        },
        {
          number: 3,
          title: "Recruitment Plan",
          section: "recruitment-plan-section",
        },
        {
          number: 4,
          title: "Team Development",
          section: "team-development-section",
        },
        {
          number: 5,
          title: "Organizational Culture",
          section: "organizational-culture-section",
        },
      ],
    });
  },
);

// Team Model page
router.get(
  "/models/team",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to team model
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["team"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Team model requires Marketing model completion",
      );
      return res.redirect(
        "/models/marketing?ideaId=" + (req.query.ideaId || ""),
      );
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Team Model";
    if (ideaTitle) {
      pageTitle = `Team Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/team", {
      title: "Team Model - Accelerator",
      bodyClass: "team-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "team",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        {
          number: 1,
          title: "Financial Projections",
          section: "financial-projections-section",
        },
        {
          number: 2,
          title: "Funding Requirements",
          section: "funding-requirements-section",
        },
        {
          number: 3,
          title: "Cost Structure",
          section: "cost-structure-section",
        },
        {
          number: 4,
          title: "Profitability Analysis",
          section: "profitability-analysis-section",
        },
        {
          number: 5,
          title: "Financial Risks",
          section: "financial-risks-section",
        },
      ],
    });
  },
);

// Funding Model page
router.get(
  "/models/funding",
  requireAuth,
  requirePackage(["student", "enterprise"], { redirectTo: "/dashboard" }),
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

    // Check access to funding model
    const hasAccess = await checkModelAccess(
      supabase,
      req.user.id,
      req.query.ideaId,
      ["funding"],
    );
    if (!hasAccess) {
      req.session.flash.error.push(
        "Funding model requires Financial model completion",
      );
      return res.redirect(
        "/models/financial?ideaId=" + (req.query.ideaId || ""),
      );
    }

    let populateIdeaJson = null;
    if (req.query.ideaId) {
      const { data: idea, error } = await supabase
        .from("ideas")
        .select("id, title, description, tags, category")
        .eq("id", req.query.ideaId)
        .eq("user_id", req.user.id)
        .single();

      if (idea && !error) {
        // Clean control characters from strings
        let cleanIdea = { ...idea };
        if (cleanIdea.title)
          cleanIdea.title = cleanIdea.title
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.description)
          cleanIdea.description = cleanIdea.description
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.category)
          cleanIdea.category = cleanIdea.category
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
        if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
          cleanIdea.tags = cleanIdea.tags.map((tag) =>
            tag
              .replace(/[\x00-\x1F\x7F]/g, "")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"'),
          );
        }

        // Create executive summary from idea data
        let executiveSummary = "";
        if (cleanIdea.title)
          executiveSummary += `Title: ${cleanIdea.title}\n\n`;
        if (cleanIdea.category)
          executiveSummary += `Category: ${cleanIdea.category}\n\n`;
        if (cleanIdea.description)
          executiveSummary += `Description: ${cleanIdea.description}\n\n`;
        if (cleanIdea.tags && cleanIdea.tags.length > 0) {
          executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
        }

        // Set the description to the executive summary
        cleanIdea.description = executiveSummary.trim();

        // Escape for HTML and JS
        populateIdeaJson = JSON.stringify(cleanIdea)
          .replace(/'/g, "\\'")
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");
      }
    }

    // Extract title, category, and tags for the heading
    let ideaTitle = null;
    let ideaCategory = null;
    let ideaTags = null;
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        ideaTitle = ideaData.title;
        ideaCategory = ideaData.category;
        ideaTags =
          ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
      } catch (e) {
        console.error("Error parsing idea data for heading:", e);
      }
    }

    // Create executive summary text for the question block (only description)
    let executiveSummaryText = "";
    if (req.query.ideaId && populateIdeaJson !== null) {
      try {
        const ideaData = JSON.parse(
          populateIdeaJson
            .replace(/\\'/g, "'")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">"),
        );
        if (ideaData.description) {
          // Extract only the description part (between "Description: " and "Tags: ")
          const descMatch = ideaData.description.match(
            /Description:\s*(.*?)(?:\n\nTags:|$)/s,
          );
          if (descMatch && descMatch[1]) {
            executiveSummaryText = descMatch[1].trim();
          } else {
            // Fallback: if no match, use the whole description
            executiveSummaryText = ideaData.description;
          }
        }
      } catch (e) {
        console.error("Error creating executive summary text:", e);
      }
    }

    // Create dynamic page title with primary color for idea title
    let pageTitle = "Funding Model";
    if (ideaTitle) {
      pageTitle = `Funding Model of <span class="text-primary">${ideaTitle}</span>`;
    }

    res.render("models/funding", {
      title: "Funding Model - Accelerator",
      bodyClass: "funding-model-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      activeStep: "funding",
      ideaId: req.query.ideaId,
      populateIdeaJson: populateIdeaJson,
      ideaTitle: ideaTitle,
      ideaCategory: ideaCategory,
      ideaTags: ideaTags,
      executiveSummaryText: executiveSummaryText,
      pageTitle: pageTitle,
      steps: [
        {
          number: 1,
          title: "Business Strategy",
          section: "business-strategy-section",
        },
        {
          number: 2,
          title: "Market Analysis",
          section: "market-analysis-section",
        },
        {
          number: 3,
          title: "Competitive Landscape",
          section: "competitive-landscape-section",
        },
        { number: 4, title: "Revenue Model", section: "revenue-model-section" },
        { number: 5, title: "Growth Plan", section: "growth-plan-section" },
      ],
    });
  },
);

// Idea Model page
router.get("/models/idea", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  let populateIdeaJson = null;
  if (req.query.ideaId) {
    const { data: idea, error } = await supabase
      .from("ideas")
      .select("id, title, description, tags, category")
      .eq("id", req.query.ideaId)
      .eq("user_id", req.user.id)
      .single();

    if (idea && !error) {
      // Clean control characters from strings
      let cleanIdea = { ...idea };
      if (cleanIdea.title)
        cleanIdea.title = cleanIdea.title
          .replace(/[\x00-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.description)
        cleanIdea.description = cleanIdea.description
          .replace(/[\x00-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.category)
        cleanIdea.category = cleanIdea.category
          .replace(/[\x00-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
        cleanIdea.tags = cleanIdea.tags.map((tag) =>
          tag
            .replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"'),
        );
      }

      // Create executive summary from idea data
      let executiveSummary = "";
      if (cleanIdea.title) executiveSummary += `Title: ${cleanIdea.title}\n\n`;
      if (cleanIdea.category)
        executiveSummary += `Category: ${cleanIdea.category}\n\n`;
      if (cleanIdea.description)
        executiveSummary += `Description: ${cleanIdea.description}\n\n`;
      if (cleanIdea.tags && cleanIdea.tags.length > 0) {
        executiveSummary += `Tags: ${cleanIdea.tags.join(", ")}\n\n`;
      }

      // Set the description to the executive summary
      cleanIdea.description = executiveSummary.trim();

      // Escape for HTML and JS
      populateIdeaJson = JSON.stringify(cleanIdea)
        .replace(/'/g, "\\'")
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e");
    }
  }

  // Extract title, category, and tags for the heading
  let ideaTitle = null;
  let ideaCategory = null;
  let ideaTags = null;
  if (req.query.ideaId && populateIdeaJson !== null) {
    try {
      const ideaData = JSON.parse(
        populateIdeaJson
          .replace(/\\'/g, "'")
          .replace(/\\u003c/g, "<")
          .replace(/\\u003e/g, ">"),
      );
      ideaTitle = ideaData.title;
      ideaCategory = ideaData.category;
      ideaTags =
        ideaData.tags && Array.isArray(ideaData.tags) ? ideaData.tags : null;
    } catch (e) {
      console.error("Error parsing idea data for heading:", e);
    }
  }

  // Create executive summary text for display
  let executiveSummaryText = "";
  if (req.query.ideaId && populateIdeaJson !== null) {
    try {
      const ideaData = JSON.parse(
        populateIdeaJson
          .replace(/\\'/g, "'")
          .replace(/\\u003c/g, "<")
          .replace(/\\u003e/g, ">"),
      );
      if (ideaData.description) {
        executiveSummaryText = ideaData.description;
      }
    } catch (e) {
      console.error("Error creating executive summary text:", e);
    }
  }

  // Fetch saved section data
  let savedSectionData = {};
  if (req.query.ideaId) {
    // Find model instance
    const { data: modelInstance } = await supabase
      .from("model_instances")
      .select("id")
      .eq("idea_id", req.query.ideaId)
      .eq("user_id", req.user.id)
      .eq("model_type", "idea")
      .single();

    if (modelInstance) {
      // Fetch all sections for this model instance
      const { data: sections } = await supabase
        .from("model_sections")
        .select("section_name, section_data")
        .eq("model_instance_id", modelInstance.id);

      if (sections) {
        // Organize by section name
        sections.forEach((section) => {
          let sectionData = section.section_data || {};
          if (typeof sectionData === "string") {
            // Backward compatibility: convert old string data to object
            sectionData = { q1: sectionData };
          }
          savedSectionData[section.section_name] = sectionData;
        });
      }
    }
  }

  // Extract individual question data for template
  const questionData = {
    executiveSummaryQ1: savedSectionData["executive-summary"]?.q1 || "",
    problemValidationQ1: savedSectionData["problem-validation"]?.q1 || "",
    problemValidationQ2: savedSectionData["problem-validation"]?.q2 || "",
    problemValidationQ3: savedSectionData["problem-validation"]?.q3 || "",
    problemValidationQ4: savedSectionData["problem-validation"]?.q4 || "",
    solutionDevelopmentQ1: savedSectionData["solution-development"]?.q1 || "",
    solutionDevelopmentQ2: savedSectionData["solution-development"]?.q2 || "",
    customerModelQ1: savedSectionData["customer-model"]?.q1 || "",
    customerModelQ2: savedSectionData["customer-model"]?.q2 || "",
    customerModelQ3: savedSectionData["customer-model"]?.q3 || "",
    customerModelQ4: savedSectionData["customer-model"]?.q4 || "",
    customerModelQ5: savedSectionData["customer-model"]?.q5 || "",
    customerModelQ6: savedSectionData["customer-model"]?.q6 || "",
    customerModelQ7: savedSectionData["customer-model"]?.q7 || "",
    customerModelQ8: savedSectionData["customer-model"]?.q8 || "",
    customerModelQ9: savedSectionData["customer-model"]?.q9 || "",
    brandingQ1: savedSectionData["branding"]?.q1 || "",
    brandingQ2: savedSectionData["branding"]?.q2 || "",
    brandingQ3: savedSectionData["branding"]?.q3 || "",
    brandingQ4: savedSectionData["branding"]?.q4 || "",
    ipProtectionQ1: savedSectionData["ip-protection"]?.q1 || "",
    ipProtectionQ2: savedSectionData["ip-protection"]?.q2 || "",
    ipProtectionQ3: savedSectionData["ip-protection"]?.q3 || "",
  };

  // Create dynamic page title with primary color for idea title
  let pageTitle = "Idea Model";
  if (ideaTitle) {
    pageTitle = `Idea Model of <span class="text-primary">${ideaTitle}</span>`;
  }

  const steps = [
    {
      number: 0,
      title: "Executive Summary",
      section: "executive-summary",
    },
    {
      number: 1,
      title: "Problem Validation",
      section: "problem-validation",
    },
    {
      number: 2,
      title: "Solution Development",
      section: "solution-development",
    },
    {
      number: 3,
      title: "Customer Model",
      section: "customer-model",
    },
    {
      number: 4,
      title: "Branding",
      section: "branding",
    },
    {
      number: 5,
      title: "IP Protection",
      section: "ip-protection",
    },
  ];

  res.render("models/idea", {
    title: "Idea Model - Accelerator",
    bodyClass: "idea-model-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    activeStep: "idea",
    ideaId: req.query.ideaId,
    populateIdeaJson: populateIdeaJson,
    ideaTitle: ideaTitle,
    ideaCategory: ideaCategory,
    ideaTags: ideaTags,
    executiveSummaryText: executiveSummaryText,
    pageTitle: pageTitle,
    steps: steps,
    sections: steps.map((s) => s.section),
    labels: steps.map((s) => `${s.number}. ${s.title}`),
    shortLabels: steps.map((s) => `${s.number}.`),
    positions: steps.map((_, i) => (i / (steps.length - 1)) * 100),
    activeSection: 0,
    savedSectionData: savedSectionData,
    ...questionData,
  });
});

// Handle model section form submissions
router.post("/models/:modelType", requireAuth, async (req, res) => {
  try {
    const { modelType } = req.params;
    const { section, data, ideaId, completed } = req.body;
    const userId = req.user.id;

    const validModels = [
      "idea",
      "business",
      "financial",
      "funding",
      "legal",
      "marketing",
      "team",
    ];
    if (!validModels.includes(modelType)) {
      req.session.flash.error.push("Invalid model type");
      return res.redirect("back");
    }

    if (!section || !data) {
      req.session.flash.error.push("Section and data are required");
      return res.redirect("back");
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

    // Find or create model instance
    let { data: modelInstance, error: instanceError } = await supabase
      .from("model_instances")
      .select("*")
      .eq("idea_id", ideaId || null)
      .eq("user_id", userId)
      .eq("model_type", modelType)
      .single();

    if (instanceError && instanceError.code === "PGRST116") {
      // Create new instance
      const { data: newInstance, error: createError } = await supabase
        .from("model_instances")
        .insert({
          idea_id: ideaId || null,
          user_id: userId,
          model_type: modelType,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating model instance:", createError);
        req.session.flash.error.push("Failed to create model instance");
        return res.redirect("back");
      }
      modelInstance = newInstance;
    } else if (instanceError) {
      console.error("Error finding model instance:", instanceError);
      req.session.flash.error.push("Failed to find model instance");
      return res.redirect("back");
    }

    // Save section data
    const sectionData = {
      section_data: data,
      is_completed: completed === "true" || completed === true,
    };

    const { error: saveError } = await supabase.from("model_sections").upsert(
      {
        model_instance_id: modelInstance.id,
        section_name: section,
        ...sectionData,
      },
      {
        onConflict: "model_instance_id,section_name",
      },
    );

    if (saveError) {
      console.error("Error saving model section:", saveError);
      req.session.flash.error.push("Failed to save section data");
      return res.redirect("back");
    }

    // Check if model instance is now completed
    const { data: allSections } = await supabase
      .from("model_sections")
      .select("is_completed")
      .eq("model_instance_id", modelInstance.id);

    const allCompleted =
      allSections &&
      allSections.length > 0 &&
      allSections.every((s) => s.is_completed);

    if (allCompleted) {
      // Update model instance status to completed
      await supabase
        .from("model_instances")
        .update({ status: 'completed' })
        .eq("id", modelInstance.id);

      if (modelType === 'idea' && ideaId) {
        // Calculate rating for idea
        const { data: votes } = await supabase
          .from("votes")
          .select("rating")
          .eq("idea_id", ideaId);

        if (votes && votes.length > 0) {
          const avgRating = votes.reduce((sum, v) => sum + v.rating, 0) / votes.length;
          const thresholdMet = avgRating > 3;

          await supabase
            .from("ideas")
            .update({
              rating: avgRating,
              validation_threshold_met: thresholdMet
            })
            .eq("id", ideaId)
            .eq("user_id", userId);
        }
      }

      // Unlock next model if applicable
      const modelOrder = ['idea', 'business', 'financial', 'legal', 'marketing', 'team', 'funding'];
      const currentIndex = modelOrder.indexOf(modelType);
      if (currentIndex >= 0 && currentIndex < modelOrder.length - 1 && ideaId) {
        const nextModel = modelOrder[currentIndex + 1];
        let shouldUnlock = true;

        if (modelType === 'idea') {
          // For idea, only unlock business if validation threshold met
          const { data: idea } = await supabase
            .from("ideas")
            .select("validation_threshold_met")
            .eq("id", ideaId)
            .single();
          shouldUnlock = idea?.validation_threshold_met || false;
        }

        if (shouldUnlock) {
          await supabase
            .from("ideas")
            .update({
              unlocked_models: supabase.sql`array_append(unlocked_models, ${nextModel})`
            })
            .eq("id", ideaId)
            .eq("user_id", userId);
        }
      }
    }

        if (shouldUnlock) {
          await supabase
            .from("ideas")
            .update({
              unlocked_models: supabase.sql`array_append(unlocked_models, ${nextModel})`,
            })
            .eq("id", ideaId)
            .eq("user_id", userId);
        }
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "model_section_updated",
      entity_type: "model_section",
      entity_id: `${modelInstance.id}_${section}`,
      details: { model_type: modelType, section, idea_id: ideaId },
    });

    req.session.flash.success.push("Section saved successfully");
    res.redirect("back");
  } catch (error) {
    console.error("Model section save error:", error);
    req.session.flash.error.push("An error occurred while saving");
    res.redirect("back");
  }
});

export default router;
