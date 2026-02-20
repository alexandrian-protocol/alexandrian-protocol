# Alexandria

A deterministic knowledge protocol with on-chain provenance and atomic royalty settlement.

---

## Start Here

**Dependencies:** Node 20 · pnpm  
On Windows, protocol tests can hit a known Hardhat teardown; see troubleshooting there or run them in WSL/CI.

**One command from scratch (clone → install deps → build → demo):**

```bash
git clone https://github.com/alexandrian-protocol/alexandrian-protocol.git && cd alexandrian-protocol && pnpm start:here
```

Already cloned? Run `pnpm start:here` (or step by step: `pnpm install && pnpm build && pnpm demo`).

---

## Milestone 1 — Complete

Milestone 1 establishes deterministic Knowledge Block identity, on-chain registration, atomic settlement, and indexable lineage.

| Guarantee | Enforced By | Proof |
|-----------|-------------|-------|
| Deterministic kbId derivation | Canonical serialization; invariant to key order and formatting | `pnpm test:spec` |
| Stable contentHash + CIDv1 from canonical envelope | Content-addressed identity derived from canonical bytes | `pnpm test:spec` |
| Unique on-chain registration | KnowledgeRegistry enforces immutability and uniqueness of kbId | `pnpm test:protocol` |
| Atomic settlement (98/2 split) | Transaction-level execution; no partial state transitions | `pnpm test:protocol` |
| Upstream royalty routing | RoyaltyDAG enforces deterministic split propagation | `pnpm test:protocol` |
| Schema validation + cycle rejection | Structural integrity of Knowledge Block graph | `pnpm test:spec` |
| Queryable lineage via subgraph | External indexability and composability | [subgraph/](subgraph/README.md) |

---

## Architecture

[docs/README.md](docs/README.md)

**Alexandrian** is the protocol layer.

Defines the primitive — a Knowledge Block — providing canonical identity, enforceable provenance, and atomic royalty settlement. Identity is deterministic. State transitions are immutable.

**Alexandria** is the library layer.

Indexes, organizes, and exposes Knowledge Blocks for discovery and query. It implements access and indexing logic but does not define protocol rules or influence settlement.

**Architect (Operator)** is the runtime operator.

Designs and operates infrastructure supporting the protocol and runtime (Alexandria, subgraph, and tooling). Protocol rules grant the Architect no privileged role in settlement, ranking, or discovery; all curators are treated identically on-chain.

**Agents (Scribes)** are independent participants.

Agents discover Knowledge Blocks through Alexandria and settle economically through the Alexandrian protocol. Most agents originate from external systems (agent frameworks, smart accounts, L2s, or external applications). Discovery is application-layer logic. Settlement and enforcement are protocol-layer logic. Intent remains agent-defined.

**Knowledge Block** is the fundamental unit of knowledge within the Alexandrian protocol.

Sstructured, content-addressed envelope containing knowledge, provenance metadata, and economic attribution information.

## Protocol Flow

Protocol (Alexandrian)
        ↓
Library (Alexandria)
        ↓
Operator (Architect)
        ↓
Application Actors (Agents)
        ↓
Protocol Primitive (Knowledge Block).

---

## Milestone 2 — Epistemic Accountability

M2 is planned (slash/deprecation, query metrics, smart-account compatibility). See [docs/milestones/](docs/milestones/) for reviewer entry.

Milestone 2 introduces economic consequence and measurable trust signals at the Knowledge Block layer.

It extends deterministic identity (Milestone 1) with stake exposure, demand weighting, and verifiable agent intent.

| What | What This Enables | Proof / Surface |
|------|-------------------|-----------------|
| totalFeesEarned per KB | On-chain demand signal; economic weight accumulates | Registry + subgraph |
| Endorsement primitive | Independent curators attest to KB accuracy; consensus beyond citation | Protocol event + subgraph |
| Slash mechanism | Curator stake at risk on deprecation; economic penalty enforced | KBDeprecated → slash() |
| EIP-712 agent signing | Agent intent cryptographically verifiable; replay-resistant | Signed settlement path |
| ERC-8004 compatibility | Any compliant agent can query and settle against KBs | Interface compatibility |
| Subgraph live on Base Sepolia | Lineage, demand, and endorsements externally queryable | Graph Studio |

---

## License

[MIT](LICENSE)
