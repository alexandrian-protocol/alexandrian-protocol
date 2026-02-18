/**
 * Lineage command: print DAG (parents + children) for a content hash.
 */
import type { AlexandrianSDK } from "../client/AlexandrianSDK.js";

export async function lineageCommand(
  contentHash: string,
  sdk: AlexandrianSDK,
  options: { depth?: number } = {}
): Promise<void> {
  const hash = contentHash.startsWith("0x") ? contentHash : `0x${contentHash}`;

  const registered = await sdk.isRegistered(hash);
  if (!registered) {
    console.error("KB not found on-chain for content hash:", hash);
    process.exitCode = 1;
    return;
  }

  const parents = await sdk.getAttributionDAG(hash);
  const children = await sdk.getDerivedKBs(hash);

  console.log("Content hash:", hash);
  console.log("");
  if (parents.length > 0) {
    console.log("Parents (" + parents.length + "):");
    for (const p of parents) {
      console.log("  -", p.parentHash, "royaltyShareBps:", p.royaltyShareBps);
    }
    console.log("");
  } else {
    console.log("Parents: (none)");
    console.log("");
  }

  if (children.length > 0) {
    console.log("Derived KBs (" + children.length + "):");
    for (const c of children) {
      console.log("  -", c);
    }
  } else {
    console.log("Derived KBs: (none)");
  }
}
