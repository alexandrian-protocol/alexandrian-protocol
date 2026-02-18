import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      // Use source for protocol so vitest transforms TS (avoids multiformats CJS resolution)
      "@alexandrian/protocol": resolve(__dirname, "packages/protocol/src"),
      "@alexandrian/protocol/core": resolve(__dirname, "packages/protocol/src/core/index.ts"),
      "@alexandrian/protocol/schema": resolve(__dirname, "packages/protocol/src/schema/index.ts"),
      "@alexandrian/pipeline": resolve(__dirname, "packages/pipeline"),
      // Resolve api .js imports to .ts stubs when @alexandrian/api package is not present
      "../../packages/api/server.js": resolve(__dirname, "packages/api/server.ts"),
      "../../packages/api/services/merkle.js": resolve(__dirname, "packages/api/services/merkle.ts"),
      "../../packages/api/services/ledger.js": resolve(__dirname, "packages/api/services/ledger.ts"),
    },
  },
});
