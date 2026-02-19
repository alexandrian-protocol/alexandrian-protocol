# Subgraph M2 — Skeletons

M2 extends the subgraph with **on-chain quality signals** and **deprecation** for grant narrative.

---

## Schema additions (M2)

Add to `KnowledgeBlock` in main `schema.graphql` when wiring M2:

```graphql
  # Epistemic accountability (usage signal + deprecation)
  queryCount: BigInt!
  totalFeesEarned: BigInt!
  deprecated: Boolean!
  supersededBy: Bytes
```

---

## Mapping additions (M2)

Add handlers and event entries when KnowledgeRegistry has settleQuery/deprecateKB:

- **handleKBQueried** — Load KB, increment queryCount, add event.params.fee to totalFeesEarned, save.
- **handleKBDeprecated** — Load KB, set deprecated = true, supersededBy = event.params.successor, save.

In **handleKBRegistered**, initialize: queryCount = 0, totalFeesEarned = 0, deprecated = false, supersededBy = null.

---

## subgraph.yaml additions (M2)

```yaml
        - event: KBQueried(indexed bytes32,indexed address,uint256)
          handler: handleKBQueried
        - event: KBDeprecated(indexed bytes32,indexed bytes32,indexed address)
          handler: handleKBDeprecated
```

---

See `packages/protocol/contracts/m2/` and `specs/m2/GRANT-NARRATIVE.md`.
