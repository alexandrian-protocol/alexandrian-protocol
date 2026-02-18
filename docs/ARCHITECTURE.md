# Architecture — Protocol core vs runtime

**For grant submission:** Protocol core tests must not depend on the runtime API layer.

---

## Principle

- **Protocol** = core spec: canonical hashing, economic invariants, ledger math, Merkle proofs, VirtualRegistry, contracts. Lives in `packages/protocol` and in **local deterministic test helpers** under `tests/`.
- **API** = runtime surface: Express server, env, ports, server lifecycle. Lives in `packages/api` (minimal stub in M1, full in M2).

Grant reviewers care about the **core**. The API is a runtime detail.

---

## What protocol core tests use

Tests that validate **canonical hashing, ledger math, Merkle proofs, economic invariants**:

- Import from **`packages/protocol`** (types, canonical, VirtualRegistry, invariants), or
- Import from **local deterministic test helpers** under `tests/` (e.g. `tests/invariants/ledger.ts`, `tests/integration/merkle.ts`).

They must **not**:

- Depend on Express
- Depend on env (beyond what Vitest sets)
- Depend on server lifecycle or ports
- Import from `packages/api` for **protocol logic** (hashing, ledger, merkle)

---

## Layout

| Layer        | Location              | Role                                      |
|-------------|------------------------|-------------------------------------------|
| Protocol    | `packages/protocol`    | Spec, contracts, canonical, invariants   |
| Test helpers| `tests/invariants/`, `tests/integration/` | Pure helpers (ledger, merkle) for core tests |
| API         | `packages/api`         | Runtime surface (stub in M1)             |

Integration tests that **hit the API** (ingest, query, ledger HTTP) may import the server app; the **validation logic** (e.g. Merkle proof verification) still uses local helpers, not the API package.

---

## Testing (monorepo-first)

- **All tests live in `/tests`.** Single root Vitest config (`vitest.config.ts`). No Vitest in subpackages; no smoke tests; no duplication.
- **Commands:** `pnpm test:spec` (unit + invariants), `pnpm test:invariants`, `pnpm test:integration`, `pnpm test:protocol` (Hardhat in protocol), `pnpm test` (runs protocol + spec + integration).
- **CI** runs test:spec, test:invariants, test:integration:ci, test:protocol.

## Quality

- **Protocol core** (`packages/protocol/src`): No `console.*`, no `process.env` mutation, no TODO (use "Milestone 2:" in comments).
- **Tests**: No env mutation; use local constants or read-only `process.env.X ?? default`. Skips are documented (M1/M2 comments) and allowlisted in CI.
- **CI**: Fails if any integration test is skipped and not in the allowlist (no describe.skip hiding broken logic).
