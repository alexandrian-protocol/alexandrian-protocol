# Testnet addresses (Base Sepolia)

Base Sepolia deployment pending — see deploy instructions below. Deployed contract addresses for the Alexandrian Protocol on Base Sepolia. Update this file after running `pnpm deploy:testnet`.

---

## Required environment

- `BASE_SEPOLIA_RPC_URL` — RPC endpoint (e.g. from Alchemy, Infura, or public Base Sepolia).
- `PRIVATE_KEY` — Deployer private key (with testnet ETH for gas).

---

## Addresses

| Contract | Address | Notes |
|----------|---------|--------|
| Registry | *TBD* | AlexandrianRegistry |
| XanderToken | *TBD* | XANDER ERC-20 (if deployed) |
| XanderQuerySettlement | *TBD* | Optional; for XANDER query settlement |

*After deployment, replace *TBD* with the actual address and add a Basescan link if desired.*

---

## Basescan

- Base Sepolia: https://sepolia.basescan.org/

---

## Demo walkthrough

The M1 demo (`pnpm demo:walkthrough`) runs locally and does not require testnet addresses. For on-chain flows (publish, query, settle), set the env vars above and the registry/token addresses in your client or SDK config.
