# Milestone 2 — Checklist

Everything that needs Base Sepolia (or testnet) for M2 delivery.

---

## M2 scope

- [ ] Integration tests unskipped (API/Redis or stubs in CI)
- [ ] Register KB on-chain, derive KB, query, settle citation (full flow)
- [ ] Subgraph schema and mappings implemented
- [ ] Registry deprecation support (KBDeprecated, supersededBy) and tests enabled
- [ ] Testnet deployment recorded in [specs/TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md)

---

## Docs in this folder

| Doc | Purpose |
|-----|---------|
| [ROADMAP.md](ROADMAP.md) | Post-M1 / M2 planned work |
| [demo-video-script.md](demo-video-script.md) | Scene-by-scene E2E recording guide (Sepolia flow) |

---

## Deploy and record

1. Set `BASE_SEPOLIA_RPC_URL` and `PRIVATE_KEY` (testnet ETH for gas).
2. Run `pnpm deploy:testnet` from repo root.
3. Update [specs/TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md) with deployed addresses.
