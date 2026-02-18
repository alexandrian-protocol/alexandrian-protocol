/**
 * Embedder Interface — Inversion of Control
 *
 * The runtime depends only on the Embedder interface.
 * Swap implementations without changing any other code:
 *
 *   const embedder = new StubEmbedder();    // development, no cost
 *   const embedder = new OpenAIEmbedder();  // hosted, production
 *   const embedder = new LocalEmbedder();   // local Ollama, no API cost
 *
 * Redis vector index dimensions must match the embedder:
 *   StubEmbedder → DIM 8  (not useful for real search)
 *   OpenAIEmbedder → DIM 1536
 *   CohereEmbedder → DIM 1024
 *   LocalEmbedder (nomic-embed-text) → DIM 768
 */

// ─── Interface ────────────────────────────────────────────────────────────────

export interface Embedder {
  /** Embed a single text string */
  embed(text: string): Promise<number[]>;
  /** Embed multiple texts — implementations should use batch API for efficiency */
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Vector dimensions this embedder produces */
  readonly dimensions: number;
  /** Human-readable model name for logging */
  readonly modelName: string;
}

// ─── Stub Embedder ────────────────────────────────────────────────────────────

/**
 * Deterministic placeholder — keeps the pipeline running without any API.
 * NOT useful for real semantic search.
 * Use for: local development, CI, demo without external dependencies.
 */
export class StubEmbedder implements Embedder {
  readonly dimensions = 8;
  readonly modelName  = 'stub';

  async embed(text: string): Promise<number[]> {
    const seed = text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return Array.from({ length: this.dimensions }, (_, i) =>
      ((seed * (i + 1)) % 100) / 100
    );
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

// ─── OpenAI Embedder ──────────────────────────────────────────────────────────

/**
 * OpenAI text-embedding-3-small — hosted, 1536 dimensions.
 * Requires: pnpm add openai
 * Requires: OPENAI_API_KEY in .env
 *
 * Cost: ~$0.02 per 1M tokens (very cheap for knowledge blocks)
 */
export class OpenAIEmbedder implements Embedder {
  readonly dimensions = 1536;
  readonly modelName  = 'text-embedding-3-small';
  private client: any;

  constructor(apiKey?: string) {
    // Dynamic import to avoid hard dependency when not in use
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OpenAI API key required. Set OPENAI_API_KEY in .env');

    // Usage:
    // import OpenAI from 'openai';
    // this.client = new OpenAI({ apiKey: key });
    throw new Error(
      'OpenAIEmbedder: install openai package first.\n' +
      'Run: pnpm --filter @alexandrian/pipeline add openai\n' +
      'Then uncomment the implementation in embedder.ts'
    );
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.modelName,
      input: text,
    });
    return res.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // OpenAI supports batching in a single API call
    const res = await this.client.embeddings.create({
      model: this.modelName,
      input: texts,
    });
    return res.data.map((d: any) => d.embedding);
  }
}

// ─── Local Embedder (Ollama) ──────────────────────────────────────────────────

/**
 * nomic-embed-text via Ollama — local, no API cost, 768 dimensions.
 * Requires: Ollama running on localhost:11434
 * Setup: ollama pull nomic-embed-text
 *
 * Best for: development without API costs, privacy-sensitive content
 */
export class LocalEmbedder implements Embedder {
  readonly dimensions = 768;
  readonly modelName  = 'nomic-embed-text';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.modelName, prompt: text }),
    });

    if (!res.ok) {
      throw new Error(
        `Ollama embedding failed: ${res.status}.\n` +
        'Ensure Ollama is running: ollama serve\n' +
        'Pull the model: ollama pull nomic-embed-text'
      );
    }

    const data = await res.json();
    return data.embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Ollama doesn't support batch in older versions — embed sequentially
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

// ─── Cohere Embedder ──────────────────────────────────────────────────────────

/**
 * Cohere embed-english-v3.0 — hosted, 1024 dimensions.
 * Requires: pnpm add cohere-ai
 * Requires: COHERE_API_KEY in .env
 */
export class CohereEmbedder implements Embedder {
  readonly dimensions = 1024;
  readonly modelName  = 'embed-english-v3.0';
  private client: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.COHERE_API_KEY;
    if (!key) throw new Error('Cohere API key required. Set COHERE_API_KEY in .env');

    throw new Error(
      'CohereEmbedder: install cohere-ai package first.\n' +
      'Run: pnpm --filter @alexandrian/pipeline add cohere-ai\n' +
      'Then uncomment the implementation in embedder.ts'
    );
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embed({
      texts: [text],
      model: this.modelName,
      inputType: 'search_document',
    });
    return res.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await this.client.embed({
      texts,
      model: this.modelName,
      inputType: 'search_document',
    });
    return res.embeddings;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create the appropriate embedder based on environment config.
 *
 * Priority:
 *   1. EMBEDDER=local  → LocalEmbedder (Ollama)
 *   2. OPENAI_API_KEY  → OpenAIEmbedder
 *   3. COHERE_API_KEY  → CohereEmbedder
 *   4. fallback        → StubEmbedder
 */
export function createEmbedder(): Embedder {
  const override = process.env.EMBEDDER?.toLowerCase();

  if (override === 'stub')  return new StubEmbedder();
  if (override === 'local') return new LocalEmbedder(process.env.OLLAMA_URL);

  if (process.env.OPENAI_API_KEY)  return new OpenAIEmbedder();
  if (process.env.COHERE_API_KEY)  return new CohereEmbedder();

  console.warn(
    '[Embedder] No embedding provider configured. Using stub.\n' +
    'For real semantic search, set OPENAI_API_KEY or COHERE_API_KEY,\n' +
    'or run Ollama locally and set EMBEDDER=local'
  );
  return new StubEmbedder();
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector dimensions must match');
  const dot  = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return (magA === 0 || magB === 0) ? 0 : dot / (magA * magB);
}

/** Backward-compatible function wrapper — existing callers keep working. */
export function embed(text: string, dimensions = 8): number[] {
  const seed = text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Array.from({ length: dimensions }, (_, i) => ((seed * (i + 1)) % 100) / 100);
}