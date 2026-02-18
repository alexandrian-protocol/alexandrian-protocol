# Milestone 1 Demo — Protocol Integrity

**M1 = Canonical Serialization + Deterministic Identity.**  
The demo should prove: same logical content → same kbId; parent order does not affect kbId; invalid schema fails; lineage cycles are rejected; registry emits canonical event; subgraph indexes it; anyone can verify independently.

---

## What a Strong M1 Demo Shows (in order)

### 1. Create a KB

**Example:** StateMachineBlock (or any KB type).

**Show:**

- Raw JSON (envelope)
- Canonicalized JSON (JCS-sorted, no timestamp in hash preimage)
- SHA-256 hash → contentHash (0x…)
- CIDv1 → kbId

**Prove:** Same input → same output across runs. Deterministic identity.

**Where:** `node scripts/demo.mjs` (protocol-only); or `packages/protocol` → `contentHashFromEnvelope`, `canonicalize`, `cidV1FromEnvelope`. Test vectors in `test-vectors/canonical/`.

---

### 2. Demonstrate Determinism

**Change:**

- Parent order (sources array order)
- Whitespace in payload
- Key order in JSON

**Show:** kbId stays identical when the canonical form is the same (sources are order-normalized; key order is fixed by canonicalization).

**Where:** `tests/unit/canonical-vectors.test.ts`, `tests/unit/derived-vectors.test.ts`; `scripts/demo.mjs` (recompute hash, compare).

---

### 3. Register On-Chain

**Call:** `registerKB` (or SDK `publish` / CLI `alex publish`).

**Show:**

- Transaction hash
- Event emitted (e.g. KBRegistered / KBPublished)
- Registry mapping updated (contentHash → metadata)

**Where:** `pnpm deploy:local` then `alex publish <envelope> --stake … --query-fee …`; or integration tests that hit the registry.

---

### 4. Query via Subgraph

**Show:** GraphQL query:

```graphql
knowledgeBlock(id: "...") {
  curator
  parents
  status
}
```

The KB exists in canonical graph state; anyone can query it.

**Where:** `subgraph/` (schema and mappings); when deployed, query the subgraph endpoint. See [subgraph/README.md](../subgraph/README.md).

---

### 5. Demonstrate Invariant Protection

**Try to:**

- Create cyclic parent reference → show it **fails** (VirtualRegistry / contract rejects).
- Submit invalid schema → show it **fails** (validation / revert).
- Use duplicate parents → show it **fails** (duplicate sources rejected).

**Prove:** Adversarial resistance; protocol enforces invariants.

**Where:** `tests/unit/virtual-registry.test.ts` (cycles, duplicate sources); `tests/invariants/`; contract tests in `packages/protocol`.

---

## Tests that demonstrate M1

Milestone 1 includes a runnable M1 demo test that proves deterministic KB identity, registry-ready formatting, subgraph indexability, and invariant enforcement.

**`tests/m1-demo.test.ts`** runs the five steps above (protocol-only, no Hardhat):

- Create a KB (stateMachine + practice) → contentHash, CIDv1, same input → same output.
- Determinism → key order, sources order normalized.
- Register (VirtualRegistry) → kbId format for registry/subgraph.
- Subgraph-indexable → 0x + 64 hex id.
- Invariant protection → duplicate sources, invalid schema, unsorted sources rejected.
- Derived KB (optional) → KB2 from KB1 (parents preserved), DAG composition (chain + diamond).

Run with: `pnpm test:spec` (includes unit, invariants, and M1 demo).

## One-Command Protocol-Only Demo

No chain required:

```bash
pnpm build
node scripts/demo.mjs
```

This shows: create KB → derive KB → contentHash + CIDv1 → determinism check. For full flow (register on-chain, subgraph, invariant tests), run `pnpm deploy:local`, set env, then use CLI/API and subgraph.

## Checklist for Reviewers

- [ ] Same logical content → same kbId (test vectors + demo).
- [ ] Parent order does not change kbId (determinism tests).
- [ ] Invalid schema fails (validation / VirtualRegistry).
- [ ] Lineage cycles rejected (VirtualRegistry + tests).
- [ ] Registry emits canonical event (deploy + publish).
- [ ] Subgraph indexes it (subgraph schema + deployment).
- [ ] Anyone can verify independently (public canonical spec + test vectors).
