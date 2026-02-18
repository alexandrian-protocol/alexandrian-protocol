/**
 * One-command demo: Register KB → Derive KB → show content hashes and CIDs.
 *
 * Run after: pnpm install && pnpm build
 *   pnpm demo
 *
 * No chain required. Uses VirtualRegistry (protocol sandbox).
 * For full flow (anchor to Base, query subgraph, settle citation): deploy:local or deploy:testnet,
 * set REGISTRY_ADDRESS, TOKEN_ADDRESS, PRIVATE_KEY, CHAIN_RPC_URL, then use SDK or API.
 */
import {
  VirtualRegistry,
  contentHashFromEnvelope,
  buildDerivedEnvelope,
  cidV1FromEnvelope,
} from "@alexandrian/protocol/core";
import type { CanonicalEnvelope } from "@alexandrian/protocol/schema";

const CURATOR = "0x0000000000000000000000000000000000000001";

async function main() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Alexandrian Protocol — One-command demo");
  console.log("═══════════════════════════════════════════════\n");

  const registry = new VirtualRegistry();

  // 1. Root KB (practice)
  const rootEnvelope: CanonicalEnvelope = {
    type: "practice",
    domain: "demo",
    sources: [],
    payload: {
      type: "practice",
      rationale: "Demo root KB for one-command protocol showcase.",
      contexts: [],
      failureModes: [],
    },
  };

  const rootResult = await registry.registerEnvelope(rootEnvelope, CURATOR);
  const rootHash = rootResult.kbId;
  const rootCid = await cidV1FromEnvelope(rootEnvelope as unknown as Record<string, unknown>);

  console.log("1. Registered root KB");
  console.log("   contentHash:", rootHash);
  console.log("   CIDv1:     ", rootCid);

  // 2. Derived KB (synthesis from root)
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
  const derivedCid = await cidV1FromEnvelope(derivedEnvelope as unknown as Record<string, unknown>);

  console.log("\n2. Registered derived KB (synthesis from root)");
  console.log("   contentHash:", derivedHash);
  console.log("   CIDv1:     ", derivedCid);

  // 3. Verify hashes match canonical (determinism)
  const recomputedRoot = contentHashFromEnvelope(rootEnvelope as unknown as Record<string, unknown>);
  const recomputedDerived = contentHashFromEnvelope(derivedEnvelope as unknown as Record<string, unknown>);
  const norm = (h: string) => (h.startsWith("0x") ? h : "0x" + h).toLowerCase();
  console.log("\n3. Determinism check");
  console.log("   Root hash matches:", norm(recomputedRoot) === norm(rootHash));
  console.log("   Derived hash matches:", norm(recomputedDerived) === norm(derivedHash));

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Demo complete. Protocol: register → derive → verify.");
  console.log("  For full flow (anchor, query, settle): deploy:local, set env, use SDK.");
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
