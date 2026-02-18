# Milestone 1 — Grant committee review pack

This folder is the single entry point for grant reviewers. Everything you need to evaluate the M1 deliverable is linked or summarized here.

---

## Start here

1. **Clone** the repository (if you haven’t already).
2. From the **repo root** (parent of this folder), run:

   ```bash
   pnpm install && pnpm build && pnpm demo
   ```
   (PowerShell: use `;` instead of `&&`: `pnpm install; pnpm build; pnpm demo`)

   This installs dependencies, builds all packages, and runs the one-command demo (ingestion flow, no chain required).

3. **Run the M1 demo test** (deterministic identity, registry, subgraph format, invariants):

   ```bash
   pnpm test:spec
   ```

   This runs unit tests, invariants, and the dedicated M1 demo suite (`tests/m1-demo.test.ts`).

---

## Command reference

All commands are run from the **repository root**.

| Goal | Command |
|------|--------|
| **One-command demo** | `pnpm install && pnpm build && pnpm demo` |
| **Protocol-only demo** (no pipeline) | `pnpm build` then `node scripts/demo.mjs` |
| **M1 demo tests** | `pnpm test:spec` |
| **All spec + invariants** | `pnpm test:spec` (includes unit, invariants, M1 demo) |
| **Invariants only** | `pnpm test:invariants` |
| **Integration tests** | `pnpm test:integration` |
| **Contract tests** (Hardhat) | `pnpm test:protocol` |
| **Full test suite** | `pnpm test` (protocol + spec + integration) |
| **Local stack (Docker)** | `docker compose -f docker/docker-compose.yml up --build` |
| **Deploy contracts (local)** | `pnpm deploy:local` |

**CLI (after build):** run `pnpm alex -- <command> ...` from repo root. The **`--`** is required so arguments are passed to the CLI, not to pnpm (e.g. `pnpm alex publish ...` without `--` gives a confusing pnpm error). Requires `CHAIN_RPC_URL`, `REGISTRY_ADDRESS`, `PRIVATE_KEY` (or `DEPLOYER_PRIVATE_KEY`) for publish/query/settle/inspect/lineage. Use **Node 20 LTS** (see [Troubleshooting](../docs/TROUBLESHOOTING.md)); Node 24 can trigger multiformats resolution errors.

| CLI command (copy-paste with `--`) | Description |
|------------------------------------|-------------|
| `pnpm alex -- publish <envelope.json> --stake <wei> --query-fee <wei>` | Publish a KB (optional `--parent <hash>` repeatable) |
| `pnpm alex -- query "<text>" --domain <domain>` | Query the archive by intent |
| `pnpm alex -- settle <contentHash> --agent <address>` | Settle a citation (default agent = signer) |
| `pnpm alex -- inspect <contentHash>` | Show on-chain KB metadata |
| `pnpm alex -- lineage <contentHash>` | Show parent and derived KBs |
| `pnpm alex -- verify <contentHash> --expected <path>` | Verify hash against expected.json |
| `pnpm alex -- accounts list` | List RPC accounts and ETH balances |

---

## Key documents

Paths are relative to the **repo root**.

| Document | Path | Purpose |
|----------|------|--------|
| **Main README** | [README.md](../README.md) | Repo overview, M1 deliverables, CI, commands |
| **M1 Demo (what we prove)** | [docs/M1-DEMO.md](../docs/M1-DEMO.md) | Five-step demo: create KB, determinism, register, subgraph, invariants |
| **Protocol spec** | [docs/PROTOCOL-SPEC.md](../docs/PROTOCOL-SPEC.md) | Canonical serialization, hashing, KB types |
| **Invariants** | [docs/INVARIANTS.md](../docs/INVARIANTS.md) | Protocol and economic invariants; test pointers |
| **Architecture** | [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Protocol core vs runtime API; testing approach |
| **Glossary** | [glossary.md](../glossary.md) | KB, contentHash, CID, VirtualRegistry, etc. |
| **Scripts (deploy, seed, demo)** | [scripts/README.md](../scripts/README.md) | Deploy, seed, and demo commands |
| **Demo video script** | [docs/demo-video-script.md](../docs/demo-video-script.md) | Scene-by-scene E2E recording guide |
| **Troubleshooting** | [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) | Windows Hardhat crash, Node/Hardhat versions |
| **Reviewer notes** | [grant-committee/REVIEW.md](REVIEW.md) | Node version, CLI `--` syntax, troubleshooting summary |

**Other useful docs (repo root):**

- [docs/ECONOMIC-ASSUMPTIONS.md](../docs/ECONOMIC-ASSUMPTIONS.md) — Royalty DAG, shares
- [docs/GAS.md](../docs/GAS.md) — Contract gas
- [docs/TESTNET-ADDRESSES.md](../docs/TESTNET-ADDRESSES.md) — Deployed addresses
- [docs/serialization-test-vectors.md](../docs/serialization-test-vectors.md) — Canonical envelope format
- [test-vectors/canonical/](../test-vectors/canonical/) — Spec test vectors (envelope → contentHash/CID)
- [subgraph/README.md](../subgraph/README.md) — The Graph M1 deliverable

---

## M1 deliverable checklist

| Item | Location |
|------|----------|
| Core protocol (hashing, VirtualRegistry, contracts) | `packages/protocol` |
| SDK / CLI | `packages/sdk` |
| Tests (unit, invariants, integration, M1 demo) | `tests/` |
| Canonical test vectors | `test-vectors/canonical/` |
| Subgraph (M1 deliverable) | `subgraph/` |
| Seed KBs | `seeds/` |
| CI workflow | `.github/workflows/ci.yml` |

**M1 demo test:** `tests/m1-demo.test.ts` proves deterministic KB identity, registry-ready formatting, subgraph indexability, and invariant enforcement. Run with `pnpm test:spec`.

---

## Optional: Docker and contract tests

- **Full local stack:** `docker compose -f docker/docker-compose.yml up --build` (contracts, API, IPFS, Redis). See [docker/README.md](../docker/README.md).
- **Contract tests:** `pnpm test:protocol` runs Hardhat tests. On **Windows**, Hardhat may exit with a teardown error (UV_HANDLE_CLOSING) *after* tests pass; CI runs on Linux and does not hit this. See [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md).

---

## One-line summary

Milestone 1 includes a runnable M1 demo test that proves deterministic KB identity, registry-ready formatting, subgraph indexability, and invariant enforcement.
