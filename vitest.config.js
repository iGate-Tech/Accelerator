import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup/global.js"],
    testTimeout: 30000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true, // Database tests need sequential execution
      },
    },
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/"],
    },
  },
});
