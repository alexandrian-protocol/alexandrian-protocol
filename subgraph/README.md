# Alexandrian Protocol — Subgraph (The Graph grant deliverable)

Subgraph for indexing Alexandrian Registry and royalty/settlement events. **Milestone 1 deliverable** for The Graph grant.

---

## Status

- Schema and mappings: to be added or linked from this repo.
- Network: localhost (Hardhat) and testnet (e.g. Base Sepolia) as per [docs/TESTNET-ADDRESSES.md](../docs/TESTNET-ADDRESSES.md).

## Commands (when implemented)

From repo root:

```bash
pnpm subgraph:codegen   # Generate types from schema
pnpm subgraph:build     # Build subgraph
```

## Data indexed

- KB registrations (contentHash, curator, type, domain, stake, query fee, attribution).
- Query settlements (querier, KB, fee, protocol fee).
- Stake and endorsement events.

This directory is the **Milestone 1 deliverable** for The Graph grant; schema and mapping code live here or in a linked package.
