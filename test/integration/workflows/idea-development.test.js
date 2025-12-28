import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import { createTestUser, createTestIdea } from "../../utils/test-helpers.js";

const pool = createTestDb();

describe("Idea Development Workflow", () => {
  it("should complete full idea development cycle", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      // Create idea
      const createResult = await client.query(
        `
        SELECT manage_idea($1, 'create', '{"title": "AI Startup", "description": "AI platform"}')
      `,
        [userId],
      );
      const ideaId = createResult.rows[0].manage_idea.idea_id;

      // Create model instance
      const modelResult = await client.query(
        `
        SELECT manage_model_instance($1, $2, 'business', 'create')
      `,
        [userId, ideaId],
      );
      expect(modelResult.rows[0].manage_model_instance.success).toBe(true);

      // Complete sections
      const sectionsResult = await client.query(
        `
        SELECT id FROM model_sections WHERE model_instance_id = $1
      `,
        [modelResult.rows[0].manage_model_instance.model_id],
      );

      for (const section of sectionsResult.rows) {
        await client.query(`SELECT complete_model_section($1, $2)`, [
          section.id,
          userId,
        ]);
      }

      // Check completion percentage
      const ideaResult = await client.query(
        `
        SELECT completion_percentage FROM ideas WHERE id = $1
      `,
        [ideaId],
      );
      expect(ideaResult.rows[0].completion_percentage).toBeGreaterThan(0);
    });
  });

  it("should handle model generation and AI assistance", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      // Generate business model
      const generateResult = await client.query(
        `
        SELECT generate_business_model($1, $2)
      `,
        [userId, ideaId],
      );

      expect(generateResult.rows[0].generate_business_model.success).toBe(true);

      // Check model instance created
      const modelResult = await client.query(
        `
        SELECT model_type FROM model_instances WHERE idea_id = $1
      `,
        [ideaId],
      );

      expect(modelResult.rows.some((m) => m.model_type === "business")).toBe(
        true,
      );
    });
  });
});
