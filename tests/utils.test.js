import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("dotenv");
vi.mock("fs");
vi.mock("winston", () => ({
  default: {
    createLogger: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      http: vi.fn(),
      debug: vi.fn(),
    })),
    format: {
      json: vi.fn(),
      timestamp: vi.fn(),
      printf: vi.fn(),
      combine: vi.fn(),
      colorize: vi.fn(),
      errors: vi.fn(),
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
    },
    addColors: vi.fn(),
  },
}));

// Mock config
vi.mock("../lib/config.js", () => ({
  default: {
    nodeEnv: "test",
    supabase: {
      url: "test-url",
      serviceKey: "test-key",
    },
  },
}));

// Mock supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  })),
}));

// Now import after mocks
import { logger, getUserCredits, deductCredits } from "../lib/utils.js";

describe("Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("logger should have required methods", () => {
    expect(logger).toHaveProperty("error");
    expect(logger).toHaveProperty("warn");
    expect(logger).toHaveProperty("info");
    expect(logger).toHaveProperty("debug");
  });

  test("getUserCredits should call supabase rpc", async () => {
    const result = await getUserCredits("user-id");
    expect(result).toHaveProperty("balance");
  });

  test("deductCredits should call supabase rpc", async () => {
    const result = await deductCredits("user-id", 10, { reason: "test" });
    expect(result).toBeDefined();
  });
});
