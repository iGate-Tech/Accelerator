import express from "express";
import { requireAuth } from "../../session.js";
import { requirePackage } from "../../middleware/package.js";

const router = express.Router();

// Idea Detail page
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

  let populateIdeaJson = "null";
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
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.description)
        cleanIdea.description = cleanIdea.description
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.category)
        cleanIdea.category = cleanIdea.category
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      if (cleanIdea.tags && Array.isArray(cleanIdea.tags)) {
        cleanIdea.tags = cleanIdea.tags.map((tag) =>
          tag
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
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
  if (req.query.ideaId && populateIdeaJson !== "null") {
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
  if (req.query.ideaId && populateIdeaJson !== "null") {
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
          executiveSummaryText = descMatch[1].trim().replace(/^\s+/gm, "");
        } else {
          // Fallback: if no match, use the whole description
          executiveSummaryText = ideaData.description.replace(/^\s+/gm, "");
        }
      }
    } catch (e) {
      console.error("Error creating executive summary text:", e);
    }
  }

  // Create dynamic page title with primary color for idea title
  let pageTitle = "Idea Model";
  if (ideaTitle) {
    pageTitle = `Idea Model of <span class="text-primary">${ideaTitle}</span>`;
  }

  res.render("models/idea", {
    title: "Idea Model - Accelerator",
    bodyClass: "models-idea-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    activeStep: "idea",
    populateIdeaJson: populateIdeaJson,
    ideaTitle: ideaTitle,
    ideaCategory: ideaCategory,
    ideaTags: ideaTags,
    executiveSummaryText: executiveSummaryText,
    pageTitle: pageTitle,
    ideaId: req.query.ideaId,
  });
});

// New Idea page
router.get("/new-idea", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  let populateIdeaJson = "null";

  const { data: projects, error } = await supabase
    .from("ideas")
    .select("id, title, completion_percentage")
    .eq("user_id", req.user.id)
    .eq("overall_status", "draft")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects for new-idea:", error);
  }

  res.render("ideas/new-idea", {
    title: "New Idea - Accelerator",
    bodyClass: "new-idea-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    projects: projects || [],
    populateIdeaJson: populateIdeaJson,
  });
});

// Portfolio page - redirect to portfolios
router.get("/portfolio", requireAuth, (req, res) => {
  res.redirect("/portfolios");
});

// Favorites page
router.get("/favorites", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get user's favorite ideas
  const { data: favorites, error } = await supabase
    .from("ideas")
    .select(
      "id, title, description, tags, category, rating, privacy, completion_percentage, overall_status, created_at, updated_at, user_id",
    )
    .eq("is_favorite", true)
    .or(`user_id.eq.${req.user.id},privacy.eq.public`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching favorites:", error);
  }

  let formattedFavorites = [];
  if (favorites) {
    // Get unique user_ids
    const userIds = [...new Set(favorites.map((fav) => fav.user_id))];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", userIds);

    // Create profile map
    const profileMap = {};
    if (profiles) {
      profiles.forEach((profile) => {
        profileMap[profile.user_id] = profile;
      });
    }

    // Format favorites with profiles
    favorites.forEach((fav) => {
      fav.created_at_formatted = fav.created_at.slice(0, 19).replace("T", " ");
      fav.profiles = profileMap[fav.user_id];
      formattedFavorites.push(fav);
    });
  }

  res.render("ideas/favorites", {
    title: "My Favorites - Accelerator",
    bodyClass: "favorites-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    ideas: formattedFavorites,
  });
});

// Explore Ideas page
router.get("/explore-idea", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select(
      "id, title, description, tags, category, rating, is_favorite, privacy, completion_percentage, overall_status, created_at, updated_at, user_id",
    )
    .eq("privacy", "public")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ideas for explore:", error);
  }

  // Get unique categories for filter dropdown
  const categories = ideas
    ? [...new Set(ideas.map((idea) => idea.category).filter(Boolean))].sort()
    : [];

  let formattedIdeas = [];
  if (ideas) {
    // Get unique user_ids
    const userIds = [...new Set(ideas.map((idea) => idea.user_id))];

    // Fetch profiles using admin client
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", userIds);

    // Create profile map
    const profileMap = {};
    if (profiles) {
      profiles.forEach((profile) => {
        profileMap[profile.user_id] = profile;
      });
    }

    // Format ideas with profiles
    ideas.forEach((idea) => {
      idea.created_at_formatted = idea.created_at
        .slice(0, 19)
        .replace("T", " ");
      idea.updated_at_formatted = idea.updated_at
        ? idea.updated_at.slice(0, 19).replace("T", " ")
        : idea.created_at.slice(0, 19).replace("T", " ");
      idea.profiles = profileMap[idea.user_id];
    });
    formattedIdeas = ideas;
  }

  res.render("ideas/explore-idea", {
    title: "Explore Ideas - Accelerator",
    bodyClass: "explore-idea-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    ideas: formattedIdeas,
    categories: categories,
  });
});

// Voting Reward page
router.get("/voting-reward", requireAuth, (req, res) => {
  res.render("notifications/voting-reward", {
    title: "Voting & Rewards - Accelerator",
    bodyClass: "voting-reward-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
  });
});

// Public Idea Detail page - accessible to logged-in users for public ideas
router.get("/idea/:id", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  try {
    const ideaId = req.params.id;

    // Fetch public idea details
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select(
        "id, title, description, tags, category, rating, privacy, completion_percentage, overall_status, created_at, updated_at, user_id",
      )
      .eq("id", ideaId)
      .eq("privacy", "public")
      .single();

    if (ideaError || !idea) {
      req.session.flash = req.session.flash || { error: [], success: [] };
      req.session.flash.error.push("Idea not found or not publicly available");
      return res.redirect("/explore-idea");
    }

    // Fetch creator profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", idea.user_id)
      .single();

    // Fetch vote statistics
    const { data: votes } = await supabase
      .from("votes")
      .select("rating")
      .eq("idea_id", ideaId);

    // Calculate vote distribution
    const voteStats = {
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
    if (votes) {
      voteStats.total = votes.length;
      votes.forEach((vote) => {
        voteStats.distribution[vote.rating] =
          (voteStats.distribution[vote.rating] || 0) + 1;
      });
    }

    // Format dates
    const formattedIdea = {
      ...idea,
      created_at_formatted: idea.created_at.slice(0, 19).replace("T", " "),
      updated_at_formatted: idea.updated_at
        ? idea.updated_at.slice(0, 19).replace("T", " ")
        : idea.created_at.slice(0, 19).replace("T", " "),
      profiles: profile || {
        name: "Anonymous",
        avatar_url: "/images/avatar.png",
      },
      voteStats,
    };

    res.render("ideas/idea-detail", {
      title: `${idea.title} - Accelerator`,
      bodyClass: "idea-detail-page",
      layout: "main",
      user: req.user,
      flash: req.session.flash || { error: [], success: [] },
      idea: formattedIdea,
    });
  } catch (error) {
    console.error("Public idea detail error:", error);
    req.session.flash = req.session.flash || { error: [], success: [] };
    req.session.flash.error.push("An error occurred while loading the idea");
    res.redirect("/explore-idea");
  }
});

// Create new idea
router.post(
  "/new-idea",
  requireAuth,
  requirePackage(["student", "enterprise"], {
    redirectTo: "/onboarding/package",
  }),
  async (req, res) => {
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

      const { title, description, category, tags, privacy } = req.body;
      const userId = req.user.id;

      if (!title || !description) {
        req.session.flash.error.push("Title and description are required");
        return res.redirect("back");
      }

      // Create the idea
      const { data: idea, error } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title,
          description,
          category: category || null,
          tags: Array.isArray(tags) ? tags : [],
          privacy: privacy || "public",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating idea:", error);
        req.session.flash.error.push("Failed to create idea");
        return res.redirect("back");
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: userId,
        action_type: "idea_created",
        entity_type: "idea",
        entity_id: idea.id,
        details: { title, category, privacy },
      });

      req.session.flash.success.push("Idea created successfully!");
      res.redirect(`/models/idea?ideaId=${idea.id}`);
    } catch (error) {
      console.error("Create idea error:", error);
      req.session.flash.error.push("An error occurred while creating the idea");
      res.redirect("back");
    }
  },
);

// Random idea generation
router.get(
  "/random-idea",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Get user's credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", req.user.id)
      .single();

    res.render("ideas/random-idea", {
      title: "Random Idea Generator - Accelerator",
      bodyClass: "random-idea-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Generate random idea
router.post(
  "/random-idea",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 10) {
        req.session.flash.error.push(
          "Insufficient credits. Random idea generation costs 10 credits.",
        );
        return res.redirect("/random-idea");
      }

      // Generate random idea using AI
      const { generateRandomIdea } = await import("../../services/ai.js");
      const result = await generateRandomIdea(prompt);

      if (!result.success) {
        req.session.flash.error.push(
          "Failed to generate idea: " + result.error?.message,
        );
        return res.redirect("/random-idea");
      }

      // Deduct credits
      await deductCredits(userId, 10, "ai_generation", { type: "random_idea" });

      // Log activity
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      await supabase.from("activity_log").insert({
        user_id: userId,
        action_type: "random_idea_generated",
        entity_type: "idea",
        entity_id: null, // Will be set when idea is created
        details: { prompt, generated_title: result.title },
      });

      // Show the generated idea with option to save it
      res.render("ideas/random-idea", {
        title: "Random Idea Generated - Accelerator",
        bodyClass: "random-idea-page",
        layout: "main",
        user: req.user,
        flash: res.locals.flash,
        generatedIdea: result,
        userCredits: balance - 10,
      });
    } catch (error) {
      console.error("Random idea generation error:", error);
      req.session.flash.error.push(
        "An error occurred while generating the idea",
      );
      res.redirect("/random-idea");
    }
  },
);

// Save generated idea
router.post(
  "/random-idea/save",
  requireAuth,
  requirePackage(["student", "enterprise"]),
  async (req, res) => {
    try {
      const { title, category, description, tags } = req.body;
      const userId = req.user.id;

      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      // Create the idea
      const { data: idea, error } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title,
          description,
          category,
          tags: Array.isArray(tags)
            ? tags
            : tags.split(",").map((t) => t.trim()),
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving generated idea:", error);
        req.session.flash.error.push("Failed to save idea");
        return res.redirect("/random-idea");
      }

      // Update activity log with idea ID
      await supabase
        .from("activity_log")
        .update({ entity_id: idea.id })
        .eq("user_id", userId)
        .eq("action_type", "random_idea_generated")
        .eq("details->>generated_title", title)
        .order("created_at", { ascending: false })
        .limit(1);

      req.session.flash.success.push(
        "Idea saved successfully! You can now start building your business model.",
      );
      res.redirect(`/models/idea?ideaId=${idea.id}`);
    } catch (error) {
      console.error("Save generated idea error:", error);
      req.session.flash.error.push("Failed to save idea");
      res.redirect("/random-idea");
    }
  },
);

export default router;
