import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup/global.js"],
    testTimeout: 30000,
    hookTimeout: 60000, // Increase for DB operations
    pool: "threads",
    threads: {
      singleThread: true, // Database tests need sequential execution
    },
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/"],
    },
  },
});
