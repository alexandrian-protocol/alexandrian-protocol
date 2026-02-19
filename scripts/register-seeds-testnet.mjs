#!/usr/bin/env node
/**
 * Register seed KBs on testnet (KnowledgeRegistry on Base Sepolia).
 * Run after: pnpm build, pnpm deploy:testnet, and set KNOWLEDGE_REGISTRY_ADDRESS + PRIVATE_KEY in packages/protocol/.env
 *
 * Registers seeds in dependency order (roots first, then derived) so lineage is valid.
 * Skips already-registered KBs.
 *
 * Usage: node scripts/register-seeds-testnet.mjs
 */
import { config } from "dotenv";
import { join } from "path";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHash } from "crypto";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
config({ path: join(root, "packages", "protocol", ".env") });

// Inline JCS-style canonical hash (matches @alexandrian/protocol canonical.ts) so we avoid loading protocol/multiformats
function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number in canonical input");
    return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return JSON.stringify(String(value));
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalize(v)).join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error("Unsupported type for canonicalization");
}
function normalizeForHash(envelope) {
  const out = { ...envelope };
  delete out.parents;
  const arr = out.sources ?? envelope.parents;
  out.sources = arr && arr.length > 1 ? [...arr].sort() : (arr ?? []);
  return out;
}
function contentHashFromEnvelope(envelope) {
  const normalized = normalizeForHash(envelope);
  const canonical = canonicalize(normalized);
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return "0x" + digest;
}

const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
let REGISTRY_ADDRESS = process.env.KNOWLEDGE_REGISTRY_ADDRESS;
if (!REGISTRY_ADDRESS || REGISTRY_ADDRESS === "*TBD*") {
  const deploymentsPath = join(root, "packages", "protocol", "deployments", "KnowledgeRegistry.json");
  if (existsSync(deploymentsPath)) {
    const deployment = JSON.parse(readFileSync(deploymentsPath, "utf8"));
    REGISTRY_ADDRESS = deployment.address;
  }
}
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const KNOWLEDGE_REGISTRY_ABI = [
  "function registerKB(bytes32 _contentHash, uint8 _type, bytes32[] _parents) external returns (bytes32)",
  "function isVerified(bytes32 _kbId) external view returns (bool)",
];

// KBType enum: Practice=0, Feature=1, StateMachine=2, PromptEngineering=3, ComplianceChecklist=4, Rubric=5
function envelopeTypeToKBType(type) {
  const map = {
    practice: 0,
    stateMachine: 2,
    complianceChecklist: 4,
    pattern: 0,
    synthesis: 0,
    adaptation: 0,
    enhancement: 0,
  };
  return map[type] ?? 0;
}

// Registration order: roots first (no sources), then derived. Matches seeds/README "Recommended for graph" + full set.
const SEED_PATHS = [
  "seeds/software.security/practice-input-validation/envelope.json",
  "seeds/software.security/practice-rate-limiting/envelope.json",
  "seeds/software.security/practice-constant-time-comparison/envelope.json",
  "seeds/software.security/practice-token-rotation/envelope.json",
  "seeds/software.security/practice-secrets-management/envelope.json",
  "seeds/software.security/state-machine-auth-flow/envelope.json",
  "seeds/software.security/state-machine-token-lifecycle/envelope.json",
  "seeds/software.security/compliance-owasp-top10/envelope.json",
  "seeds/software.security/compliance-jwt-rfc7519/envelope.json",
  "seeds/software.patterns/practice-retry-exponential-backoff/envelope.json",
  "seeds/software.patterns/practice-circuit-breaker/envelope.json",
  "seeds/software.patterns/pattern-idempotency-key/envelope.json",
  "seeds/software.patterns/pattern-webhook-delivery/envelope.json",
  "seeds/software.patterns/adaptation-retry-to-queue/envelope.json",
  "seeds/software.patterns/enhancement-circuit-breaker-observability/envelope.json",
  "seeds/meta.alexandria/practice-kb-authoring/envelope.json",
  "seeds/meta.alexandria/practice-domain-taxonomy/envelope.json",
  "seeds/software.security/synthesis-secure-api-design/envelope.json",
  "seeds/software.security/synthesis-auth-patterns/envelope.json",
  "seeds/meta.alexandria/synthesis-knowledge-economy-intro/envelope.json",
];

async function main() {
  if (!REGISTRY_ADDRESS || !PRIVATE_KEY) {
    console.error("Set PRIVATE_KEY in packages/protocol/.env. KnowledgeRegistry address comes from .env (KNOWLEDGE_REGISTRY_ADDRESS) or from packages/protocol/deployments/KnowledgeRegistry.json after pnpm deploy:testnet.");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  const registry = new Contract(REGISTRY_ADDRESS, KNOWLEDGE_REGISTRY_ABI, wallet);

  console.log("\n  Registering seeds on KnowledgeRegistry (Base Sepolia)");
  console.log("  Registry:", REGISTRY_ADDRESS);
  console.log("  Deployer:", wallet.address);
  console.log("");

  let registered = 0;
  let skipped = 0;

  for (const relPath of SEED_PATHS) {
    const fullPath = join(root, relPath);
    if (!existsSync(fullPath)) {
      console.log("  Skip (missing):", relPath);
      continue;
    }
    const envelope = JSON.parse(readFileSync(fullPath, "utf8"));
    const contentHash = contentHashFromEnvelope(envelope);
    const type = envelope.type ?? envelope.payload?.type ?? "practice";
    const kbType = envelopeTypeToKBType(type);
    const parents = Array.isArray(envelope.sources) ? envelope.sources : [];

    const isVerified = await registry.isVerified(contentHash);
    if (isVerified) {
      console.log("  Skip (already registered):", relPath, "→", contentHash.slice(0, 18) + "…");
      skipped++;
      continue;
    }

    try {
      const tx = await registry.registerKB(contentHash, kbType, parents);
      await tx.wait();
      console.log("  Registered:", relPath, "→", contentHash.slice(0, 18) + "…");
      registered++;
    } catch (e) {
      const msg = e?.message ?? String(e);
      if (msg.includes("Already registered")) {
        console.log("  Skip (already registered):", relPath);
        skipped++;
      } else {
        console.error("  Error registering", relPath, msg);
        throw e;
      }
    }
  }

  console.log("\n  Done. Registered:", registered, "| Skipped:", skipped);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
