/**
 * Knowledge Block Processor — Protocol-Grade
 *
 * Produces fully enriched KnowledgeBlocks ready for:
 *   - Semantic retrieval (embedding + entity filters)
 *   - Quality scoring (qualityScore field)
 *   - Derivation chains (documentId + parentId)
 *   - Hybrid search (keywords for BM25 + vectors for semantic)
 *   - Curator dashboard display (chunkType, importance, entityMap)
 */

import { semanticChunk } from './chunker.js';
import { createEmbedder, type Embedder } from './embedder.js';
import { extractEntitiesTyped, groupEntitiesByType, type Entity, type EntityType } from './entityExtractor.js';
import { summarize }                                                       from './summarizer.js';

// ─── KnowledgeBlock ───────────────────────────────────────────────────────────

export interface KnowledgeBlock {
  // ── Identity ─────────────────────────────────────────────────────────────
  /** Unique block ID within this document: block-0, block-1, ... */
  id: string;
  /** Source document ID (content hash or KB ID) — links all blocks to parent */
  documentId: string;
  /** Parent block ID for derived/split blocks (optional) */
  parentId?: string;

  // ── Content ──────────────────────────────────────────────────────────────
  text: string;
  summary: string;
  /** High-frequency nouns + entity text + section heading tokens */
  keywords: string[];

  // ── Structure ─────────────────────────────────────────────────────────────
  chunkType:     'section' | 'paragraph' | 'summary' | 'definition' | 'unknown';
  importance:    number;     // 0–1
  wordCount:     number;
  sentenceCount: number;
  position: {
    sectionIndex:   number;
    paragraphIndex: number;
    /** Linear index across all blocks in the document */
    blockIndex:     number;
    total:          number;
    isFirst:        boolean;
    isLast:         boolean;
  };
  sectionHeading?: string;

  // ── Entities ──────────────────────────────────────────────────────────────
  /** Top entity strings — backward compatible with old API */
  entities: string[];
  /** Typed entity map grouped by category */
  entityMap: Partial<Record<EntityType, string[]>>;
  /** Full entity objects for detailed analysis */
  entityDetails: Entity[];

  // ── Quality ───────────────────────────────────────────────────────────────
  /** Quality score 0–100 (heuristic: entity density, importance, word count). */
  qualityScore: number;

  // ── Embeddings ────────────────────────────────────────────────────────────
  /** Semantic embedding vector. Dimensions depend on configured embedder. */
  embedding?: number[];
}

// ─── Processor Options ────────────────────────────────────────────────────────

export type ProcessorOptions = {
  /** Document ID to attach to all blocks (default: auto-generated) */
  documentId?: string;
  /** Target words per chunk (default: 150) */
  chunkSize?: number;
  /** Run entity extraction (default: true) */
  extractEntities?: boolean;
  /** Generate embeddings (default: true) */
  generateEmbeddings?: boolean;
  /** Sentences to overlap between chunks (default: 1) */
  overlapSentences?: number;
  /** Override the embedder (useful for testing) */
  embedder?: Embedder;
};

// ─── Keyword Extraction ───────────────────────────────────────────────────────

/**
 * Extract keywords from text:
 *   - Entity text (already extracted)
 *   - High-frequency nouns (simple heuristic: capitalized words, length > 3)
 *   - Section heading tokens
 *
 * No external library needed — good enough for hybrid search.
 */
function extractKeywords(
  text: string,
  entities: Entity[],
  sectionHeading?: string
): string[] {
  const keywords = new Set<string>();

  // From entities — already the most meaningful terms
  entities
    .filter(e => e.confidence > 0.7)
    .forEach(e => keywords.add(e.text.toLowerCase()));

  // From heading tokens
  if (sectionHeading) {
    sectionHeading
      .split(/\s+/)
      .filter(t => t.length > 3)
      .forEach(t => keywords.add(t.toLowerCase()));
  }

  // High-frequency nouns: words appearing 2+ times, length > 4, not stop words
  const STOP = new Set([
    'that', 'this', 'with', 'from', 'they', 'have', 'been', 'were',
    'their', 'there', 'which', 'when', 'what', 'will', 'your', 'each',
    'into', 'more', 'also', 'some', 'than', 'then', 'them', 'these',
  ]);

  const wordFreq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOP.has(w));

  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
  }

  for (const [word, count] of wordFreq) {
    if (count >= 2) keywords.add(word);
  }

  return Array.from(keywords).slice(0, 20); // Top 20 keywords per block
}

// ─── Quality Score Heuristic ──────────────────────────────────────────────────

/**
 * Heuristic quality score — 0 to 100.
 * Based on: entity density, importance, word count, chunk completeness.
 */
function computeQualityScore(
  importance: number,
  entityCount: number,
  wordCount: number,
  isComplete: boolean
): number {
  const importancePoints = importance * 40;           // Max 40
  const entityPoints     = Math.min(entityCount * 3, 30); // Max 30
  const wordPoints       = Math.min(wordCount / 5, 20);    // Max 20, 100 words = 20pts
  const completenessBonus = isComplete ? 10 : 0;          // 10 bonus for paragraph-complete

  return Math.round(importancePoints + entityPoints + wordPoints + completenessBonus);
}

// ─── Processor ────────────────────────────────────────────────────────────────

export class Processor {
  private defaultEmbedder: Embedder;

  constructor(embedder?: Embedder) {
    this.defaultEmbedder = embedder ?? createEmbedder();
  }

  async process(text: string, options: ProcessorOptions = {}): Promise<KnowledgeBlock[]> {
    const {
      documentId         = `doc-${Date.now()}`,
      chunkSize          = 150,
      extractEntities    = true,
      generateEmbeddings = true,
      overlapSentences   = 1,
      embedder           = this.defaultEmbedder,
    } = options;

    // ── 1. Semantic chunking ──────────────────────────────────────────────────
    const semanticChunks = semanticChunk(text, {
      targetWords:      chunkSize,
      maxWords:         Math.round(chunkSize * 2),
      overlapSentences: overlapSentences,
    });

    const total = semanticChunks.length;

    // ── 2. Batch embed all chunks upfront (one API call for OpenAI/Cohere) ────
    let embeddings: number[][] = [];
    if (generateEmbeddings) {
      embeddings = await embedder.embedBatch(semanticChunks.map(c => c.text));
    }

    // ── 3. Build blocks ───────────────────────────────────────────────────────
    const blocks: KnowledgeBlock[] = semanticChunks.map((sc, index) => {
      // Entity extraction
      const entityDetails = extractEntities ? extractEntitiesTyped(sc.text) : [];
      const entityMap     = groupEntitiesByType(entityDetails);
      const entities      = entityDetails.slice(0, 15).map(e => e.text);

      // Keywords
      const keywords = extractKeywords(sc.text, entityDetails, sc.sectionHeading);

      // Summary
      const summary = summarize(sc.text);

      // Quality score (heuristic)
      const qualityScore = computeQualityScore(
        sc.importance,
        entityDetails.filter(e => e.confidence > 0.7).length,
        sc.wordCount,
        sc.isComplete
      );

      return {
        id:         `block-${index}`,
        documentId,
        text:       sc.text,
        summary,
        keywords,
        chunkType:    sc.chunkType,
        importance:   sc.importance,
        wordCount:    sc.wordCount,
        sentenceCount: sc.sentenceCount,
        position: {
          sectionIndex:   sc.position.sectionIndex,
          paragraphIndex: sc.position.paragraphIndex,
          blockIndex:     index,
          total,
          isFirst: index === 0,
          isLast:  index === total - 1,
        },
        sectionHeading: sc.sectionHeading,
        entities,
        entityMap,
        entityDetails,
        qualityScore,
        embedding: generateEmbeddings ? embeddings[index] : undefined,
      };
    });

    return blocks;
  }
}