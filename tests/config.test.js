import { describe, test, expect, vi } from "vitest";
import config from "../lib/config.js";

// Mock dotenv
vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

// Mock fs
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => false), // Assume no .env
  },
}));

describe("Config", () => {
  test("should have default values", () => {
    expect(config.port).toBe(4000);
    expect(config.nodeEnv).toBe("test");
  });

  test("should have supabase config structure", () => {
    expect(config.supabase).toHaveProperty("url");
    expect(config.supabase).toHaveProperty("key");
    expect(config.supabase).toHaveProperty("serviceKey");
    expect(config.supabase).toHaveProperty("dbUrl");
  });

  test("should have ai config structure", () => {
    expect(config.ai).toHaveProperty("openrouter");
    expect(config.ai.openrouter).toHaveProperty("apiKey");
    expect(config.ai.openrouter).toHaveProperty("model");
  });
});
