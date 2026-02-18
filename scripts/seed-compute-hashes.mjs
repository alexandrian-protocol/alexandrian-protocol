/**
 * Compute contentHash for each seed envelope.
 * Output: seeds/hashes.json (name -> contentHash) for use by seed scripts.
 * Uses same algorithm as generate-test-vector-expected.mjs (standalone, no protocol import).
 *
 * Run from repo root: node scripts/seed-compute-hashes.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error("Unsupported type");
}

function contentHashFromEnvelope(envelope) {
  const out = { ...envelope };
  delete out.parents;
  const arr = out.sources ?? envelope.parents;
  out.sources = arr && arr.length > 1 ? [...arr].sort() : (arr ?? []);
  const canonical = canonicalize(out);
  return "0x" + createHash("sha256").update(canonical, "utf8").digest("hex");
}

const seeds = [
  ["software.security", "practice-constant-time-comparison"],
  ["software.security", "practice-token-rotation"],
  ["software.security", "practice-rate-limiting"],
  ["software.security", "practice-input-validation"],
  ["software.security", "practice-secrets-management"],
  ["software.security", "state-machine-auth-flow"],
  ["software.security", "state-machine-token-lifecycle"],
  ["software.security", "compliance-owasp-top10"],
  ["software.security", "compliance-jwt-rfc7519"],
  ["software.security", "synthesis-secure-api-design"],
  ["software.security", "synthesis-auth-patterns"],
  ["software.patterns", "practice-retry-exponential-backoff"],
  ["software.patterns", "practice-circuit-breaker"],
  ["software.patterns", "pattern-webhook-delivery"],
  ["software.patterns", "pattern-idempotency-key"],
  ["software.patterns", "adaptation-retry-to-queue"],
  ["software.patterns", "enhancement-circuit-breaker-observability"],
  ["meta.alexandria", "practice-kb-authoring"],
  ["meta.alexandria", "practice-domain-taxonomy"],
  ["meta.alexandria", "synthesis-knowledge-economy-intro"],
];

const hashes = {};
for (const [domain, name] of seeds) {
  const dir = join(root, "seeds", domain, name);
  try {
    const envelope = JSON.parse(readFileSync(join(dir, "envelope.json"), "utf8"));
    const h = contentHashFromEnvelope(envelope);
    const key = `${domain}/${name}`;
    hashes[key] = h;
    console.log(key, "->", h.slice(0, 18) + "...");
  } catch (e) {
    console.warn("Skip", domain, name, e.message);
  }
}
writeFileSync(join(root, "seeds", "hashes.json"), JSON.stringify(hashes, null, 2) + "\n");
console.log("\nWritten seeds/hashes.json");
