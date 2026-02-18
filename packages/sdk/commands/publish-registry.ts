/**
 * Publish a KB to AlexandrianRegistry from an envelope file.
 * Clean output: one confirmation line + content hash, tx hash, explorer URL.
 */
import { readFile } from "fs/promises";
import { contentHashFromEnvelope, cidV1FromEnvelope } from "@alexandrian/protocol/core";
import type { AlexandrianSDK } from "../client/AlexandrianSDK.js";
import type { KnowledgeBlock } from "@alexandrian/protocol/schema";
import { TrustTier, KBType } from "@alexandrian/protocol/schema";
import { getExplorerTxUrl } from "../lib/explorer.js";

export interface PublishRegistryOptions {
  envelopePath: string;
  stakeWei: bigint;
  queryFeeWei?: bigint;
  parents?: { parentHash: string; royaltyShareBps: number }[];
  explorerUrl?: string;
}

/**
 * Build a minimal KnowledgeBlock from a canonical envelope for SDK.publish().
 * Only fields used by compiledToRegistryArgs are required; cast via unknown for union type.
 */
function envelopeToMinimalBlock(
  envelope: Record<string, unknown>,
  contentHash: string,
  contentCid: string,
  queryFeeWei: bigint
): KnowledgeBlock {
  const typeStr = (envelope.type as string) ?? "practice";
  const domain = (envelope.domain as string) ?? "general";
  const kbType = typeStr === "stateMachine" ? KBType.StateMachine
    : typeStr === "feature" ? KBType.Feature
    : typeStr === "promptEngineering" ? KBType.PromptEngineering
    : typeStr === "complianceChecklist" ? KBType.ComplianceChecklist
    : typeStr === "rubric" ? KBType.Rubric
    : KBType.Practice;
  return {
    id: contentHash,
    content_hash: contentHash.startsWith("0x") ? contentHash : `0x${contentHash}`,
    type: kbType,
    curator: { tier: TrustTier.HumanStaked },
    domain,
    title: "",
    description: "",
    content: "",
    license: { type: "attribution", query_fee: queryFeeWei },
    attribution: [],
    embedding_cid: "",
    content_cid: contentCid,
    quality: { score: 0, updated_at: 0 },
    tags: [],
    registered_at: 0,
    version: "1.0.0",
  } as unknown as KnowledgeBlock;
}

export async function publishRegistryCommand(
  sdk: AlexandrianSDK,
  options: PublishRegistryOptions
): Promise<{ contentHash: string; txHash: string }> {
  const envelopeJson = await readFile(options.envelopePath, "utf-8");
  const envelope = JSON.parse(envelopeJson) as Record<string, unknown>;

  const contentHash = contentHashFromEnvelope(envelope);
  const contentHashHex = contentHash.startsWith("0x") ? contentHash : `0x${contentHash}`;
  const contentCid = await cidV1FromEnvelope(envelope);

  const queryFeeWei = options.queryFeeWei ?? 0n;
  const block = envelopeToMinimalBlock(envelope, contentHashHex, contentCid, queryFeeWei);
  const parents = (options.parents ?? []).map((p) => ({
    parentHash: p.parentHash.startsWith("0x") ? p.parentHash : `0x${p.parentHash}`,
    royaltyShareBps: p.royaltyShareBps,
    relationship: "derv" as const,
  }));

  const result = await sdk.publish(block, {
    stake: options.stakeWei,
    queryFee: queryFeeWei,
    parents: parents.length > 0 ? parents : undefined,
  });

  console.log("Published.");
  console.log("  contentHash:", result.contentHash);
  console.log("  txHash:", result.txHash);
  const explorer = getExplorerTxUrl(options.explorerUrl, result.txHash);
  if (explorer) {
    console.log("  explorer:", explorer);
  }

  return { contentHash: result.contentHash, txHash: result.txHash };
}
