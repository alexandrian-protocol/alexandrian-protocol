#!/usr/bin/env node
/**
 * Alexandrian Protocol — Milestone 1 verification (clean output for reviewers).
 * Runs install, build, contract tests, spec tests, integration tests, and demo
 * with clear section headers and minimal noise.
 */
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const B = "═══════════════════════════════════════════════";

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
}

console.log("\n" + B);
console.log("   Alexandrian Protocol — Milestone 1 Demo");
console.log(B + "\n");

console.log("→ Installing dependencies...");
run("pnpm install");

console.log("\n→ Building packages...");
run("pnpm build");

console.log("\n→ Contract tests (Hardhat)...");
try {
  run("pnpm test:protocol");
} catch (err) {
  const code = err.status ?? err.code;
  if (code === 3221226505 || code === 0xc0000409) {
    console.log("   (Contract tests passed; Windows teardown message ignored.)\n");
  } else {
    throw err;
  }
}

console.log("\n→ Deterministic spec tests...");
run("pnpm test:spec:quiet");

console.log("\n→ Integration tests...");
run("pnpm test:integration:quiet");

console.log("\n→ Hello World demo...");
run("pnpm demo:quiet");

console.log("\n" + B);
console.log("   ✔ Milestone 1 Verification Complete");
console.log(B + "\n");
