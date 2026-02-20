# Protocol invariants

What the protocol **always** enforces. Milestone reviewers can rely on these.

---

## Structural (VirtualRegistry + canonical)

- **No cycles** — A KB cannot be its own ancestor. Registration is rejected if it would create a cycle.
- **No duplicate sources** — An envelope cannot list the same source twice. Rejected at registration.
- **Sources before descendants** — Every source in an envelope must already be registered before the child.
- **Deterministic identity** — Same canonical envelope (type, domain, sources order-normalized, payload) → same contentHash and CIDv1. No timestamp in the hash preimage.

---

## Economic (royalty DAG)

- **No cycles in royalty graph** — Enforced by `EconomicInvariants.validateNoCycles` and on-chain validation.
- **Path share ≤ 100%** — For any path from a node to ancestors, the sum of edge shares does not exceed 100%. Enforced by `EconomicInvariants.validateRoyaltyDAG`.
- **Per-node bounds** — Base royalty and each parent share in [0, 100]; base + sum(parent shares) ≤ 100%. Enforced by `EconomicInvariants.validateRoyaltyShares`.
- **Distribution** — Payout distribution is deterministic from the DAG and payment amount; no caller-dependent branching.

---

## Where to see them

- **Code:** `packages/protocol/src/core/virtualRegistry/`, `packages/protocol/src/core/invariants/economic.ts`.
- **Tests:** `tests/invariants/economic-invariants.test.ts`, `tests/unit/virtual-registry.test.ts`, `tests/performance/royalty-graph-scale.test.ts`.
- **Spec:** [PROTOCOL-SPEC.md](PROTOCOL-SPEC.md).
