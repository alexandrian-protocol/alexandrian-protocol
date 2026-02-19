#!/usr/bin/env node
/**
 * Reads vitest JSON report and exits 1 if any integration test was skipped
 * and is not in the expected allowlist (M2/API-dependent tests).
 * Usage: run "vitest run tests/ --reporter=json --outputFile=integration-results.json" first, then:
 *   node scripts/assert-no-skipped-integration.mjs
 *
 * No describe.skip hiding broken logic — skips must be documented (M1/M2 comments) and listed here.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const reportPath = join(root, "integration-results.json");

// Expected skipped test files (M2/API-dependent; testnet/subgraph require funded wallet + deployed contracts).
const ALLOWED_SKIP_FILES = [
  "ai-usage-proof.test",
  "flow-ai-usage-proof.test",
  "attribution-verification.test",
  "deprecation.test",
  "lineage.test",
  "payment-settlement.test",
  "query-settlement-fullstack.test",
  "royalty-settlement.test",
  "testnet-smoke.test",
  "subgraph.test",
];

function isAllowedSkip(filePath) {
  const name = filePath.split(/[/\\]/).pop() || "";
  return ALLOWED_SKIP_FILES.some((allowed) => name.includes(allowed));
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, "utf-8"));
} catch (e) {
  console.error(
    "Error: Could not read integration-results.json. Run: vitest run tests/ --reporter=json --outputFile=integration-results.json"
  );
  process.exit(2);
}

const unexpectedSkips = [];
for (const file of report.testResults || []) {
  const filePath = file.name || "";
  for (const assertion of file.assertionResults || []) {
    if (assertion.status === "skipped") {
      if (!isAllowedSkip(filePath)) {
        unexpectedSkips.push({ file: filePath, title: assertion.title || assertion.fullName });
      }
    }
  }
}

if (unexpectedSkips.length > 0) {
  console.error("CI: Unexpected integration test(s) skipped. Fix or add to allowlist in scripts/assert-no-skipped-integration.mjs.");
  unexpectedSkips.forEach(({ file, title }) => console.error("  -", file, "|", title));
  process.exit(1);
}

console.log("CI: No unexpected integration tests skipped.");
process.exit(0);
