# Docs and features — what a grant reviewee needs

Quick reference: all docs/features in the repo and what is **needed** vs **not needed** for an M1 grant reviewee.

---

## Single entry point for reviewers

**Start here:** [specs/grants/](.) — [README.md](README.md) and [COMMANDS.md](COMMANDS.md).  
One flow: `pnpm install && pnpm build && pnpm demo` then `pnpm test:spec` or `pnpm verify`.

---

## Needed for grant reviewee (M1)

| Item | Purpose |
|------|--------|
| **README.md** (root) | Repo overview, CI badge, protocol diagram, M1 deliverables, proof-of-execution table, live subgraph link. |
| **specs/grants/** | Reviewer entry: [README.md](README.md), [COMMANDS.md](COMMANDS.md), [REVIEW.md](REVIEW.md), [AUDIT-READINESS.md](AUDIT-READINESS.md). |
| **specs/M1-DEMO.md** | What M1 proves: create KB → determinism → register → subgraph → invariants. |
| **specs/PROTOCOL-SPEC.md** | Canonical serialization, hashing, KB types. |
| **specs/INVARIANTS.md** | Protocol and economic invariants. |
| **specs/ARCHITECTURE.md** | Core vs runtime, testing. |
| **specs/TROUBLESHOOTING.md** | Node/Windows/Docker known issues. |
| **specs/TESTNET-ADDRESSES.md** | How to deploy and set env; testnet faucets. |
| **specs/E2E-TESTNET-GRAPH.md** | E2E → testnet → subgraph flow. |
| **CHANGELOG.md** | M1 entry; shows maintained history. |
| **subgraph/README.md** | Subgraph schema, deploy, example GraphQL queries, startBlock note. |
| **seeds/README.md** | Seed count, recommended-for-graph set, registration order. |
| **scripts/README.md** | Deploy, register:seeds, demo commands. |
| **test-vectors/canonical/** | Canonical reference (envelope → contentHash/CID). |
| **packages/protocol** | Core: types, schemas, canonical serialization, VirtualRegistry, Solidity (KnowledgeRegistry, etc.). |
| **packages/sdk** | Client SDK and CLI; examples. |
| **tests/** | Unit, invariants, M1 demo, integration (incl. testnet smoke, subgraph). |
| **subgraph/** | Schema, mapping, deploy to Studio. |
| **seeds/** | 20 seed KBs for demos and graph. |
| **CI** (GitHub Actions) | Build and test on push/PR; green badge. |

**Optional but useful:** [specs/ECONOMIC-ASSUMPTIONS.md](../ECONOMIC-ASSUMPTIONS.md), [specs/GAS.md](../GAS.md), [specs/serialization-test-vectors.md](../serialization-test-vectors.md), [glossary.md](../../glossary.md), [specs/PACKAGING.md](../PACKAGING.md), [packages/protocol/docs/API.md](../../packages/protocol/docs/API.md).

---

## Not needed for grant reviewee

These are internal, M2+, or contributor-focused. A reviewee does **not** need to read or run them to evaluate M1.

| Item | Why not needed |
|------|----------------|
| **specs/m2/** | M2 grant narrative, ERC stack, roadmap, demo video script — post-M1. |
| **specs/grants/** deep dive | COMMANDS + README + M1-DEMO + REVIEW is enough; AUDIT-READINESS is optional. |
| **specs/THREAT-MODEL.md** | Internal/audit prep; not required to judge M1. |
| **specs/SHARP-EDGES.md** | Contributor/implementation notes. |
| **CONTRIBUTING.md** | For contributors, not reviewers. |
| **TESTS.md** | Detailed test layout; reviewee runs `pnpm verify` / `pnpm test`, no need to read this. |
| **packages/api** | Not M1 (README says so); API layer is M2+. |
| **packages/pipeline** | Not M1; pipeline/runtime is M2+. |
| **docker/** | Supporting; optional for local full stack. |
| **packages/protocol/contracts/m2/** | M2 contract stubs (KBStaking, EIP-712, etc.). |
| **subgraph/m2/** | M2 schema/mapping snippets. |
| **test-vectors/.../edge-cases/** | Edge-case vectors; canonical set is enough. |

---

## Summary

- **Reviewee path:** Root README → [specs/grants/README.md](README.md) → `pnpm verify` or `pnpm demo:walkthrough` → [M1-DEMO.md](../M1-DEMO.md) and [PROTOCOL-SPEC.md](../PROTOCOL-SPEC.md) if they want detail.
- **Not needed:** M2 docs (specs/m2/), api/pipeline packages, contributor-only docs (CONTRIBUTING, SHARP-EDGES, THREAT-MODEL), M2 contract/subgraph stubs, deep test doc (TESTS.md).
