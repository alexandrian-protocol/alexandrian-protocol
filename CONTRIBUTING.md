# Contributing to Alexandria

Alexandria is the monorepo for the **Alexandrian Protocol** — infrastructure for canonical knowledge blocks, content-addressed identity, and on-chain attribution. Base scouts and grant reviewers: this doc points you at what matters.

---

## Quick start (reviewers)

- **One command for the M1 demo:** `pnpm demo:walkthrough` (from repo root after `pnpm install`).
- **Full command reference:** [specs/grants/COMMANDS.md](specs/grants/COMMANDS.md).
- **Grant review pack:** [specs/grants/](specs/grants/) — demos, commands, and links in one place.

---

## Development setup

1. **Node 20 LTS** — Use Node 20 (see `.nvmrc`). Node 24 has known compatibility issues in this repo.
2. **Install and build:** `pnpm install && pnpm build`
3. **Run tests:** `pnpm test:spec` (unit + invariants + M1 demo), `pnpm test:protocol` (contracts), `pnpm test:integration` (integration suite).

---

## Project layout

| Area | Purpose |
|------|--------|
| `packages/protocol` | Core protocol: hashing, VirtualRegistry, Solidity contracts |
| `packages/sdk` | SDK and CLI (`pnpm alex --`) |
| `packages/pipeline` | Content → knowledge blocks |
| `packages/api` | Optional API layer |
| `tests/` | Unit, invariants, integration, and demo-walkthrough tests |
| `tests/demo-walkthrough/` | Tests run by `pnpm demo:walkthrough` |
| `scripts/` | Deploy, demo, and verification scripts |
| `specs/` | Specs, troubleshooting, grants, testnet addresses |
| `test-vectors/`, `seeds/`, `subgraph/` | Canonical data and subgraph |

---

## Making changes

- **Protocol or contracts:** Change in `packages/protocol`; run `pnpm test:protocol` and `pnpm test:spec`.
- **SDK/CLI:** Change in `packages/sdk`; run `pnpm build` and relevant tests.
- **Tests:** Add or update tests under `tests/`; keep demo-walkthrough tests in `tests/demo-walkthrough/` human-readable for grant reviewers.

---

## Code and conventions

- TypeScript in packages; Hardhat for Solidity.
- Determinism is critical: same logical input must yield same contentHash/CID.
- See [specs/INVARIANTS.md](specs/INVARIANTS.md) and [specs/PROTOCOL-SPEC.md](specs/PROTOCOL-SPEC.md) for protocol rules.

---

## Deployments and testnet

- **Local:** `pnpm deploy:local` (requires a running node or Hardhat node).
- **Base Sepolia:** Set `BASE_SEPOLIA_RPC_URL` and `PRIVATE_KEY`, then `pnpm deploy:testnet`. Record addresses in [specs/TESTNET-ADDRESSES.md](specs/TESTNET-ADDRESSES.md).

---

## Questions

- **Troubleshooting:** [specs/TROUBLESHOOTING.md](specs/TROUBLESHOOTING.md)
- **Reviewer notes:** [specs/grants/REVIEW.md](specs/grants/REVIEW.md)
