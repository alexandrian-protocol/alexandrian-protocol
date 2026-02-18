/**
 * Flow 3: Payment — ingest → query (on-chain) → verify XANDER transfer.
 *
 * NOTE: Use flow-2-3-fullstack.test.ts when running full-stack tests (avoids nonce conflicts).
 * This file is kept for documentation; it skips to prevent parallel ingest conflicts.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const hasStack =
  process.env.RUN_PAYMENT_FLOW === "1" &&
  !!process.env.REGISTRY_ADDRESS &&
  !!process.env.TOKEN_ADDRESS &&
  !!process.env.AGENT_PRIVATE_KEY &&
  !!process.env.AGENT_WALLET;

describe("Flow 3: Payment", () => {
  it.skip(
    "use flow-2-3-fullstack.test.ts for full-stack runs",
    async () => {
      const { app } = await import("../../packages/api/server.js");

      const agentWallet = process.env.AGENT_WALLET!;
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY!;

      // 1. Ingest
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

      // 2. Query with on-chain payment (useLedger: false)
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
      console.log(`   Payment tx: ${queryRes.body.paymentTxHash.slice(0, 18)}...`);
    },
    { timeout: 20000 }
  );
});
