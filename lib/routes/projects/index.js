import express from "express";
import { requireAuth } from "../../session.js";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import logger from "../../utils/logger.js";
import slugify from "slugify";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Create new project/idea
router.post("/new", requireAuth, async (req, res) => {
  try {
    const { title, category, prompt: description, tags } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!description || description.trim().length < 100) {
      return res.status(400).json({
        error: `Description must be at least 100 characters long. You currently have ${description?.trim().length || 0} characters. Please provide more details about your project idea.`,
      });
    }

    if (!title || title.trim().length === 0 || title.trim() === "Untitled") {
      return res.status(400).json({
        error:
          "Please provide a meaningful title for your project (not 'Untitled')",
      });
    }

    if (
      !category ||
      category.trim().length === 0 ||
      category.trim() === "Category"
    ) {
      return res.status(400).json({
        error: "Please select a category for your project (not 'Category')",
      });
    }

    if (!title || title.trim().length === 0 || title.trim() === "Untitled") {
      return res.status(400).json({
        error:
          "Please provide a meaningful title for your project (not 'Untitled')",
      });
    }

    if (
      !category ||
      category.trim().length === 0 ||
      category.trim() === "Category"
    ) {
      return res.status(400).json({
        error: "Please select a category for your project (not 'Category')",
      });
    }

    if (!title || title.trim().length === 0 || title.trim() === "Untitled") {
      return res.status(400).json({
        error: "Please provide a meaningful title for your project",
      });
    }

    if (
      !category ||
      category.trim().length === 0 ||
      category.trim() === "Category"
    ) {
      return res.status(400).json({
        error: "Please select a category for your project",
      });
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = [];
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    // Generate unique slug from title
    let baseSlug = slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Ensure slug is not empty
    if (!baseSlug) {
      baseSlug = "untitled-project";
    }

    let slug = baseSlug;
    let counter = 1;

    // Check for slug uniqueness and append counter if needed
    while (true) {
      const { data: existing } = await supabase
        .from("ideas")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) {
        break; // Slug is unique
      }

      // Append counter to make it unique
      slug = `${baseSlug}-${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 100) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    // Determine category icon based on category
    const getCategoryIcon = (cat) => {
      switch (cat) {
        case "Technology":
          return "cpu";
        case "Healthcare":
          return "heart";
        case "Finance":
          return "dollar-sign";
        case "Education":
          return "book-open";
        case "E-commerce":
          return "shopping-cart";
        case "Entertainment":
          return "film";
        case "Social":
          return "users";
        case "Environment":
          return "leaf";
        default:
          return "star";
      }
    };
    const categoryIcon = getCategoryIcon(category);

    let data, message;

    if (req.body.idea_id) {
      // Update existing idea
      const { data: updateData, error } = await supabase
        .from("ideas")
        .update({
          title: title.trim(),
          category: category.trim(),
          category_icon: categoryIcon,
          description: description.trim(),
          tags: parsedTags,
        })
        .eq("id", req.body.idea_id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        logger.error("Error updating idea:", error);
        return res.status(500).json({
          error: "Failed to update project",
        });
      }

      data = updateData;
      message = "Project updated successfully";
    } else {
      // Insert new idea
      const { data: insertData, error } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title: title.trim(),
          category: category.trim(),
          category_icon: categoryIcon,
          description: description.trim(),
          tags: parsedTags,
          overall_status: "draft",
          slug: slug,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating idea:", error);
        return res.status(500).json({
          error: "Failed to create project",
        });
      }

      data = insertData;
      message = "Project created successfully";
    }

    res.json({
      success: true,
      idea_id: data.id,
      message: message,
    });
  } catch (error) {
    logger.error("Project creation error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
