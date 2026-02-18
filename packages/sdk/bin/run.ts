#!/usr/bin/env node
/**
 * Alexandrian CLI — entry point.
 * Clean output: one confirmation per command, content hash + tx hash, block explorer URL.
 */
import { Command } from "commander";
import { ethers } from "ethers";
import { AlexandrianSDK } from "../client/AlexandrianSDK.js";
import { publishRegistryCommand } from "../commands/publish-registry.js";
import { lineageCommand } from "../commands/lineage.js";
import { inspectCommand } from "../commands/inspect.js";
import { verifyCommand } from "../commands/verify.js";
import { getExplorerTxUrl } from "../lib/explorer.js";

const program = new Command();

program
  .name("alexandrian")
  .description("Alexandrian Protocol CLI — publish KBs, query lineage, settle citations")
  .option("--rpc-url <url>", "RPC URL (default: CHAIN_RPC_URL env)")
  .option("--private-key <key>", "Curator/signer private key (default: PRIVATE_KEY or DEPLOYER_PRIVATE_KEY env)")
  .option("--registry <address>", "Registry contract address (default: REGISTRY_ADDRESS env)")
  .option("--explorer-url <url>", "Block explorer base URL (default: CHAIN_EXPLORER_URL env)")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (!opts.rpcUrl && !process.env.CHAIN_RPC_URL) {
      console.error("Error: Set CHAIN_RPC_URL or pass --rpc-url");
      process.exit(1);
    }
    // Registry and private-key only required for publish, settle, lineage, inspect
    const cmd = process.argv[2];
    if (cmd !== "verify" && cmd !== "accounts") {
      if (!opts.privateKey && !process.env.PRIVATE_KEY && !process.env.DEPLOYER_PRIVATE_KEY) {
        console.error("Error: Set PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) or pass --private-key");
        process.exit(1);
      }
      if (!opts.registry && !process.env.REGISTRY_ADDRESS) {
        console.error("Error: Set REGISTRY_ADDRESS or pass --registry");
        process.exit(1);
      }
    }
  });

function createSDK(): { sdk: AlexandrianSDK; explorerUrl?: string } {
  const rpcUrl = program.opts().rpcUrl ?? process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545";
  const privateKey = program.opts().privateKey ?? process.env.PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
  const registryAddress = program.opts().registry ?? process.env.REGISTRY_ADDRESS;
  const explorerUrl = program.opts().explorerUrl ?? process.env.CHAIN_EXPLORER_URL;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey!, provider);
  const sdk = new AlexandrianSDK({
    provider,
    signer,
    registryAddress: registryAddress!,
  });
  return { sdk, explorerUrl };
}

program
  .command("publish <envelope.json>")
  .description("Publish a KB from a canonical envelope file to the Registry")
  .option("--stake <wei>", "Stake amount in wei (default: 1000000000000000)", "1000000000000000")
  .option("--parent <hash>", "Parent content hash (can repeat); royalty split 50/50 if two parents", (v, prev) => (prev ?? []).concat(v), [] as string[])
  .option("--query-fee <wei>", "Query fee in wei", "0")
  .action(async (envelopePath: string, opts: { stake: string; parent: string[]; queryFee: string }) => {
    try {
      const { sdk, explorerUrl } = createSDK();
      const stakeWei = BigInt(opts.stake);
      const queryFeeWei = BigInt(opts.queryFee);
      const parents = opts.parent?.length
        ? opts.parent.map((hash, i) => ({
            parentHash: hash,
            royaltyShareBps: Math.floor(10000 / opts.parent!.length),
          }))
        : undefined;

      await publishRegistryCommand(sdk, {
        envelopePath,
        stakeWei,
        queryFeeWei,
        parents,
        explorerUrl,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("missing") || msg.includes("required") || msg.includes("not set")) {
        console.error("Error:", msg);
      } else {
        console.error("Error:", msg);
      }
      process.exitCode = 1;
    }
  });

program
  .command("lineage <contentHash>")
  .description("Show parent and derived KBs for a content hash")
  .action(async (contentHash: string) => {
    try {
      const { sdk } = createSDK();
      await lineageCommand(contentHash, sdk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error:", msg);
      process.exitCode = 1;
    }
  });

program
  .command("verify <contentHash>")
  .description("Verify content hash against canonical expected.json (e.g. test-vectors/.../expected.json)")
  .option("--expected <path>", "Path to expected.json containing contentHash", "")
  .action(async (contentHash: string, opts: { expected: string }) => {
    try {
      if (!opts.expected) {
        console.error("Error: --expected <path> is required");
        process.exitCode = 1;
        return;
      }
      await verifyCommand({ contentHash, expectedPath: opts.expected });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error:", msg);
      process.exitCode = 1;
    }
  });

program
  .command("inspect <contentHash>")
  .description("Show on-chain KB metadata: curator, domain, type, stake, query fee")
  .action(async (contentHash: string) => {
    try {
      const { sdk } = createSDK();
      await inspectCommand(contentHash, sdk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error:", msg);
      process.exitCode = 1;
    }
  });

program
  .command("accounts list")
  .description("List accounts visible to the RPC (e.g. Hardhat test accounts) and their ETH balances")
  .action(async () => {
    try {
      const rpcUrl = program.opts().rpcUrl ?? process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        console.log("No accounts returned by RPC.");
        return;
      }
      const net = await provider.getNetwork();
      console.log("Network:", net.name, "chainId:", net.chainId.toString());
      console.log("");
      for (const addr of accounts) {
        const bal = await provider.getBalance(addr);
        console.log(" ", addr, "  ", ethers.formatEther(bal), "ETH");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error:", msg);
      process.exitCode = 1;
    }
  });

program
  .command("earnings <address>")
  .description("Show total earnings for a curator (requires subgraph or indexer; not implemented)")
  .action(async () => {
    console.error("Earnings aggregation not implemented. Query the subgraph or use the block explorer for RoyaltyPaid / QuerySettled events.");
    process.exitCode = 1;
  });

program
  .command("deprecate <contentHash>")
  .description("Mark a KB as deprecated and set superseded-by (Registry does not yet support this)")
  .option("--superseded-by <hash>", "Content hash of the KB that supersedes this one", "")
  .action(async (contentHash: string, opts: { supersededBy: string }) => {
    console.error("Deprecation not implemented. The Registry contract does not yet emit KBDeprecated or store supersededBy.");
    process.exitCode = 1;
  });

program
  .command("settle <contentHash>")
  .description("Settle a citation (pay KB query fee in ETH). Signer must have enough ETH.")
  .action(async (contentHash: string) => {
    try {
      const { sdk, explorerUrl } = createSDK();
      const signer = (sdk as unknown as { signer?: { getAddress: () => Promise<string> } }).signer;
      const agentAddress = signer ? await signer.getAddress() : "";
      const result = await sdk.settleCitation(contentHash, agentAddress);
      console.log("Settled.");
      console.log("  contentHash:", contentHash);
      console.log("  txHash:", result.txHash);
      const url = getExplorerTxUrl(explorerUrl, result.txHash);
      if (url) console.log("  explorer:", url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error:", msg);
      process.exitCode = 1;
    }
  });

program.parse();
