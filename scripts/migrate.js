#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies pending migrations to update schema
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

console.log("🔄 Checking for pending migrations...");

// For now, this just re-applies the current schema
// In a full implementation, this would check applied migrations vs pending ones
const migrationFiles = [
  "db/setup/extensions/extensions.sql",
  "db/setup/tables/tables.sql",
  "db/setup/indexes/indexes.sql",
  "db/setup/policies/policies.sql",
  "db/setup/functions/functions-core.sql",
  "db/setup/functions/functions-user.sql",
  "db/setup/functions/functions-credit.sql",
  "db/setup/functions/functions-idea.sql",
  "db/setup/functions/functions-voting.sql",
  "db/setup/functions/functions-model.sql",
  "db/setup/functions/functions-portfolio.sql",
  "db/setup/triggers/triggers.sql",
  "db/setup/views/views.sql",
];

console.log("📄 Applying migrations...");

try {
  migrationFiles.forEach((file) => {
    console.log(`🔧 Applying ${file}...`);
    execSync(`psql "${SUPABASE_DB_URL}" -f ${file}`, {
      stdio: "pipe", // Suppress output for cleaner logs
      cwd: join(__dirname, "../.."),
    });
  });

  console.log("✅ Database migrations applied successfully!");
} catch (error) {
  console.error("❌ Database migration failed:", error.message);
  process.exit(1);
}
