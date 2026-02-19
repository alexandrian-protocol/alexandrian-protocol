/**
 * Subgraph integration — The Graph indexes KBRegistered; lineage and artifactType queryable.
 * Run after: deploy testnet → register 2–3 seed KBs → deploy subgraph → set SUBGRAPH_QUERY_URL and KNOWLEDGE_REGISTRY_ADDRESS in packages/protocol/.env
 * Skips when SUBGRAPH_QUERY_URL or KNOWLEDGE_REGISTRY_ADDRESS or PRIVATE_KEY are unset.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { contentHashFromEnvelope } from "@alexandrian/protocol/canonical";

config({ path: resolve(process.cwd(), "packages/protocol/.env") });

const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const SUBGRAPH_QUERY_URL = process.env.SUBGRAPH_QUERY_URL;
const REGISTRY_ADDRESS = process.env.KNOWLEDGE_REGISTRY_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const KNOWLEDGE_REGISTRY_ABI = [
  "function registerKB(bytes32 _contentHash, uint8 _type, bytes32[] _parents) external returns (bytes32)",
  "function getKB(bytes32 _kbId) external view returns (tuple(bytes32 contentHash, address curator, uint256 timestamp, uint8 artifactType, bytes32[] parents))",
];

const KB_TYPE_PRACTICE = 0;
const KB_TYPE_STATEMACHINE = 2;

const hasSubgraph =
  !!SUBGRAPH_QUERY_URL &&
  !!REGISTRY_ADDRESS &&
  !!PRIVATE_KEY &&
  REGISTRY_ADDRESS !== "*TBD*";

async function querySubgraph<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(SUBGRAPH_QUERY_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Subgraph HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data as T;
}

interface KnowledgeBlockResult {
  id: string;
  curator: string;
  artifactType: string;
  parentCount: number;
  parents: string[];
}

async function pollKnowledgeBlock(kbId: string, maxWaitMs = 90000): Promise<KnowledgeBlockResult | null> {
  const start = Date.now();
  const id = kbId.startsWith("0x") ? kbId.toLowerCase() : kbId;
  const query = `
    query GetKB($id: ID!) {
      knowledgeBlock(id: $id) {
        id
        curator
        artifactType
        parentCount
        parents
      }
    }
  `;
  while (Date.now() - start < maxWaitMs) {
    const data = await querySubgraph<{ knowledgeBlock: KnowledgeBlockResult | null }>(query, { id });
    if (data?.knowledgeBlock) return data.knowledgeBlock;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

describe("Subgraph — Base Sepolia", () => {
  let provider: JsonRpcProvider;
  let wallet: Wallet;
  let registry: Contract;
  let parentKbId: string;
  let childKbId: string;

  beforeAll(async () => {
    if (!hasSubgraph) return;
    provider = new JsonRpcProvider(RPC_URL);
    wallet = new Wallet(PRIVATE_KEY!, provider);
    registry = new Contract(REGISTRY_ADDRESS!, KNOWLEDGE_REGISTRY_ABI, wallet);

    const parentPath = resolve(process.cwd(), "seeds/software.security/practice-input-validation/envelope.json");
    const childPath = resolve(process.cwd(), "seeds/software.security/practice-rate-limiting/envelope.json");
    const parentEnvelope = JSON.parse(readFileSync(parentPath, "utf-8"));
    const childEnvelope = JSON.parse(readFileSync(childPath, "utf-8"));
    parentKbId = contentHashFromEnvelope(parentEnvelope);
    childKbId = contentHashFromEnvelope(childEnvelope);

    try {
      await (await registry.registerKB(parentKbId, KB_TYPE_PRACTICE, [])).wait();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "";
      if (!msg.includes("Already registered")) throw e;
    }
    try {
      await (await registry.registerKB(childKbId, KB_TYPE_PRACTICE, [parentKbId])).wait();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "";
      if (!msg.includes("Already registered")) throw e;
    }
  }, 60000);

  it.skipIf(!hasSubgraph)("subgraph indexes KBRegistered event", async () => {
    const kb = await pollKnowledgeBlock(parentKbId);
    expect(kb).not.toBeNull();
    expect(kb!.id).toBe(parentKbId.toLowerCase());
    expect(kb!.curator?.toLowerCase()).toBe(wallet.address.toLowerCase());
    expect(Number(kb!.parentCount)).toBe(0);
  }, 95000);

  it.skipIf(!hasSubgraph)("lineage is queryable via subgraph", async () => {
    const child = await pollKnowledgeBlock(childKbId);
    expect(child).not.toBeNull();
    expect(child!.parentCount).toBe(1);
    const parentRefs = child!.parents.map((p) => String(p).toLowerCase());
    expect(parentRefs).toContain(parentKbId.toLowerCase());
  }, 95000);

  it.skipIf(!hasSubgraph)("subgraph returns correct artifactType", async () => {
    const kb = await pollKnowledgeBlock(parentKbId);
    expect(kb).not.toBeNull();
    expect(Number(kb!.artifactType)).toBe(KB_TYPE_PRACTICE);
    const stateMachinePath = resolve(process.cwd(), "seeds/software.security/state-machine-auth-flow/envelope.json");
    const stateMachineEnvelope = JSON.parse(readFileSync(stateMachinePath, "utf-8"));
    const stateMachineKbId = contentHashFromEnvelope(stateMachineEnvelope);
    try {
      await (await registry.registerKB(stateMachineKbId, KB_TYPE_STATEMACHINE, [])).wait();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "";
      if (!msg.includes("Already registered")) throw e;
    }
    const stateMachineKb = await pollKnowledgeBlock(stateMachineKbId);
    expect(stateMachineKb).not.toBeNull();
    expect(Number(stateMachineKb!.artifactType)).toBe(KB_TYPE_STATEMACHINE);
  }, 95000);
});
