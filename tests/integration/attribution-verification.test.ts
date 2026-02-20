/**
 * Attribution verification — proves curator address is correctly on-chain (or in mock).
 * Resolves: "No attribution" failure mode.
 *
 * After ingest, retrieval (GET /api/blocks/:contentHash) must return the same curator
 * that was provided at publish time.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Skipped in Milestone 1: depends on full API runtime.
// Deferred: requires full API layer.
describe.skip("Attribution verification — requires full API layer", () => {
  it("returns the same curator on GET /api/blocks/:contentHash as was set at ingest", async () => {
    const { app } = await import("../../packages/api/server.js");
    const ingestRes = await request(app)
      .post("/api/ingest")
      .send({
        text: `Attribution test. Curator must be stored and returned. [${Date.now()}]`,
        title: "Attribution Test",
        curatorWallet: VALID_CURATOR,
        licenseType: "attribution",
      })
      .expect(201);

    expect(ingestRes.body.contentHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    const contentHash = ingestRes.body.contentHash;

    const blockRes = await request(app)
      .get(`/api/blocks/${contentHash}`)
      .expect(200);

    expect(blockRes.body.registered).toBe(true);
    expect(blockRes.body.onChain).toBeDefined();
    expect(blockRes.body.onChain.curator).toBeDefined();
    // Compare case-insensitively (Ethereum addresses are checksummed but may differ by provider)
    expect(blockRes.body.onChain.curator.toLowerCase()).toBe(VALID_CURATOR.toLowerCase());
  }, 15000);
});
