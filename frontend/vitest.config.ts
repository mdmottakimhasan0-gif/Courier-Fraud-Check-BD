import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  test: {
    coverage: {
      reporter: ["text", "json-summary"],
      reportsDirectory: "../coverage/frontend"
    },
    environment: "jsdom",
    globals: true,
    include: ["**/*.spec.ts", "**/*.spec.tsx"],
    setupFiles: ["./vitest.setup.ts"]
  }
});
