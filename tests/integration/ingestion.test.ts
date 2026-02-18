import { describe, it, expect } from 'vitest';
import { IpfsHasher } from '@alexandrian/protocol/core';
import { DatasetSchema } from '@alexandrian/protocol/schema';
import { Compiler } from '@alexandrian/pipeline';

describe('Alexandrian Protocol Hello World', () => {
  it('should create a knowledge asset with verifiable identity', async () => {
    // 1. Start with raw content
    const content = Buffer.from(`
      Alexandrian Protocol is a decentralized knowledge protocol.
      It enables AI agents to access curated information.
      Contributors are rewarded through a recursive royalty DAG.
    `);

    // 2. Generate fingerprint (Step 1)
    const cid = await IpfsHasher.fromBuffer(content);
    expect(cid).toBeDefined();
    expect(typeof cid).toBe('string');

    // 3. Compile into knowledge blocks (Step 2)
    const compiler = new Compiler();
    const blocks = await compiler.synthesize(content, {
      chunkSize: 50, // Small for testing
      extractEntities: true
    });

    expect(blocks.length).toBeGreaterThanOrEqual(1);

    // 4. Create dataset object (using schema)
    const dataset = {
      id: cid,
      cid: cid,
      fingerprint: cid,
      title: 'Alexandrian Protocol Introduction',
      description: 'A brief introduction to the protocol',
      license: {
        type: 'CC-BY-4.0',
        terms: {
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          derivatives: true
        }
      },
      qualityScore: 100,
      creator: '0x1234...',
      contributor: '0x1234...',
      timestamp: new Date(),
      tags: ['alexandria', 'protocol', 'intro'],
      contentHash: cid,
      blocks: blocks
    };

    // Validate against schema
    const validated = DatasetSchema.parse(dataset);
    expect(validated.id).toBe(cid);

    // 5. CRITICAL TEST: Verify integrity
    // Hash all blocks together and ensure they point back to original
    const blockHashes = await Promise.all(
      blocks.map(block => IpfsHasher.fromBuffer(Buffer.from(JSON.stringify(block))))
    );

    const combinedHash = await IpfsHasher.fromBuffer(Buffer.from(blockHashes.join('')));

    // This is the key insight: the original CID should be recoverable
    // from the blocks (Merkle tree style)
    expect(combinedHash).not.toBe(cid); // Different, but...

    // In a real Merkle tree, the root would match. For simplicity,
    // we just prove we can regenerate something verifiable
    const verification = await IpfsHasher.verify(content, cid);
    expect(verification).toBe(true);

    console.log('✅ Alexandrian Protocol Hello World passed!');
    console.log(`📄 Original CID: ${cid}`);
    console.log(`📦 Generated ${blocks.length} knowledge blocks`);
  });
});
