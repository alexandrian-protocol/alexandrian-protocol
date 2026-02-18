#!/usr/bin/env node
/**
 * One-command full E2E demo: start stack, deploy, run demo.
 *
 * Usage:
 *   pnpm demo:full
 *   node scripts/run-full-demo.mjs
 *
 * Does:
 *   1. docker compose up -d
 *   2. Wait for blockchain (8545) and API (3000)
 *   3. pnpm deploy:local
 *   4. Brief pause for API to pick up contracts
 *   5. pnpm demo
 *
 * Requires: Docker, Node, pnpm. On first run, ensure packages/api/.env exists
 * (copy from .env.example); deploy:local will write Registry/Token addresses.
 */
import { spawn } from "child_process";
import { createInterface } from "readline";
import http from "http";

const ROOT = process.cwd();
const DOCKER_COMPOSE = "docker/docker-compose.yml";
const MAX_WAIT_MS = 120000;
const POLL_MS = 2000;

function log(msg) {
  console.log(`[demo:full] ${msg}`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const cwd = opts.cwd || ROOT;
    const shell = false;
    const p = spawn(cmd, args, {
      stdio: opts.silent ? "pipe" : "inherit",
      shell,
      cwd,
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      { hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80), path: u.pathname || "/", method: "GET", timeout: 5000 },
      (res) => resolve(res.statusCode)
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

function rpcBlockNumber(host = "http://127.0.0.1:8545") {
  return new Promise((resolve, reject) => {
    const u = new URL(host);
    const body = JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 });
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 8545,
        path: u.pathname || "/",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        timeout: 5000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(data);
            resolve(j.result != null);
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });
}

async function waitFor(fn, label) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      if (await fn()) {
        log(`${label} ready`);
        return;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function main() {
  log("Starting Docker stack...");
  await run("docker", ["compose", "-f", DOCKER_COMPOSE, "up", "-d"], { cwd: ROOT });
  await new Promise((r) => setTimeout(r, 3000));

  log("Waiting for blockchain (8545) and API (3000)...");
  await waitFor(() => rpcBlockNumber(), "Blockchain");
  await waitFor(() => httpGet("http://127.0.0.1:3000/").then((c) => c === 200 || c === 404).catch(() => false), "API");

  log("Deploying contracts (pnpm deploy:local)...");
  await run("pnpm", ["deploy:local"], { cwd: ROOT });

  log("Waiting 5s for API to use new contracts...");
  await new Promise((r) => setTimeout(r, 5000));

  log("Running demo (pnpm demo)...");
  await run("pnpm", ["demo"], { cwd: ROOT });

  log("Done. Full E2E loop complete.");
}

main().catch((err) => {
  console.error("[demo:full]", err.message);
  process.exit(1);
});
