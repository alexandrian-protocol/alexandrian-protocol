/**
 * VirtualRegistry: Protocol Sandbox — stricter-than-mainnet invariants.
 */
import { describe, it, expect } from "vitest";
import { VirtualRegistry, VirtualRegistryError } from "@alexandrian/protocol/core";

const CURATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("VirtualRegistry", () => {
  it("registers practice envelope and returns kbId", async () => {
    const registry = new VirtualRegistry();
    const envelope = {
      type: "practice" as const,
      domain: "software.security",
      sources: [] as string[],
      payload: {
        type: "practice" as const,
        rationale: "Use constant-time comparison.",
        contexts: [],
        failureModes: [],
      },
    };
    const result = await registry.registerEnvelope(envelope, CURATOR);
    expect(result.isNew).toBe(true);
    expect(result.kbId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(registry.isVerified(result.kbId)).toBe(true);
    expect(registry.getCurator(result.kbId)).toBe(CURATOR);
  });

  it("idempotency: same envelope returns same kbId", async () => {
    const registry = new VirtualRegistry();
    const envelope = {
      type: "practice" as const,
      domain: "test",
      sources: [] as string[],
      payload: {
        type: "practice" as const,
        rationale: "Same",
        contexts: [],
        failureModes: [],
      },
    };
    const r1 = await registry.registerEnvelope(envelope, CURATOR);
    const r2 = await registry.registerEnvelope(envelope, "0x" + "1".repeat(40));
    expect(r1.kbId).toBe(r2.kbId);
    expect(r2.isNew).toBe(false);
  });

  it("rejects duplicate sources (INVALID_ENVELOPE)", async () => {
    const registry = new VirtualRegistry();
    const r1 = await registry.registerEnvelope(
      {
        type: "practice",
        domain: "test",
        sources: [],
        payload: { type: "practice", rationale: "A", contexts: [], failureModes: [] },
      },
      CURATOR
    );
    const kbId = r1.kbId;
    const envelope = {
      type: "practice" as const,
      domain: "test",
      sources: [kbId, kbId],
      payload: {
        type: "practice" as const,
        rationale: "Child",
        contexts: [],
        failureModes: [],
      },
    };
    await expect(registry.registerEnvelope(envelope, CURATOR)).rejects.toMatchObject({
      code: "INVALID_ENVELOPE",
    });
  });

  it("rejects unsorted sources (SOURCES_NOT_SORTED)", async () => {
    const registry = new VirtualRegistry();
    const r1 = await registry.registerEnvelope(
      {
        type: "practice",
        domain: "test",
        sources: [],
        payload: { type: "practice", rationale: "A", contexts: [], failureModes: [] },
      },
      CURATOR
    );
    const r2 = await registry.registerEnvelope(
      {
        type: "practice",
        domain: "test",
        sources: [],
        payload: { type: "practice", rationale: "B", contexts: [], failureModes: [] },
      },
      CURATOR
    );
    const kbId1 = r1.kbId;
    const kbId2 = r2.kbId;
    const [first, second] = [kbId1, kbId2].sort();
    const envelope = {
      type: "practice" as const,
      domain: "test",
      sources: [second!, first!], // wrong order (reverse sorted)
      payload: {
        type: "practice" as const,
        rationale: "Child",
        contexts: [],
        failureModes: [],
      },
    };
    const err = await registry.registerEnvelope(envelope, CURATOR).catch((e) => e);
    expect(err).toBeInstanceOf(VirtualRegistryError);
    expect((err as VirtualRegistryError).code).toBe("SOURCES_NOT_SORTED");
  });

  it("rejects unregistered source", async () => {
    const registry = new VirtualRegistry();
    const envelope = {
      type: "practice" as const,
      domain: "test",
      sources: ["0x" + "c".repeat(64)],
      payload: {
        type: "practice" as const,
        rationale: "Child of unregistered",
        contexts: [],
        failureModes: [],
      },
    };
    await expect(registry.registerEnvelope(envelope, CURATOR)).rejects.toThrow(
      VirtualRegistryError
    );
    await expect(registry.registerEnvelope(envelope, CURATOR)).rejects.toMatchObject({
      code: "CYCLE_DETECTED",
    });
  });

  it("validates schema: practice requires rationale, contexts, failureModes", async () => {
    const registry = new VirtualRegistry();
    const bad = {
      type: "practice" as const,
      domain: "test",
      sources: [] as string[],
      payload: { type: "practice" as const, rationale: "x" }, // missing contexts, failureModes
    };
    await expect(registry.registerEnvelope(bad as never, CURATOR)).rejects.toMatchObject({
      code: "SCHEMA_INVALID",
    });
  });

  it("reset clears state", async () => {
    const registry = new VirtualRegistry();
    const envelope = {
      type: "practice" as const,
      domain: "test",
      sources: [] as string[],
      payload: {
        type: "practice" as const,
        rationale: "x",
        contexts: [],
        failureModes: [],
      },
    };
    const { kbId } = await registry.registerEnvelope(envelope, CURATOR);
    expect(registry.isVerified(kbId)).toBe(true);
    registry.reset();
    expect(registry.isVerified(kbId)).toBe(false);
  });
});
