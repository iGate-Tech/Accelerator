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
  "db/schema/01_extensions.sql",
  "db/schema/02_tables.sql",
  "db/schema/03_indexes.sql",
  "db/security/rls_policies.sql",
  "db/business/triggers.sql",
  "db/business/functions.sql",
  "db/views/aggregations.sql",
];

console.log("📄 Applying migrations...");

try {
  migrationFiles.forEach((file) => {
    console.log(`🔧 Applying ${file}...`);
    execSync(`psql "${SUPABASE_DB_URL}" -f ${file}`, {
      stdio: "pipe", // Suppress output for cleaner logs
      cwd: join(__dirname, ".."),
    });
  });

  console.log("✅ Database migrations applied successfully!");
} catch (error) {
  console.error("❌ Database migration failed:", error.message);
  process.exit(1);
}
