#!/usr/bin/env node
/**
 * M1 demo — human-readable walkthrough for grant reviewers.
 *
t * The only command needed for the M1 demo:  pnpm demo:walkthrough
 * (from repo root; run after pnpm install, or we build first)
 *
 * This script runs the supporting test files in tests/demo-walkthrough/ plus protocol:
 *   tests/demo-walkthrough/demo-protocol-walkthrough.test.ts
 *   tests/demo-walkthrough/ingestion.test.ts
 *   tests/demo-walkthrough/m1-demo.test.ts
 *   packages/protocol/test/QuerySettleWalkthrough.test.js
 *
 * Format: .mjs for ESM without requiring "type": "module" in package.json.
 */
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const major = parseInt(process.version.slice(1).split(".")[0], 10);
if (major >= 24) {
  console.error("\nThis script requires Node.js 20 LTS. You have Node " + process.version + ".");
  console.error("Node 24 has a known compatibility issue (multiformats) in this repo.");
  console.error("Switch to Node 20: run  nvm use   or  fnm use   (see .nvmrc), then run again:\n   pnpm demo:walkthrough\n");
  process.exit(1);
}

const B = "═══════════════════════════════════════════════";
const S = "───────────────────────────────────────────────";

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
    maxBuffer: 10 * 1024 * 1024,
  });
}

function isNoise(line) {
  if (/^\s*$/.test(line)) return true;
  if (/Duration\s+[\d.]+m?s\s*\(/.test(line) || /\btransform\s+\d+ms\b/.test(line) || /\bsetup\s+\d+ms\b/.test(line) || /\bcollect\s+\d+ms\b/.test(line) || /\btests\s+\d+ms\b/.test(line) || /\bprepare\s+\d+ms\b/.test(line)) return true;
  if (/^\s*Start at\s+/.test(line)) return true;
  if (/RUN\s+v\d[\d.]+\s/i.test(line) || /^\s*RUN\s+v\d/i.test(line)) return true;
  if (/CJS build of Vite's Node API is deprecated/i.test(line)) return true;
  return false;
}

/** Run vitest; print stdout blocks first, then pass/fail. Suppress timing and reporter noise. */
function runQuietVitest(cmd) {
  const fullCmd = `${cmd} 2>&1`;
  try {
    const out = execSync(fullCmd, {
      cwd: root,
      encoding: "utf8",
      shell: true,
      env: { ...process.env, FORCE_COLOR: "0" },
      maxBuffer: 10 * 1024 * 1024,
    });
    const lines = (out || "").split(/\r?\n/);
    const stdoutBlocks = [];
    const rest = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isNoise(line)) { i++; continue; }
      if (/^\s*stdout\s+\|/.test(line)) {
        const block = [];
        while (i < lines.length) {
          if (isNoise(lines[i])) { i++; continue; }
          if (/^\s*✓\s/.test(lines[i]) || /^\s*Test Files\s+/.test(lines[i]) || /^\s+Tests\s+\d+/.test(lines[i])) break;
          block.push(lines[i]);
          i++;
        }
        if (block.length) stdoutBlocks.push(block);
      } else {
        rest.push(line);
        i++;
      }
    }
    for (const block of stdoutBlocks) { for (const l of block) console.log(l); }
    for (const l of rest) if (!isNoise(l)) console.log(l);
    console.log("");
  } catch (e) {
    const out = (e.stdout || e.stderr || "").toString();
    const lines = out.split(/\r?\n/);
    for (const line of lines) {
      if (isNoise(line)) continue;
      console.log(line);
    }
    throw e;
  }
}

console.log("\n" + B);
console.log("   Alexandrian Protocol — M1 Demo");
console.log("   (Grant reviewer artifact)");
console.log(B + "\n");

console.log("Step 1 — Building packages...");
console.log("   Knowledge Blocks have permanent cryptographic identities — the same content always produces the same address, forever.");
console.log("   (Compiling protocol, pipeline, SDK, API)");
console.log("");
run("pnpm build");

console.log("\n" + S + "\n");
console.log("Step 2 — Protocol demo: Register KB → Derive KB");
console.log("   Deterministic CIDs mean agents and curators can refer to the same KB by one content hash; derivations link to parents for provenance and royalties.");
console.log("   (VirtualRegistry; no chain required)");
console.log("");
runQuietVitest("pnpm exec vitest run tests/demo-walkthrough/demo-protocol-walkthrough.test.ts --reporter=verbose");

console.log("\n" + S + "\n");
console.log("Step 3 — Ingestion demo: Raw content → CID → Knowledge blocks");
console.log("   Raw content is fingerprinted and turned into verifiable blocks that can be registered and queried.");
console.log("   (Pipeline + protocol; verifiable identity)");
console.log("");
runQuietVitest("pnpm exec vitest run tests/demo-walkthrough/ingestion.test.ts --reporter=verbose");

console.log("\n" + S + "\n");
console.log("Step 4 — M1 demo tests: Determinism, registry, invariants");
console.log("   The protocol enforces key order and source order so that hashes are stable and invalid envelopes are rejected.");
console.log("   (Canonical identity, source ordering, duplicate rejection, subgraph format)");
console.log("");
runQuietVitest("pnpm exec vitest run tests/demo-walkthrough/m1-demo.test.ts --reporter=verbose");

console.log("\n" + S + "\n");
console.log("Step 5 — Agent Query + Payment (ETH)");
console.log("   An AI agent looks up a Knowledge Block and pays the query fee in ETH; the curator receives ETH atomically and provenance is permanent.");
console.log("   (Local Hardhat: Registry only; stake and query fee in native ETH — no token required.)");
console.log("");
run("pnpm --filter @alexandrian/protocol run test test/QuerySettleWalkthrough.test.js");

console.log("\n" + B + "\n");
console.log("   What was demonstrated");
console.log(B);
console.log("");
console.log("   • Economic loop               AI agent queries KB → curator receives payment → provenance is permanent on-chain.");
console.log("   • Deterministic identity     Same input → same contentHash/CID.");
console.log("   • Registry semantics         Register root KB, derive child KB; query + settle on-chain.");
console.log("   • Ingestion loop             Raw content → fingerprint → knowledge blocks.");
console.log("   • M1 guarantees              Key order, source order, invariants enforced.");
console.log("   • Local verification         All steps run locally; deploy to Base Sepolia with one command for testnet.");
console.log("");
console.log(B);
console.log("");
console.log("   Next: Testnet");
console.log("   Set BASE_SEPOLIA_RPC_URL and PRIVATE_KEY, then: pnpm deploy:testnet");
console.log("   Record addresses in docs/TESTNET-ADDRESSES.md");
console.log("");
console.log(B + "\n");
