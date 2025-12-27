#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a backup of the current database schema and data
 */

import { execSync } from "child_process";
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!SUPABASE_DB_URL) {
  console.error("❌ Error: SUPABASE_DB_URL environment variable is not set");
  process.exit(1);
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
const backupFile = `db_backup_${NODE_ENV}_${timestamp}.sql`;

console.log(`💾 Creating database backup: ${backupFile}`);

try {
  // Use pg_dump to create a schema and data backup
  execSync(
    `pg_dump "${SUPABASE_DB_URL}" --schema=public --no-owner --no-privileges --clean --if-exists > ${backupFile}`,
    {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
    },
  );

  console.log(`✅ Database backup created: ${backupFile}`);
  console.log("💡 Tip: Store this file safely for disaster recovery");
} catch (error) {
  console.error("❌ Database backup failed:", error.message);
  process.exit(1);
}
