# Threat model

What the protocol protects against, and what it does not. This is the adversarial lens reviewers expect.

---

## Assumed adversaries

- **Rational curators** — Maximize payout or reputation within the rules; may try to game royalty DAG, parent links, or registration volume.
- **Spam / Sybil accounts** — Many identities or many low-value KBs to dilute discovery, inflate graphs, or probe settlement.
- **Colluding parties** — Curators or agents coordinating to shift payouts or reputation in ways the rules allow or don’t explicitly forbid.

We do **not** assume unbounded off-chain resources (e.g. infinite compute to break crypto); we assume economic and structural attacks that stay within the protocol’s data and incentive model.

---

## In-scope threats the protocol addresses

| Threat | Mitigation |
|--------|------------|
| **Cycle in royalty DAG** | VirtualRegistry and EconomicInvariants reject cycles; on-chain registration enforces DAG. Cycle detection is deterministic and independently verifiable. |
| **Duplicate sources** | VirtualRegistry rejects duplicate sources in an envelope; single logical parent per edge. |
| **Parent share > 100% or path overflow** | EconomicInvariants validate per-node and per-path; shares and base royalty bounded; distribution math is deterministic. |
| **Identity / hash manipulation** | Content hash is from canonical envelope (JCS + sorted sources); no timestamp in preimage. Same content + lineage → same identity. |
| **Privileged curator treatment** | Neutrality commitment: no FOUNDER/ARCHITECT in settlement, ranking, or discovery; all curators treated identically by the rules. |

---

## Out-of-scope or partially addressed

| Area | Current stance |
|------|----------------|
| **Spam (10k tiny KBs)** | Structural and economic invariants hold (no cycle, no share overflow). Whether spam is *profitable* depends on stake, query fees, and discovery; not fully modeled here. See [ECONOMIC-ASSUMPTIONS.md](ECONOMIC-ASSUMPTIONS.md). |
| **Exponential DAG traversal** | DAG depth and fan-out are bounded by validation and gas in practice; no explicit complexity cap in the spec. Implementations should bound traversal (e.g. max depth / max parents). |
| **Reputation gaming** | Reputation and ranking are used for discovery; the protocol does not define a single “reputation truth.” Gaming (e.g. self-endorsement, Sybil) is a known risk; mitigation is implementation- and policy-dependent. |
| **Oracle / off-chain data** | Trust in embedding providers, indexers, or off-chain state is outside the core protocol; interfaces exist but are not part of the invariant set. |

---

## Summary

The protocol **guarantees**: deterministic identity, cycle-free and share-bounded royalty DAG, and neutral treatment of curators by the rules. It **does not guarantee**: unprofitability of spam, full Sybil resistance, or bounded worst-case graph size in all implementations. Documenting this separation is what makes the adversarial model explicit and reviewer-ready.
