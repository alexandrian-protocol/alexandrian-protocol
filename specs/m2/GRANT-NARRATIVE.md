# Grant Narrative (M2)

**Framing for AI infrastructure / L2 grants (e.g. epistemic settlement, agent-native tooling).**

---

## One-liner

Alexandrian Protocol introduces a **deterministic, *autonomous agents** operating on Ethereum and L2s. The protocol is compatible with **ERC-4337 smart accounts** and uses **EIP-712 typed signatures** for secure agent interaction.stake-backed knowledge primitive** designed for *

---

## On-chain quality signals

**On-chain quality signals (totalFeesEarned)** enable measurable knowledge demand, making the protocol **natively indexable** and **analytics-friendly** for ecosystem tooling.

That hits:

- **Agent-native** — Any address (including smart accounts) as querying agent.
- **Measurable activity** — queryCount, totalFeesEarned on-chain and in subgraph.
- **L2-compatible** — No L1-only assumptions; settlement logic portable.
- **Account abstraction aware** — ERC-1271–aware verification; no ecrecover-only for agents.

---

## What to pitch (and what not)

**Do not pitch:** “Knowledge marketplace.”

**Pitch:** **An epistemic settlement layer for autonomous on-chain agents.**

That sounds like infrastructure.

---

## Ideal M2 for grant applications

1. **Slash mechanism** — KBStaking, onDeprecation (10% to protocol). Demonstrate in test harness.
2. **totalFeesEarned** — Query accumulator on KnowledgeRegistry (settleQuery, KBQueried).
3. **Subgraph** — Query metrics (queryCount, totalFeesEarned, deprecated, supersededBy); handleKBQueried, handleKBDeprecated.
4. **Smart account compatibility** — ERC-165, ERC-1271 (SignatureHelper), EIP-712 (AlexandrianEIP712). Optional: ERC-2612 Permit on token.

That’s enough. Clean economic wiring; lean ERC stack.

---

## Discipline

- **Value proposition:** Deterministic KB identity, economic accountability, royalty DAG settlement. **Not** identity reinvention.
- **Stay narrow.** Wire consequences. Show composability. Keep the ERC stack lean.

See [ERC-STACK.md](ERC-STACK.md) and [packages/protocol/contracts/m2/README.md](../../packages/protocol/contracts/m2/README.md).
