/**
 * subgraph-deploy.cjs — Codegen, build, and optionally deploy subgraph to The Graph Studio
 *
 * After pnpm deploy:testnet, subgraph.yaml is already patched with address and startBlock.
 * This script runs codegen + build, then if GRAPH_STUDIO_DEPLOY_KEY and SUBGRAPH_SLUG
 * are set, deploys to Studio (no manual auth or typing for testers).
 *
 * Usage:
 *   pnpm subgraph:deploy
 *
 * Env (e.g. packages/protocol/.env or root .env):
 *   GRAPH_STUDIO_DEPLOY_KEY  — Studio deploy key (from Subgraph Studio → Settings)
 *   SUBGRAPH_SLUG            — Subgraph slug (e.g. alexandria or your-studio-id)
 *
 * If either is missing, only codegen + build run; deploy is skipped.
 */

const path = require("path");
const { execSync } = require("child_process");

// Load env from protocol .env then root .env so testers can use one place
require("dotenv").config({ path: path.join(__dirname, "..", "packages", "protocol", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const repoRoot = path.join(__dirname, "..");
const subgraphDir = path.join(repoRoot, "subgraph");

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd: opts.cwd || repoRoot, ...opts });
}

function main() {
  console.log("\n  Subgraph: codegen + build…\n");
  run("pnpm subgraph:codegen");
  run("pnpm subgraph:build");

  const key = process.env.GRAPH_STUDIO_DEPLOY_KEY;
  const slug = process.env.SUBGRAPH_SLUG;

  if (!key || !slug) {
    console.log("\n  Skipping deploy (set GRAPH_STUDIO_DEPLOY_KEY and SUBGRAPH_SLUG to deploy to Studio).\n");
    return;
  }

  const versionLabel = "v" + Math.floor(Date.now() / 1000);
  console.log("\n  Deploying to The Graph Studio:", slug, "version", versionLabel, "\n");
  run(
    `pnpm exec graph deploy --studio ${slug} --deploy-key ${key} --version-label ${versionLabel}`,
    { cwd: subgraphDir }
  );
  console.log("\n  Deploy complete.\n");
}

main();
