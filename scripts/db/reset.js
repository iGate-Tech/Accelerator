#!/usr/bin/env node

/**
 * Database Reset Script
 * Completely resets the database by dropping all public schema objects
 */

import { execSync } from "child_process";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("❌ Error: SUPABASE_DB_URL environment variable is not set");
  process.exit(1);
}

console.log("⚠️  WARNING: This will completely reset the database!");
console.log("🔄 Starting database reset...");

try {
  // Apply the reset script
  execSync(`psql "${SUPABASE_DB_URL}" -f db/maintenance/reset.sql`, {
    stdio: "inherit",
    cwd: join(__dirname, ".."),
  });

  console.log("✅ Database reset complete!");
  console.log('💡 Next: Run "npm run db:setup" to recreate the schema');
} catch (error) {
  console.error("❌ Database reset failed:", error.message);
  process.exit(1);
}
