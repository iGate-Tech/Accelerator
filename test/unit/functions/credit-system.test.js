import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import {
  createTestUser,
  expectDatabaseError,
} from "../../utils/test-helpers.js";

const pool = createTestDb();

describe("Credit System", () => {
  it("should process credit transaction successfully", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      const result = await client.query(
        `
        SELECT process_credit_transaction($1, 'credit_purchase', 500, '{}')
      `,
        [userId],
      );

      expect(result.rows[0].process_credit_transaction.success).toBe(true);

      // Check balance updated
      const balanceResult = await client.query(
        `
        SELECT credit_balance FROM profiles WHERE user_id = $1
      `,
        [userId],
      );
      expect(balanceResult.rows[0].credit_balance).toBe(1500);
    });
  });

  it("should reject insufficient credit transactions", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client, { credits: 100 });

      await expectDatabaseError(
        client.query(
          `SELECT process_credit_transaction($1, 'ai_generation', -200, '{}')`,
          [userId],
        ),
        "P0001", // Custom error from function
      );
    });
  });

  it("should handle credit rewards correctly", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      const result = await client.query(
        `
        SELECT process_credit_reward($1, 'voting_reward', 50)
      `,
        [userId],
      );

      expect(result.rows[0].process_credit_reward.success).toBe(true);

      // Check balance updated
      const balanceResult = await client.query(
        `
        SELECT credit_balance FROM profiles WHERE user_id = $1
      `,
        [userId],
      );
      expect(balanceResult.rows[0].credit_balance).toBe(1050);
    });
  });
});
