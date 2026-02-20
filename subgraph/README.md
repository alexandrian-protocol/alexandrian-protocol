# Alexandrian Protocol — Subgraph (The Graph)

Indexes **KnowledgeRegistry** (V2) on Base Sepolia: KB registrations and lineage. Public-facing infrastructure for querying on-chain knowledge blocks by contentHash (kbId), curator, artifact type, and lineage (parents).

**Repository:** [alexandrian-protocol/alexandrian-protocol](https://github.com/alexandrian-protocol/alexandrian-protocol) — monorepo root. After deploying to [Subgraph Studio](https://thegraph.com/studio), add this repo link and a short description on your subgraph page.

---

## Example GraphQL queries

Use these against your deployed subgraph endpoint (Studio Playground or your app).

**All knowledge blocks (latest first):**

```graphql
{
  knowledgeBlocks(first: 10, orderBy: blockNumber, orderDirection: desc) {
    id
    curator
    artifactType
    parentCount
    parents
    timestamp
    blockNumber
  }
}
```

**Single block by contentHash (kbId):**

```graphql
{
  knowledgeBlock(id: "0x...") {
    id
    curator
    artifactType
    parentCount
    parents
    timestamp
    blockNumber
  }
}
```

**Blocks by curator address:**

```graphql
{
  knowledgeBlocks(where: { curator: "0x..." }, first: 20) {
    id
    artifactType
    parentCount
    timestamp
  }
}
```

---

## startBlock (required)

**`startBlock` in `subgraph.yaml` must be the actual block where KnowledgeRegistry was deployed — not 0, not a guess.**

- After `pnpm deploy:testnet`, the deploy script writes the deploy block into `subgraph.yaml` automatically.
- **Before running `subgraph:deploy`**, open `subgraph/subgraph.yaml` and confirm `source.startBlock` matches the deploy block. Verify on [Basescan](https://sepolia.basescan.org/) (block number from deploy output or from the deployment tx).
- If startBlock is wrong, the subgraph will index nothing or spend hours syncing through irrelevant history. Once correct, Studio’s sync progress reaches 100% and the GraphQL endpoint is live; then subgraph integration tests can run against real data.

---

## Prerequisites

- **Contract on Base Sepolia** — Deploy `KnowledgeRegistry` (or use existing). See [docs/TESTNET-ADDRESSES.md](../docs/TESTNET-ADDRESSES.md).
- **ABI** — Compile protocol so the ABI exists:  
  `pnpm test:protocol` or `hardhat compile --config packages/protocol/hardhat.config.cjs` (from repo root).
- **The Graph CLI** — `npm install -g @graphprotocol/graph-cli`

---

## Setup (once per deployment)

1. **Subgraph.yaml**  
   After `pnpm deploy:testnet`, `subgraph.yaml` is **automatically** updated with the deployed **KnowledgeRegistry** address and `startBlock`. **Confirm** `startBlock` is the actual deploy block (see [startBlock](#startblock-required) above) before deploying the subgraph.

2. **Codegen, build, and deploy** (from repo root):

   ```bash
   pnpm subgraph:deploy
   ```

   This runs codegen + build. If you set `GRAPH_STUDIO_DEPLOY_KEY` and `SUBGRAPH_SLUG` in `packages/protocol/.env` (or root `.env`), it also deploys to The Graph Studio (no manual auth or typing).

   Optional env (for deploy):

   - `GRAPH_STUDIO_DEPLOY_KEY` — Deploy key from [Subgraph Studio](https://thegraph.com/studio) → your subgraph → Settings.
   - `SUBGRAPH_SLUG` — Subgraph slug (e.g. `alexandria`) or Studio subgraph ID.

   If either is missing, only codegen + build run; deploy is skipped.

---

## Schema

- **KnowledgeBlock** — id (kbId), curator, artifactType, parentCount, parents (lineage), timestamp, blockNumber.

Events indexed: `KBRegistered(kbId, curator, artifactType, parentCount, parents)` from `KnowledgeRegistry.sol`.

---

## Commands (from repo root)

| Command              | Description                          |
|----------------------|--------------------------------------|
| `pnpm subgraph:codegen` | Generate types from schema + ABI  |
| `pnpm subgraph:build`   | Build subgraph (compile mapping)   |
| `pnpm subgraph:deploy`  | Codegen + build; if env set, deploy to Studio (no manual auth) |

---

## Note

Settlement/deprecation events live in other contracts (e.g. AlexandrianRegistry). This subgraph indexes only **KnowledgeRegistry** for KB registration and lineage. To index settlements, add a second data source in `subgraph.yaml` and handlers in `src/mapping.ts`.
