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
