import { readFile } from 'fs/promises';
import { AlexandrianPipeline, type PipelineOptions } from '@alexandrian/pipeline';
import { EconomicInvariants, type RoyaltyNode } from '@alexandrian/protocol/core';

type RegistryClient = {
  registerAsset: (
    fingerprint: string,
    cid: string,
    license: unknown,
    parents: string[]
  ) => Promise<{ assetId: string }>;
  fetchNodes?: (parents: string[]) => Promise<RoyaltyNode[]>;
};

export type PublishOptions = {
  parents?: string[];
  registry?: RegistryClient;
  [key: string]: unknown;
};

export async function publishCommand(filePath: string, options: PublishOptions = {}) {
  const pipeline = new AlexandrianPipeline();

  // --- PHASE 1: INGESTION & CONTENT INVARIANTS ---
  const fileBuffer = await readFile(filePath);
  const result = await pipeline.runPipeline(fileBuffer, filePath, options as unknown as PipelineOptions);

  // --- PHASE 2: LEGAL INVARIANTS ---
  console.log('⚖️ License Verified:', result.dataset.license.type);

  // --- PHASE 3: ECONOMIC INVARIANTS ---
  if (options.parents && options.parents.length > 0) {
    if (!options.registry?.fetchNodes) {
      throw new Error('Registry client missing fetchNodes() for parent lookup');
    }

    const nodes = await options.registry.fetchNodes(options.parents);
    EconomicInvariants.validateNoCycles(nodes);
    EconomicInvariants.validateRoyaltyDAG(nodes);
    console.log('💸 Royalty DAG Validated: No loops or over-payments detected.');
  }

  // --- PHASE 4: SETTLEMENT (THE ANCHOR) ---
  if (!options.registry?.registerAsset) {
    throw new Error('Registry client missing registerAsset()');
  }

  console.log('🔗 Anchoring to Filecoin Virtual Machine...');
  const tx = await options.registry.registerAsset(
    result.fingerprint,
    result.cid,
    result.dataset.license,
    options.parents || []
  );

  console.log('✅ SUCCESS: Knowledge Asset Published!');
  console.log(`📍 Asset ID: ${tx.assetId}`);
  return tx.assetId;
}
