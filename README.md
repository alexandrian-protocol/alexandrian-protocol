# Alexandria

A deterministic knowledge protocol with on-chain provenance and atomic royalty settlement.

---

## Start Here

**Dependencies:** Node 20 · pnpm  
(Details: [specs/TROUBLESHOOTING.md](specs/TROUBLESHOOTING.md))

**Full commands:** [specs/grants/COMMANDS.md](specs/grants/COMMANDS.md)

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

[specs/grants/FILE-STRUCTURE.md](specs/grants/FILE-STRUCTURE.md)

**Alexandrian** is the protocol layer.

- Defines the primitive — a **Knowledge Block** with canonical identity, enforceable provenance, and atomic royalty settlement. Identity is deterministic. State transitions are immutable.

**Alexandria** is the library layer.

- Indexes, organizes, and exposes Knowledge Blocks for discovery and query. It implements access logic but does not define protocol rules.

**Agents** operate independently.

- Discovers Knowledge Blocks via Alexandria and settle economically via the Alexandrian Protocol. Discovery is application-layer logic. Intent remains agent-defined. Most are external agents, smart accounts, or frameworks.

**Architect (operator)** is the runtime operator.

- Designs and operates the protocol and runtime: deploys contracts, runs Alexandria and the subgraph, and maintains tooling and docs.

**Protocol Flow**

 Agent → KnowledgeRegistry (query); Registry → RoyaltyDAG → Curators; contentHash CIDv1 = canonical identity.
 
---

## Milestone 2 — Epistemic Accountability

[specs/m2/README.md](specs/m2/README.md)

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
