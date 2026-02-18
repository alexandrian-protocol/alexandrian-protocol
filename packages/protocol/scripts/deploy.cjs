/**
 * deploy.js — Alexandrian Protocol v1 deploy script
 *
 * Deploys:
 *   1. XanderToken (XANDER ERC-20)
 *   2. AlexandrianRegistry
 *
 * Seeds three named test wallets with XANDER:
 *   - DEPLOYER  (account[0]) — contract owner, API server wallet
 *   - CURATOR   (account[1]) — publishes Knowledge Blocks, receives payments
 *   - AGENT     (account[2]) — queries Knowledge Blocks, pays XANDER
 *
 * Writes ABI + address to:
 *   deployments/Token.json
 *   deployments/Registry.json
 *
 * Usage:
 *   pnpm deploy:local   →  hardhat run scripts/deploy.js --network localhost
 */

const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const XANDER_DECIMALS  = 18n;
const ONE_XANDER       = 10n ** XANDER_DECIMALS;

// Seed amounts per wallet
const CURATOR_SEED     = 500n  * ONE_XANDER;   // 500 XANDER
const AGENT_SEED       = 1000n * ONE_XANDER;   // 1000 XANDER — agent needs balance to pay queries
const DEPLOYER_RESERVE = 100n  * ONE_XANDER;   // 100 XANDER kept on deployer for gas / testing

const DEPLOYMENTS_DIR = path.join(__dirname, "..", "deployments");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function xander(n) {
  return (BigInt(n) * ONE_XANDER).toString();
}

function writeDeployment(name, address, abi) {
  const filePath = path.join(DEPLOYMENTS_DIR, `${name}.json`);
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ address, abi }, null, 2));
  console.log(`  ✅ Written: deployments/${name}.json`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer, curator, agent] = await hre.ethers.getSigners();

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Alexandrian Protocol — v1 Deploy");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Network:   ${hre.network.name}`);
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Curator:   ${curator.address}`);
  console.log(`  Agent:     ${agent.address}`);
  console.log("───────────────────────────────────────────────\n");

  // ── 1. Deploy XanderToken ──────────────────────────────────────────────────

  console.log("1. Deploying XanderToken...");
  const TokenFactory = await hre.ethers.getContractFactory("XanderToken", deployer);
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`   Address: ${tokenAddress}`);

  // ── 2. Deploy AlexandrianRegistry ──────────────────────────────────────────

  console.log("\n2. Deploying AlexandrianRegistry...");
  const RegistryFactory = await hre.ethers.getContractFactory("AlexandrianRegistry", deployer);
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`   Address: ${registryAddress}`);

  // ── 2b. Deploy KYAStaking (extends AgentRegistry) ─────────────────────────

  console.log("\n2b. Deploying KYAStaking...");
  const KYAStakingFactory = await hre.ethers.getContractFactory("KYAStaking", deployer);
  const kyaStaking = await KYAStakingFactory.deploy(tokenAddress);
  await kyaStaking.waitForDeployment();
  const kyaStakingAddress = await kyaStaking.getAddress();
  console.log(`   Address: ${kyaStakingAddress}`);

  // ── 2c. Deploy EpochCommit (ledger Merkle root per epoch) ──────────────────
  console.log("\n2c. Deploying EpochCommit...");
  const EpochCommitFactory = await hre.ethers.getContractFactory("EpochCommit", deployer);
  const epochCommit = await EpochCommitFactory.deploy();
  await epochCommit.waitForDeployment();
  const epochCommitAddress = await epochCommit.getAddress();
  console.log(`   Address: ${epochCommitAddress}`);

  // ── 3. Seed wallets with XANDER ───────────────────────────────────────────

  console.log("\n3. Seeding wallets with XANDER...");

  await (await token.mint(deployer.address, DEPLOYER_RESERVE)).wait();
  console.log(`   DEPLOYER: ${Number(DEPLOYER_RESERVE / ONE_XANDER)} XANDER`);

  await (await token.mint(curator.address, CURATOR_SEED)).wait();
  console.log(`   CURATOR:  ${Number(CURATOR_SEED / ONE_XANDER)} XANDER`);

  await (await token.mint(agent.address, AGENT_SEED)).wait();
  console.log(`   AGENT:    ${Number(AGENT_SEED / ONE_XANDER)} XANDER`);

  // ── 4. Approvals (agent → deployer, curator → KYAStaking) ───────────────────
  // Agent must approve deployer so the API can transferFrom on query payments.
  // Curator must approve KYAStaking so stake() can transferFrom.

  console.log("\n4. Approving XANDER spend...");
  const LARGE_ALLOWANCE = 10000n * ONE_XANDER;
  const tokenAsAgent = token.connect(agent);
  const tokenAsCurator = token.connect(curator);
  await (await tokenAsAgent.approve(deployer.address, LARGE_ALLOWANCE)).wait();
  console.log(`   Agent approved deployer to spend up to ${Number(LARGE_ALLOWANCE / ONE_XANDER)} XANDER`);
  await (await tokenAsCurator.approve(kyaStakingAddress, LARGE_ALLOWANCE)).wait();
  console.log(`   Curator approved KYAStaking to spend up to ${Number(LARGE_ALLOWANCE / ONE_XANDER)} XANDER`);

  // ── 5. Write deployment JSON ───────────────────────────────────────────────

  console.log("\n5. Writing deployment files...");

  const tokenArtifact       = await hre.artifacts.readArtifact("XanderToken");
  const registryArtifact    = await hre.artifacts.readArtifact("AlexandrianRegistry");
  const kyaStakingArtifact  = await hre.artifacts.readArtifact("KYAStaking");
  const epochCommitArtifact = await hre.artifacts.readArtifact("EpochCommit");

  writeDeployment("Token",       tokenAddress,       tokenArtifact.abi);
  writeDeployment("Registry",    registryAddress,    registryArtifact.abi);
  writeDeployment("KYAStaking",  kyaStakingAddress,   kyaStakingArtifact.abi);
  writeDeployment("EpochCommit", epochCommitAddress, epochCommitArtifact.abi);

  // ── 6. Verify balances ────────────────────────────────────────────────────

  console.log("\n6. Verifying balances...");
  const deployerBal = await token.balanceOfXander(deployer.address);
  const curatorBal  = await token.balanceOfXander(curator.address);
  const agentBal    = await token.balanceOfXander(agent.address);

  console.log(`   DEPLOYER: ${deployerBal} XANDER`);
  console.log(`   CURATOR:  ${curatorBal} XANDER`);
  console.log(`   AGENT:    ${agentBal} XANDER`);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Deploy complete ✅");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Token:       ${tokenAddress}`);
  console.log(`  Registry:    ${registryAddress}`);
  console.log(`  KYAStaking:  ${kyaStakingAddress}`);
  console.log(`  EpochCommit: ${epochCommitAddress}`);
  console.log("═══════════════════════════════════════════════\n");

  // ── 7. Print env vars for copy-paste into .env ────────────────────────────

  console.log("  Copy these into your packages/api/.env:\n");
  console.log(`  REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`  KYA_STAKING_ADDRESS=${kyaStakingAddress}`);
  console.log(`  EPOCH_COMMIT_ADDRESS=${epochCommitAddress}`);
  console.log(`  TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`  DEPLOYER_ADDRESS=${deployer.address}`);
  console.log(`  CURATOR_ADDRESS=${curator.address}`);
  console.log(`  AGENT_ADDRESS=${agent.address}`);
  console.log(`  CHAIN_RPC_URL=http://localhost:8545`);
  console.log(`  CHAIN_EXPLORER_URL=  # optional; e.g. https://sepolia.basescan.org for Base Sepolia\n`);
}

main()
  .then(() => {
    // Brief delay to let RPC connection close cleanly (avoids Node/libuv crash on Windows)
    setTimeout(() => process.exit(0), 500);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
