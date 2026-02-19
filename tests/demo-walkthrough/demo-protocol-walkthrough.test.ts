/**
 * Protocol demo for the walkthrough script — same narrative as scripts/demo.mjs.
 * Run via Vitest so resolution avoids the multiformats require path that fails under Node.
 * Human-readable output for grant reviewers.
 */
import { it, expect } from "vitest";
import {
  VirtualRegistry,
  contentHashFromEnvelope,
  buildDerivedEnvelope,
  cidV1FromEnvelope,
} from "@alexandrian/protocol/core";

const CURATOR = "0x0000000000000000000000000000000000000001";

it("Protocol demo: Register KB → Derive KB → verify (human-readable)", async () => {
  const registry = new VirtualRegistry();

  const rootEnvelope = {
    type: "practice" as const,
    domain: "demo",
    sources: [] as string[],
    payload: {
      type: "practice" as const,
      rationale: "Demo root KB for one-command protocol showcase.",
      contexts: [],
      failureModes: [],
    },
  };

  const rootResult = await registry.registerEnvelope(rootEnvelope, CURATOR);
  const rootHash = rootResult.kbId;
  const rootCid = await cidV1FromEnvelope(rootEnvelope);

  console.log("1. Registered root KB");
  console.log("   contentHash:", rootHash);
  console.log("   CIDv1:     ", rootCid);

  const derivedEnvelope = buildDerivedEnvelope({
    domain: "demo",
    sources: [rootHash],
    derivation: {
      type: "compose",
      inputs: [{ kbId: rootHash, selectors: ["payload.rationale"] }],
      recipe: {},
    },
    payload: {
      type: "synthesis",
      question: "What is this demo?",
      answer: "A one-command demo of register → derive.",
      citations: { [rootHash]: "Demo root KB for one-command protocol showcase." },
    },
  });

  const derivedResult = await registry.registerEnvelope(derivedEnvelope, CURATOR);
  const derivedHash = derivedResult.kbId;
  const derivedCid = await cidV1FromEnvelope(derivedEnvelope);

  console.log("\n2. Registered derived KB (synthesis from root)");
  console.log("   contentHash:", derivedHash);
  console.log("   CIDv1:     ", derivedCid);

  const recomputedRoot = contentHashFromEnvelope(rootEnvelope);
  const recomputedDerived = contentHashFromEnvelope(derivedEnvelope);
  const norm = (h: string) => (h.startsWith("0x") ? h : "0x" + h).toLowerCase();
  console.log("\n3. Determinism check");
  console.log("   Root hash matches:", norm(recomputedRoot) === norm(rootHash));
  console.log("   Derived hash matches:", norm(recomputedDerived) === norm(derivedHash));

  expect(norm(recomputedRoot)).toBe(norm(rootHash));
  expect(norm(recomputedDerived)).toBe(norm(derivedHash));
});
