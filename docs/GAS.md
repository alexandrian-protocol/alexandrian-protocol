# Gas considerations

Notes for contract deployment and interaction (Milestone 1 scope).

---

## Contracts

- **Registry** — `publishKB`, `settleQuery`, `addStake`, `withdrawStake`, `endorse`. Cost scales with attribution links count and calldata.
- **Token (XANDER)** — Standard ERC-20; mint, transfer, approve. Seed and approval txs during deploy.
- **KYAStaking / EpochCommit** — Deploy and any per-epoch or per-stake operations.

## Deployment

- Local (Hardhat): `pnpm deploy:local` or `docker compose -f docker/docker-compose.yml up` for full stack.
- Testnet (e.g. Base Sepolia): `pnpm deploy:testnet`. Ensure RPC and deployer key are set; see [TESTNET-ADDRESSES.md](TESTNET-ADDRESSES.md) for where addresses are recorded.

## Optimization (future)

- Batch registration, merkle-based settlement, and storage layout are out of scope for M1; document here when added.
