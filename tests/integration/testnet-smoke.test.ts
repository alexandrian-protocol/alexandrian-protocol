/**
 * Testnet smoke — KnowledgeRegistry live on Base Sepolia and register/retrieve.
 * Run after: fund Sepolia wallet → pnpm deploy:testnet → set KNOWLEDGE_REGISTRY_ADDRESS in packages/protocol/.env
 * Skips when KNOWLEDGE_REGISTRY_ADDRESS or PRIVATE_KEY are unset.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { contentHashFromEnvelope } from "@alexandrian/protocol/canonical";

config({ path: resolve(process.cwd(), "packages/protocol/.env") });

const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const REGISTRY_ADDRESS = process.env.KNOWLEDGE_REGISTRY_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const KNOWLEDGE_REGISTRY_ABI = [
  "function registerKB(bytes32 _contentHash, uint8 _type, bytes32[] _parents) external returns (bytes32)",
  "function getKB(bytes32 _kbId) external view returns (tuple(bytes32 contentHash, address curator, uint256 timestamp, uint8 artifactType, bytes32[] parents))",
  "function isVerified(bytes32 _kbId) external view returns (bool)",
];

// KBType enum: Practice=0, Feature=1, StateMachine=2, PromptEngineering=3, ComplianceChecklist=4, Rubric=5
const KB_TYPE_PRACTICE = 0;

const hasTestnet =
  !!REGISTRY_ADDRESS && !!PRIVATE_KEY && REGISTRY_ADDRESS !== "*TBD*";

describe("Testnet smoke — Base Sepolia", () => {
  let provider: JsonRpcProvider;
  let wallet: Wallet;
  let registry: Contract;

  beforeAll(() => {
    if (!hasTestnet) return;
    provider = new JsonRpcProvider(RPC_URL);
    wallet = new Wallet(PRIVATE_KEY!, provider);
    registry = new Contract(REGISTRY_ADDRESS!, KNOWLEDGE_REGISTRY_ABI, wallet);
  });

  it.skipIf(!hasTestnet)("KnowledgeRegistry is live on Base Sepolia", async () => {
    const code = await provider.getCode(REGISTRY_ADDRESS!);
    expect(code).not.toBe("0x");
    expect(code?.length).toBeGreaterThan(2);
  }, 15000);

  it.skipIf(!hasTestnet)("can register and retrieve a KB on Sepolia", async () => {
    const envelopePath = resolve(
      process.cwd(),
      "seeds/software.security/practice-input-validation/envelope.json"
    );
    const envelope = JSON.parse(readFileSync(envelopePath, "utf-8"));
    const contentHashHex = contentHashFromEnvelope(envelope);
    expect(contentHashHex).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const parents: string[] = [];
    try {
      const tx = await registry.registerKB(
        contentHashHex,
        KB_TYPE_PRACTICE,
        parents
      );
      await tx.wait();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "";
      if (!msg.includes("Already registered")) throw e;
    }

    const kb = await registry.getKB(contentHashHex);
    expect(kb).toBeDefined();
    expect(kb.contentHash).toBe(contentHashHex);
    expect(kb.curator?.toLowerCase()).toBe(wallet.address.toLowerCase());
    expect(Number(kb.artifactType)).toBe(KB_TYPE_PRACTICE);
  }, 30000);
});

