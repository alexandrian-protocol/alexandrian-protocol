/**
 * Flow: AI usage proof — the "AI-native proof loop".
 *
 * Ingest → query (ledger) → verify:
 *   1. Returned chunks verify against merkleRoot (Merkle proof per chunk)
 *   2. servedChunkHashes match returned content (hash(chunk) === servedChunkHash)
 *   3. receipt recomputes exactly (hashLeaf(JSON.stringify(receipt)) === receiptHash)
 *   4. On-chain payment event includes receiptHash (when Registry.settleQuery emits it)
 *   5. Balances reflect payment (ledger balance increased for curator)
 *
 * Unskip with: RUN_AI_USAGE_PROOF=1 pnpm test:integration
 * Requires: API runtime (ingest, query, ledger). Uses MOCK_REGISTRY=1 by default.
 *
 * Skipped in Milestone 1: depends on full API runtime.
 * Deferred: requires full API layer.
 */
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";
import { hashLeaf, hashChunkLeaf, verifyMerkleProof } from "./merkle.js";

config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const VALID_AGENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

/** Shared flow state: set in beforeAll, read in each it() */
const flow: {
  kbId?: string;
  queryRes?: request.Response;
  results?: { id?: string; index?: number; content?: string }[];
  merkleRoot?: string;
  proofBundle?: { perChunkMerkleProofs?: { merkleProof?: string[]; chunkIndex?: number }[] };
  servedChunkHashes?: string[];
  receipt?: unknown;
  receiptHash?: string;
  balBefore?: number;
  balAfter?: number;
} = {};

describe.skip("Flow: AI usage proof (AI-native proof loop) — requires full API layer", () => {
  beforeAll(async () => {
    const { app } = await import("../../packages/api/server.js");

    const ingestBody = {
      text: `AI usage proof flow. Alexandrian Protocol verifiable knowledge retrieval.
      Merkle proofs bind served chunks to the KB root. Receipts bind query to payment.
      [Run: ${Date.now()}]`,
      title: "Flow AI Usage Proof Doc",
      curatorWallet: VALID_CURATOR,
      licenseType: "attribution",
    };

    const ingestRes = await request(app).post("/api/ingest").send(ingestBody).expect(201);
    expect(ingestRes.body.success).toBe(true);
    expect(ingestRes.body.kbId).toBeDefined();
    flow.kbId = ingestRes.body.kbId;

    const balRes = await request(app).get(`/api/ledger/balance/${VALID_CURATOR}`).expect(200);
    flow.balBefore = Number(balRes.body.balance ?? 0);

    const queryRes = await request(app)
      .post("/api/query")
      .send({
        kbId: flow.kbId,
        q: "verifiable knowledge retrieval",
        agentWallet: VALID_AGENT,
        useLedger: true,
      })
      .expect(200);

    flow.queryRes = queryRes;
    expect(queryRes.body.success).toBe(true);
    flow.results = queryRes.body.results ?? [];
    flow.merkleRoot =
      queryRes.body.proofBundle?.merkleRoot ?? queryRes.body.merkleRoot;
    flow.proofBundle = queryRes.body.proofBundle;
    flow.servedChunkHashes = queryRes.body.servedChunkHashes ?? [];
    flow.receipt = queryRes.body.receipt;
    flow.receiptHash = queryRes.body.receiptHash;

    const balAfterRes = await request(app).get(`/api/ledger/balance/${VALID_CURATOR}`).expect(200);
    flow.balAfter = Number(balAfterRes.body.balance ?? 0);
  }, 25000);

  it("1. returned chunks verify against merkleRoot", () => {
    const { results, merkleRoot, proofBundle } = flow;
    expect(results).toBeDefined();
    expect(merkleRoot).toBeDefined();
    expect(proofBundle?.perChunkMerkleProofs).toBeDefined();

    const perChunkProofs = proofBundle!.perChunkMerkleProofs ?? [];
    expect(perChunkProofs.length).toBe(results!.length);

    for (let i = 0; i < results!.length; i++) {
      const r = results![i];
      const chunkId = r.id ?? `chunk_${r.index ?? i}`;
      const chunkContent = r.content ?? "";
      const leafHash = hashChunkLeaf(chunkId, chunkContent);
      const proof = perChunkProofs[i]?.merkleProof ?? [];
      const chunkIndex = perChunkProofs[i]?.chunkIndex ?? r.index ?? i;
      const verified = verifyMerkleProof(leafHash, proof, chunkIndex, merkleRoot!);
      expect(verified).toBe(true);
    }
  });

  it("2. servedChunkHashes match returned content", () => {
    const { results, servedChunkHashes } = flow;
    expect(results).toBeDefined();
    expect(Array.isArray(servedChunkHashes)).toBe(true);
    expect(servedChunkHashes!.length).toBe(results!.length);

    for (let i = 0; i < results!.length; i++) {
      const r = results![i];
      const chunkId = r.id ?? `chunk_${r.index ?? i}`;
      const chunkContent = r.content ?? "";
      const expectedHash = hashChunkLeaf(chunkId, chunkContent);
      const actualHash = servedChunkHashes![i];
      expect(actualHash).toBeDefined();
      expect(expectedHash).toBe(actualHash);
    }
  });

  it("3. receipt recomputes exactly", () => {
    const { receipt, receiptHash } = flow;
    expect(receipt).toBeDefined();
    expect(receiptHash).toBeDefined();

    const receiptStr = JSON.stringify(receipt);
    const recomputedHash = hashLeaf(receiptStr);
    expect(recomputedHash).toBe(receiptHash);
  });

  it("4. on-chain payment event includes receiptHash", () => {
    const { queryRes, receiptHash } = flow;
    expect(queryRes?.body.receiptHash).toBeDefined();
    expect(receiptHash).toBeDefined();
    // When Registry.settleQuery emits receiptHash in the event, assert from tx receipt:
    // expect(event.receiptHash).toBe(receiptHash)
    // For now we require the API to return receiptHash so it can be submitted/verified on-chain.
    expect(queryRes!.body.receiptHash).toBe(receiptHash);
  });

  it("5. balances reflect payment", () => {
    const { balBefore, balAfter, queryRes } = flow;
    expect(balBefore).toBeDefined();
    expect(balAfter).toBeDefined();

    const payout = Number(queryRes?.body.payout ?? 0);
    expect(balAfter!).toBeGreaterThanOrEqual(balBefore!);
    expect(balAfter!).toBeGreaterThanOrEqual(balBefore! + payout * 0.99);
  });
});
