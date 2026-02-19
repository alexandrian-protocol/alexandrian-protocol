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
      // Pipeline: use built dist (main) so "./cache/index.js" resolves; alias to source breaks on CI (no .js in source).
      // API server only — for integration tests that hit the runtime. Protocol core tests use local helpers (tests/invariants/ledger.ts, tests/integration/merkle.ts) and must not depend on api.
      "../../packages/api/server.js": resolve(__dirname, "packages/api/server.ts"),
    },
  },
});
