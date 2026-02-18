# Testnet addresses

Where to find deployed contract addresses for Milestone 1 review and integration.

---

## After deploy

- **Local:** Addresses are printed by `pnpm deploy:local` and written to `packages/protocol/deployments/` (Token.json, Registry.json, KYAStaking.json, EpochCommit.json). Copy into `packages/api/.env` (or your client) as `REGISTRY_ADDRESS`, `TOKEN_ADDRESS`, etc.
- **Testnet (e.g. Base Sepolia):** Run `pnpm deploy:testnet`; addresses are printed and can be written to this file or to a CI artifact for reviewers.

## Format (example)

| Contract   | Network     | Address |
|-----------|-------------|---------|
| Registry  | localhost   | (see deployments/) |
| Token     | localhost   | (see deployments/) |
| Registry  | base-sepolia| TBD after deploy |
| Token     | base-sepolia| TBD after deploy |

Update this table after each testnet deploy so reviewers have a single place to look.
