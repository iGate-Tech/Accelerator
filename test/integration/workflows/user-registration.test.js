import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import { v4 as uuidv4 } from "uuid";

const pool = createTestDb();

describe("User Registration Workflow", () => {
  it("should complete full user registration process", async () => {
    await withTransaction(pool, async (client) => {
      const userId = uuidv4();

      // Register user
      const regResult = await client.query(
        `
        SELECT handle_user_registration($1, '{"name": "John Doe", "package_type": "student"}')
      `,
        [userId],
      );

      expect(regResult.rows[0].handle_user_registration.success).toBe(true);

      // Check profile created
      const profileResult = await client.query(
        `
        SELECT name, package_type, credit_balance FROM profiles WHERE user_id = $1
      `,
        [userId],
      );

      expect(profileResult.rows[0].name).toBe("John Doe");
      expect(profileResult.rows[0].package_type).toBe("student");
      expect(profileResult.rows[0].credit_balance).toBe(1500);

      // Check welcome notification
      const notificationResult = await client.query(
        `
        SELECT type, message FROM notifications WHERE user_id = $1
      `,
        [userId],
      );

      expect(notificationResult.rows.some((n) => n.type === "welcome")).toBe(
        true,
      );
    });
  });

  it("should handle user package upgrades", async () => {
    await withTransaction(pool, async (client) => {
      const userId = uuidv4();

      // Initial registration
      await client.query(
        `
        SELECT handle_user_registration($1, '{"name": "Jane Doe", "package_type": "free"}')
      `,
        [userId],
      );

      // Upgrade package
      const upgradeResult = await client.query(
        `
        SELECT upgrade_user_package($1, 'premium')
      `,
        [userId],
      );

      expect(upgradeResult.rows[0].upgrade_user_package.success).toBe(true);

      // Check package updated and credits added
      const profileResult = await client.query(
        `
        SELECT package_type, credit_balance FROM profiles WHERE user_id = $1
      `,
        [userId],
      );

      expect(profileResult.rows[0].package_type).toBe("premium");
      expect(profileResult.rows[0].credit_balance).toBeGreaterThan(1000);
    });
  });
});
