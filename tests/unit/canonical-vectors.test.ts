/**
 * Validates canonical test vectors produce expected contentHash.
 * Regression test for Milestone 1 serialization spec.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { contentHashFromEnvelope, canonicalize, sortSources } from "@alexandrian/protocol/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");
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

describe("Canonical test vectors", () => {
  for (const rel of vectors) {
    it(`${rel} produces expected contentHash`, () => {
      const dir = join(root, rel);
      const envelope = JSON.parse(
        readFileSync(join(dir, "envelope.json"), "utf8")
      );
      const expected = JSON.parse(
        readFileSync(join(dir, "expected.json"), "utf8")
      );
      const contentHash = contentHashFromEnvelope(envelope);
      expect(contentHash).toBe(expected.contentHash);
      if (expected.canonicalJson) {
        const sorted = sortSources(envelope);
        const canonical = canonicalize(sorted);
        expect(canonical).toBe(expected.canonicalJson);
      }
    });
  }
});
