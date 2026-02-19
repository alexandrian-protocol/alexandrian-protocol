# Alexandria

A deterministic knowledge protocol with on-chain provenance and atomic royalty settlement.

---

## Start here

**Dependencies:** Node 20 · pnpm  
(Details: [specs/TROUBLESHOOTING.md](specs/TROUBLESHOOTING.md))

**Full commands:** [specs/grants/COMMANDS.md](specs/grants/COMMANDS.md)

```bash
git clone https://github.com/alexandrian-protocol/alexandrian-protocol.git && cd alexandrian-protocol && pnpm install && pnpm build
```

---

## Milestone 1 — Complete

Milestone 1 established deterministic Knowledge Block identity, on-chain registration, atomic settlement, and indexable lineage.

| What | What This Demonstrates | Proof |
|------|------------------------|-------|
| Same content → same kbId, always | Deterministic canonical identity; invariant to key order and formatting | `pnpm test:spec` |
| Canonical envelope → fixed contentHash + CIDv1 | Content-addressed identity derived from canonical serialization | `pnpm test:spec` |
| Knowledge Blocks registered on-chain with permanent provenance | Registry enforces uniqueness and immutability of kbId | `pnpm test:protocol` |
| Agent queries KB → curator paid atomically (98/2 split) | On-chain settlement executes fully or not at all | `pnpm test:protocol` |
| RoyaltyDAG routes upstream payments | Derivations correctly split and route royalties | `pnpm test:protocol` |
| Invalid schema, cycles, duplicates rejected | Structural integrity and graph safety enforced | `pnpm test:spec` |
| Lineage queryable via subgraph | Knowledge graph externally indexable and composable | [subgraph/](subgraph/README.md) |
| Full verification (install, build, all tests, demo) | One command runs the complete M1 check | `pnpm verify` |
| Verbose walkthrough | Human-readable demo for reviewers | `pnpm demo:walkthrough` |

---

## Architecture

[specs/grants/FILE-STRUCTURE.md](specs/grants/FILE-STRUCTURE.md)

**Alexandrian** is the protocol layer.

- It defines the primitive — a **Knowledge Block** with canonical identity, enforceable provenance, and atomic royalty settlement. Identity is deterministic. State transitions are immutable.

**Alexandria** is the library layer.

- It indexes, organizes, and exposes Knowledge Blocks for discovery and query. It implements access logic but does not define protocol rules.

**Agents** operate independently.

- They discover Knowledge Blocks via Alexandria and settle economically via the Alexandrian Protocol. Discovery is application-layer logic. Settlement and enforcement are protocol-layer logic. Intent remains agent-defined.

*Chart: Agent → KnowledgeRegistry (query); Registry → RoyaltyDAG → Curators; contentHash CIDv1 = canonical identity. Renders in GitHub README.*

**Protocol Flow**

graph LR
  A[Agent] -->|query + payment| B[KnowledgeRegistry]
  B -->|royalty split| C[RoyaltyDAG]
  C -->|curator fee| D[Curator]
  C -->|parent royalties| E[Parent Curators]
  B -->|contentHash / CIDv1| F[Knowledge Block]
  
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
