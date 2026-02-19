# Economic assumptions

How the protocol thinks about incentives and rational actors. Complements the [threat model](THREAT-MODEL.md).

---

## What the protocol enforces (invariants)

- **Royalty DAG:** No cycles; no path with total share > 100%; base royalty + parent shares ≤ 100% per node. Distribution and obligation are deterministic from the graph and payment amount.
- **Settlement:** Query fees and royalty flows follow the DAG; no “extra” payout beyond what the DAG and contract allow.
- **Stake / fees:** Defined by contracts and configuration; protocol layer does not change economic parameters, only enforces structural and arithmetic consistency.

So: **the protocol is economically consistent** — it never allows impossible or ill-defined payouts. It does not, by itself, guarantee that rational actors cannot profit from spam, parent inflation, or collusion; that depends on parameters and policy.

---

## Intended economic properties (design goals)

- **Spam:** The design intends that creating many low-value KBs is not trivially profitable (e.g. stake and/or query fees and discovery ranking should make bulk low-quality registration costly or low-reward). Formal modeling of “spam is unprofitable” is not in scope of this doc; parameters should be set with that goal in mind.
- **Parent inflation:** Deep or very wide DAGs are structurally allowed but may be limited by contract (e.g. max parents), gas, or policy. The protocol does not incentivize unbounded parent count; it only enforces that any given DAG is cycle-free and share-bounded.
- **Collusion:** The protocol does not add special rules to prevent collusion. Colluding parties can only get payouts that the DAG and shares allow. Mitigation (e.g. detection, rate limits, reputation) is implementation- and ecosystem-level.

---

## What we do not claim

- **Sybil resistance:** The protocol does not define identity or Sybil resistance; that is delegated to stake, auth, or external systems.
- **Optimal fee or stake levels:** Economic parameters (query fee, stake size, protocol fee) are not derived here from first principles; they are configuration.
- **Reputation truth:** Reputation and ranking are used for discovery; the protocol does not define a single canonical reputation model or claim game-theoretic optimality of ranking.

---

## Summary

The protocol aims to be **economically stable** in the sense that (1) invariants prevent impossible or inconsistent payouts, and (2) the design intends to discourage spam and unbounded parent inflation via parameters and policy. It is **not** a full game-theoretic design document; it makes explicit what is enforced (invariants) and what is assumed or left to deployment (profitability of spam, Sybil, collusion). Stating this clearly is what reviewers look for when assessing economic maturity.
