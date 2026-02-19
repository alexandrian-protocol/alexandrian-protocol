# Alexandrian Protocol — ERC Stack (M2)

Minimal but strong ERC stack for **ecosystem-native architecture** on Ethereum Mainnet, Sepolia, and Base. **M2 skeletons live in `packages/protocol/contracts/m2/`.**

---

## Positioning

**Alexandrian Protocol is identity-agnostic and interoperable with ERC-4337 smart accounts, ERC-1271 contract wallets, and ERC-8004 agent registries. All economic settlement follows ERC-20 and EIP-712 standards, ensuring composability across Ethereum mainnet, Sepolia, and Base.**

We do **not** reinvent identity. We are composable with existing standards, L2-aware, security-conscious, and future-compatible.

---

## Identity & Account Layer

| Standard | Role | M2 location |
|----------|------|-------------|
| **ERC-4337** | Support | Any address as agent/curator; no new DID. |
| **ERC-1271** | Critical | `contracts/m2/IERC1271.sol`, `SignatureHelper.sol` |
| **ERC-165** | Clean | `contracts/m2/IERC165.sol` |

---

## Token & Payments

| Standard | Role | M2 location |
|----------|------|-------------|
| **ERC-20** | Core | Main Token.sol (XANDER). |
| **ERC-2612** (Permit) | Optional M2 | Add ERC20Permit to Token for gasless approvals. |
| **EIP-712** | Security | `contracts/m2/AlexandrianEIP712.sol` |

---

## Optional Compatibility

| Standard | Role | M2 location |
|----------|------|-------------|
| **ERC-8004** | Alignment | `contracts/m2/IERC8004.sol` |
| **ERC-2981** | Symbolic | `contracts/m2/IERC2981.sol` |

---

## What We Do *Not* Need

- A new DID ERC, agent registry, identity token standard, soulbound complexity, overlapping reputation tokens.

**Our edge is economic wiring, not identity innovation.**

---

## Grant Framing

*Alexandrian Protocol is an L1/L2-native epistemic settlement layer for autonomous agents. It combines deterministic KB identity (M1), slashable staking and economic quality signals (M2), ERC-4337 compatibility, and EIP-712 security — without reinventing identity.*
