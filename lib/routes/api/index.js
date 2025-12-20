import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "API working" });
});

export default router;
