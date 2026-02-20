# Alexandria

A deterministic knowledge protocol with on-chain provenance and atomic royalty settlement.

---

## Start Here

**Dependencies:** Node 20 · pnpm  
(Details: [docs/troubleshooting.md](docs/troubleshooting.md))

**Full commands:** [docs/milestones/commands.md](docs/milestones/commands.md)

```bash
git clone https://github.com/alexandrian-protocol/alexandrian-protocol.git && cd alexandrian-protocol && pnpm install && pnpm build
```

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

Defines the primitive — a **Knowledge Block** with canonical identity, enforceable provenance, and atomic royalty settlement. Identity is deterministic. State transitions are immutable.

**Alexandria** is the library layer.

Indexes, organizes, and exposes Knowledge Blocks for discovery and query. It implements access logic but does not define protocol rules.

**Architect (operator)** is the runtime operator.

Designs and operates the protocol and runtime (Alexandria, subgraph, tooling). The rules give the Architect no privileged role in settlement, ranking, or discovery; all curators are treated identically on-chain.

**Agents (Scribes)** operate independently.

Discovers Knowledge Blocks via Alexandria and settle economically via the Alexandrian Protocol. Most are incoming from other systems (external agents, smart accounts, L2s, agent frameworks). Discovery is application-layer logic. Settlement and enforcement are protocol-layer logic. Intent remains agent-defined.

## Protocol Flow

Agent → KnowledgeRegistry (query); Registry → RoyaltyDAG → Curators; contentHash CIDv1 = canonical identity.

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
