# Alexandria

[![CI](https://github.com/alexandrian-protocol/alexandrian-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandrian-protocol/alexandrian-protocol/actions/workflows/ci.yml)

**Alexandria** is the monorepo for the **Alexandrian Protocol**: canonical knowledge blocks, content-addressed serialization (JCS/CIDv1), VirtualRegistry, Solidity contracts (Registry, Royalty, License), and pipeline/SDK/API packages.

**Why agents need this.** Agents coordinate through shared state, not through messaging each other. The registry is that shared state: content-addressed KBs and a royalty DAG encode who contributed what. Stake is the coordination signal—curators lock capital on claims they stand behind. The DAG encodes collaboration without point-to-point messages: derivation and attribution are first-class, so agents can build on each other’s outputs and get paid along the graph. That’s the thesis.

---

## Protocol guarantees

| Guarantee | Status |
|-----------|--------|
| Deterministic identity | ✔ Same logical input → same contentHash/CID |
| Canonical derivation DAG | ✔ VirtualRegistry: cycle-free, sorted sources |
| On-chain attribution | ✔ Registry: publish, settle, royalty routing |
| Enforced royalty routing | ✔ Economic invariants; no cycles, path ≤ 100% |
| Staked curator accountability | ✔ Stake, slashing, reputation (contracts + tests) |

---

## For Milestone 1 grant reviewers

**Single entry point:** [specs/grants/](specs/grants/) — demos, commands, and links to all docs in one place.

Milestone 1 includes a runnable M1 demo test that proves deterministic KB identity, registry-ready formatting, subgraph indexability, and invariant enforcement.

**Non-negotiable (M1):** protocol, SDK, tests, test-vectors, subgraph, seeds, CI. **Supporting:** specs, scripts, glossary, docker. **Not M1:** api, pipeline, runtime, discovery, agents (internal or M2+). See [specs/grants/README.md](specs/grants/README.md) for the full table.

---

## Milestone 1 complete when

- Protocol is deterministic (canonical identity, source ordering, no duplicates).
- Registry works (deploy, publish, settle).
- Settlement routing works (economic invariants, royalty DAG).
- Tests are reproducible (spec, invariants, integration, protocol).
- Repo builds cleanly on a fresh clone.
- No runtime crashes; no scary logs (see [Troubleshooting](specs/TROUBLESHOOTING.md) for known Windows/Node notes).

---

## Proof of execution

Run these from the **repository root**. Use one command per line (OS-neutral; on PowerShell use `;` instead of `&&` if you chain).

| What | Command | Expected result |
|------|---------|-----------------|
| **Canonical test suite** | `pnpm test:spec` | Unit + invariants + M1 demo passed. Deterministic hashing and citation DAG validated. |
| **Integration tests** | `pnpm test:integration` | Suite passed. Economic invariants and publish/settlement loop validated. |
| **Local demo** | `pnpm demo` | Knowledge block created, IPFS CID generated, content hash verified, identity proven deterministic. |
| **Contract tests** | `pnpm test:protocol` | Hardhat tests passed. (Windows: use WSL for clean exit; CI runs on Linux.) |
| **SDK examples** | From `packages/sdk`: `pnpm build` then `npx ts-node examples/research-agent.ts` or `examples/contribute.ts` | Onboarding scripts run; see [packages/sdk/examples/](packages/sdk/examples/). |

No raw logs required—just green results and the signals above. You may see one harmless Vitest/Vite deprecation line; ignore it.

**Clean one-command run (for reviewers):** `pnpm verify` — install, build, contract tests, spec tests, integration tests, and demo with section headers and minimal output (dot reporters). Full commands: [specs/grants/COMMANDS.md](specs/grants/COMMANDS.md).

---

## Status

| Component | Status |
|-----------|--------|
| Registry (contracts) | ✅ Implemented |
| Canonical test vectors | ✅ Passing |
| Integration tests | ✅ Passing (M2 API tests allowlisted by design) |
| SDK & CLI | ✅ Operational |
| Contract tests (Hardhat) | ✅ Passing (CI/Linux; on Windows use WSL for clean exit) |
| Subgraph | ✅ M1 deliverable (directory + README; schema/mappings in progress) |
| IPFS storage | ✅ Confirmed (pipeline/demo) |

Addresses: no placeholders in repo. Local → `pnpm deploy:local`; testnet → [specs/TESTNET-ADDRESSES.md](specs/TESTNET-ADDRESSES.md). Roadmap: [specs/m2/ROADMAP.md](specs/m2/ROADMAP.md).

---

## One-command demo

From repo root (OS-neutral: run each line, or chain with `;` on PowerShell):

```
pnpm install
pnpm build
pnpm demo
```

**What it does:** Raw content → fingerprint (CID) → knowledge blocks → validate → verify. No chain or API required.

Protocol-only (VirtualRegistry): after build, run `node scripts/demo.mjs`.

**Full local stack (Docker):** `docker compose -f docker/docker-compose.yml up --build` — from repo root; Docker Desktop must be running on Windows. See [docker/README.md](docker/README.md).

---

## Dependencies

- **Node.js 20 LTS** (20.19.0 recommended; `.nvmrc` / `.node-version`). Node 24 has a known multiformats resolution issue in this monorepo.
- **pnpm** (see `packageManager` in `package.json`).

---

## Quick start

```
pnpm install
pnpm build
pnpm demo
pnpm test:spec
pnpm test:integration
pnpm test:protocol
```

Full commands and CLI: [specs/grants/COMMANDS.md](specs/grants/COMMANDS.md).

---

## Structure (M1-focused)

| Area | Purpose |
|------|---------|
| **packages/protocol** | Core: types, schemas, canonical serialization, VirtualRegistry, Solidity contracts. |
| **packages/sdk** | Client SDK and CLI. **Onboarding:** [packages/sdk/examples/](packages/sdk/examples/) — `research-agent.ts`, `contribute.ts` (run after build). |
| **tests/** | Unit, invariants, integration, M1 demo (single root Vitest config). |
| **test-vectors/canonical** | Canonical spec reference (envelope → contentHash/CID). |
| **subgraph/** | The Graph M1 deliverable. |
| **seeds/** | Seed KBs for demos. |
| **scripts/** | Deploy, seed, demo. [scripts/README.md](scripts/README.md). |

---

## Docs

| Doc | Purpose |
|-----|---------|
| [PROTOCOL-SPEC](specs/PROTOCOL-SPEC.md) | Canonical serialization, hashing, KB types. |
| [INVARIANTS](specs/INVARIANTS.md) | Protocol and economic invariants. |
| [ARCHITECTURE](specs/ARCHITECTURE.md) | Protocol core vs runtime API; testing. |
| [M1 Demo](specs/M1-DEMO.md) | What M1 proves: create KB → determinism → register → subgraph → invariants. |
| [Troubleshooting](specs/TROUBLESHOOTING.md) | Node 24/multiformats, Windows Hardhat, Docker. |
| [ROADMAP](specs/m2/ROADMAP.md) | Post-M1 and M2. |
| [glossary.md](glossary.md) | KB, contentHash, CID, VirtualRegistry, etc. |

Gas, testnet addresses, threat model, packaging: see [specs/](specs/).

---

## Environment (pipeline / embedder)

| Env | Behavior |
|-----|----------|
| (default / stub) | No semantic API; stub mode (M1). Message: *Running in stub mode (M1). Semantic providers optional.* |
| `EMBEDDER=local` | Ollama (e.g. `OLLAMA_URL=http://localhost:11434`). |
| `EMBEDDER=openai` | Requires `OPENAI_API_KEY`. Fails fast at pipeline start if unset. |
| `EMBEDDER=cohere` | Requires `COHERE_API_KEY`. Fails fast at pipeline start if unset. |

---

## License

See [LICENSE](LICENSE).
