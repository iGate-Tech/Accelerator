import { describe, test, expect, vi } from "vitest";

// Mock dependencies
vi.mock("dotenv");
vi.mock("connect-pg-simple", () => ({
  default: vi.fn(() => vi.fn()),
}));
vi.mock("express-session", () => ({
  default: vi.fn(() => (req, res, next) => next()),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "test-user" } }, error: null }),
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: { id: "test-user", name: "Test" },
              error: null,
            }),
          ),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  })),
}));
vi.mock("../lib/config.js", () => ({
  default: {
    supabase: {
      url: "test-url",
      key: "test-key",
    },
  },
}));
vi.mock("../lib/utils.js", () => ({
  logger: {
    error: vi.fn(),
  },
}));
vi.mock("../utils/profile-init.js", () => ({
  initializeUserProfile: vi.fn(() => Promise.resolve({ success: true })),
}));

// Now import
import { requireAuth, optionalAuth, guestOnly } from "../lib/session.js";

describe("Session Middleware", () => {
  test("requireAuth should be a function", () => {
    expect(typeof requireAuth).toBe("function");
  });

  test("optionalAuth should be a function", () => {
    expect(typeof optionalAuth).toBe("function");
  });

  test("guestOnly should be a function", () => {
    expect(typeof guestOnly).toBe("function");
  });
});
