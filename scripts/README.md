# Scripts (M1 supporting)

Where deploy, seed, and demo live for grant reviewers.

---

## Deploy

Contract deployment is in **packages/protocol**. From repo root:

| Command | What it does |
|--------|----------------|
| `pnpm deploy:local` | Deploy Registry, Token, KYAStaking, EpochCommit to local Hardhat. Outputs to `packages/protocol/deployments/`. |
| `pnpm deploy:testnet` | Deploy to testnet (e.g. Base Sepolia). Set RPC and deployer key; record addresses in [specs/TESTNET-ADDRESSES.md](../specs/TESTNET-ADDRESSES.md). |
| `pnpm deploy:docker` | Deploy from inside Docker stack: `docker compose -f docker/docker-compose.yml run --rm -e CHAIN_RPC_URL=http://blockchain:8545 blockchain npx hardhat run scripts/deploy.cjs --network docker`. |

The actual deploy script is `packages/protocol/scripts/deploy.cjs` (or `.ts` if present).

---

## Seed

Seed data for demos and reviewers:

| Script | What it does |
|--------|----------------|
| **`pnpm register:seeds`** | **Register all 20 seeds on testnet** (KnowledgeRegistry on Base Sepolia). Requires `KNOWLEDGE_REGISTRY_ADDRESS` and `PRIVATE_KEY` in `packages/protocol/.env`. Run after `pnpm build` and `pnpm deploy:testnet`. Skips already-registered KBs. |
| `scripts/seed-compute-hashes.mjs` | Compute contentHash/CID for seed KBs; updates `seeds/hashes.json`. |
| `scripts/seed-test-data.ts` | Generate or validate seed test data. Run with `pnpm exec ts-node scripts/seed-test-data.ts` (or via package script if defined). |

The **seeds/** directory holds ~20 seed KBs (e.g. software.security, software.patterns, meta.alexandria). See [seeds/README.md](../seeds/README.md).

---

## Demo

| Command / Script | What it does |
|------------------|----------------|
| **`pnpm verify`** | **Clean M1 verification:** install → build → all tests → demo. Dot reporters; minimal noise. |
| **`pnpm demo:walkthrough`** | **Demo artifact for reviewers:** build → protocol demo → ingestion demo → M1 demo tests. **Human-readable output** (verbose); no dots. Use for grant submission or non-technical review. |
| `pnpm demo` | One-command demo: runs ingestion test via vitest (verbose). No chain or API required. |
| `node scripts/demo.mjs` | Protocol-only: register KB → derive KB in VirtualRegistry (no pipeline). Run after `pnpm build`. |
| `pnpm demo:slash` / `pnpm demo:dispute` | Slash and dispute demos via `scripts/demo.mjs`. |

**Quiet variants (dot output):** `pnpm test:spec:quiet`, `pnpm test:integration:quiet`, `pnpm demo:quiet`. Used by `pnpm verify`.

Reviewers: **`pnpm demo:walkthrough`** for a human-readable demo artifact; **`pnpm verify`** for a full quiet verification run; **`pnpm demo`** for ingestion only.
