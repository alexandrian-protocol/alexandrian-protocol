# Subgraph & GraphQL (M1)

The Alexandrian subgraph indexes **KBRegistered** events from **KnowledgeRegistry** on Base Sepolia. Grant reviewers can query it to see registered Knowledge Blocks and lineage.

---

## What it indexes

- **Entity:** `KnowledgeBlock` — id (contentHash), curator, artifactType, parentCount, parents, timestamp, blockNumber.
- **Source:** KnowledgeRegistry on Base Sepolia; event `KBRegistered(indexed bytes32, indexed address, uint8, uint256, bytes32[])`.
- **M1 relevance:** Queryable lineage, indexable KBs; proof that the protocol is deployed and the subgraph returns data.

---

## Live endpoint

**GraphQL (queries):**

- **Latest version:** `https://api.studio.thegraph.com/query/1742359/alexandria-protocol/version/latest`
- **Studio:** [The Graph Studio — alexandria-protocol](https://thegraph.com/studio/subgraph/alexandria-protocol)

Open the URL in a browser for GraphiQL, or send POST requests with a `query` body.

---

## Example query

List Knowledge Blocks (most recent first):

```graphql
{
  knowledgeBlocks(first: 20, orderBy: blockNumber, orderDirection: desc) {
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

**What you get:** 20 seed KBs registered on testnet; roots have `parentCount: 0`, derived KBs have `parents` pointing to parent contentHashes (lineage).

**Single KB by id (contentHash):** Replace `<contentHash>` with a kbId (0x-prefixed hex from registry or subgraph list).

```graphql
{
  knowledgeBlock(id: "<contentHash>") {
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

---

## Schema (M1)

| Field         | Type       | Description                    |
|---------------|------------|--------------------------------|
| `id`          | ID!        | contentHash (kbId)             |
| `curator`     | Bytes!     | Registrar address              |
| `artifactType`| Int!       | KB type (0=practice, 2=stateMachine, 4=complianceChecklist, etc.) |
| `parentCount` | Int!       | Number of parent KBs           |
| `parents`     | [Bytes!]!  | Parent contentHashes (lineage) |
| `timestamp`   | BigInt!    | Block timestamp                |
| `blockNumber` | BigInt!    | Registration block             |

---

## Build & deploy (for maintainers)

- **Codegen:** `pnpm subgraph:codegen` (requires protocol ABI: run `pnpm test:protocol` or `pnpm build` first).
- **Build:** `pnpm subgraph:build`
- **Deploy:** Set `GRAPH_STUDIO_DEPLOY_KEY` and `SUBGRAPH_SLUG` in `packages/protocol/.env`, then `pnpm subgraph:deploy`.

Subgraph manifest: `subgraph/subgraph.yaml`. After `pnpm deploy:testnet`, the manifest is updated with KnowledgeRegistry address and startBlock.
