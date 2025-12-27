#!/usr/bin/env node

/**
 * Database Setup Script
 * Applies all schema files in the correct order
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

// Schema files in deployment order
const schemaFiles = [
  "db/schema/01_extensions.sql",
  "db/schema/02_tables.sql",
  "db/schema/03_indexes.sql",
  "db/security/rls_policies.sql",
  "db/business/core_functions.sql",
  "db/business/user_management.sql",
  "db/business/credit_system.sql",
  "db/business/idea_management.sql",
  "db/business/voting_rewards.sql",
  "db/business/model_management.sql",
  "db/business/portfolio_management.sql",
  "db/business/triggers.sql",
  "db/views/aggregations.sql",
];

console.log("🚀 Starting database schema setup...");

try {
  const rootDir = join(__dirname, "../..");
  schemaFiles.forEach((file) => {
    console.log(`📄 Applying ${file}...`);
    execSync(`psql "${SUPABASE_DB_URL}" -f "${join(rootDir, file)}"`, {
      stdio: "inherit",
    });
  });

  console.log("✅ Database schema setup complete!");
} catch (error) {
  console.error("❌ Database setup failed:", error.message);
  process.exit(1);
}
