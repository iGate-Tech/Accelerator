#!/usr/bin/env node

import { execSync } from "child_process";
import { config } from "dotenv";

config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("❌ Error: SUPABASE_DB_URL environment variable is not set");
  process.exit(1);
}

console.log("🗑️  Deleting all users from auth...");

try {
  execSync(`psql "${SUPABASE_DB_URL}" -f db/reset/reset-users.sql`, {
    stdio: "inherit",
  });
  console.log("✅ Users reset complete!");
} catch (error) {
  console.error("❌ Users reset failed:", error.message);
  process.exit(1);
}
