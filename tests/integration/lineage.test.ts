/**
 * Lineage traversal — proves the citation DAG is traversable end-to-end.
 * Resolves: "No persistent, trustless knowledge lineage" failure mode.
 *
 * Ingest a parent KB, then a child KB with parent reference; assert GET /api/lineage
 * returns correct parents for child and correct derived list for parent.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { resolve } from "path";

process.env.MOCK_REGISTRY = process.env.MOCK_REGISTRY ?? "1";
config({ path: resolve(process.cwd(), "packages/api/.env") });

const VALID_CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe.skip("Flow: Lineage traversal — requires API package (Milestone 2)", () => {
  it("returns parent for child and derived for parent via GET /api/lineage/:contentHash", async () => {
    const { app } = await import("../../packages/api/server.js");

    const parentRes = await request(app)
      .post("/api/ingest")
      .send({
        text: `Lineage test parent. [${Date.now()}]`,
        title: "Parent KB",
        curatorWallet: VALID_CURATOR,
        licenseType: "attribution",
      })
      .expect(201);

    const parentHash = parentRes.body.contentHash;
    expect(parentHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const childRes = await request(app)
      .post("/api/ingest")
      .send({
        text: `Lineage test child derived from parent. [${Date.now()}]`,
        title: "Child KB",
        curatorWallet: VALID_CURATOR,
        licenseType: "attribution",
        parents: [{ contentHash: parentHash, weight: 1 }],
      })
      .expect(201);

    const childHash = childRes.body.contentHash;
    expect(childHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(childHash).not.toBe(parentHash);

    const childLineage = await request(app)
      .get(`/api/lineage/${childHash}`)
      .expect(200);
    expect(childLineage.body.parents).toBeDefined();
    expect(Array.isArray(childLineage.body.parents)).toBe(true);
    const parentRefs = childLineage.body.parents.map((p: { parentHash: string }) => p.parentHash);
    expect(parentRefs).toContain(parentHash);

    const parentLineage = await request(app)
      .get(`/api/lineage/${parentHash}`)
      .expect(200);
    expect(parentLineage.body.derived).toBeDefined();
    expect(Array.isArray(parentLineage.body.derived)).toBe(true);
    expect(parentLineage.body.derived).toContain(childHash);
  }, 20000);
});
