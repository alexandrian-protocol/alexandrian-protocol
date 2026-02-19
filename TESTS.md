# Test layout and contents (inline)

All tests from repo root and `packages/protocol/test/`, with full file contents.

---

## Root folder layout

```
alexandria/
├── tests/                          # Vitest (pnpm test:spec, pnpm test:integration)
│   ├── unit/                       # Canonical vectors, VirtualRegistry, SDK, neutrality
│   ├── invariants/                 # Economic invariants (ledger math)
│   ├── demo-walkthrough/           # M1 demo, protocol demo, ingestion
│   ├── integration/                # API flows (many skipped in M1)
│   └── performance/                # Royalty graph scale
├── packages/
│   └── protocol/
│       └── test/                   # Hardhat (pnpm test:protocol)
│           ├── Registry.test.js
│           └── QuerySettleWalkthrough.test.js
└── test-vectors/
    └── canonical/                  # envelope.json + expected.json per case
```

**Commands (from repo root):**

- `pnpm test:protocol` — Hardhat: Registry + QuerySettle (ETH)
- `pnpm test:spec` — Vitest: unit + invariants + demo-walkthrough (m1-demo)
- `pnpm test:integration` — Vitest: all under `tests/` (includes skipped API flows)
- `pnpm test` — protocol + spec + integration

---

## 1. packages/protocol/test/Registry.test.js

```javascript
/**
 * Registry contract — minimal integration test.
 * Ensures AlexandrianRegistry deploys and exposes getKnowledgeBlock.
 */
const hre = require("hardhat");
const { expect } = require("chai");

describe("AlexandrianRegistry", function () {
  it("deploys and returns registry address", async function () {
    const Registry = await hre.ethers.getContractFactory("AlexandrianRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const address = await registry.getAddress();
    expect(address).to.be.a("string");
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

---

## 2. packages/protocol/test/QuerySettleWalkthrough.test.js

```javascript
/**
 * Step 5 — Agent Query + Payment (walkthrough demo).
 * Pay in ETH: deploy Registry only; curator publishes KB (stake + query fee in ETH);
 * agent pays query fee in ETH via registry.settleQuery → curator receives ETH.
 */
const hre = require("hardhat");
const { expect } = require("chai");

const STAKE = hre.ethers.parseEther("0.001");
const QUERY_FEE_ETH = hre.ethers.parseEther("0.0005");

function ethFmt(wei) {
  return hre.ethers.formatEther(wei) + " ETH";
}

describe("Agent Query + Payment", function () {
  it("Agent queries KB and pays in ETH; curator receives ETH", async function () {
    const [owner, curator, agent] = await hre.ethers.getSigners();
    const contentHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("walkthrough-demo-kb"));

    const Registry = await hre.ethers.getContractFactory("AlexandrianRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    await registry.connect(curator).publishKB(
      contentHash,
      curator.address,
      0, // KBType.Practice
      0, // TrustTier.HumanStaked
      "bafkreidemo",
      "",
      "demo",
      "attribution",
      QUERY_FEE_ETH,
      "0.1.0",
      [],
      { value: STAKE }
    );

    const kb = await registry.getKnowledgeBlock(contentHash);
    expect(kb.exists).to.be.true;
    expect(kb.curator).to.equal(curator.address);
    expect(kb.queryFee).to.equal(QUERY_FEE_ETH);

    const curatorEthBefore = await hre.ethers.provider.getBalance(curator.address);
    const agentEthBefore = await hre.ethers.provider.getBalance(agent.address);

    const tx = await registry.connect(agent).settleQuery(contentHash, agent.address, {
      value: QUERY_FEE_ETH,
    });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;

    const curatorEthAfter = await hre.ethers.provider.getBalance(curator.address);
    const agentEthAfter = await hre.ethers.provider.getBalance(agent.address);

    const protocolFeeBps = 200;
    const protocolFee = (QUERY_FEE_ETH * BigInt(protocolFeeBps)) / 10000n;
    const toCurator = QUERY_FEE_ETH - protocolFee;

    console.log("1. Registry deployed on local Hardhat (ETH for stake and query fee)");
    console.log("   Registry: ", await registry.getAddress());
    console.log("\n2. Curator published a Knowledge Block (stake in ETH)");
    console.log("   contentHash:", contentHash);
    console.log("   queryFee:  ", ethFmt(QUERY_FEE_ETH));
    console.log("\n3. Agent queried KB and paid in ETH (registry.settleQuery)");
    console.log("   Agent paid:       ", ethFmt(QUERY_FEE_ETH));
    console.log("   Curator received: ", ethFmt(toCurator));
    console.log("   Protocol fee:     ", ethFmt(protocolFee));
    console.log("   (98% curator / 2% protocol, enforced on-chain)");
    console.log("\n4. ETH balances after settlement");
    console.log("   Curator ETH: +" + ethFmt(curatorEthAfter - curatorEthBefore));
    console.log("   Agent ETH:  -" + ethFmt(agentEthBefore - agentEthAfter) + " (incl. gas)");

    expect(curatorEthAfter - curatorEthBefore).to.equal(toCurator);
    expect(agentEthBefore - agentEthAfter).to.equal(QUERY_FEE_ETH + gasCost);
  });
});
```

---

## 3. tests/unit/neutrality.test.ts

```typescript
/**
 * Protocol Neutrality — verify no privileged curator logic
 *
 * Ensures all curators are treated identically in settlement, reputation, ranking.
 * @see specs/INVARIANTS.md
 */
import { describe, it, expect } from "vitest";
import { PROTOCOL_NEUTRALITY } from "@alexandrian/protocol";

describe("Protocol Neutrality", () => {
  it("PROTOCOL_NEUTRALITY constant is true", () => {
    expect(PROTOCOL_NEUTRALITY).toBe(true);
  });

  it("contentHashFromEnvelope is identical for same envelope regardless of source", async () => {
    const { contentHashFromEnvelope } = await import("@alexandrian/protocol/core");
    const envelope = {
      type: "practice",
      domain: "test",
      sources: [] as string[],
      payload: {
        type: "practice",
        rationale: "Same content",
        contexts: [],
        failureModes: [],
      },
    };
    const h1 = contentHashFromEnvelope(envelope);
    const h2 = contentHashFromEnvelope({ ...envelope });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("VirtualRegistry produces same kbId for same envelope regardless of curator", async () => {
    const { VirtualRegistry } = await import("@alexandrian/protocol/core");
    const reg = new VirtualRegistry();
    const env = {
      type: "practice" as const,
      domain: "test",
      sources: [] as string[],
      payload: {
        type: "practice" as const,
        rationale: "Neutral",
        contexts: [],
        failureModes: [],
      },
    };
    const r1 = await reg.registerEnvelope(env, "0x1234567890123456789012345678901234567890");
    expect(r1.kbId).toMatch(/^0x[a-f0-9]{64}$/);
    expect(r1.isNew).toBe(true);
    const r2 = await reg.registerEnvelope(env, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    expect(r2.kbId).toBe(r1.kbId);
    expect(r2.isNew).toBe(false);
  });
});
```

---

## 4. tests/unit/canonical-vectors.test.ts

Validates canonical test vectors produce expected contentHash. Loops over `test-vectors/canonical/types/*` and `edge-cases/*`; reads `envelope.json` and `expected.json`; asserts `contentHashFromEnvelope(envelope) === expected.contentHash` and optional `canonicalize`/`sortSources` match.

*(Full listing: 47 lines; vectors list + one `it()` per vector.)*

---

## 5. tests/unit/derived-vectors.test.ts

Derived block test vectors: single-parent, multi-parent, parent-sort (unsorted/sorted same hash), cycle rejection (VirtualRegistry rejects unregistered parent), duplicate-source rejection.

*(Full listing: 86 lines.)*

---

## 6. tests/unit/derived-envelope.test.ts

DerivedBlock / Deterministic Synthesis: `buildDerivedEnvelope` sorts sources; `contentHashFromEnvelope` deterministic for derived envelope; VirtualRegistry rejects derivation input kbId not in sources; accepts valid derived envelope when sources registered.

*(Full listing: 146 lines.)*

---

## 7. tests/unit/virtual-registry.test.ts

VirtualRegistry: registers practice envelope and returns kbId; idempotency (same envelope → same kbId); rejects duplicate sources (INVALID_ENVELOPE); rejects unsorted sources (SOURCES_NOT_SORTED); rejects unregistered source (CYCLE_DETECTED); validates schema (SCHEMA_INVALID); reset clears state.

*(Full listing: 166 lines.)*

---

## 8. tests/unit/sdk-consumption-modes.test.ts

QueryResult consumption: `asContext()` summary/citation/attribution/narrative; `asContext()` with payload; `asStructured()` throws when payload not resolved / returns validated payload when resolved; `withPayload()` returns new QueryResult with payload.

*(Full listing: 90 lines.)*

---

## 9. tests/demo-walkthrough/demo-protocol-walkthrough.test.ts

Protocol demo: Register KB → Derive KB → verify (human-readable). Same narrative as `scripts/demo.mjs`. Uses VirtualRegistry, contentHashFromEnvelope, buildDerivedEnvelope, cidV1FromEnvelope; asserts determinism.

*(Full listing: 71 lines.)*

---

## 10. tests/demo-walkthrough/m1-demo.test.ts

Milestone 1 Demo — Canonical Identity, Determinism, Derived KB (DAG), Registry Semantics, Subgraph Compatibility, Invariant Enforcement (duplicate sources, schema violations, unsorted sources). No Hardhat; pure protocol-layer.

*(Full listing: 294 lines.)*

---

## 11. tests/demo-walkthrough/ingestion.test.ts

Alexandrian Protocol Hello World: create knowledge asset with verifiable identity — IpfsHasher.fromBuffer, Compiler.synthesize, DatasetSchema.parse, IpfsHasher.verify. Uses pipeline + protocol.

*(Full listing: 78 lines.)*

---

## 12. tests/invariants/ledger.ts

Pure helpers for economic invariants: RS_MIN/RS_MAX, clampRS, freshnessMultiplier, meetsTier, computePayout, ledgerLeafHash.

*(Full listing: 50 lines.)*

---

## 13. tests/invariants/economic-invariants.test.ts

Economic invariants (pure): RS bounds (clampRS), freshness multiplier, tier gating (meetsTier), payout (computePayout), ledger leaf hash. Imports from `./ledger.js` (implementation in `ledger.ts`).

*(Full listing: 127 lines.)*

---

## 14. tests/performance/royalty-graph-scale.test.ts

Royalty graph scale: findCycles, findAllPaths, calculateDistribution, calculateTotalObligation, validateRoyaltyDAG on linear chain, binary tree, fan-out; cycle detection and validateNoCycles.

*(Full listing: 265 lines.)*

---

## 15. tests/integration/* (summary)

| File | Purpose | Status |
|------|---------|--------|
| flow-ai-usage-proof.test.ts | AI usage proof loop (ingest → query → Merkle/receipt/balance) | describe.skip (M2) |
| query-settlement-fullstack.test.ts | Flow 2 & 3: royalty + payment full stack | describe.sequential.skip (M2) |
| attribution-verification.test.ts | GET /api/blocks/:contentHash returns same curator as ingest | describe.skip (M2) |
| ai-usage-proof.test.ts | AI usage proof (Merkle, receipt, balances) | describe.skip (M2) |
| lineage.test.ts | GET /api/lineage/:contentHash parents/derived | describe.skip (M2) |
| royalty-settlement.test.ts | Flow 2: royalty payout/splits/RS/freshness | it.skip, use fullstack |
| payment-settlement.test.ts | Flow 3: on-chain payment (XANDER) | it.skip, use fullstack |
| deprecation.test.ts | KBDeprecated / supersededBy | it.skip until Registry support |

All integration tests under `tests/integration/` depend on API runtime or on-chain config; skipped for Milestone 1, enabled in M2.

---

## Quick reference

| What | Command |
|------|---------|
| Contract tests (Hardhat) | `pnpm test:protocol` |
| Unit + invariants + M1 demo | `pnpm test:spec` |
| All Vitest (including skipped) | `pnpm test:integration` |
| Full suite | `pnpm test` |

Test vectors live in `test-vectors/canonical/` (per-case `envelope.json` + `expected.json`). Protocol tests use Hardhat (AlexandrianRegistry, ETH settlement); spec tests use Vitest and `@alexandrian/protocol` + pipeline.
