/**
 * SDK consumption modes: asContext() and asStructured()
 */
import { describe, it, expect } from "vitest";
import { QueryResult } from "../../packages/sdk/client/AlexandrianSDK";

const MOCK_MATCH = {
  contentHash: "0x" + "a".repeat(64),
  kb: {
    curator: "0x" + "b".repeat(40),
    kbType: 0,
    trustTier: 0,
    cid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    embeddingCid: "",
    domain: "software.security",
    licenseType: "attribution",
    queryFee: BigInt(0),
    timestamp: 0,
    version: "1.0.0",
    exists: true,
  },
  reputation: { queryVolume: 0, positiveOutcomes: 0, endorsements: 0, score: 0, lastUpdated: 0 },
  stake: { amount: BigInt(0), lockedUntil: 0, slashed: false },
  relevanceScore: 1.0,
};

describe("QueryResult consumption modes", () => {
  it("asContext() returns summary, citation, attribution, narrative (metadata-only)", () => {
    const result = QueryResult.from(MOCK_MATCH);
    const ctx = result.asContext();
    expect(ctx.summary).toBeDefined();
    expect(ctx.summary).toContain("software.security");
    expect(ctx.citation).toEqual({
      contentHash: MOCK_MATCH.contentHash,
      curator: MOCK_MATCH.kb.curator,
      domain: "software.security",
      kbType: 0,
    });
    expect(ctx.attribution).toContain("curator:");
    expect(ctx.attribution).toContain("software.security");
    expect(ctx.narrative).toBeDefined();
  });

  it("asContext() uses payload when available for richer summary/narrative", () => {
    const payload = {
      type: "practice" as const,
      rationale: "Use constant-time comparison to prevent timing attacks.",
      contexts: [] as unknown[],
      failureModes: [] as unknown[],
    };
    const result = QueryResult.from(MOCK_MATCH, payload);
    const ctx = result.asContext();
    expect(ctx.summary).toContain("constant-time");
    expect(ctx.narrative).toContain("constant-time");
  });

  it("asStructured() throws when payload not resolved", () => {
    const result = QueryResult.from(MOCK_MATCH);
    expect(() => result.asStructured()).toThrow("Payload not resolved");
  });

  it("asStructured() returns validated payload when resolved", () => {
    const payload = {
      type: "practice" as const,
      rationale: "Secure token refresh pattern.",
      contexts: [] as unknown[],
      failureModes: [] as unknown[],
    };
    const result = QueryResult.from(MOCK_MATCH, payload);
    const struct = result.asStructured();
    expect(struct.payload).toEqual(payload);
    expect(struct.contentHash).toBe(MOCK_MATCH.contentHash);
    expect(struct.domain).toBe("software.security");
    expect(struct.kbType).toBe(0);
    expect(struct.schema).toBe("practice");
  });

  it("withPayload() returns new QueryResult with payload attached", () => {
    const result = QueryResult.from(MOCK_MATCH);
    const payload = {
      type: "practice" as const,
      rationale: "x",
      contexts: [] as unknown[],
      failureModes: [] as unknown[],
    };
    const withPayload = result.withPayload(payload);
    expect(withPayload.payload).toEqual(payload);
    expect(withPayload.asStructured().payload).toEqual(payload);
  });
});
