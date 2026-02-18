/**
 * Generate expected.json for canonical test vectors.
 * Standalone: no protocol import (avoids multiformats resolution).
 * Uses same algorithm as canonical.ts: sort sources, JCS, SHA-256.
 *
 * Run from repo root: node scripts/generate-test-vector-expected.mjs
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

const vectors = [
  "test-vectors/canonical/types/practice-minimal",
  "test-vectors/canonical/types/practice-with-parents",
  "test-vectors/canonical/types/state-machine",
  "test-vectors/canonical/types/prompt",
  "test-vectors/canonical/types/compliance",
  "test-vectors/canonical/types/synthesis",
  "test-vectors/canonical/types/pattern",
  "test-vectors/canonical/types/adaptation",
  "test-vectors/canonical/types/enhancement",
  "test-vectors/canonical/edge-cases/empty-payload-fields",
  "test-vectors/canonical/edge-cases/max-sources",
  "test-vectors/canonical/edge-cases/unicode-content",
  "test-vectors/canonical/edge-cases/large-payload",
];

for (const rel of vectors) {
  const dir = join(root, rel);
  const envelope = JSON.parse(readFileSync(join(dir, "envelope.json"), "utf8"));
  const contentHash = contentHashFromEnvelope(envelope);
  const expected = { contentHash };
  writeFileSync(join(dir, "expected.json"), JSON.stringify(expected, null, 2) + "\n");
  console.log(rel, "->", contentHash.slice(0, 18) + "...");
}
console.log("Done.");
