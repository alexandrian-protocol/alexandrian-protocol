/**
 * Inspect command: print on-chain KB metadata (curator, domain, type, stake).
 */
import type { AlexandrianSDK } from "../client/AlexandrianSDK.js";

const KB_TYPE_NAMES: Record<number, string> = {
  0: "practice",
  1: "feature",
  2: "stateMachine",
  3: "promptEngineering",
  4: "complianceChecklist",
  5: "rubric",
};

export async function inspectCommand(contentHash: string, sdk: AlexandrianSDK): Promise<void> {
  const hash = contentHash.startsWith("0x") ? contentHash : `0x${contentHash}`;

  const registered = await sdk.isRegistered(hash);
  if (!registered) {
    console.error("KB not found on-chain for content hash:", hash);
    process.exitCode = 1;
    return;
  }

  const kb = await sdk.getKB(hash);
  const stake = await sdk.getStake(hash);

  console.log("Knowledge Block:", hash);
  console.log("  Curator:", kb.curator);
  console.log("  Domain:", kb.domain);
  console.log("  Type:", KB_TYPE_NAMES[kb.kbType] ?? `kbType ${kb.kbType}`);
  console.log("  Query fee (wei):", kb.queryFee.toString());
  console.log("  Stake (wei):", stake.amount.toString());
  console.log("  Registered at timestamp:", kb.timestamp);
  console.log("  Version:", kb.version);
}
