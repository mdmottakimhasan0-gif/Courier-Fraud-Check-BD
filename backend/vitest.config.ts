import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "json-summary"],
      reportsDirectory: "../coverage/backend"
    },
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
    restoreMocks: true
  }
});
