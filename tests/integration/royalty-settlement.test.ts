/**
 * Flow 2: Royalty — ingest → query (ledger) → verify payout, splits, RS, freshness.
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
const VALID_AGENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const hasStack =
  process.env.RUN_ROYALTY_FLOW === "1" &&
  !!process.env.REGISTRY_ADDRESS &&
  !!process.env.TOKEN_ADDRESS;

describe("Flow 2: Royalty", () => {
  // Skipped in Milestone 1: depends on full API runtime.
  // Deferred: requires full API layer.
  it.skip(
    "use flow-2-3-fullstack.test.ts for full-stack runs",
    async () => {
      const { app } = await import("../../packages/api/server.js");
      // 1. Ingest
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

      // 2. Query with ledger (useLedger: true)
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

      // Royalty fields
      expect(typeof queryRes.body.feePaid).toBe("number");
      expect(queryRes.body.feePaid).toBeGreaterThan(0);
      expect(typeof queryRes.body.payout).toBe("number");
      expect(queryRes.body.payout).toBeGreaterThanOrEqual(0);
      expect(typeof queryRes.body.rs).toBe("number");
      expect(queryRes.body.rs).toBeGreaterThan(0);
      expect(typeof queryRes.body.freshness).toBe("number");
      expect(queryRes.body.freshness).toBeGreaterThan(0);
      expect(queryRes.body.freshness).toBeLessThanOrEqual(1);

      // Splits: at least curator
      expect(Array.isArray(queryRes.body.splits)).toBe(true);
      expect(queryRes.body.splits.length).toBeGreaterThanOrEqual(1);
      const curatorSplit = queryRes.body.splits.find(
        (s: { role: string }) => s.role === "curator"
      );
      expect(curatorSplit).toBeDefined();
      expect(curatorSplit.address).toBe(VALID_CURATOR);
      expect(typeof curatorSplit.amount).toBe("number");
      expect(curatorSplit.amount).toBeGreaterThan(0);

      // Payout = base × RS × freshness; splits should sum to payout (or main weight portion)
      const totalSplits = queryRes.body.splits.reduce(
        (sum: number, s: { amount: number }) => sum + s.amount,
        0
      );
      expect(totalSplits).toBeGreaterThan(0);
      expect(totalSplits).toBeLessThanOrEqual(
        queryRes.body.payout * 1.01
      ); // allow tiny rounding

      // New fields: queryHash, receipt, servedChunkHashes, proofBundle
      expect(queryRes.body.queryHash).toBeDefined();
      expect(typeof queryRes.body.queryHash).toBe("string");
      expect(queryRes.body.receipt).toBeDefined();
      expect(queryRes.body.receipt.queryHash).toBe(queryRes.body.queryHash);
      expect(Array.isArray(queryRes.body.servedChunkHashes)).toBe(true);
      expect(queryRes.body.proofBundle).toBeDefined();
      expect(queryRes.body.proofBundle.merkleRoot).toBeDefined();
      expect(Array.isArray(queryRes.body.proofBundle.perChunkMerkleProofs)).toBe(true);

      console.log("✅ Flow 2: Royalty passed!");
      console.log(`   Payout: ${queryRes.body.payout}, RS: ${queryRes.body.rs}, Freshness: ${queryRes.body.freshness}`);
      console.log(`   Splits: ${queryRes.body.splits.length} (curator + upstream)`);
    },
    { timeout: 20000 }
  );
});
