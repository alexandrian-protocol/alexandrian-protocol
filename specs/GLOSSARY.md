# Glossary

Terminology for grant reviewers and contributors.

---

## Protocol core

- **KB (Knowledge Block)** — A content-addressed unit of knowledge: type, domain, payload, optional derivation. Registered on-chain with stake and query fee.
- **Canonical envelope** — The object that is JCS-serialized and hashed: type, domain, sources (sorted), payload, optional derivation. No timestamp or signature in the hash preimage.
- **contentHash** — SHA-256 hash of the canonical envelope (hex, 0x-prefixed). Same content + same lineage → same hash (deterministic identity).
- **CIDv1** — Content identifier (IPFS-style) derived from the same canonical bytes. Used for storage and retrieval.
- **VirtualRegistry** — In-memory protocol sandbox that enforces cycle-free lineage, no duplicate sources, and payload validation. Stricter-than-mainnet reference implementation.
- **Royalty DAG** — Directed acyclic graph of parent→child attribution; query fees flow to parents per share. Cycles and path overflow are rejected by economic invariants.

## Types and payloads

- **Practice** — Root KB type: rationale, contexts, failure modes.
- **Derived** — KB built from sources via derivation (compose, transform, extract, summarize). Sources must be registered first.
- **Synthesis** — Derived type: question, answer, citations (source → excerpt).
- **Attribution link** — On-chain: parent contentHash, royaltyShareBps, relationship (derv, extd, ctrd, vald).

## Conformance and testing

- **Test vectors** — `test-vectors/canonical/`: synthetic envelopes + expected contentHash/CID. Used for spec conformance and regression.
- **Seeds** — `seeds/`: real KBs (e.g. software.security, software.patterns) for demos and reviewers. Not test vectors.
- **Economic invariants** — Rules enforced in code and tests: no cycles in royalty DAG, path shares ≤ 100%, base royalty + parent shares ≤ 100%, deterministic distribution.

## Operations

- **Register** — Publish a KB on-chain (Registry contract) with stake and optional parent attribution.
- **Settle (citation)** — Pay query fee for a KB; royalties flow through the DAG per on-chain attribution.
- **Stake** — XANDER locked on a KB; affects reputation and slashing (if applicable).

## Milestones

- **M1 (Milestone 1)** — Spec, canonical hashing, contracts, SDK/CLI, test vectors, seeds, subgraph, CI. What grant reviewers evaluate for the first deliverable.
- **M2+** — Full API, pipeline, discovery, agents, production runtime.
