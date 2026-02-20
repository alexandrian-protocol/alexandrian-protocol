🚀 Start Here
Requirements

Node.js 20

pnpm

(Windows) Hardhat teardown issue may occur — use WSL or CI if needed.

One Command Setup

Clone → install → build → run demo:

git clone https://github.com/alexandrian-protocol/alexandrian-protocol.git
cd alexandrian-protocol
pnpm start:here
Already cloned?
pnpm start:here
Manual steps
pnpm install
pnpm build
pnpm demo
✅ Milestone 1 — Complete

Milestone 1 establishes:

Deterministic Knowledge Block identity

On-chain registration

Atomic settlement

Indexable lineage

Guarantees
Guarantee	Enforced By	Proof
Deterministic kbId	Canonical serialization invariant	pnpm test:spec
Stable contentHash + CIDv1	Canonical byte derivation	pnpm test:spec
Unique on-chain registration	KnowledgeRegistry immutability	pnpm test:protocol
Atomic settlement (98/2)	Transaction-level execution	pnpm test:protocol
Royalty propagation	RoyaltyDAG deterministic routing	pnpm test:protocol
Schema validation	Graph integrity enforcement	pnpm test:spec
Queryable lineage	Subgraph indexing	subgraph
🏗 Architecture Overview

See full definitions → docs/README.md

The Alexandrian system separates protocol enforcement, infrastructure operation, and application intent into distinct layers.

Components
Alexandrian — Protocol Layer

Defines the protocol primitive — the Knowledge Block — providing:

Canonical identity

Enforceable provenance

Atomic royalty settlement

Identity is deterministic. State transitions are immutable.

Alexandria — Library Layer

Indexes and exposes Knowledge Blocks for discovery and query.

Implements access and indexing logic

Does not define protocol rules

Does not influence settlement

Architect (Operator) — Infrastructure

Operates runtime infrastructure:

Alexandria runtime

Subgraph indexing

Tooling and services

Protocol rules grant no privileged authority in settlement, ranking, or discovery.

Agents (Scribes) — Application Layer

Independent participants that:

Discover Knowledge Blocks via Alexandria

Settle economically via Alexandrian

Discovery is application-layer logic.
Enforcement is protocol-layer logic.
Intent remains agent-defined.

Knowledge Block — Protocol Primitive

The fundamental unit of knowledge.

A structured, content-addressed envelope containing:

knowledge payload

provenance metadata

economic attribution

🧭 Architectural Stack
🔭 Milestone 2 — Epistemic Accountability

Milestone 2 introduces economic consequence and measurable trust signals at the Knowledge Block layer.

It extends deterministic identity (M1) with:

stake exposure

demand weighting

verifiable agent intent

Feature	Enables	Surface
totalFeesEarned	On-chain demand signal	Registry + subgraph
Endorsements	Multi-curator consensus	Protocol events
Slashing	Economic penalties	KBDeprecated → slash()
EIP-712 signing	Verifiable agent intent	Signed settlement
ERC-8004 compatibility	Agent interoperability	Interface layer
Base Sepolia subgraph	Public queryability	Graph Studio
📄 License

MIT — see LICENSE

🎯 What Improved
1️⃣ Visual Scanning

Readers now see:

Start → Proof → Architecture → Future

which matches reviewer cognition.

2️⃣ Architecture Feels Real

Components are grouped logically instead of appearing as paragraphs.

3️⃣ Protocol Tone Increased

Bullets emphasize capabilities, not prose.

4️⃣ GitHub Native Formatting Only

No custom HTML required → renders perfectly everywhere.

⭐ Optional High-Impact Upgrade

Add badges at top:

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Milestone](https://img.shields.io/badge/M1-complete-blue)
![License](https://img.shields.io/badge/license-MIT-green)
