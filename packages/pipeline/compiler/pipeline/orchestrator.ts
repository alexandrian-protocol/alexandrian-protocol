import { IpfsHasher, LicenseValidator, LICENSE_PRESETS, type License } from '@alexandrian/protocol/core';
import { DatasetSchema, type Dataset } from '@alexandrian/protocol/schema';
import { ExtractorFactory } from '../extractors/factory.js';
import { Processor, type KnowledgeBlock } from '../processors/processor.js';

export type { KnowledgeBlock };

export interface PipelineOptions {
  license?: License;
  tags?: string[];
  title?: string;
  description?: string;
  extractMetadata?: boolean;
  chunkSize?: number;
  /** Suppress console output (for library use) */
  quiet?: boolean;
}

export interface PipelineResult {
  dataset: Dataset;
  fingerprint: string;
  cid: string;
  blocks: KnowledgeBlock[];
  metadata: Record<string, unknown>;
}

export class AlexandrianPipeline {
  private extractorFactory: ExtractorFactory;
  private processor: Processor;

  constructor() {
    this.extractorFactory = new ExtractorFactory();
    this.processor = new Processor();
  }

  async runPipeline(file: Buffer, filename: string, options: PipelineOptions): Promise<PipelineResult> {
    const log = options.quiet ? () => {} : console.log;
    log(`📄 Processing: ${filename}`);

    log('  Step 1/5: Extracting content...');
    const extractor = this.extractorFactory.getExtractor(filename);
    const extracted = await extractor.extract(file);

    log('  Step 2/5: Generating fingerprint...');
    const fingerprint = await IpfsHasher.fromBuffer(file);
    const contentFingerprint = await IpfsHasher.fromString(extracted.text);

    log('  Step 3/5: Processing into knowledge blocks...');
    const blocks = await this.processor.process(extracted.text, {
      chunkSize: options.chunkSize || 1000,
      extractEntities: true,
      generateEmbeddings: true
    });

    console.log('  Step 4/5: Attaching license...');
    const license: License = options.license ?? {
      type: 'CC-BY-4.0',
      terms: LICENSE_PRESETS['CC-BY-4.0'],
      metadata: { payout: { price: 0 } }, // Free commercial use
    };

    const licenseValidation = LicenseValidator.validateLicense(license);

    if (!licenseValidation.valid) {
      throw new Error(`Invalid license: ${licenseValidation.errors.join(', ')}`);
    }

    log('  Step 5/5: Validating against schema...');

    const packageData = {
      content: extracted.text,
      blocks,
      metadata: {
        filename,
        contentType: extracted.metadata?.contentType,
        wordCount: extracted.text.split(/\s+/).length,
        blockCount: blocks.length
      }
    };

    const cid = await IpfsHasher.fromBuffer(Buffer.from(JSON.stringify(packageData)));

    const dataset: Dataset = {
      id: fingerprint,
      cid: cid,
      fingerprint: fingerprint,
      title: options.title || filename,
      description: options.description || `Extracted from ${filename}`,
      license: license,
      qualityScore: 100,
      creator: 'pending',
      contributor: 'pending',
      timestamp: new Date(),
      tags: options.tags || [],
      contentHash: contentFingerprint,
      blocks: blocks,
      metadata: {
        ...extracted.metadata,
        ...options,
        processingTime: new Date().toISOString()
      }
    };

    const validated = DatasetSchema.parse(dataset);

    log(`✅ Pipeline complete for ${filename}`);
    log(`   📍 Fingerprint: ${fingerprint.slice(0, 16)}...`);
    log(`   📦 CID: ${cid.slice(0, 16)}...`);
    log(`   📚 Blocks: ${blocks.length}`);

    return {
      dataset: validated,
      fingerprint,
      cid,
      blocks,
      metadata: extracted.metadata || {}
    };
  }

  /** Raw text input — uses TextExtractor, same flow as file. */
  async runFromText(content: string, options: PipelineOptions = {}): Promise<PipelineResult> {
    return this.runPipeline(Buffer.from(content, 'utf-8'), 'input.txt', options);
  }

  /** Alias for runFromText (legacy). */
  async runQuick(content: string, options: PipelineOptions = {}): Promise<PipelineResult> {
    return this.runFromText(content, options);
  }

  async verifyDataset(dataset: Dataset, originalFile?: Buffer): Promise<boolean> {
    if (originalFile) {
      const fingerprint = await IpfsHasher.fromBuffer(originalFile);
      if (fingerprint !== dataset.fingerprint) {
        console.error('❌ Fingerprint mismatch');
        return false;
      }
    }

    const packageData = {
      content: (dataset.blocks as { text: string }[]).map(b => b.text).join('\n'),
      blocks: dataset.blocks,
      metadata: dataset.metadata
    };

    const computedCid = await IpfsHasher.fromBuffer(Buffer.from(JSON.stringify(packageData)));

    if (computedCid !== dataset.cid) {
      console.error('❌ CID mismatch');
      return false;
    }

    const licenseValidation = LicenseValidator.validateLicense(dataset.license as License);
    if (!licenseValidation.valid) {
      console.error('❌ License invalid:', licenseValidation.errors);
      return false;
    }

    console.log('✅ Dataset verification passed');
    return true;
  }
}
