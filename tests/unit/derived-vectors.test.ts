/**
 * Derived block test vectors — single-parent, multi-parent, parent-sort, cycle rejection.
 * Milestone 1 conformance.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  contentHashFromEnvelope,
  VirtualRegistry,
  VirtualRegistryError,
} from "@alexandrian/protocol/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

describe("Derived block test vectors", () => {
  it("single-parent derivation produces stable contentHash", () => {
    const dir = join(root, "test-vectors/canonical/derivation/single-parent");
    const envelope = JSON.parse(
      readFileSync(join(dir, "envelope.json"), "utf8")
    );
    const expected = JSON.parse(
      readFileSync(join(dir, "expected.json"), "utf8")
    );
    const contentHash = contentHashFromEnvelope(envelope);
    expect(contentHash).toBe(expected.contentHash);
  });

  it("multi-parent derivation produces stable contentHash", () => {
    const dir = join(root, "test-vectors/canonical/derivation/multi-parent");
    const envelope = JSON.parse(
      readFileSync(join(dir, "envelope.json"), "utf8")
    );
    const expected = JSON.parse(
      readFileSync(join(dir, "expected.json"), "utf8")
    );
    const contentHash = contentHashFromEnvelope(envelope);
    expect(contentHash).toBe(expected.contentHash);
  });

  it("parent-sort normalization: unsorted and sorted yield same contentHash", () => {
    const dir = join(root, "test-vectors/canonical/derivation/parent-sort");
    const unsorted = JSON.parse(
      readFileSync(join(dir, "envelope-unsorted.json"), "utf8")
    );
    const sorted = JSON.parse(
      readFileSync(join(dir, "envelope-sorted.json"), "utf8")
    );
    const expected = JSON.parse(
      readFileSync(join(dir, "expected.json"), "utf8")
    );
    const hashUnsorted = contentHashFromEnvelope(unsorted);
    const hashSorted = contentHashFromEnvelope(sorted);
    expect(hashUnsorted).toBe(hashSorted);
    expect(hashUnsorted).toBe(expected.contentHash);
  });

  it("cycle rejection: VirtualRegistry rejects unregistered parent", async () => {
    const dir = join(root, "test-vectors/canonical/derivation/cycle-rejection");
    const envelope = JSON.parse(
      readFileSync(join(dir, "envelope.json"), "utf8")
    );
    const registry = new VirtualRegistry();
    await expect(
      registry.registerEnvelope(envelope, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    ).rejects.toThrow(VirtualRegistryError);
  });

  it("duplicate-source-rejection: VirtualRegistry rejects duplicate sources", async () => {
    const dir = join(root, "test-vectors/canonical/edge-cases/duplicate-source-rejection");
    const practiceDir = join(root, "test-vectors/canonical/types/practice-minimal");
    const practiceEnvelope = JSON.parse(
      readFileSync(join(practiceDir, "envelope.json"), "utf8")
    );
    const envelope = JSON.parse(
      readFileSync(join(dir, "envelope.json"), "utf8")
    );
    const registry = new VirtualRegistry();
    await registry.registerEnvelope(practiceEnvelope, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    await expect(
      registry.registerEnvelope(envelope, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    ).rejects.toMatchObject({ code: "INVALID_ENVELOPE" });
  });
});
