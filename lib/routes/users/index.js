import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import { requireAuth } from "../../session.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

// Configure express-fileupload for avatar uploads
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// GET /api/users/profile - Get user profile information
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch profile",
      });
    }

    // Return profile data or default structure
    const profileData = profile || {
      user_id: userId,
      name: null,
      avatar_url: null,
      package_type: "free",
      credit_balance: 1000,
      total_spent: 0,
      total_earned: 1000,
      last_credit_update: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/users/profile - Update user profile
router.post("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, package_type } = req.body;

    // Validate package type if provided
    if (
      package_type &&
      !["free", "student", "enterprise"].includes(package_type)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid package type",
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (package_type !== undefined) updateData.package_type = package_type;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          ...updateData,
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "profile_updated",
      entity_type: "profile",
      entity_id: userId,
      details: {
        fields_updated: Object.keys(updateData),
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: data,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/users/profile/avatar - Upload avatar
router.post("/profile/avatar", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.files || !req.files.avatar) {
      return res.status(400).json({
        success: false,
        error: "No avatar file provided",
      });
    }

    const avatarFile = req.files.avatar;

    // Validate file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(avatarFile.name).toLowerCase(),
    );
    const mimetype = allowedTypes.test(avatarFile.mimetype);

    if (!mimetype || !extname) {
      return res.status(400).json({
        success: false,
        error: "Only image files are allowed!",
      });
    }

    // Check file size (5MB limit)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File size must be less than 5MB",
      });
    }

    // Upload to Supabase Storage
    const filePath = `avatars/${Date.now()}-${userId}-${avatarFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile.data, {
        contentType: avatarFile.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Failed to upload avatar",
      });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with avatar URL
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating profile with avatar:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update profile with avatar",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "avatar_updated",
      entity_type: "profile",
      entity_id: userId,
      details: {
        avatar_url: publicUrl,
      },
    });

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      profile: data,
      avatar_url: publicUrl,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// DELETE /api/users/profile/avatar - Remove avatar
router.delete("/profile/avatar", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Update profile to remove avatar URL
    const { data, error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error removing avatar:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to remove avatar",
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "avatar_removed",
      entity_type: "profile",
      entity_id: userId,
    });

    res.json({
      success: true,
      message: "Avatar removed successfully",
      profile: data,
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/users/credits - Get user credit balance and history
router.get("/credits", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get profile with credit info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credit_balance, total_spent, total_earned, last_credit_update")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching credits:", profileError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit information",
      });
    }

    // Get recent credit transactions
    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txError) {
      console.error("Error fetching credit transactions:", txError);
      // Don't fail the request if transactions fail
    }

    res.json({
      success: true,
      credits: {
        current_balance: profile?.credit_balance || 0,
        total_spent: profile?.total_spent || 0,
        total_earned: profile?.total_earned || 0,
        last_update: profile?.last_credit_update,
      },
      recent_transactions: transactions || [],
    });
  } catch (error) {
    console.error("Get credits error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
