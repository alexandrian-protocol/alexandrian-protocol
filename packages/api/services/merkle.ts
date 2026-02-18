/**
 * Stub Merkle helpers for tests when @alexandrian/api is not present.
 * Provides deterministic hashes so ai-usage-proof.test.ts can load and run (proof assertions may fail).
 */
import { createHash } from "crypto";

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export function hashLeaf(data: string): string {
  return sha256(data);
}

export function hashChunkLeaf(chunk: unknown): string {
  return sha256(JSON.stringify(chunk));
}

export function verifyMerkleProof(
  _leaf: string,
  _proof: string[],
  _root: string
): boolean {
  return false;
}
