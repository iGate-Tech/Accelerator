// ULTRA-MINIMAL AI ROUTES - External API calls only
// All business logic (credit validation, activity logging) handled by database
import express from "express";
import { requireAuth } from "../../session.js";
import {
  callOpenAI,
  callAnthropic,
  processStripePayment,
  sendTransactionalEmail,
} from "../../services/index.js";

const router = express.Router();

// Apply authentication to all AI routes
router.use(requireAuth);

// Universal AI endpoint - delegates to external services
router.post("/generate/:provider/:action", async (req, res) => {
  try {
    const { provider, action } = req.params;
    const { prompt, model, options } = req.body;
    const userId = req.user.id;

    // Credit validation and activity logging handled by database triggers
    let result;
    switch (provider) {
      case "openai":
        result = await callOpenAI(prompt, { model, ...options });
        break;
      case "anthropic":
        result = await callAnthropic(prompt, { model, ...options });
        break;
      default:
        return res.status(400).json({ error: "Unsupported provider" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "AI service error" });
  }
});

// GET /api/ai/models - Available models (static data)
router.get("/models", (req, res) => {
  res.json({
    success: true,
    providers: ["openai", "anthropic", "openrouter"],
    models: {
      openai: ["gpt-4", "gpt-3.5-turbo"],
      anthropic: ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
      openrouter: ["google/gemma-3n-e2b-it:free"],
    },
  });
});

// Legacy endpoints - now delegate to universal endpoint
router.post("/generate-content", async (req, res) => {
  // This now uses the universal AI endpoint above
  const { model, input: prompt } = req.body;
  const provider = model?.includes("claude") ? "anthropic" : "openai";

  const response = await fetch(
    `${req.protocol}://${req.get("host")}/api/ai/generate/${provider}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization,
      },
      body: JSON.stringify({ prompt, model }),
    },
  );

  const result = await response.json();
  res.json(result);
});

export default router;
