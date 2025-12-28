import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import { createTestUser, createTestIdea } from "../../utils/test-helpers.js";

const pool = createTestDb();

describe("Database Triggers", () => {
  it("should automatically update idea rating on vote", async () => {
    await withTransaction(pool, async (client) => {
      const userId1 = await createTestUser(client);
      const userId2 = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId1);

      // Insert vote (should trigger rating update)
      await client.query(
        `
        INSERT INTO votes (idea_id, user_id, rating) VALUES ($1, $2, 5)
      `,
        [ideaId, userId2],
      );

      // Check rating was automatically updated
      const result = await client.query(
        `
        SELECT rating FROM ideas WHERE id = $1
      `,
        [ideaId],
      );
      expect(result.rows[0].rating).toBe(5.0);
    });
  });

  it("should create notification on credit transaction", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      // Insert credit transaction (should trigger notification)
      await client.query(
        `
        INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata)
        VALUES ($1, 'credit_purchase', 100, '{}')
      `,
        [userId],
      );

      // Check notification was created
      const result = await client.query(
        `
        SELECT type FROM notifications WHERE user_id = $1
      `,
        [userId],
      );
      expect(result.rows.some((n) => n.type === "credit_earned")).toBe(true);
    });
  });

  it("should update user activity on idea modification", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      // Update idea (should trigger activity log)
      await client.query(
        `
        UPDATE ideas SET title = 'Updated Title' WHERE id = $1
      `,
        [ideaId],
      );

      // Check activity was logged
      const result = await client.query(
        `
        SELECT action FROM user_activity WHERE user_id = $1
      `,
        [userId],
      );
      expect(result.rows.some((a) => a.action === "idea_updated")).toBe(true);
    });
  });
});
