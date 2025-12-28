import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export const migrateTestDb = async (client) => {
  for (const file of schemaFiles) {
    const sql = fs.readFileSync(path.join(__dirname, "../../", file), "utf8");
    await client.query(sql);
  }
};
