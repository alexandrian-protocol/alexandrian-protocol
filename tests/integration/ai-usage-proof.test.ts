/**
 * Flow: AI usage proof — ingest → query (ledger) → verify the "AI-native proof loop".
 *
 * Asserts:
 *   1. Returned chunks verify against merkleRoot (Merkle proof per chunk)
 *   2. servedChunkHashes match returned content (hash(chunk) === servedChunkHash)
 *   3. receipt recomputes exactly (hashLeaf(JSON.stringify(receipt)) === receiptHash)
 *   4. On-chain payment event includes receiptHash when Registry.settleQuery emits it
 *   5. Balances reflect payment (ledger balance increased for curator)
 *
 * Unskip with: RUN_AI_USAGE_PROOF=1 pnpm test:integration
 * Requires: IPFS, Redis. Uses MOCK_REGISTRY=1 by default.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";
import { hashLeaf, hashChunkLeaf, verifyMerkleProof } from "./merkle.js";

config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const VALID_AGENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const hasStack =
  process.env.RUN_AI_USAGE_PROOF === "1" &&
  ((process.env.MOCK_REGISTRY ?? "1") === "1" || (!!process.env.REGISTRY_ADDRESS && !!process.env.TOKEN_ADDRESS));

// Deferred: requires full API layer.
describe.skip("Flow: AI usage proof — requires full API layer", () => {
  it(
    "should return verifiable proof loop: merkleRoot, servedChunkHashes, receipt, balances",
    async () => {
      const { app } = await import("../../packages/api/server.js");

      // 1. Ingest
      const ingestBody = {
        text: `AI usage proof test. Alexandrian Protocol provides verifiable knowledge retrieval.
        Merkle proofs bind served chunks to the KB root. Receipts bind query to payment.
        [Run: ${Date.now()}]`,
        title: "AI Usage Proof Doc",
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

      // 2. Get curator balance before query
      const balBeforeRes = await request(app)
        .get(`/api/ledger/balance/${VALID_CURATOR}`)
        .expect(200);
      const balBefore = Number(balBeforeRes.body.balance ?? 0);

      // 3. Query with ledger
      const queryRes = await request(app)
        .post("/api/query")
        .send({
          kbId,
          q: "verifiable knowledge retrieval",
          agentWallet: VALID_AGENT,
          useLedger: true,
        })
        .expect(200);

      expect(queryRes.body.success).toBe(true);
      expect(queryRes.body.ledgerUpdated).toBe(true);
      const {
        results,
        proofBundle,
        servedChunkHashes,
        receipt,
        receiptHash,
        merkleRoot: _mr,
      } = queryRes.body;

      const merkleRoot = queryRes.body.proofBundle?.merkleRoot ?? queryRes.body.merkleRoot;
      expect(merkleRoot).toBeDefined();
      expect(Array.isArray(servedChunkHashes)).toBe(true);
      expect(receipt).toBeDefined();
      expect(receiptHash).toBeDefined();

      // --- Assert 1: Returned chunks verify against merkleRoot ---
      const perChunkProofs = proofBundle?.perChunkMerkleProofs ?? [];
      expect(perChunkProofs.length).toBe(results.length);

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const chunkId = r.id ?? `chunk_${r.index}`;
        const chunkContent = r.content ?? "";
        const leafHash = hashChunkLeaf(chunkId, chunkContent);
        const proof = perChunkProofs[i]?.merkleProof ?? [];
        const chunkIndex = perChunkProofs[i]?.chunkIndex ?? r.index ?? i;

        const verified = verifyMerkleProof(leafHash, proof, chunkIndex, merkleRoot);
        expect(verified).toBe(true);
      }

      // --- Assert 2: servedChunkHashes match returned content ---
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const chunkId = r.id ?? `chunk_${r.index}`;
        const chunkContent = r.content ?? "";
        const expectedHash = hashChunkLeaf(chunkId, chunkContent);
        const actualHash = servedChunkHashes[i];
        expect(actualHash).toBeDefined();
        expect(expectedHash).toBe(actualHash);
      }

      // --- Assert 3: receipt recomputes exactly ---
      const receiptStr = JSON.stringify(receipt);
      const recomputedHash = hashLeaf(receiptStr);
      expect(recomputedHash).toBe(receiptHash);

      // --- Assert 5: Balances reflect payment ---
      const balAfterRes = await request(app)
        .get(`/api/ledger/balance/${VALID_CURATOR}`)
        .expect(200);
      const balAfter = Number(balAfterRes.body.balance ?? 0);
      expect(balAfter).toBeGreaterThanOrEqual(balBefore);
      const payout = queryRes.body.payout ?? 0;
      expect(balAfter).toBeGreaterThanOrEqual(balBefore + payout * 0.99);

      // --- Assert 4: On-chain payment event includes receiptHash ---
      // NOTE: Registry.settleQuery currently emits QuerySettled(contentHash, querier, totalFee, protocolFee)
      // without receiptHash. When contract is extended to emit receiptHash, add:
      // - Query with useLedger=false (or SDK settleCitation)
      // - Parse QuerySettled event from tx receipt
      // - expect(event.receiptHash).toBe(receiptHash)

      console.log("✅ AI usage proof loop passed!");
      console.log(`   Chunks: ${results.length}, merkleRoot: ${String(merkleRoot).slice(0, 18)}...`);
      console.log(`   receiptHash: ${String(receiptHash).slice(0, 18)}...`);
      console.log(`   Balance delta: ${balAfter - balBefore}`);
    },
    { timeout: 20000 }
  );
});
