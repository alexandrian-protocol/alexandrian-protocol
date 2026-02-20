# Knowledge Blocks: Spec & Ecosystem Value

**Status:** Draft (aligns with [PROTOCOL-SPEC](PROTOCOL-SPEC.md) v2.0.0)  
**Purpose:** Define **Knowledge Blocks (KBs)** — the Alexandrian Protocol primitive — and articulate the value they bring to the ecosystem via **data** and **formalization**.

---

## 1. Design Goals (Knowledge Blocks)

A Knowledge Block MUST be:

| Goal | KB instantiation |
|------|-------------------|
| **Atomic** | One claim-set / procedure / pattern (small enough to compose). |
| **Machine-readable** | Typed envelope (Practice, StateMachine, Compliance, Synthesis, etc.) with Zod schemas. |
| **Verifiable** | Deterministic contentHash + CIDv1; anyone can recompute from canonical bytes. |
| **Composable** | `sources` (parents) reference prior KBs; lineage DAG; no cycles. |
| **Economically settled** | Royalty DAG; atomic settlement (98/2); on-chain registry. |
| **Retrievable** | Subgraph indexes id, curator, type, parents; queryable by agents. |

Optional / M2+: freshness, confidence decomposition, execution envelope, relations (supports/contradicts).

---

## 2. Canonical Identity (KB)

KBs use **Canonical JSON (JCS / RFC 8785)** before hashing. Identity is **deterministic** across implementations.

```
kbId = contentHash = SHA-256( canonical_json(envelope_without_timestamp_in_hash_preimage) )
      CIDv1 = multiformat wrapper for contentHash (0x-prefixed hex → base32)
```

- **Hash preimage:** type, domain, payload, `sources` (order-normalized). No timestamp in preimage → same logical content → same kbId.
- **Spec:** [PROTOCOL-SPEC](PROTOCOL-SPEC.md), [INVARIANTS](INVARIANTS.md). Test vectors: `test-vectors/canonical/`.

---

## 3. Core Object Model (KB Envelope)

Knowledge Blocks use a **typed envelope** per KB type (Practice, Feature, StateMachine, Prompt, Compliance, Synthesis, Pattern, Adaptation, Enhancement). Minimal shape:

| Zone | Role |
|------|------|
| **Identity** | `type`, `domain`, `payload`, `sources` (parents) → contentHash / kbId. |
| **Provenance** | Curator (on-chain); author/sources in envelope. |
| **Economics** | Base royalty + parent shares (royalty DAG); settlement on-chain. |
| **Payload** | Type-specific (e.g. Practice: rationale, steps; StateMachine: states, transitions). |

On-chain registry stores: **kbId**, **curator**, **artifactType** (KBType enum), **parents**. Payload and rich metadata live off-chain; identity and settlement are on-chain.

---

## 4. KB Types (Kinds)

| Kind | Purpose |
|------|--------|
| **Practice** | Stepwise procedures, patterns (e.g. input validation, rate limiting). |
| **StateMachine** | State machines (e.g. auth flow, token lifecycle). |
| **ComplianceChecklist** | Requirements + evidence mapping. |
| **Synthesis** | Derived KBs from multiple parents (e.g. secure API design from practices). |
| **Pattern** | Reusable patterns with occurrences. |
| **Adaptation** | Target domain, tradeoffs. |
| **Enhancement** | Concern, enhanced content. |
| **Prompt** | Prompt-engineering blocks. |
| **Feature** | Feature specs with practice refs. |

See `packages/protocol` types and schemas.

---

## 5. Protocol Invariants (KB)

Aligned with [INVARIANTS](INVARIANTS.md):

| ID | Rule |
|----|------|
| **INV-01** | Canonical identity: hash(canonical_json) is deterministic. |
| **INV-02** | No cycles: a KB cannot be its own ancestor. |
| **INV-03** | No duplicate sources; sources before descendants. |
| **INV-04** | Royalty DAG: no cycles; path share ≤ 100%; per-node bounds. |
| **INV-05** | Payload determinism: non-URI payload in hash preimage. |

Default deny, signature/verification (M2), and freshness/deprecation (M2) extend this.

---

## 6. On-Chain vs Off-Chain (KB)

| On-chain | Off-chain |
|----------|------------|
| kbId (contentHash) | Full payload content |
| Curator | Author metadata, evidence |
| ArtifactType (KBType) | Domain, tags, embeddings |
| Parents (lineage) | Rich provenance |
| Royalty DAG + settlement | License text, cost metadata |
| Registration / deprecation events | Index (subgraph, Alexandria) |

Subgraph exposes on-chain data for query; Alexandria (library) can index payload + embeddings for retrieval.

---

## 7. Agent Consumption (KB)

| Operation | KB layer |
|-----------|----------|
| **Search** | Subgraph (by curator, type, lineage); Alexandria (by content/embeddings). |
| **Fetch** | Payload + envelope from content-addressed storage or index. |
| **Verify** | Recompute contentHash from canonical envelope; compare to kbId. |
| **Cite** | kbId + curator + parents (provenance snippet). |
| **Settle** | On-chain: agent pays; registry splits royalty along DAG. |

See [SUBGRAPH](SUBGRAPH.md) for live query endpoint and example GraphQL.

---

## 8. Ecosystem Value: Data

Knowledge Blocks give the ecosystem **structured, queryable data** with **stable identity**:

- **Deterministic identity:** Same content → same kbId everywhere. No vendor lock-in; any index can resolve and verify.
- **Queryable lineage:** Subgraph exposes `parents`, `parentCount`, `curator`, `artifactType`. Agents can walk the DAG, reason about dependencies, and attribute provenance.
- **Indexable at scale:** Subgraph (The Graph) + optional Alexandria index. GraphQL for structured query; embeddings/tags for semantic search (off-chain).
- **Settlement as data:** Registration and settlement events are on-chain and indexed; demand and attribution are measurable (M2: totalFeesEarned, queryCount).

**Outcome:** One primitive (KB) yields a **knowledge graph** that is both human- and agent-queryable, with identity and economics anchored on-chain.

---

## 9. Ecosystem Value: Formalization

Knowledge Blocks **formalize** knowledge so agents and systems can consume it safely:

- **Canonical serialization:** JCS + sorted sources → one canonical form. Implementations agree on identity; no ambiguous hashes.
- **Typed schema:** Zod schemas per KB type. Validation at ingest; predictable structure for tooling and agents.
- **Economic invariants:** Royalty DAG is cycle-free and share-bounded. Settlement is deterministic; no overflow or underspec.
- **Structural invariants:** No cycles in lineage; sources before descendants. The graph is always a DAG; composition is well-defined.
- **One primitive, many uses:** Practices, syntheses, compliance, patterns share the same identity and settlement layer. Ecosystem builds one integration (KB) instead of N ad-hoc formats.

**Outcome:** Knowledge is **machine-negotiable**: agents can verify, cite, and pay in a single protocol. Formalization reduces integration cost and increases trust (verifiable hashes, enforceable royalties).

---

## 10. Conceptual Stack (KB)

```
Agent / Application
  ↓
Knowledge Block (identity + payload + lineage + economics)
  ↓
Alexandria (index, search, retrieval) + Subgraph (queryable graph)
  ↓
Alexandrian Protocol (registry + settlement + invariants)
  ↓
Chain (Base Sepolia / L2)
```

---

## 11. Summary

Knowledge Blocks are the Alexandrian **KB primitive**: atomic, verifiable, composable, and economically settled. They bring value to the ecosystem through:

1. **Data:** Deterministic identity, queryable lineage, indexable graph, measurable settlement — one coherent knowledge layer for agents and apps.
2. **Formalization:** Canonical serialization, typed schemas, structural and economic invariants — one protocol primitive for knowledge, trust, and payment.

Spec and implementation: [PROTOCOL-SPEC](PROTOCOL-SPEC.md), [INVARIANTS](INVARIANTS.md), [SUBGRAPH](SUBGRAPH.md).
