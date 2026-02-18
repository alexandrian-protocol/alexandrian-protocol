# Alexandrian Protocol

[![CI](https://github.com/alexandrian-protocol/alexandrian-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandrian-protocol/alexandrian-protocol/actions/workflows/ci.yml)

Monorepo for the Alexandrian Protocol: canonical knowledge blocks, content-addressed serialization (JCS/CIDv1), VirtualRegistry, Solidity contracts (Registry, Royalty, License), and pipeline/SDK/API packages.

**Why agents need this.** Agents coordinate through shared state, not through messaging each other. The registry is that shared state: content-addressed KBs and a royalty DAG encode who contributed what. Stake is the coordination signal—curators lock capital on claims they stand behind. The DAG encodes collaboration without point-to-point messages: derivation and attribution are first-class, so agents can build on each other’s outputs and get paid along the graph. That’s the thesis.

---

## For Milestone 1 grant reviewers

**Single entry point:** [grant-committee/](grant-committee/) — demos, commands, and links to all docs in one place.

**Non-negotiable (what we deliver for M1):**

Milestone 1 includes a runnable M1 demo test that proves deterministic KB identity, registry-ready formatting, subgraph indexability, and invariant enforcement.

| Item | Purpose |
|------|--------|
| **packages/protocol** | Contracts + canonical hashing — the core spec and reference implementation. |
| **packages/sdk** | CLI and SDK — proof the protocol is usable. |
| **tests/** | All six failure-mode tests plus unit, invariants, integration, performance. |
| **test-vectors/** | Canonical spec reference data (envelope → contentHash/CID). |
| **subgraph/** | The Graph grant deliverable — indexing Registry and royalty events. |
| **seeds/** | 20 seed KBs — demonstrates real usage. |
| **.github/workflows/ci.yml** | Green badge — build + spec tests + integration (no silent skips). |

**Important supporting:**

| Item | Purpose |
|------|--------|
| **docs/** | PROTOCOL-SPEC, INVARIANTS, ECONOMICS, GAS, TESTNET-ADDRESSES, threat/quality docs. |
| **scripts/** | deploy, seed, demo — see [scripts/README.md](scripts/README.md). |
| **glossary.md** | Terminology reviewers need (KB, contentHash, CID, VirtualRegistry, etc.). |
| **README.md** | This file — first thing reviewers read. |
| **docker/** | One-command local setup: `docker compose -f docker/docker-compose.yml up --build`. |

**Not part of M1 (internal or M2+):**

- **packages/api**, **packages/pipeline**, **packages/runtime** — internal.
- **packages/discovery**, **packages/agents** — M2+.
- **samples/** — internal.

---

## One-command demo

Reviewers run one command to see the stack work:

```bash
pnpm install && pnpm build && pnpm demo
```

On **PowerShell** use `;` instead of `&&`: `pnpm install; pnpm build; pnpm demo`

**What it does:** Runs the ingestion flow (pipeline + protocol): raw content → fingerprint (CID) → compile into knowledge blocks → validate against dataset schema → verify integrity. No chain or API required.

For protocol-only (register KB → derive KB in VirtualRegistry): after build, run `node scripts/demo.mjs` from repo root.

**One-command local stack (contracts + API + IPFS + Redis):**

```bash
docker compose -f docker/docker-compose.yml up --build
```

See [docker/README.md](docker/README.md). For a scene-by-scene recording guide (publish → derive → settle → lineage), see [docs/demo-video-script.md](docs/demo-video-script.md).

---

## CI & quality signals

CI runs on every push/PR and enforces:

- **pnpm install** — Frozen lockfile.
- **pnpm build** — Protocol, pipeline, SDK, API compile.
- **pnpm test:spec** — Unit + canonical vectors + economic invariants (no API/Redis).
- **pnpm test:invariants** — Invariants only (`tests/invariants/`).
- **pnpm test:integration** — Full suite (unit, invariants, integration, performance).
- **pnpm test:protocol** — Contract tests (Hardhat in `packages/protocol`).
- **pnpm test** — Runs test:protocol, test:spec, test:integration.

**All tests live in `/tests`.** Single root Vitest config. No Vitest in subpackages; no smoke tests. CI runs test:spec, test:invariants, test:integration:ci, test:protocol.

Green badge = real engineering discipline.

---

## Milestone checklist (formal delivery)

**Milestone 1 — Spec & conformance**

- [x] Canonical test vectors in `test-vectors/canonical/` (envelope + expected hash/CID).
- [x] `pnpm test:spec` passing: unit + canonical vectors + economic invariants.
- [x] Serialization spec in `docs/` (PROTOCOL-SPEC, serialization-test-vectors).
- [x] VirtualRegistry: cycle rejection, duplicate-source rejection, lineage validation.
- [x] Zod schemas for all 10 KB types (minimal); roadmap for tightening (Milestone 2).
- [x] Subgraph directory as The Graph grant deliverable (`subgraph/`).

**Milestone 2 — API & full stack** (when unblocked)

- [ ] Integration tests unskipped (API/Redis or stubs available in CI).
- [ ] Register KB on-chain, derive KB, query, settle citation (full flow).
- [ ] Subgraph schema and mappings implemented.

**Roadmap (post-M1)** — Settlement engine v2, multi-chain deployment, and full subgraph indexing are planned; not in scope for the M1 deliverable.

---

## Dependencies

- **Node.js 20 LTS** (recommended: 20.19.0; see `.nvmrc` / `.node-version`). Node 24 has a known multiformats resolution issue in this monorepo (`ERR_PACKAGE_PATH_NOT_EXPORTED` when running the CLI or some imports).
- **pnpm** (see `packageManager` in `package.json`).

## Fresh clone

`pnpm install && pnpm build` works on a fresh clone with no `.env` or extra setup. Build does not mutate env or require secrets.

## Exact commands (Build, Run, Deploy, E2E)

| Goal | Command |
|------|--------|
| **Build** | `pnpm install && pnpm build` |
| **Run (one-command demo)** | `pnpm demo` |
| **Deploy (local)** | `pnpm deploy:local` |
| **Deploy (Docker stack)** | `docker compose -f docker/docker-compose.yml up --build` |
| **Run full E2E** | `pnpm demo:full` (requires API + chain; start stack first) |

---

## Quick start

```bash
pnpm install
pnpm build
pnpm demo              # One-command demo (ingestion flow)
pnpm test              # Protocol + spec + integration (all tests live in /tests)
pnpm test:spec         # Unit + invariants (no API/Redis)
pnpm test:invariants   # Invariants only
pnpm test:integration  # Full suite (CI fails if tests skipped unexpectedly)
pnpm test:protocol    # Contract tests (Hardhat)
```

## Structure (M1-focused)

- **packages/protocol** — Core: types, schemas, canonical serialization, VirtualRegistry, Solidity contracts. [README](packages/protocol/README.md).
- **packages/sdk** — Client SDK and CLI.
- **test-vectors/canonical** — [Milestone 1 canonical test vectors](test-vectors/canonical/README.md).
- **tests/** — All tests live here. Unit, invariants, integration, performance (single root config; no tests in subpackages).
- **subgraph/** — The Graph grant M1 deliverable. [README](subgraph/README.md).
- **seeds/** — 20 seed KBs for demos and reviewers.
- **scripts/** — [Deploy, seed, demo](scripts/README.md).

## Docs

- [PROTOCOL-SPEC](docs/PROTOCOL-SPEC.md) — Protocol specification (v2.0.0).
- [ARCHITECTURE](docs/ARCHITECTURE.md) — Protocol core vs runtime API; core tests must not depend on api.
- [INVARIANTS](docs/INVARIANTS.md) — Protocol and economic invariants; pointers to code and tests.
- [ECONOMIC-ASSUMPTIONS](docs/ECONOMIC-ASSUMPTIONS.md) — Royalty DAG, shares, distribution.
- [GAS](docs/GAS.md) — Contract gas notes. [TESTNET-ADDRESSES](docs/TESTNET-ADDRESSES.md) — Deployed addresses.
- [Serialization test vectors](docs/serialization-test-vectors.md) — Canonical envelope format.
- [PACKAGING](docs/PACKAGING.md) — TypeScript packaging and exports.
- [Threat model](docs/THREAT-MODEL.md) | [Protocol quality assessment](docs/PROTOCOL-QUALITY-ASSESSMENT.md).
- [glossary.md](glossary.md) — Terminology for reviewers.
- [M1 Demo](docs/M1-DEMO.md) — What M1 proves: create KB → determinism → register → subgraph → invariant protection.
- [Demo video script](docs/demo-video-script.md) — Scene-by-scene E2E recording guide (publish, query, settle, deprecate, lineage).
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Windows Hardhat crash (UV_HANDLE_CLOSING), Node upgrade, WSL.
- [@alexandrian/protocol API](packages/protocol/docs/API.md) — Package API reference.

## Environment (pipeline / embedder)

| Env | Behavior |
|-----|----------|
| `EMBEDDER=stub` | No API; stub vectors (default when no keys set). |
| `EMBEDDER=local` | Ollama (e.g. `OLLAMA_URL=http://localhost:11434`). |
| `EMBEDDER=openai` | **Requires `OPENAI_API_KEY`.** Fails fast at pipeline start if unset. |
| `EMBEDDER=cohere` | **Requires `COHERE_API_KEY`.** Fails fast at pipeline start if unset. |

## License

See [LICENSE](LICENSE).
