# End-to-end: local testing → testnet → The Graph

Ordered flow for full verification and deployment.

---

## 1. End-to-end testing (local)

Single command runs build and full test suite (protocol + spec + integration):

```bash
pnpm test:e2e
```

This runs:

1. `pnpm build` — compile protocol, pipeline, SDK, API
2. `pnpm test:protocol` — Hardhat: Registry deploy + QuerySettle (ETH)
3. `pnpm test:spec` — Vitest: unit, invariants, m1-demo
4. `pnpm test:integration` — Vitest: all tests (including demo-walkthrough, integration; some integration tests may be skipped without API)

**Human-readable demo (for reviewers):**

```bash
pnpm demo:walkthrough
```

Runs the same pipeline with verbose output: build → protocol demo → ingestion → m1-demo → agent query + payment.

---

## 2. Testnet deployment

**Prerequisites:** `BASE_SEPOLIA_RPC_URL`, `PRIVATE_KEY` (testnet ETH for gas). Set in `packages/protocol/.env` or export.

**Deploy (from repo root):**

```bash
pnpm deploy:testnet
```

Deploys:

- **AlexandrianRegistry** — ETH stake/query (used by API and current protocol tests)
- **KnowledgeRegistry** — V2 KB registration and lineage (used by subgraph)

**After deploy:**

1. Copy printed addresses into [TESTNET-ADDRESSES.md](TESTNET-ADDRESSES.md).
2. The deploy script writes **KnowledgeRegistry** address and **startBlock** into `subgraph/subgraph.yaml`. **Confirm** `startBlock` is the actual deploy block (not 0) before subgraph deploy — wrong startBlock means the subgraph indexes nothing or syncs for hours.
3. Run `pnpm subgraph:codegen`, `pnpm subgraph:build`, then deploy (see step 3).

---

## 3. The Graph (subgraph)

**Prerequisites:** Protocol compiled (ABI exists). After testnet deploy, the script sets KnowledgeRegistry address and startBlock in `subgraph.yaml`; confirm startBlock is the actual deploy block before deploying.

**Codegen** (generates types from schema + ABI):

```bash
pnpm subgraph:codegen
```

**Build** (compile mapping):

```bash
pnpm subgraph:build
```

**Deploy** (from `subgraph/`, after `graph auth --studio <key>`):

```bash
cd subgraph && graph deploy --studio <subgraph-slug>
```

**Note:** If you have not deployed testnet yet, `subgraph.yaml` uses a placeholder address and startBlock 0 so codegen still runs. For a real deployment, run `pnpm deploy:testnet` first so address and startBlock are set; confirm startBlock in `subgraph.yaml` (verify on Basescan) before `graph deploy`. Once Studio sync hits 100%, the GraphQL endpoint is live and subgraph tests can run.

---

## Quick reference

| Step        | Command / action |
|------------|-------------------|
| E2E local  | `pnpm test:e2e` or `pnpm demo:walkthrough` |
| Testnet    | Set env → `pnpm deploy:testnet` → record addresses in TESTNET-ADDRESSES.md |
| Subgraph  | Confirm address + startBlock in subgraph.yaml (from deploy:testnet) → `pnpm subgraph:codegen` → `pnpm subgraph:build` → deploy from subgraph/ |
