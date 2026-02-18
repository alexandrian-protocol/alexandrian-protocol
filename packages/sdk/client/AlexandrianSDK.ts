/**
 * Alexandrian Protocol — SDK v1
 *
 * The agent-facing interface to the protocol.
 * Bridges compiler output → on-chain registration → agent retrieval.
 *
 * Four operations:
 *   sdk.publish(compiledKB)      — register a compiled KB on-chain with stake
 *   sdk.query(intent)            — find the best matching KB for an agent intent
 *   sdk.settleCitation(contentHash) — pay query fee and settle citation through DAG
 *   sdk.getReputation(hash)      — check trust score before retrieval
 *
 * Two consumption modes on query result:
 *   Mode 1 — asContext():  summary, citation, attribution, narrative (for prompt injection)
 *   Mode 2 — asStructured(): exact JSON payload, validated schema (for Architect Agent / tools)
 *
 * Usage:
 *   import { AlexandrianSDK, QueryResult } from "@alexandrian/sdk"
 *
 *   const sdk = new AlexandrianSDK({ provider, signer, registryAddress })
 *   const result = await sdk.query({ intent: "secure token refresh", kbType: KBType.Practice, domain: "security", agentAddress: "0x..." })
 *   if (result) {
 *     const ctx = result.asContext()           // for prompt injection
 *     const struct = result.withPayload(payload).asStructured()  // for programmatic use
 *     await sdk.settleCitation(result.match.contentHash, agentAddress)
 *   }
 */

import {
  Contract,
  type Provider,
  type Signer,
  ethers,
  formatEther,
  parseEther,
} from "ethers";
import type { KnowledgeBlock, CanonicalPayload } from "@alexandrian/protocol/schema";
import {
  KBType,
  TrustTier,
} from "@alexandrian/protocol/schema";
import {
  buildDerivedEnvelope,
  contentHashFromEnvelope,
} from "@alexandrian/protocol/core";
import type { DerivedEnvelopeInput } from "@alexandrian/protocol/core";

/** One-time deprecation warnings (runtime) so callers see them without relying on IDE JSDoc. */
const deprecationWarned = new Set<string>();

// ─────────────────────────────────────────────────────────────────────────────
// ABI — matches AlexandrianRegistry (Registry.sol) exactly
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY_ABI = [
  "function publishKB(bytes32 contentHash, address curator, uint8 kbType, uint8 trustTier, string cid, string embeddingCid, string domain, string licenseType, uint256 queryFee, string version, tuple(bytes32 parentHash, uint16 royaltyShareBps, bytes4 relationship)[] parents) external payable",
  "function settleQuery(bytes32 contentHash, address querier) external payable",
  "function addStake(bytes32 contentHash) external payable",
  "function withdrawStake(bytes32 contentHash) external",
  "function endorse(bytes32 contentHash) external",
  "function recordPositiveOutcome(bytes32 contentHash) external",
  "function slash(bytes32 contentHash, string reason) external",
  "function isRegistered(bytes32 contentHash) external view returns (bool)",
  "function getCurator(bytes32 contentHash) external view returns (address)",
  "function getKnowledgeBlock(bytes32 contentHash) external view returns (tuple(address curator, uint8 kbType, uint8 trustTier, string cid, string embeddingCid, string domain, string licenseType, uint256 queryFee, uint256 timestamp, string version, bool exists))",
  "function getAttributionDAG(bytes32 contentHash) external view returns (tuple(bytes32 parentHash, uint16 royaltyShareBps, bytes4 relationship)[])",
  "function getStake(bytes32 contentHash) external view returns (tuple(uint256 amount, uint256 lockedUntil, bool slashed))",
  "function getReputation(bytes32 contentHash) external view returns (tuple(uint32 queryVolume, uint32 positiveOutcomes, uint32 endorsements, uint16 score, uint256 lastUpdated))",
  "function getShareSplit(bytes32 contentHash) external view returns (uint256 curatorBps, uint256 parentBps)",
  "function getCuratorBlocks(address curator) external view returns (bytes32[])",
  "function getBlocksByType(uint8 kbType) external view returns (bytes32[])",
  "function getBlocksByDomain(string domain) external view returns (bytes32[])",
  "function getDerivedBlocks(bytes32 parentHash) external view returns (bytes32[])",
  "function isDerivedFrom(bytes32 childHash, bytes32 parentHash) external view returns (bool)",
  "function protocolFeesBps() external view returns (uint256)",
  "function minStakeAmount() external view returns (uint256)",
  "function treasuryBalance() external view returns (uint256)",
  "event KBPublished(bytes32 indexed contentHash, address indexed curator, uint8 indexed kbType, string domain, uint256 queryFee, uint256 timestamp)",
  "event QuerySettled(bytes32 indexed contentHash, address indexed querier, uint256 totalFee, uint256 protocolFee)",
  "event RoyaltyPaid(bytes32 indexed contentHash, address indexed recipient, uint256 amount)",
  "event ReputationUpdated(bytes32 indexed contentHash, uint16 newScore, uint32 queryVolume)",
  "event KBStaked(bytes32 indexed contentHash, address indexed curator, uint256 amount)",
  "event KBSlashed(bytes32 indexed contentHash, address indexed curator, uint256 slashedAmount, string reason)",
  "event KBEndorsed(bytes32 indexed contentHash, address indexed endorser)",
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SDKConfig {
  provider: Provider;
  signer?: Signer;
  registryAddress: string;
  /** Optional: LLM call for semantic query matching (inject your Anthropic client) */
  llmCall?: (system: string, user: string) => Promise<string>;
}

export interface PublishOptions {
  /** Stake in wei — must meet contract minStakeAmount */
  stake: bigint;
  /** Query fee in wei per retrieval */
  queryFee?: bigint;
  /** Attribution links to parent KBs */
  parents?: OnChainAttributionLink[];
  /** Override trust tier — defaults to HumanStaked */
  trustTier?: TrustTier;
}

export interface PublishDerivedOptions {
  /** CID of envelope stored on IPFS */
  cid: string;
  /** Stake in wei */
  stake: bigint;
  /** Query fee in wei (default 0) */
  queryFee?: bigint;
  /** Optional: royalty weight per source (by index). Default: equal split. */
  sourceWeights?: number[];
  /** @deprecated Use sourceWeights. */
  parentWeights?: number[];
}

export interface OnChainAttributionLink {
  parentHash: string;
  royaltyShareBps: number;
  relationship: "derv" | "extd" | "ctrd" | "vald";
}

export interface PublishResult {
  contentHash: string;
  txHash: string;
  blockNumber: number;
  curator: string;
  kbType: KBType;
  domain: string;
  stake: bigint;
  queryFee: bigint;
}

export interface OnChainKB {
  curator: string;
  kbType: number;
  trustTier: number;
  cid: string;
  embeddingCid: string;
  domain: string;
  licenseType: string;
  queryFee: bigint;
  timestamp: number;
  version: string;
  exists: boolean;
}

export interface ReputationRecord {
  queryVolume: number;
  positiveOutcomes: number;
  endorsements: number;
  score: number;
  lastUpdated: number;
}

export interface StakeRecord {
  amount: bigint;
  lockedUntil: number;
  slashed: boolean;
}

export interface QueryIntent {
  intent: string;
  kbType?: number;
  domain?: string;
  minScore?: number;
  minTrustTier?: number;
  agentAddress: string;
}

export interface QueryMatch {
  contentHash: string;
  kb: OnChainKB;
  reputation: ReputationRecord;
  stake: StakeRecord;
  relevanceScore: number;
}

/** Mode 1 — for prompt injection: clean summary, citation, attribution, trimmed narrative */
export interface ContextOutput {
  summary: string;
  citation: { contentHash: string; curator: string; domain: string; kbType: number };
  attribution: string;
  narrative: string;
}

/** Mode 2 — for programmatic execution: exact JSON payload, validated schema, deterministic */
export interface StructuredOutput<T = CanonicalPayload> {
  payload: T;
  contentHash: string;
  domain: string;
  kbType: number;
  schema: string;
}

const KB_TYPE_NAMES: Record<number, string> = {
  0: "practice",
  1: "feature",
  2: "stateMachine",
  3: "promptEngineering",
  4: "complianceChecklist",
  5: "rubric",
};

const MAX_NARRATIVE_CHARS = 2000;

/**
 * Wraps a QueryMatch with optional payload. Exposes two consumption modes:
 * - asContext(): for prompt injection (summary, citation, attribution, narrative)
 * - asStructured(): for programmatic execution (validated JSON payload)
 */
export class QueryResult {
  constructor(
    public readonly match: QueryMatch,
    public readonly payload?: CanonicalPayload | null
  ) {}

  /** Mode 1 — returns content formatted for prompt injection */
  asContext(): ContextOutput {
    const { contentHash, kb, reputation } = this.match;
    const schemaName = KB_TYPE_NAMES[kb.kbType] ?? "practice";
    const summary = this.payload
      ? extractSummary(this.payload, schemaName)
      : `[${schemaName}] ${kb.domain} — contentHash: ${contentHash.slice(0, 18)}...`;
    const citation = {
      contentHash,
      curator: kb.curator,
      domain: kb.domain,
      kbType: kb.kbType,
    };
    const attribution = `Source: ${contentHash.slice(0, 10)}...${contentHash.slice(-6)} (curator: ${kb.curator.slice(0, 10)}...) — ${kb.domain} / ${schemaName}`;
    const narrative = this.payload
      ? trimNarrative(extractNarrative(this.payload))
      : summary;
    return { summary, citation, attribution, narrative };
  }

  /** Mode 2 — returns validated payload for Architect Agent / tools */
  asStructured<T extends CanonicalPayload = CanonicalPayload>(): StructuredOutput<T> {
    const { contentHash, kb } = this.match;
    const schemaName = KB_TYPE_NAMES[kb.kbType] ?? "practice";
    if (!this.payload) {
      throw new Error(
        `Payload not resolved for contentHash ${contentHash}. Fetch from IPFS (cid: ${kb.cid}) and use QueryResult.from(match, payload).`
      );
    }
    if (this.payload.type !== schemaName) {
      throw new Error(
        `Payload type "${this.payload.type}" does not match kbType ${kb.kbType} (${schemaName})`
      );
    }
    return {
      payload: this.payload as T,
      contentHash,
      domain: kb.domain,
      kbType: kb.kbType,
      schema: schemaName,
    };
  }

  /** Attach payload for asContext/asStructured when content is resolved from IPFS */
  withPayload(payload: CanonicalPayload): QueryResult {
    return new QueryResult(this.match, payload);
  }

  static from(match: QueryMatch, payload?: CanonicalPayload | null): QueryResult {
    return new QueryResult(match, payload ?? null);
  }
}

function extractSummary(payload: CanonicalPayload, schemaName: string): string {
  switch (payload.type) {
    case "practice":
      return payload.rationale.slice(0, 120) + (payload.rationale.length > 120 ? "…" : "");
    case "feature":
      return `Feature: ${JSON.stringify(payload.interfaceContract).slice(0, 80)}…`;
    case "stateMachine":
      return `State machine: ${(payload.states as string[]).length} states, ${(payload.transitions as unknown[]).length} transitions`;
    case "promptEngineering":
      return payload.template.slice(0, 120) + (payload.template.length > 120 ? "…" : "");
    case "complianceChecklist":
      return `Compliance: ${payload.jurisdictionTags.join(", ")} — ${payload.requirements.length} requirements`;
    case "rubric":
      return `Rubric: ${(payload.dimensions as { criterion: string }[]).length} dimensions, ${payload.scoringLogic.slice(0, 60)}…`;
    default:
      return `[${schemaName}]`;
  }
}

function extractNarrative(payload: CanonicalPayload): string {
  switch (payload.type) {
    case "practice":
      return payload.rationale;
    case "promptEngineering":
      return payload.template;
    case "complianceChecklist":
      return payload.requirements
        .map((r) => `- ${r.id}: ${r.description}`)
        .join("\n");
    case "rubric":
      return (payload.dimensions as { criterion: string; weight: number }[])
        .map((d) => `- ${d.criterion} (${d.weight})`)
        .join("\n");
    default:
      return JSON.stringify(payload, null, 2);
  }
}

function trimNarrative(s: string): string {
  if (s.length <= MAX_NARRATIVE_CHARS) return s;
  return s.slice(0, MAX_NARRATIVE_CHARS) + "\n… [trimmed]";
}

export interface SettleResult {
  txHash: string;
  contentHash: string;
  querier: string;
  totalFee: bigint;
  protocolFee: bigint;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP ENCODING
// ─────────────────────────────────────────────────────────────────────────────

const RELATIONSHIP_BYTES: Record<string, string> = {
  derv: "0x64657276",
  extd: "0x65787464",
  ctrd: "0x63747264",
  vald: "0x76616c64",
};

function encodeRelationship(rel: string): string {
  return RELATIONSHIP_BYTES[rel] ?? RELATIONSHIP_BYTES.derv;
}

function decodeRelationship(bytes4Hex: string): "derv" | "extd" | "ctrd" | "vald" {
  const s = Buffer.from(bytes4Hex.slice(2), "hex").toString("utf8").replace(/\0/g, "").toLowerCase();
  if (s === "extd" || s === "ctrd" || s === "vald") return s;
  return "derv";
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPILER OUTPUT BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

const KB_TYPE_TO_U8: Record<string, number> = {
  [KBType.Practice]: 0,
  [KBType.Feature]: 1,
  [KBType.StateMachine]: 2,
  [KBType.PromptEngineering]: 3,
  [KBType.ComplianceChecklist]: 4,
  [KBType.Rubric]: 5,
};

const CANONICAL_TYPE_TO_U8: Record<string, number> = {
  practice: 0,
  feature: 1,
  stateMachine: 2,
  promptEngineering: 3,
  complianceChecklist: 4,
  rubric: 5,
};

const TRUST_TIER_TO_U8: Record<string, number> = {
  [TrustTier.HumanStaked]: 0,
  [TrustTier.AgentDerived]: 1,
  [TrustTier.AgentDiscovered]: 2,
};

/**
 * Converts a compiled KnowledgeBlock into the args needed for publishKB().
 */
export function compiledToRegistryArgs(block: KnowledgeBlock): {
  contentHash: string;
  kbType: number;
  trustTier: number;
  cid: string;
  embeddingCid: string;
  domain: string;
  licenseType: string;
  queryFee: bigint;
  version: string;
} {
  const contentHash = block.content_hash.startsWith("0x")
    ? block.content_hash
    : "0x" + block.content_hash;
  return {
    contentHash,
    kbType: KB_TYPE_TO_U8[block.type] ?? 0,
    trustTier: TRUST_TIER_TO_U8[block.curator.tier] ?? 0,
    cid: block.content_cid,
    embeddingCid: block.embedding_cid ?? "",
    domain: block.domain,
    licenseType: String(block.license.type),
    queryFee: block.license.query_fee ?? 0n,
    version: block.version,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK
// ─────────────────────────────────────────────────────────────────────────────

export class AlexandrianSDK {
  private registry: Contract;
  private provider: Provider;
  private signer?: Signer;
  private llmCall?: (system: string, user: string) => Promise<string>;

  constructor(config: SDKConfig) {
    this.provider = config.provider;
    this.signer = config.signer;
    this.llmCall = config.llmCall;
    this.registry = new Contract(
      config.registryAddress,
      REGISTRY_ABI,
      config.signer ?? config.provider
    );
  }

  async publish(block: KnowledgeBlock, options: PublishOptions): Promise<PublishResult> {
    if (!this.signer) throw new Error("Signer required for publish");

    const args = compiledToRegistryArgs(block);
    const parents = (options.parents ?? []).map((p) => ({
      parentHash: p.parentHash,
      royaltyShareBps: p.royaltyShareBps,
      relationship: encodeRelationship(p.relationship),
    }));

    const curatorAddress = await this.signer.getAddress();
    const queryFee = options.queryFee ?? args.queryFee;
    const trustTierU8 = options.trustTier != null ? TRUST_TIER_TO_U8[options.trustTier] ?? 0 : 0;

    const tx = await this.registry.publishKB(
      args.contentHash,
      curatorAddress,
      args.kbType,
      trustTierU8,
      args.cid,
      args.embeddingCid,
      args.domain,
      args.licenseType,
      queryFee,
      args.version,
      parents,
      { value: options.stake }
    );

    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");
    const txHash = receipt.hash;

    return {
      contentHash: args.contentHash,
      txHash,
      blockNumber: receipt.blockNumber,
      curator: curatorAddress,
      kbType: block.type,
      domain: args.domain,
      stake: options.stake,
      queryFee,
    };
  }

  /**
   * Publishes a derived block (deterministic synthesis).
   * Handles lexicographical parent sorting and CID derivation.
   * Royalty DAG: query fees split across parents per parentWeights.
   */
  async publishDerived(
    input: DerivedEnvelopeInput,
    options: PublishDerivedOptions
  ): Promise<PublishResult> {
    if (!this.signer) throw new Error("Signer required for publishDerived");

    const envelope = buildDerivedEnvelope(input);
    const contentHash = contentHashFromEnvelope(
      envelope as unknown as Record<string, unknown>
    );
    const h = contentHash.startsWith("0x") ? contentHash : "0x" + contentHash;

    const sources = envelope.sources;
    if (options.parentWeights !== undefined && !deprecationWarned.has("parentWeights")) {
      deprecationWarned.add("parentWeights");
      console.warn("[@alexandrian/sdk] parentWeights is deprecated; use sourceWeights.");
    }
    const weights = options.sourceWeights ?? options.parentWeights ?? sources.map(() => 1);
    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
    const maxBps = 9800;
    const attributionLinks = sources.map((sourceHash, i) => ({
      parentHash: sourceHash,
      royaltyShareBps: Math.round(((weights[i] ?? 1) / totalWeight) * maxBps),
      relationship: "derv" as const,
    }));

    const curatorAddress = await this.signer.getAddress();
    const queryFee = options.queryFee ?? 0n;
    const kbTypeU8 = CANONICAL_TYPE_TO_U8[envelope.payload.type] ?? 0;

    const tx = await this.registry.publishKB(
      h,
      curatorAddress,
      kbTypeU8,
      0, // trustTier: AgentDerived
      options.cid,
      "",
      envelope.domain,
      "attribution",
      queryFee,
      "1.0.0",
      attributionLinks.map((p: { parentHash: string; royaltyShareBps: number; relationship: string }) => ({
        parentHash: p.parentHash,
        royaltyShareBps: p.royaltyShareBps,
        relationship: encodeRelationship(p.relationship),
      })),
      { value: options.stake }
    );

    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");
    const txHash = receipt.hash;

    return {
      contentHash: h,
      txHash,
      blockNumber: receipt.blockNumber,
      curator: curatorAddress,
      kbType: envelope.payload.type as unknown as KBType,
      domain: envelope.domain,
      stake: options.stake,
      queryFee,
    };
  }

  async query(intent: QueryIntent): Promise<QueryResult | null> {
    let candidates: string[] = [];

    if (intent.kbType !== undefined && intent.domain !== undefined) {
      const byType = await this.registry.getBlocksByType(intent.kbType);
      const byDomain = await this.registry.getBlocksByDomain(intent.domain);
      const domainSet = new Set(byDomain.map((h: string) => h.toLowerCase()));
      candidates = byType.filter((h: string) => domainSet.has(h.toLowerCase()));
    } else if (intent.kbType !== undefined) {
      candidates = await this.registry.getBlocksByType(intent.kbType);
    } else if (intent.domain !== undefined) {
      candidates = await this.registry.getBlocksByDomain(intent.domain);
    } else {
      return null;
    }

    if (candidates.length === 0) return null;

    const enriched = await Promise.all(
      candidates.slice(0, 20).map(async (hash: string) => {
        try {
          const [kb, rep, stake] = await Promise.all([
            this.registry.getKnowledgeBlock(hash),
            this.registry.getReputation(hash),
            this.registry.getStake(hash),
          ]);
          return { hash, kb, rep, stake };
        } catch {
          return null;
        }
      })
    );

    const valid = enriched.filter((e) => {
      if (!e || e.stake.slashed) return false;
      if (intent.minScore !== undefined && Number(e.rep.score) < intent.minScore) return false;
      if (
        intent.minTrustTier !== undefined &&
        Number(e.kb.trustTier) > intent.minTrustTier
      )
        return false;
      return true;
    }) as NonNullable<(typeof enriched)[number]>[];

    if (valid.length === 0) return null;

    let ranked: typeof valid;
    if (this.llmCall && valid.length > 1) {
      ranked = await this._semanticRank(intent.intent, valid);
    } else {
      ranked = valid.sort((a, b) => Number(b.rep.score) - Number(a.rep.score));
    }

    const best = ranked[0]!;
    const match: QueryMatch = {
      contentHash: best.hash,
      kb: {
        curator: best.kb.curator,
        kbType: Number(best.kb.kbType),
        trustTier: Number(best.kb.trustTier),
        cid: best.kb.cid,
        embeddingCid: best.kb.embeddingCid,
        domain: best.kb.domain,
        licenseType: best.kb.licenseType,
        queryFee: BigInt(best.kb.queryFee),
        timestamp: Number(best.kb.timestamp),
        version: best.kb.version,
        exists: true,
      },
      reputation: {
        queryVolume: Number(best.rep.queryVolume),
        positiveOutcomes: Number(best.rep.positiveOutcomes),
        endorsements: Number(best.rep.endorsements),
        score: Number(best.rep.score),
        lastUpdated: Number(best.rep.lastUpdated),
      },
      stake: {
        amount: BigInt(best.stake.amount),
        lockedUntil: Number(best.stake.lockedUntil),
        slashed: best.stake.slashed,
      },
      relevanceScore: 1.0,
    };
    return QueryResult.from(match);
  }

  /** Settle citation — pay query fee and route royalties through DAG. (Contract: settleQuery) */
  async settleCitation(contentHash: string, agentAddress: string): Promise<SettleResult> {
    if (!this.signer) throw new Error("Signer required for settleCitation");

    const kb = await this.registry.getKnowledgeBlock(contentHash);
    const queryFee = BigInt(kb.queryFee);

    const tx = await this.registry.settleQuery(contentHash, agentAddress, { value: queryFee });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");

    const settled = receipt.logs
      .map((log: { data: string; topics: string[] }) => {
        try {
          return this.registry.interface.parseLog({
            data: log.data,
            topics: log.topics as string[],
          });
        } catch {
          return null;
        }
      })
      .find((e: unknown) => (e as { name?: string })?.name === "QuerySettled");

    const totalFee = settled && settled.args ? BigInt(settled.args[2] ?? queryFee) : queryFee;
    const protocolFee =
      settled && settled.args ? BigInt(settled.args[3] ?? 0) : 0n;

    const txHash = receipt.hash;
    return {
      txHash,
      contentHash,
      querier: agentAddress,
      totalFee,
      protocolFee,
    };
  }

  /** @deprecated Use settleCitation */
  async settle(contentHash: string, agentAddress: string): Promise<SettleResult> {
    if (!deprecationWarned.has("settle")) {
      deprecationWarned.add("settle");
      console.warn("[@alexandrian/sdk] settle() is deprecated; use settleCitation().");
    }
    return this.settleCitation(contentHash, agentAddress);
  }

  async getReputation(contentHash: string): Promise<ReputationRecord> {
    const r = await this.registry.getReputation(contentHash);
    return {
      queryVolume: Number(r.queryVolume),
      positiveOutcomes: Number(r.positiveOutcomes),
      endorsements: Number(r.endorsements),
      score: Number(r.score),
      lastUpdated: Number(r.lastUpdated),
    };
  }

  async addStake(contentHash: string, amount: bigint): Promise<string> {
    if (!this.signer) throw new Error("Signer required");
    const tx = await this.registry.addStake(contentHash, { value: amount });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");
    return receipt.hash;
  }

  async withdrawStake(contentHash: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required");
    const tx = await this.registry.withdrawStake(contentHash);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");
    return receipt.hash;
  }

  async endorse(contentHash: string): Promise<string> {
    if (!this.signer) throw new Error("Signer required");
    const tx = await this.registry.endorse(contentHash);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("No receipt");
    return receipt.hash;
  }

  async getKB(contentHash: string): Promise<OnChainKB> {
    const kb = await this.registry.getKnowledgeBlock(contentHash);
    return {
      curator: kb.curator,
      kbType: Number(kb.kbType),
      trustTier: Number(kb.trustTier),
      cid: kb.cid,
      embeddingCid: kb.embeddingCid,
      domain: kb.domain,
      licenseType: kb.licenseType,
      queryFee: BigInt(kb.queryFee),
      timestamp: Number(kb.timestamp),
      version: kb.version,
      exists: kb.exists,
    };
  }

  async getAttributionDAG(contentHash: string): Promise<OnChainAttributionLink[]> {
    const links = await this.registry.getAttributionDAG(contentHash);
    return links.map((l: { parentHash: string; royaltyShareBps: number; relationship: string }) => ({
      parentHash: l.parentHash,
      royaltyShareBps: Number(l.royaltyShareBps),
      relationship: decodeRelationship(l.relationship),
    }));
  }

  async getStake(contentHash: string): Promise<StakeRecord> {
    const s = await this.registry.getStake(contentHash);
    return {
      amount: BigInt(s.amount),
      lockedUntil: Number(s.lockedUntil),
      slashed: s.slashed,
    };
  }

  async getCuratorKBs(curatorAddress: string): Promise<string[]> {
    return this.registry.getCuratorBlocks(curatorAddress);
  }

  async getKBsByType(kbType: number): Promise<string[]> {
    return this.registry.getBlocksByType(kbType);
  }

  async getKBsByDomain(domain: string): Promise<string[]> {
    return this.registry.getBlocksByDomain(domain);
  }

  async getDerivedKBs(parentHash: string): Promise<string[]> {
    return this.registry.getDerivedBlocks(parentHash);
  }

  async isRegistered(contentHash: string): Promise<boolean> {
    return this.registry.isRegistered(contentHash);
  }

  async getShareSplit(
    contentHash: string
  ): Promise<{ curatorBps: bigint; parentBps: bigint }> {
    const [curatorBps, parentBps] = await this.registry.getShareSplit(contentHash);
    return { curatorBps: BigInt(curatorBps), parentBps: BigInt(parentBps) };
  }

  async getProtocolFee(): Promise<number> {
    return Number(await this.registry.protocolFeesBps());
  }

  async getMinStake(): Promise<bigint> {
    return BigInt(await this.registry.minStakeAmount());
  }

  private async _semanticRank(
    intent: string,
    candidates: { hash: string; kb: unknown; rep: unknown; stake: unknown }[]
  ): Promise<typeof candidates> {
    if (!this.llmCall) return candidates;

    const descriptions = candidates
      .map(
        (c, i) =>
          `${i}: hash=${c.hash.slice(0, 10)} domain=${(c.kb as { domain: string }).domain} type=${(c.kb as { kbType: number }).kbType} score=${(c.rep as { score: number }).score}`
      )
      .join("\n");

    const SYSTEM = `You are ranking Knowledge Blocks by relevance to an agent's query intent.
Given a list of KB candidates, return ONLY a JSON array of indices sorted by relevance (most relevant first).
Example response: [2, 0, 4, 1, 3]`;

    const response = await this.llmCall(
      SYSTEM,
      `Intent: "${intent}"\n\nCandidates:\n${descriptions}`
    );

    try {
      const clean = response.replace(/```json|```/g, "").trim();
      const order: number[] = JSON.parse(clean);
      return order
        .filter((i) => i >= 0 && i < candidates.length)
        .map((i) => candidates[i]!)
        .filter(Boolean);
    } catch {
      return candidates;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE FACTORIES
// ─────────────────────────────────────────────────────────────────────────────

export function createBaseSDK(config: {
  privateKey: string;
  registryAddress: string;
  alchemyKey: string;
  llmCall?: (system: string, user: string) => Promise<string>;
}): AlexandrianSDK {
  const provider = new ethers.JsonRpcProvider(
    `https://base-mainnet.g.alchemy.com/v2/${config.alchemyKey}`
  );
  const wallet = new ethers.Wallet(config.privateKey, provider);
  return new AlexandrianSDK({
    provider,
    signer: wallet,
    registryAddress: config.registryAddress,
    llmCall: config.llmCall,
  });
}

export function createBaseSepoliaSDK(config: {
  privateKey: string;
  registryAddress: string;
  alchemyKey: string;
  llmCall?: (system: string, user: string) => Promise<string>;
}): AlexandrianSDK {
  const provider = new ethers.JsonRpcProvider(
    `https://base-sepolia.g.alchemy.com/v2/${config.alchemyKey}`
  );
  const wallet = new ethers.Wallet(config.privateKey, provider);
  return new AlexandrianSDK({
    provider,
    signer: wallet,
    registryAddress: config.registryAddress,
    llmCall: config.llmCall,
  });
}

export { parseEther, formatEther };
