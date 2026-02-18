/**
 * Alexandrian Protocol — Virtual Registry (Protocol Sandbox)
 *
 * Stricter-than-mainnet reference implementation. Enforces protocol invariants
 * that the blockchain might accept but which harm long-term determinism.
 *
 * - Idempotency: Re-registering the same CanonicalEnvelope always returns the same kbId
 * - Zero-State: kbId is a pure function of content, lineage, and schema
 * - Duplicate Sources: Rejects envelopes with duplicate source IDs (INVALID_ENVELOPE)
 * - Lexicographical Source Ordering: Rejects unsorted sources (hash divergence)
 * - Cycle Detection: DFS on provenance graph; rejects circular dependencies
 * - Schema Rigidity: Validates payload against the six typed schemas
 */

import type { CanonicalEnvelope, CanonicalPayload } from "../../schema/canonicalEnvelope.js";
import {
  contentHashFromEnvelope,
  sortSources,
  canonicalize,
  cidV1FromCanonical,
} from "../../canonical.js";

export class VirtualRegistryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "SOURCES_NOT_SORTED"
      | "CYCLE_DETECTED"
      | "SCHEMA_INVALID"
      | "INVALID_ENVELOPE"
  ) {
    super(message);
    this.name = "VirtualRegistryError";
  }
}

interface StoredBlock {
  kbId: string;
  curator: string;
  type: string;
  sources: string[];
  timestamp: number;
}

export interface RegisterResult {
  kbId: string;
  cidV1: string;
  isNew: boolean;
}

/** CanonicalKBType to schema type string */
const TYPE_MAP: Record<string, string> = {
  practice: "practice",
  feature: "feature",
  stateMachine: "stateMachine",
  promptEngineering: "promptEngineering",
  complianceChecklist: "complianceChecklist",
  rubric: "rubric",
  synthesis: "synthesis",
  pattern: "pattern",
  adaptation: "adaptation",
  enhancement: "enhancement",
};

/**
 * Validates that sources array has no duplicates.
 */
function assertSourcesUnique(sources: string[]): void {
  const normalized = sources.map((p) => (p.startsWith("0x") ? p : "0x" + p));
  const sourceSet = new Set(normalized);
  if (sourceSet.size !== sources.length) {
    throw new VirtualRegistryError("Duplicate sources not allowed", "INVALID_ENVELOPE");
  }
}

/**
 * Validates that sources array is lexicographically sorted.
 * Rejects to prevent cross-environment hash divergence.
 */
function assertSourcesSorted(sources: string[]): void {
  if (sources.length <= 1) return;
  const sorted = [...sources].sort();
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] !== sorted[i]) {
      throw new VirtualRegistryError(
        "sources array must be lexicographically sorted before registration",
        "SOURCES_NOT_SORTED"
      );
    }
  }
}

/**
 * Validates derivation inputs: each inputs[].kbId must be in sources.
 */
function assertDerivationInputsValid(
  derivation: { inputs: { kbId: string }[] },
  sources: string[]
): void {
  const sourceSet = new Set(sources.map((p) => (p.startsWith("0x") ? p : "0x" + p)));
  for (const inp of derivation.inputs) {
    const k = inp.kbId.startsWith("0x") ? inp.kbId : "0x" + inp.kbId;
    if (!sourceSet.has(k)) {
      throw new VirtualRegistryError(
        `Derivation input kbId ${k} is not in sources; all inputs must reference sources`,
        "INVALID_ENVELOPE"
      );
    }
  }
}

/**
 * Validates payload shape for the typed schemas (Tier 0 + Tier 1).
 * Minimal validation; production would use full Zod schemas.
 */
function validatePayload(type: string, payload: CanonicalPayload): void {
  if (payload.type !== type) {
    throw new VirtualRegistryError(
      `payload.type "${payload.type}" does not match envelope type "${type}"`,
      "SCHEMA_INVALID"
    );
  }
  switch (type) {
    case "practice":
      if (
        !("rationale" in payload) ||
        !("contexts" in payload) ||
        !("failureModes" in payload)
      ) {
        throw new VirtualRegistryError(
          "practice payload must have rationale, contexts, failureModes",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "feature":
      if (!("interfaceContract" in payload) || !("testScaffold" in payload)) {
        throw new VirtualRegistryError(
          "feature payload must have interfaceContract, testScaffold",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "stateMachine":
      if (
        !("states" in payload) ||
        !("transitions" in payload) ||
        !("invariants" in payload)
      ) {
        throw new VirtualRegistryError(
          "stateMachine payload must have states, transitions, invariants",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "promptEngineering":
      if (
        !("template" in payload) ||
        !("modelVersion" in payload) ||
        !("evalCriteria" in payload)
      ) {
        throw new VirtualRegistryError(
          "promptEngineering payload must have template, modelVersion, evalCriteria",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "complianceChecklist":
      if (
        !("jurisdictionTags" in payload) ||
        !("requirements" in payload) ||
        !("evidenceMapping" in payload)
      ) {
        throw new VirtualRegistryError(
          "complianceChecklist payload must have jurisdictionTags, requirements, evidenceMapping",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "rubric":
      if (
        !("dimensions" in payload) ||
        !("scoringLogic" in payload) ||
        !("thresholds" in payload)
      ) {
        throw new VirtualRegistryError(
          "rubric payload must have dimensions, scoringLogic, thresholds",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "synthesis":
      if (
        !("question" in payload) ||
        !("answer" in payload) ||
        !("citations" in payload)
      ) {
        throw new VirtualRegistryError(
          "synthesis payload must have question, answer, citations",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "pattern":
      if (
        !("pattern" in payload) ||
        !("occurrences" in payload) ||
        !("applicability" in payload)
      ) {
        throw new VirtualRegistryError(
          "pattern payload must have pattern, occurrences, applicability",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "adaptation":
      if (
        !("targetDomain" in payload) ||
        !("adaptedContent" in payload) ||
        !("tradeoffs" in payload)
      ) {
        throw new VirtualRegistryError(
          "adaptation payload must have targetDomain, adaptedContent, tradeoffs",
          "SCHEMA_INVALID"
        );
      }
      break;
    case "enhancement":
      if (!("concern" in payload) || !("enhancedContent" in payload)) {
        throw new VirtualRegistryError(
          "enhancement payload must have concern, enhancedContent",
          "SCHEMA_INVALID"
        );
      }
      break;
    default:
      throw new VirtualRegistryError(`Unknown type: ${type}`, "SCHEMA_INVALID");
  }
}

export class VirtualRegistry {
  private store = new Map<string, StoredBlock>();

  /**
   * Compute ancestors of a node (transitive parents) via DFS.
   */
  private getAncestors(kbId: string, visited = new Set<string>()): Set<string> {
    if (visited.has(kbId)) return visited;
    visited.add(kbId);
    const block = this.store.get(
      kbId.startsWith("0x") ? kbId : "0x" + kbId
    );
    if (!block) return visited;
    for (const p of block.sources) {
      this.getAncestors(p, visited);
    }
    return visited;
  }

  /**
   * Check if adding (kbId, parents) would create a cycle.
   * Cycle: parent A is ancestor of parent B and parent B is ancestor of parent A.
   */
  private wouldCreateCycle(_kbId: string, parents: string[]): boolean {
    for (let i = 0; i < parents.length; i++) {
      const ancI = this.getAncestors(parents[i]!);
      for (let j = i + 1; j < parents.length; j++) {
        if (ancI.has(parents[j]!) && this.getAncestors(parents[j]!).has(parents[i]!)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Register a CanonicalEnvelope. Idempotent: same envelope → same kbId.
   * Rejects: unsorted sources, cycles, invalid schema.
   */
  async registerEnvelope(
    envelope: CanonicalEnvelope,
    curator: string
  ): Promise<RegisterResult> {
    if (!envelope || typeof envelope !== "object") {
      throw new VirtualRegistryError("Invalid envelope", "INVALID_ENVELOPE");
    }
    if (!envelope.type || !envelope.domain || !Array.isArray(envelope.sources)) {
      throw new VirtualRegistryError(
        "Envelope must have type, domain, sources",
        "INVALID_ENVELOPE"
      );
    }
    if (!envelope.payload) {
      throw new VirtualRegistryError("Envelope must have payload", "INVALID_ENVELOPE");
    }

    assertSourcesUnique(envelope.sources);
    assertSourcesSorted(envelope.sources);
    validatePayload(envelope.type, envelope.payload);
    if (envelope.derivation) {
      if (!envelope.derivation.inputs || !Array.isArray(envelope.derivation.inputs)) {
        throw new VirtualRegistryError(
          "Derivation must have inputs array",
          "INVALID_ENVELOPE"
        );
      }
      assertDerivationInputsValid(envelope.derivation, envelope.sources);
    }

    const kbId = contentHashFromEnvelope(
      envelope as unknown as Record<string, unknown>
    );
    const normalized = kbId.startsWith("0x") ? kbId : "0x" + kbId;

    if (this.store.has(normalized)) {
      const canonical = canonicalize(sortSources({ ...envelope }) as object);
      const cidV1 = await cidV1FromCanonical(canonical);
      return { kbId: normalized, cidV1, isNew: false };
    }

    if (envelope.sources.length > 0) {
      const sourcesNormalized = envelope.sources.map((p) =>
        p.startsWith("0x") ? p : "0x" + p
      );
      for (const p of sourcesNormalized) {
        if (!this.store.has(p)) {
          throw new VirtualRegistryError(
            `Source ${p} not registered; register sources before descendants`,
            "CYCLE_DETECTED"
          );
        }
      }
      if (this.wouldCreateCycle(normalized, sourcesNormalized)) {
        throw new VirtualRegistryError(
          "Registration would create a cycle in the provenance graph",
          "CYCLE_DETECTED"
        );
      }
    }

    this.store.set(normalized, {
      kbId: normalized,
      curator,
      type: envelope.type,
      sources: envelope.sources.map((p) => (p.startsWith("0x") ? p : "0x" + p)),
      timestamp: Math.floor(Date.now() / 1000),
    });

    const canonical = canonicalize(sortSources({ ...envelope }) as object);
    const cidV1 = await cidV1FromCanonical(canonical);
    return { kbId: normalized, cidV1, isNew: true };
  }

  isVerified(kbId: string): boolean {
    const k = kbId.startsWith("0x") ? kbId : "0x" + kbId;
    return this.store.has(k);
  }

  getCurator(kbId: string): string {
    const k = kbId.startsWith("0x") ? kbId : "0x" + kbId;
    const b = this.store.get(k);
    if (!b) return "0x0000000000000000000000000000000000000000";
    return b.curator;
  }

  getKB(kbId: string): {
    contentHash: string;
    curator: string;
    type: string;
    sources: string[];
    timestamp: number;
    exists: boolean;
  } {
    const k = kbId.startsWith("0x") ? kbId : "0x" + kbId;
    const b = this.store.get(k);
    if (!b) {
      return {
        contentHash: k,
        curator: "0x0000000000000000000000000000000000000000",
        type: "practice",
        sources: [],
        timestamp: 0,
        exists: false,
      };
    }
    return {
      contentHash: b.kbId,
      curator: b.curator,
      type: b.type,
      sources: b.sources,
      timestamp: b.timestamp,
      exists: true,
    };
  }

  /** Parents with equal royalty split (for lineage API). */
  getAttributionDAG(contentHash: string): { parentHash: string; royaltyShareBps: number }[] {
    const kb = this.getKB(contentHash);
    if (!kb.exists || kb.sources.length === 0) return [];
    const bps = Math.floor(10000 / kb.sources.length);
    return kb.sources.map((parentHash) => ({ parentHash, royaltyShareBps: bps }));
  }

  /** Content hashes of blocks that list this hash as a source. */
  getDerivedBlocks(parentHash: string): string[] {
    const p = parentHash.startsWith("0x") ? parentHash : "0x" + parentHash;
    const out: string[] = [];
    for (const [kbId, block] of this.store) {
      if (block.sources.includes(p)) out.push(kbId);
    }
    return out;
  }

  /** For testing: clear all state */
  reset(): void {
    this.store.clear();
  }
}
