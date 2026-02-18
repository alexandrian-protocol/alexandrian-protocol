/**
 * Verify command: compare content hash to expected.json (canonical test vector).
 */
import { readFile } from "fs/promises";

export interface VerifyOptions {
  contentHash: string;
  expectedPath: string;
}

export async function verifyCommand(options: VerifyOptions): Promise<boolean> {
  const hash = options.contentHash.startsWith("0x") ? options.contentHash : `0x${options.contentHash}`;
  if (hash.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    console.error("Error: Invalid content hash (expected 64 hex chars, optional 0x prefix)");
    process.exitCode = 1;
    return false;
  }

  const expectedJson = await readFile(options.expectedPath, "utf-8");
  let expected: { contentHash?: string };
  try {
    expected = JSON.parse(expectedJson) as { contentHash?: string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error: Invalid JSON in expected file:", options.expectedPath, msg);
    process.exitCode = 1;
    return false;
  }
  const expectedHash = expected.contentHash;
  if (!expectedHash) {
    console.error("Error: expected file must contain contentHash");
    process.exitCode = 1;
    return false;
  }
  const normalizedExpected = expectedHash.startsWith("0x") ? expectedHash : `0x${expectedHash}`;

  if (hash.toLowerCase() !== normalizedExpected.toLowerCase()) {
    console.error("Verification: FAIL — hash does not match canonical vector");
    console.error("  Got:     ", hash);
    console.error("  Expected:", normalizedExpected);
    process.exitCode = 1;
    return false;
  }

  console.log("Verification: PASS — hash matches canonical vector");
  console.log("  contentHash:", hash);
  return true;
}
