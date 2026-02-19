/**
 * deploy-testnet.cjs — Alexandrian Protocol testnet deploy (ETH-only)
 *
 * Deploys only AlexandrianRegistry. Uses native ETH for stake and query fees
 * (no XanderToken, KYAStaking, or EpochCommit). Suitable for Base Sepolia
 * and other EVM testnets where you use the chain's native token (ETH).
 *
 * Usage:
 *   PRIVATE_KEY=0x... pnpm exec hardhat run scripts/deploy-testnet.cjs --network base-sepolia
 *
 * Writes: deployments/Registry.json
 *
 * After deploy, set in packages/api/.env and subgraph/subgraph.yaml:
 *   REGISTRY_ADDRESS=<address>
 *   CHAIN_RPC_URL=https://sepolia.base.org
 */

const path = require("path");
// Load protocol .env when run from repo root (e.g. pnpm deploy:testnet)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const hre = require("hardhat");
const fs = require("fs");

const DEPLOYMENTS_DIR = path.join(__dirname, "..", "deployments");

function writeDeployment(name, address, abi) {
  const filePath = path.join(DEPLOYMENTS_DIR, `${name}.json`);
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ address, abi }, null, 2));
  console.log(`  ✅ Written: deployments/${name}.json`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    console.error("\n  Missing deployer: set BASE_SEPOLIA_RPC_URL and PRIVATE_KEY in packages/protocol/.env");
    console.error("  Example: PRIVATE_KEY=0x... BASE_SEPOLIA_RPC_URL=https://sepolia.base.org");
    process.exit(1);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Alexandrian Protocol — Testnet Deploy (ETH)");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Network:  ${hre.network.name}`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log("───────────────────────────────────────────────\n");

  console.log("Deploying AlexandrianRegistry (ETH stake/query)...");
  const RegistryFactory = await hre.ethers.getContractFactory(
    "AlexandrianRegistry",
    deployer
  );
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`   Address: ${registryAddress}`);

  const registryArtifact = await hre.artifacts.readArtifact("AlexandrianRegistry");
  writeDeployment("Registry", registryAddress, registryArtifact.abi);

  console.log("\nDeploying KnowledgeRegistry (V2 — subgraph)...");
  const KRFactory = await hre.ethers.getContractFactory("KnowledgeRegistry", deployer);
  const knowledgeRegistry = await KRFactory.deploy();
  await knowledgeRegistry.waitForDeployment();
  const krAddress = await knowledgeRegistry.getAddress();
  console.log(`   Address: ${krAddress}`);

  const krArtifact = await hre.artifacts.readArtifact("KnowledgeRegistry");
  writeDeployment("KnowledgeRegistry", krAddress, krArtifact.abi);

  // Use the block that actually contains the KnowledgeRegistry deploy (not "latest")
  const krDeployTx = knowledgeRegistry.deploymentTransaction();
  const deployBlock = krDeployTx
    ? (await krDeployTx.wait()).blockNumber
    : await hre.ethers.provider.getBlockNumber();
  console.log(`   Block:   ${deployBlock}`);

  // Patch subgraph.yaml so testers don't have to edit by hand
  const subgraphYamlPath = path.join(__dirname, "..", "..", "..", "subgraph", "subgraph.yaml");
  if (fs.existsSync(subgraphYamlPath)) {
    let yaml = fs.readFileSync(subgraphYamlPath, "utf8");
    yaml = yaml.replace(/address:\s*"0x[a-fA-F0-9]{40}"/, `address: "${krAddress}"`);
    yaml = yaml.replace(/startBlock:\s*\d+/, `startBlock: ${deployBlock}`);
    fs.writeFileSync(subgraphYamlPath, yaml);
    console.log("\n  ✅ subgraph/subgraph.yaml updated with KnowledgeRegistry address and startBlock.");
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Deploy complete ✅");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Registry:          ${registryAddress}`);
  console.log(`  KnowledgeRegistry: ${krAddress} (use in subgraph)`);
  console.log("═══════════════════════════════════════════════\n");
  console.log("  Copy to packages/api/.env:");
  console.log(`  REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`  CHAIN_RPC_URL=${hre.network.config.url}`);
  console.log(`  DEPLOYER_ADDRESS=${deployer.address}`);
  console.log("\n  Update specs/TESTNET-ADDRESSES.md with both addresses.");
  console.log("  Subgraph: confirm startBlock in subgraph/subgraph.yaml (must be actual deploy block, not 0).");
  console.log("  Then: pnpm subgraph:deploy (or codegen + build + graph deploy --studio <slug>).");
  const chainId = Number(hre.network.config.chainId);
  const explorerBase = chainId === 84532 ? "https://sepolia.basescan.org" : chainId === 8453 ? "https://basescan.org" : "";
  if (explorerBase) {
    console.log(`\n  Verify block on Basescan: ${explorerBase}/block/${deployBlock}`);
    console.log(`  CHAIN_EXPLORER_URL=${explorerBase}`);
  }
  console.log("");
}

(async () => {
  try {
    await main();
    setTimeout(() => process.exit(0), 500);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
