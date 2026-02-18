import { Processor } from './processors/processor.js';
import type { KnowledgeBlock } from './processors/processor.js';

export type SynthesizeOptions = {
  chunkSize?: number;
  extractEntities?: boolean;
};

export class Compiler {
  private processor = new Processor();

  async synthesize(content: Buffer | string, options: SynthesizeOptions = {}): Promise<KnowledgeBlock[]> {
    const text = typeof content === 'string' ? content : content.toString('utf8');
    return this.processor.process(text, {
      chunkSize: options.chunkSize ?? 150,
      extractEntities: options.extractEntities ?? true,
    });
  }
}
