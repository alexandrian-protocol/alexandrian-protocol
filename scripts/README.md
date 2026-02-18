# Scripts (M1 supporting)

Where deploy, seed, and demo live for grant reviewers.

---

## Deploy

Contract deployment is in **packages/protocol**. From repo root:

| Command | What it does |
|--------|----------------|
| `pnpm deploy:local` | Deploy Registry, Token, KYAStaking, EpochCommit to local Hardhat. Outputs to `packages/protocol/deployments/`. |
| `pnpm deploy:testnet` | Deploy to testnet (e.g. Base Sepolia). Set RPC and deployer key; record addresses in [docs/TESTNET-ADDRESSES.md](../docs/TESTNET-ADDRESSES.md). |
| `pnpm deploy:docker` | Deploy from inside Docker stack: `docker compose -f docker/docker-compose.yml run --rm -e CHAIN_RPC_URL=http://blockchain:8545 blockchain npx hardhat run scripts/deploy.cjs --network docker`. |

The actual deploy script is `packages/protocol/scripts/deploy.cjs` (or `.ts` if present).

---

## Seed

Seed data for demos and reviewers:

| Script | What it does |
|--------|----------------|
| `scripts/seed-compute-hashes.mjs` | Compute contentHash/CID for seed KBs; updates `seeds/hashes.json`. |
| `scripts/seed-test-data.ts` | Generate or validate seed test data. Run with `pnpm exec ts-node scripts/seed-test-data.ts` (or via package script if defined). |

The **seeds/** directory holds ~20 seed KBs (e.g. software.security, software.patterns, meta.alexandria). See [seeds/README.md](../seeds/README.md).

---

## Demo

| Command / Script | What it does |
|------------------|----------------|
| `pnpm demo` | One-command demo: runs ingestion test (`tests/integration/ingestion.test.ts`) via vitest. No chain or API required. |
| `node scripts/demo.mjs` | Protocol-only: register KB → derive KB in VirtualRegistry (no pipeline). Run after `pnpm build`. |
| `pnpm demo:full` | `node scripts/run-full-demo.mjs` — full flow when stack is up. |
| `pnpm demo:slash` / `pnpm demo:dispute` | Slash and dispute demos via `scripts/demo.ts`. |

Reviewers should use **`pnpm demo`** for the single-command experience.
