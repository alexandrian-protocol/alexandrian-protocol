# Testnet addresses (Base Sepolia / Ethereum Sepolia)

Deployed contract addresses for the Alexandrian Protocol. **Fill after running deploy** (see below). Supported: **Base Sepolia** (default) and **Ethereum Sepolia**.

---

## Required environment

Set in **`packages/protocol/.env`**:

- `PRIVATE_KEY` — Deployer private key (with testnet ETH for gas). Used for both networks.
- **Base Sepolia:** `BASE_SEPOLIA_RPC_URL` (optional; default `https://sepolia.base.org`). Optional: `BASE_SEPOLIA_GAS_PRICE` (wei).
- **Ethereum Sepolia:** `SEPOLIA_RPC_URL` (optional; default `https://rpc.sepolia.org`). Optional: `SEPOLIA_GAS_PRICE` (wei).
- **Testnet smoke / subgraph tests:** After deploy, set `KNOWLEDGE_REGISTRY_ADDRESS` to the printed KnowledgeRegistry address. For subgraph tests only, set `SUBGRAPH_QUERY_URL` to your Studio query URL (e.g. `https://api.studio.thegraph.com/query/<id>/<slug>/version/latest`).

**Get testnet ETH (no mainnet ETH required):**

| Network | Faucets |
|---------|--------|
| **Base Sepolia** | [Alchemy](https://www.alchemy.com/faucets/base-sepolia), [QuickNode](https://faucet.quicknode.com/base/sepolia), [thirdweb](https://thirdweb.com/base-sepolia/faucet), [LearnWeb3](https://learnweb3.io/faucets/base_sepolia/), [Base docs](https://docs.base.org/chain/network-faucets) |
| **Ethereum Sepolia** | [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia), [QuickNode](https://faucet.quicknode.com/ethereum/sepolia), [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [Sepolia PoW](https://sepolia-faucet.pk910.de/) |

Paste your **deployer address** (e.g. `Deployer: 0x...` from the deploy output) into the faucet. Use `*_GAS_PRICE=1000000000` in `.env` to lower cost per tx.

---

## How to fulfill addresses

1. Create `packages/protocol/.env` with `PRIVATE_KEY=0x...` and (optional) RPC URL for your chosen network.
2. From repo root:
   - **Base Sepolia:** `pnpm deploy:testnet`
   - **Ethereum Sepolia:** `pnpm deploy:testnet:sepolia`
3. Copy the printed **Registry** and **KnowledgeRegistry** addresses into the table below. **Subgraph:** `subgraph.yaml` is updated automatically with KnowledgeRegistry address and startBlock.
4. To build and deploy the subgraph: `pnpm subgraph:deploy`. To deploy to The Graph Studio without manual auth, set in `packages/protocol/.env`: `GRAPH_STUDIO_DEPLOY_KEY` (from Studio → Settings) and `SUBGRAPH_SLUG` (e.g. `alexandria`).

---

## Addresses

| Contract | Address | Notes |
|----------|---------|--------|
| Registry | *TBD* | AlexandrianRegistry (ETH stake/query) |
| KnowledgeRegistry | *TBD* | V2 KB registration; set in subgraph.yaml |
| XanderToken | *TBD* | XANDER ERC-20 (optional) |
| XanderQuerySettlement | *TBD* | Optional; for XANDER query settlement |

*Replace *TBD* with the addresses printed by `pnpm deploy:testnet`.*

---

## Explorers

- Base Sepolia: https://sepolia.basescan.org/
- Ethereum Sepolia: https://sepolia.etherscan.io/

---

## Demo walkthrough

The M1 demo (`pnpm demo:walkthrough`) runs locally and does not require testnet addresses. For on-chain flows (publish, query, settle), set the env vars above and the registry/token addresses in your client or SDK config.
