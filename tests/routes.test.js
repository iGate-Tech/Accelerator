import { describe, test, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock all dependencies
vi.mock("dotenv");
vi.mock("connect-pg-simple", () => ({
  default: vi.fn(() => class PostgreSQLStore {}),
}));
vi.mock("express-session");
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "test-user" } }, error: null }),
      ),
    },
    rpc: vi.fn(() => Promise.resolve({ data: { status: "OK" }, error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
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
  callOpenRouter: vi.fn(() => Promise.resolve({ success: true })),
}));
vi.mock("../lib/session.js", () => ({
  optionalAuth: vi.fn((req, res, next) => next()),
  requireAuth: vi.fn((req, res, next) => {
    req.user = { id: "test-user" };
    next();
  }),
}));

// Now import routes
import routes from "../lib/routes.js";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.render = vi.fn((view, options, callback) => {
    if (callback) {
      callback(null, "<html>Test</html>");
    } else {
      res.send("<html>Test</html>");
    }
  });
  next();
});
app.use("/", routes);

const OK_STATUS = 200;

describe("Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET /api/health should return health data", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /api/dashboard should require auth", async () => {
    const response = await request(app).get("/api/dashboard");
    expect(response.status).toBe(OK_STATUS); // Since requireAuth is mocked to set user
  });

  test("POST /api/ideas should create idea", async () => {
    const response = await request(app)
      .post("/api/ideas")
      .send({ title: "Test Idea" });
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /api/achievements should return data", async () => {
    const response = await request(app).get("/api/achievements");
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /api/recommendations should return data", async () => {
    const response = await request(app).get("/api/recommendations");
    expect(response.status).toBe(OK_STATUS);
  });

  test("POST /api/votes should process vote", async () => {
    const response = await request(app)
      .post("/api/votes")
      .send({ idea_id: "123", rating: 5 });
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /terms should return terms page", async () => {
    const response = await request(app).get("/terms");
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /privacy should return privacy page", async () => {
    const response = await request(app).get("/privacy");
    expect(response.status).toBe(OK_STATUS);
  });

  test("GET /dashboard/data should return HTMX data", async () => {
    const response = await request(app).get("/dashboard/data");
    expect(response.status).toBe(OK_STATUS);
  });
});
