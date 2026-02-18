/**
 * Flow 2 & 3: Royalty + Payment — run sequentially to avoid deployer nonce conflicts.
 *
 * Flow 2: ingest → query (ledger) → verify payout, splits, RS, freshness.
 * Flow 3: ingest → query (on-chain) → verify XANDER transfer.
 *
 * Requires: IPFS, Redis. Set RUN_ROYALTY_FLOW=1 and RUN_PAYMENT_FLOW=1 to enable.
 * With MOCK_REGISTRY=1 (default for tests): no blockchain/ETH — in-memory mock.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";

// No real ETH: use mock registry for integration tests
process.env.MOCK_REGISTRY = process.env.MOCK_REGISTRY ?? "1";
process.env.RUN_ROYALTY_FLOW = process.env.RUN_ROYALTY_FLOW ?? "1";
process.env.RUN_PAYMENT_FLOW = process.env.RUN_PAYMENT_FLOW ?? "1";
// Hardhat test account #1 (for Flow 3 when MOCK_REGISTRY)
if (process.env.MOCK_REGISTRY === "1" && !process.env.AGENT_WALLET) {
  process.env.AGENT_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  process.env.AGENT_PRIVATE_KEY =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d1";
}

config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const VALID_AGENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const hasStack =
  (process.env.RUN_ROYALTY_FLOW === "1" || process.env.RUN_PAYMENT_FLOW === "1") &&
  (process.env.MOCK_REGISTRY === "1" || (!!process.env.REGISTRY_ADDRESS && !!process.env.TOKEN_ADDRESS));

describe.sequential.skip("Flow 2 & 3: Full stack — requires API package (Milestone 2)", () => {
  it.skipIf(!hasStack || process.env.RUN_ROYALTY_FLOW !== "1")(
    "Flow 2: should ingest, query with ledger, and return payout/splits/rs/freshness",
    async () => {
      const { app } = await import("../../packages/api/server.js");
      const ingestBody = {
        text: `Royalty flow test document. Alexandrian Protocol enables knowledge economy.
        Curators earn through queries. RS and freshness affect payout.
        [Run: ${Date.now()}]`,
        title: "Royalty Test Doc",
        curatorWallet: VALID_CURATOR,
        licenseType: "attribution",
      };

      const ingestRes = await request(app)
        .post("/api/ingest")
        .send(ingestBody)
        .expect(201);

      expect(ingestRes.body.success).toBe(true);
      expect(ingestRes.body.kbId).toBeDefined();
      expect(ingestRes.body.contentHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(ingestRes.body.chunksIndexed).toBeGreaterThan(0);

      const { kbId } = ingestRes.body;

      const queryRes = await request(app)
        .post("/api/query")
        .send({
          kbId,
          q: "knowledge economy curator",
          agentWallet: VALID_AGENT,
          useLedger: true,
        })
        .expect(200);

      expect(queryRes.body.success).toBe(true);
      expect(queryRes.body.ledgerUpdated).toBe(true);
      expect(queryRes.body.contentHash).toBe(ingestRes.body.contentHash);
      expect(queryRes.body.curatorWallet).toBe(VALID_CURATOR);
      expect(typeof queryRes.body.feePaid).toBe("number");
      expect(queryRes.body.feePaid).toBeGreaterThan(0);
      expect(typeof queryRes.body.payout).toBe("number");
      expect(queryRes.body.payout).toBeGreaterThanOrEqual(0);
      expect(typeof queryRes.body.rs).toBe("number");
      expect(queryRes.body.rs).toBeGreaterThan(0);
      expect(typeof queryRes.body.freshness).toBe("number");
      expect(queryRes.body.freshness).toBeGreaterThan(0);
      expect(queryRes.body.freshness).toBeLessThanOrEqual(1);
      expect(Array.isArray(queryRes.body.splits)).toBe(true);
      expect(queryRes.body.splits.length).toBeGreaterThanOrEqual(1);
      const curatorSplit = queryRes.body.splits.find(
        (s: { role: string }) => s.role === "curator"
      );
      expect(curatorSplit).toBeDefined();
      expect(curatorSplit.address).toBe(VALID_CURATOR);
      expect(curatorSplit.amount).toBeGreaterThan(0);
      expect(queryRes.body.queryHash).toBeDefined();
      expect(queryRes.body.receipt).toBeDefined();
      expect(queryRes.body.proofBundle).toBeDefined();

      console.log("✅ Flow 2: Royalty passed!");
    },
    { timeout: 20000 }
  );

  it.skipIf(
    !hasStack ||
    process.env.RUN_PAYMENT_FLOW !== "1" ||
    !process.env.AGENT_PRIVATE_KEY ||
    !process.env.AGENT_WALLET
  )(
    "Flow 3: should ingest, query with on-chain payment, and return paymentTxHash",
    async () => {
      const { app } = await import("../../packages/api/server.js");
      const agentWallet = process.env.AGENT_WALLET!;
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY!;

      const ingestBody = {
        text: `Payment flow test. On-chain XANDER transfer from agent to curator.
        [Run: ${Date.now()}]`,
        title: "Payment Test Doc",
        curatorWallet: VALID_CURATOR,
        licenseType: "attribution",
      };

      const ingestRes = await request(app)
        .post("/api/ingest")
        .send(ingestBody)
        .expect(201);

      expect(ingestRes.body.success).toBe(true);
      expect(ingestRes.body.kbId).toBeDefined();
      const { kbId } = ingestRes.body;

      const queryRes = await request(app)
        .post("/api/query")
        .send({
          kbId,
          q: "XANDER transfer",
          agentWallet,
          agentPrivateKey,
          useLedger: false,
        })
        .expect(200);

      expect(queryRes.body.success).toBe(true);
      expect(queryRes.body.ledgerUpdated).toBe(false);
      expect(queryRes.body.paymentTxHash).toBeDefined();
      expect(queryRes.body.paymentTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(queryRes.body.contentHash).toBe(ingestRes.body.contentHash);
      expect(queryRes.body.curatorWallet).toBe(VALID_CURATOR);
      expect(typeof queryRes.body.feePaid).toBe("number");
      expect(queryRes.body.feePaid).toBeGreaterThan(0);

      console.log("✅ Flow 3: Payment passed!");
    },
    { timeout: 20000 }
  );
});
