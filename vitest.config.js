import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "scripts/",
        "public/",
        "locales/",
        "lib/components/",
        "lib/layouts/",
        "lib/pages/",
        "lib/prompts/",
        "db/",
        "docker-compose.yml",
        "Dockerfile",
        "*.config.js",
        "*.md",
      ],
    },
  },
});
