# Changelog

All notable changes to the Alexandrian Protocol are documented here.

## [M1] — 2026-02-19

**Milestone 1: Canonical identity, registry, subgraph.**

- **Canonical serialization & deterministic identity** — JCS-serialized envelopes; same logical content → same contentHash and CIDv1. Test vectors and unit tests prove determinism across runs.
- **VirtualRegistry** — Cycle-free derivation DAG, sorted sources; protocol and economic invariants enforced (no cycles, path ≤ 100%).
- **On-chain registry** — Solidity: AlexandrianRegistry (ETH stake/query), KnowledgeRegistry (V2 KB registration, `KBRegistered` event). Deploy to Base Sepolia or Ethereum Sepolia; Hardhat tests pass.
- **Subgraph** — The Graph: schema and mappings for KnowledgeRegistry on Base Sepolia; indexes KB registrations and lineage. Codegen and build pass; deploy via `pnpm subgraph:deploy` with env-set key and slug.
- **Proof of execution** — `pnpm test` (protocol + spec + integration) and `pnpm demo` / `pnpm demo:walkthrough` demonstrate end-to-end: create KB → determinism → register → subgraph-ready event. CI (GitHub Actions) runs build and full test suite on push/PR.

Maintained protocol with a history; see [specs/M1-DEMO.md](specs/M1-DEMO.md) and [specs/grants/](specs/grants/) for reviewers.
