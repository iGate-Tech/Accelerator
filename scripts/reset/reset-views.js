#!/usr/bin/env node

import { execSync } from "child_process";
import { config } from "dotenv";

config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("❌ Error: SUPABASE_DB_URL environment variable is not set");
  process.exit(1);
}

console.log("👁️  Dropping all views...");

try {
  execSync(`psql "${SUPABASE_DB_URL}" -f db/reset/reset-views.sql`, {
    stdio: "inherit",
  });
  console.log("✅ Views reset complete!");
} catch (error) {
  console.error("❌ Views reset failed:", error.message);
  process.exit(1);
}
