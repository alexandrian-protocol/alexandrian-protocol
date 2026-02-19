# Alexandrian Protocol — Subgraph (The Graph)

Indexes **KnowledgeRegistry** (V2) on Base Sepolia: KB registrations and lineage.

---

## Prerequisites

- **Contract on Base Sepolia** — Deploy `KnowledgeRegistry` (or use existing). See [specs/TESTNET-ADDRESSES.md](../specs/TESTNET-ADDRESSES.md).
- **ABI** — Compile protocol so the ABI exists:  
  `pnpm test:protocol` or `hardhat compile --config packages/protocol/hardhat.config.cjs` (from repo root).
- **The Graph CLI** — `npm install -g @graphprotocol/graph-cli`

---

## Setup (once per deployment)

1. **Edit `subgraph.yaml`**  
   Replace `YOUR_REGISTRY_ADDRESS` with the deployed KnowledgeRegistry address and set `startBlock` to the deploy block (optional but recommended).

2. **Codegen and build** (from repo root):

   ```bash
   pnpm subgraph:codegen
   pnpm subgraph:build
   ```

3. **Deploy to The Graph Studio** (optional):

   ```bash
   graph auth --studio YOUR_DEPLOY_KEY
   cd subgraph && graph deploy --studio alexandria
   ```

   Or deploy by Studio subgraph ID:

   ```bash
   cd subgraph && graph deploy --studio c8ccd40643e950c41efe77d75c17cb34
   ```

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

Deploy (from `subgraph/` after auth): `graph deploy --studio alexandria` or `graph deploy --studio c8ccd40643e950c41efe77d75c17cb34`.

---

## Note

Settlement/deprecation events live in other contracts (e.g. AlexandrianRegistry). This subgraph indexes only **KnowledgeRegistry** for KB registration and lineage. To index settlements, add a second data source in `subgraph.yaml` and handlers in `src/mapping.ts`.
