import { describe, test, expect, vi } from "vitest";

// Mock app
vi.mock("../lib/app.js", () => ({
  default: {
    listen: vi.fn(() => ({
      on: vi.fn(),
    })),
  },
}));

// Mock config
vi.mock("../lib/config.js", () => ({
  default: {
    port: 4000,
  },
}));

describe("Index", () => {
  test("should export server", async () => {
    const { default: server } = await import("../index.js");
    expect(server).toBeDefined();
  });
});
