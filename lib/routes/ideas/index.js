import express from "express";
import { requireAuth } from "../../session.js";
import { requirePackage } from "../../middleware/package.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// API Endpoints for Ideas Management

// GET /api/ideas - List user's ideas with optional filtering
router.get("/api/ideas", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Build query with filters
    let query = supabase
      .from("ideas")
      .select(
        `
        id, title, description, tags, category, privacy, rating, overall_status,
        completion_percentage, created_at, updated_at,
        validation_threshold_met, unlocked_models
      `,
      )
      .eq("user_id", userId);

    // Apply filters
    const { status, category, search } = req.query;

    if (status) {
      query = query.eq("overall_status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Order by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data: ideas, error } = await query;

    if (error) {
      logger.error("Error fetching ideas:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch ideas",
      });
    }

    // Get ratings for each idea
    const ideaIds = ideas?.map((idea) => idea.id) || [];
    if (ideaIds.length > 0) {
      const { data: ratings } = await supabase
        .from("votes")
        .select("idea_id, rating")
        .in("idea_id", ideaIds);

      // Calculate average ratings
      const ratingMap = {};
      ratings?.forEach((vote) => {
        if (!ratingMap[vote.idea_id]) {
          ratingMap[vote.idea_id] = { total: 0, count: 0 };
        }
        ratingMap[vote.idea_id].total += vote.rating;
        ratingMap[vote.idea_id].count += 1;
      });

      // Add calculated ratings to ideas
      ideas.forEach((idea) => {
        if (ratingMap[idea.id]) {
          idea.calculated_rating =
            ratingMap[idea.id].total / ratingMap[idea.id].count;
          idea.rating = idea.calculated_rating;
          idea.vote_count = ratingMap[idea.id].count;
        } else {
          idea.calculated_rating = 0;
          idea.rating = 0;
          idea.vote_count = 0;
        }
      });
    }

    res.json({
      success: true,
      ideas: ideas || [],
      count: ideas?.length || 0,
    });
  } catch (error) {
    logger.error("Get ideas error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/ideas - Create new idea
router.post("/api/ideas", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, tags, privacy } = req.body;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Validate required fields
    if (!title || !title.trim()) {
      if (req.isHtmx) {
        return res.send(`
             <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="12" x2="12" y1="8" y2="12"></line>
                 <line x1="12" x2="12.01" y1="16" y2="16"></line>
               </svg>
               <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.title_required")}</div>
               <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please enter a title for your idea.</div>
             </div>
             <script>hideLoading();</script>
           `);
      }
      return res.redirect("back");
    }

    if (!description || !description.trim()) {
      if (req.isHtmx) {
        return res.send(`
             <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="12" x2="12" y1="8" y2="12"></line>
                 <line x1="12" x2="12.01" y1="16" y2="16"></line>
               </svg>
               <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.description_required")}</div>
               <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please describe your idea.</div>
             </div>
             <script>hideLoading();</script>
           `);
      }
      return res.redirect("back");
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    // Create the idea
    const { data: idea, error } = await supabase
      .from("ideas")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        category: category || "Other",
        tags: Array.isArray(tags) ? tags : [],
        privacy: privacy || "private",
        overall_status: "draft",
        completion_percentage: 0,
        validation_threshold_met: false,
        unlocked_models: [],
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating idea:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create idea",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "idea_created",
      entity_type: "idea",
      entity_id: idea.id,
      details: {
        title: idea.title,
        category: idea.category,
      },
    });

    res.status(201).json({
      success: true,
      message: "Idea created successfully",
      idea,
    });
  } catch (error) {
    logger.error("Create idea error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/ideas/:id - Get specific idea
router.get("/api/ideas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: idea, error } = await supabase
      .from("ideas")
      .select(
        `
        id, title, description, tags, category, privacy, rating, overall_status,
        completion_percentage, created_at, updated_at,
        validation_threshold_met, unlocked_models
      `,
      )
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          error: "Idea not found",
        });
      }
      logger.error("Error fetching idea:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch idea",
      });
    }

    // Get rating statistics
    const { data: votes } = await supabase
      .from("votes")
      .select("rating")
      .eq("idea_id", id);

    let calculated_rating = 0;
    let vote_count = 0;

    if (votes && votes.length > 0) {
      calculated_rating =
        votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length;
      vote_count = votes.length;
    }

    res.json({
      success: true,
      idea: {
        ...idea,
        calculated_rating,
        vote_count,
      },
    });
  } catch (error) {
    logger.error("Get idea error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/ideas/:id - Update idea
router.put("/api/ideas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, category, tags, privacy, overall_status } =
      req.body;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Validate required fields if provided
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({
        success: false,
        error: "Title cannot be empty",
      });
    }

    if (description !== undefined && (!description || !description.trim())) {
      return res.status(400).json({
        success: false,
        error: "Description cannot be empty",
      });
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (category !== undefined) {
      updateData.category = category;
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }
    if (privacy !== undefined) {
      updateData.privacy = privacy;
    }
    if (overall_status !== undefined) {
      updateData.overall_status = overall_status;
    }

    const { data: idea, error } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          error: "Idea not found",
        });
      }
      logger.error("Error updating idea:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update idea",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "idea_updated",
      entity_type: "idea",
      entity_id: id,
      details: {
        fields_updated: Object.keys(updateData),
      },
    });

    res.json({
      success: true,
      message: "Idea updated successfully",
      idea,
    });
  } catch (error) {
    logger.error("Update idea error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// DELETE /api/ideas/:id - Delete idea
router.delete("/api/ideas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // First check if idea exists and belongs to user
    const { data: existingIdea, error: fetchError } = await supabase
      .from("ideas")
      .select("title")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingIdea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found",
      });
    }

    // Delete the idea (cascade will handle related records)
    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error deleting idea:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete idea",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "idea_deleted",
      entity_type: "idea",
      entity_id: id,
      details: {
        title: existingIdea.title,
      },
    });

    res.json({
      success: true,
      message: "Idea deleted successfully",
    });
  } catch (error) {
    logger.error("Delete idea error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/ideas/:id/favorite - Toggle favorite status
router.post("/api/ideas/:id/favorite", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Set user session for RLS
    if (req.session.supabaseAccessToken) {
      try {
        await supabase.auth.setSession({
          access_token: req.session.supabaseAccessToken,
          refresh_token: req.session.supabaseRefreshToken,
        });
        logger.info("Supabase session set for favorite toggle");
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user) {
          logger.error("Auth user not found after setSession:", userError);
        } else {
          logger.info("Auth user confirmed:", userData.user.id);
        }
      } catch (error) {
        logger.error("Error setting supabase session:", error);
      }
    } else {
      logger.error("No supabaseAccessToken in session for favorite toggle");
    }

    // Check if idea exists
    const { data: idea, error: fetchError } = await supabase
      .from("ideas")
      .select("title")
      .eq("id", id)
      .single();

    if (fetchError || !idea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found",
      });
    }

    // Check if already favorited by this user
    const { data: existingFavorite } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("idea_id", id)
      .single();

    let isFavorite;
    let message;

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("idea_id", id);

      if (deleteError) {
        logger.error("Error removing favorite:", deleteError);
        return res.status(500).json({
          success: false,
          error: "Failed to remove favorite",
        });
      }

      isFavorite = false;
      message = "Removed from favorites";
      logger.info("Favorite removed successfully");
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from("user_favorites")
        .insert({
          user_id: userId,
          idea_id: id,
        });

      if (insertError) {
        logger.error("Error adding favorite:", insertError);
        return res.status(500).json({
          success: false,
          error: "Failed to add favorite",
        });
      }

      isFavorite = true;
      message = "Added to favorites";
      logger.info("Favorite added successfully");
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: isFavorite ? "idea_favorited" : "idea_unfavorited",
      entity_type: "idea",
      entity_id: id,
      details: {
        title: idea.title,
      },
    });

    res.json({
      success: true,
      message,
      is_favorite: isFavorite,
    });
  } catch (error) {
    logger.error("Toggle favorite error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/ideas/explore - Explore public ideas with filtering/search
router.get("/api/ideas/explore", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Build query for public ideas only
    let query = supabase
      .from("ideas")
      .select(
        `
        id, title, description, tags, category, rating, overall_status,
        completion_percentage, created_at, updated_at, user_id,
        profiles:user_id (
          name,
          avatar_url
        )
      `,
      )
      .eq("privacy", "public")
      .eq("validation_threshold_met", true);

    // Apply filters
    const { category, search, sort, limit, offset } = req.query;

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`,
      );
    }

    // Sorting
    if (sort === "rating") {
      query = query.order("rating", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      // Default: most recently updated
      query = query.order("updated_at", { ascending: false });
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100
    const offsetNum = parseInt(offset) || 0;

    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: ideas, error } = await query;

    if (error) {
      logger.error("Error exploring ideas:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to explore ideas",
      });
    }

    // Get vote counts and ratings for each idea
    const ideaIds = ideas?.map((idea) => idea.id) || [];
    if (ideaIds.length > 0) {
      const { data: voteStats } = await supabase
        .from("votes")
        .select("idea_id, rating")
        .in("idea_id", ideaIds);

      const voteMap = {};
      voteStats?.forEach((vote) => {
        if (!voteMap[vote.idea_id]) {
          voteMap[vote.idea_id] = { total: 0, count: 0 };
        }
        voteMap[vote.idea_id].total += vote.rating;
        voteMap[vote.idea_id].count += 1;
      });

      ideas.forEach((idea) => {
        const stats = voteMap[idea.id];
        if (stats) {
          idea.calculated_rating = stats.total / stats.count;
          idea.rating = idea.calculated_rating;
          idea.vote_count = stats.count;
        } else {
          idea.calculated_rating = 0;
          idea.rating = 0;
          idea.vote_count = 0;
        }
      });
    }

    res.json({
      success: true,
      ideas: ideas || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        has_more: (ideas?.length || 0) === limitNum,
      },
    });
  } catch (error) {
    logger.error("Explore ideas error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

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
      const cleanIdea = { ...idea };
      if (cleanIdea.title) {
        cleanIdea.title = cleanIdea.title
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      }
      if (cleanIdea.description) {
        cleanIdea.description = cleanIdea.description
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      }
      if (cleanIdea.category) {
        cleanIdea.category = cleanIdea.category
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
      }
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
      if (cleanIdea.title) {
        executiveSummary += `Title: ${cleanIdea.title}\n\n`;
      }
      if (cleanIdea.category) {
        executiveSummary += `Category: ${cleanIdea.category}\n\n`;
      }
      if (cleanIdea.description) {
        executiveSummary += `Description: ${cleanIdea.description}\n\n`;
      }
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
      logger.error("Error parsing idea data for heading:", e);
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
      logger.error("Error creating executive summary text:", e);
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

  // Populate from query params if provided
  if (
    req.query.title ||
    req.query.description ||
    req.query.category ||
    req.query.tags
  ) {
    const populateData = {
      title: req.query.title || "",
      category: req.query.category || "",
      description: req.query.description || "",
      tags: req.query.tags
        ? Array.isArray(req.query.tags)
          ? req.query.tags
          : req.query.tags.split(",").map((t) => t.trim())
        : [],
    };

    // Clean control characters
    const cleanData = { ...populateData };
    if (cleanData.title) {
      cleanData.title = cleanData.title
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
    }
    if (cleanData.category) {
      cleanData.category = cleanData.category
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
    }
    if (cleanData.description) {
      cleanData.description = cleanData.description
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
    }
    if (cleanData.tags && Array.isArray(cleanData.tags)) {
      cleanData.tags = cleanData.tags.map((tag) =>
        tag
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"'),
      );
    }

    populateIdeaJson = JSON.stringify(cleanData)
      .replace(/'/g, "\\'")
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e");
  }

  const { data: projects, error } = await supabase
    .from("ideas")
    .select("id, title, completion_percentage")
    .eq("user_id", req.user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching projects for new-idea:", error);
  }

  // Get notifications for SSR
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get packages
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("price_monthly", { ascending: true });

  res.render("ideas/new-idea", {
    title: "New Idea - Accelerator",
    bodyClass: "new-idea-page",
    layout: "main",
    user: req.user,
    projects: projects || [],
    notifications: notifications || [],
    activeNav: "projects",
    unreadCount: notifications
      ? notifications.filter((n) => !n.is_read).length
      : 0,
    packages: packages || [],
    populateIdeaJson: populateIdeaJson,
  });
});

// Generate random idea and populate new-idea form
router.post("/new-idea/generate", requireAuth, async (req, res) => {
  try {
    const { generateRandomIdea } = await import("../../services/ai.js");
    const result = await generateRandomIdea("", req.user.id);

    if (!result.success) {
      return res.redirect("/new-idea");
    }

    const query = `title=${encodeURIComponent(result.title)}&description=${encodeURIComponent(result.description)}&category=${encodeURIComponent(result.category)}&tags=${encodeURIComponent(result.tags.join(","))}`;

    res.redirect("/new-idea?" + query);
  } catch (error) {
    logger.error("Generate random idea for populate error:", error);
    res.redirect("/new-idea");
  }
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
  const { data: favoriteRecords, error: favError } = await supabase
    .from("user_favorites")
    .select("idea_id")
    .eq("user_id", req.user.id);

  if (favError) {
    logger.error("Error fetching user favorites:", favError);
  }

  let favorites = [];
  if (favoriteRecords && favoriteRecords.length > 0) {
    const ideaIds = favoriteRecords.map((fav) => fav.idea_id);
    const { data: favIdeas, error } = await supabase
      .from("ideas")
      .select(
        "id, title, description, tags, category, rating, privacy, completion_percentage, overall_status, created_at, updated_at, user_id",
      )
      .in("id", ideaIds)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("Error fetching favorite ideas:", error);
    } else {
      favorites = favIdeas || [];
    }
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
      fav.updated_at_formatted = fav.updated_at
        ? fav.updated_at.slice(0, 19).replace("T", " ")
        : fav.created_at.slice(0, 19).replace("T", " ");
      fav.profiles = profileMap[fav.user_id];
      fav.is_favorite = true; // All favorites should show as favorited
      formattedFavorites.push(fav);
    });
  }

  // Add vote counts and ratings
  const favoriteIds = formattedFavorites.map((idea) => idea.id);
  const { data: favVotes } = await supabase
    .from("votes")
    .select("idea_id, rating")
    .in("idea_id", favoriteIds);

  const favVoteMap = {};
  if (favVotes) {
    favVotes.forEach((vote) => {
      if (!favVoteMap[vote.idea_id]) {
        favVoteMap[vote.idea_id] = { total: 0, count: 0 };
      }
      favVoteMap[vote.idea_id].total += vote.rating;
      favVoteMap[vote.idea_id].count += 1;
    });
  }

  formattedFavorites.forEach((idea) => {
    const stats = favVoteMap[idea.id];
    if (stats) {
      idea.rating = stats.total / stats.count;
      idea.vote_count = stats.count;
    } else {
      idea.rating = 0;
      idea.vote_count = 0;
    }
  });

  // Add user votes
  const { data: favUserVotes } = await supabase
    .from("votes")
    .select("idea_id, rating")
    .eq("user_id", req.user.id)
    .in("idea_id", favoriteIds);

  const favUserVoteMap = {};
  if (favUserVotes) {
    favUserVotes.forEach((vote) => {
      favUserVoteMap[vote.idea_id] = vote.rating;
    });
  }

  formattedFavorites.forEach((idea) => {
    idea.user_rating = favUserVoteMap[idea.id] || null;
  });

  // Add user context to each idea for component rendering
  formattedFavorites = formattedFavorites.map((idea) => ({
    ...idea,
    user: req.user,
    is_owner: req.user && idea.user_id === req.user.id,
  }));

  res.render("ideas/favorites", {
    title: "My Favorites - Accelerator",
    bodyClass: "favorites-page",
    layout: "main",
    user: req.user,
    ideas: formattedFavorites,
    isFavoritesPage: true,
  });
});

// Explore Ideas page
router.get("/explore-idea", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  const { search, category, sort } = req.query;

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select(
      "id, title, description, tags, category, rating, privacy, completion_percentage, overall_status, created_at, updated_at, user_id",
    )
    .eq("privacy", "public")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching ideas for explore:", error);
  }

  // Get unique categories for filter dropdown
  const categories = ideas
    ? [...new Set(ideas.map((idea) => idea.category).filter(Boolean))].sort()
    : [];

  let formattedIdeas = [];
  if (ideas) {
    // Get unique user_ids
    const userIds = [...new Set(ideas.map((idea) => idea.user_id))];

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

    // Add user favorites if logged in
    if (req.user) {
      const ideaIds = formattedIdeas.map((idea) => idea.id);
      const { data: userFavorites, error: favError } = await supabase
        .from("user_favorites")
        .select("idea_id")
        .eq("user_id", req.user.id)
        .in("idea_id", ideaIds);

      if (favError) {
        logger.error("Error fetching user favorites:", favError);
      }

      const favoriteMap = {};
      if (userFavorites) {
        userFavorites.forEach((fav) => {
          favoriteMap[fav.idea_id] = true;
        });
        logger.info(
          `Fetched ${userFavorites.length} favorites for user ${req.user.id}`,
        );
      } else {
        logger.info("No favorites fetched");
      }

      formattedIdeas.forEach((idea) => {
        idea.is_favorite = !!favoriteMap[idea.id];
      });
    }

    // Add vote counts and ratings
    const ideaIds = formattedIdeas.map((idea) => idea.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("idea_id, rating")
      .in("idea_id", ideaIds);

    const voteMap = {};
    if (votes) {
      votes.forEach((vote) => {
        if (!voteMap[vote.idea_id]) {
          voteMap[vote.idea_id] = { total: 0, count: 0 };
        }
        voteMap[vote.idea_id].total += vote.rating;
        voteMap[vote.idea_id].count += 1;
      });
    }

    formattedIdeas.forEach((idea) => {
      const stats = voteMap[idea.id];
      if (stats) {
        idea.rating = stats.total / stats.count;
        idea.vote_count = stats.count;
      } else {
        idea.rating = 0;
        idea.vote_count = 0;
      }
    });

    // Add user votes if logged in
    if (req.user) {
      const { data: userVotes } = await supabase
        .from("votes")
        .select("idea_id, rating")
        .eq("user_id", req.user.id)
        .in("idea_id", ideaIds);

      const userVoteMap = {};
      if (userVotes) {
        userVotes.forEach((vote) => {
          userVoteMap[vote.idea_id] = vote.rating;
        });
      }

      formattedIdeas.forEach((idea) => {
        idea.user_rating = userVoteMap[idea.id] || null;
      });
    }

    // Add user context to each idea for component rendering
    formattedIdeas = formattedIdeas.map((idea) => ({
      ...idea,
      user: req.user,
      is_owner: req.user && idea.user_id === req.user.id,
    }));

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      formattedIdeas = formattedIdeas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(searchLower) ||
          idea.description.toLowerCase().includes(searchLower) ||
          (idea.tags &&
            idea.tags.some((tag) => tag.toLowerCase().includes(searchLower))),
      );
    }

    if (category && category !== "") {
      formattedIdeas = formattedIdeas.filter(
        (idea) => idea.category === category,
      );
    }

    // Apply sort
    if (sort === "newest") {
      formattedIdeas.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      );
    } else if (sort === "oldest") {
      formattedIdeas.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
    } else if (sort === "rating") {
      formattedIdeas.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "title") {
      formattedIdeas.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // default newest
      formattedIdeas.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      );
    }
  }

  // Add user context to each idea for component rendering
  formattedIdeas = formattedIdeas.map((idea) => ({
    ...idea,
    user: req.user,
    is_owner: req.user && idea.user_id === req.user.id,
  }));

  res.render("ideas/explore-idea", {
    title: "Explore Ideas - Accelerator",
    bodyClass: "explore-idea-page",
    layout: "main",
    user: req.user,
    ideas: formattedIdeas,
    categories: categories,
    ideasJson: JSON.stringify(formattedIdeas),
    search: search || "",
    category: category || "",
    sort: sort || "newest",
    hasIdeas: formattedIdeas.length > 0,
  });
});

// Public Idea Detail page - accessible to logged-in users for public ideas
router.get("/idea/:id", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

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
      return res.redirect("/explore-idea");
    }

    // Fetch creator profile
    const { data: profile } = await supabase
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

    // Calculate average rating
    let averageRating = 0;
    if (voteStats.total > 0) {
      const totalScore = Object.entries(voteStats.distribution).reduce(
        (sum, [rating, count]) => sum + parseInt(rating) * count,
        0,
      );
      averageRating = totalScore / voteStats.total;
    }
    idea.rating = averageRating;

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
      idea: formattedIdea,
    });
  } catch (error) {
    logger.error("Public idea detail error:", error);
    res.redirect("/explore-idea");
  }
});

// Create new idea
router.post(
  "/new-idea",
  requireAuth,
  requirePackage(["student", "enterprise"], {
    redirectTo: "/onboarding/plan",
  }),
  async (req, res) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../../config.js")).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      if (req.session.supabaseAccessToken) {
        try {
          await supabase.auth.setSession({
            access_token: req.session.supabaseAccessToken,
            refresh_token: req.session.supabaseRefreshToken,
          });
          logger.info("Supabase session set for explore page");
          const { data: userData, error: userError } =
            await supabase.auth.getUser();
          if (userError || !userData.user) {
            logger.error(
              "Auth user not found after setSession for explore:",
              userError,
            );
          } else {
            logger.info("Auth user confirmed for explore:", userData.user.id);
          }
        } catch (error) {
          logger.error("Error setting supabase session for explore:", error);
        }
      } else {
        logger.error("No supabaseAccessToken in session for explore page");
      }

      // Handle form field: "prompt" is the description from the textarea
      let { description } = req.body;
      const { category, tags, privacy } = req.body;
      let title = req.body.title; // May be undefined
      const userId = req.user.id;
      const MAX_TITLE_WORDS = 4;

      // If description comes from "prompt" field
      if (!description && req.body.prompt) {
        description = req.body.prompt;
      }

      if (!description || !description.trim()) {
        if (req.isHtmx) {
          return res.send(`
            <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.description_required")}</div>
              <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please describe your idea.</div>
            </div>
            <script>hideLoading();</script>
          `);
        }
        return res.redirect("back");
      }

      // If no title provided, generate one from the description
      if (!title || !title.trim()) {
        const { generateTitle } = await import("../../services/ai.js");
        const titleResult = await generateTitle(description.trim(), userId);
        if (titleResult.success) {
          title = titleResult.title;
        } else {
          // Fallback title
          const words = description.trim().split(" ");
          title =
            words.slice(0, MAX_TITLE_WORDS).join(" ") +
            (words.length > MAX_TITLE_WORDS ? "..." : "");
        }
      }

      // Create the idea
      const { data: idea, error } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          category: category || "Other",
          tags: Array.isArray(tags) ? tags : [],
          privacy: privacy || "private",
          overall_status: "draft",
          completion_percentage: 0,
          validation_threshold_met: false,
          unlocked_models: [],
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating idea:", error);
        if (req.isHtmx) {
          return res.send(`
           <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" x2="12" y1="8" y2="12"></line>
               <line x1="12" x2="12.01" y1="16" y2="16"></line>
             </svg>
             <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.create_idea_failed")}</div>
             <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to create idea. Please try again.</div>
           </div>
           <script>hideLoading();</script>
         `);
        }
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

      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.create_idea_successful")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.create_idea_success_description")}</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.href = '/models/idea?ideaId=${idea.id}';
            }, 1000);
          </script>
        `);
      }
      res.redirect(`/models/idea?ideaId=${idea.id}`);
    } catch (error) {
      logger.error("Create idea error:", error);
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

      // Generate random idea using AI (credit validation happens inside the function)
      const { generateRandomIdea } = await import("../../services/ai.js");
      const result = await generateRandomIdea(prompt, userId);

      if (!result.success) {
        if (req.isHtmx) {
          return res.send(`
             <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="12" x2="12" y1="8" y2="12"></line>
                 <line x1="12" x2="12.01" y1="16" y2="16"></line>
               </svg>
               <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.generate_idea_failed")}</div>
               <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${result.error || "Failed to generate idea. Please try again."}</div>
             </div>
             <script>hideLoading();</script>
           `);
        }
        return res.redirect("/random-idea");
      }

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

      // Get updated credit balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("user_id", req.user.id)
        .single();

      // Show the generated idea with option to save it
      res.render("ideas/random-idea", {
        title: "Random Idea Generated - Accelerator",
        bodyClass: "random-idea-page",
        layout: "main",
        user: req.user,
        generatedIdea: result,
        userCredits: (profile?.credit_balance || 0) - 10,
      });
    } catch (error) {
      logger.error("Random idea generation error:", error);
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
        logger.error("Error saving generated idea:", error);
        if (req.isHtmx) {
          return res.send(`
             <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="12" x2="12" y1="8" y2="12"></line>
                 <line x1="12" x2="12.01" y1="16" y2="16"></line>
               </svg>
               <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.save_idea_failed")}</div>
               <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to save idea. Please try again.</div>
             </div>
             <script>hideLoading();</script>
           `);
        }
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

      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.save_idea_successful")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.save_idea_success_description")}</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.href = '/models/idea?ideaId=${idea.id}';
            }, 1000);
          </script>
        `);
      }
      res.redirect(`/models/idea?ideaId=${idea.id}`);
    } catch (error) {
      logger.error("Save generated idea error:", error);
      res.redirect("/random-idea");
    }
  },
);

export default router;
