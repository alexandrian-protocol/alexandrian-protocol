/**
 * Semantic Chunker — Section-Aware
 *
 * Three-phase splitting strategy:
 *   1. Section boundaries — Markdown headings (#, ##, ###) and numbered sections
 *   2. Paragraph boundaries — blank lines within sections
 *   3. Sentence accumulation — group sentences until targetWords reached
 *
 * Never merges content from different sections into one chunk.
 * Never splits a sentence across chunks.
 * Overlaps the last sentence for cross-chunk context.
 */

export type ChunkType = 'section' | 'paragraph' | 'summary' | 'definition' | 'unknown';

export interface SemanticChunk {
  text: string;
  chunkType: ChunkType;
  wordCount: number;
  sentenceCount: number;
  position: {
    sectionIndex: number;
    paragraphIndex: number;
  };
  /** 0–1 importance score based on heuristics — no ML required */
  importance: number;
  /** Section heading text if this chunk starts a new section */
  sectionHeading?: string;
  /** Whether this chunk ends at a natural boundary */
  isComplete: boolean;
}

export interface ChunkOptions {
  /** Target words per chunk (default: 150) */
  targetWords?: number;
  /** Hard ceiling (default: 300) */
  maxWords?: number;
  /** Sentences to overlap between chunks (default: 1) */
  overlapSentences?: number;
  /** Min words to keep a chunk (default: 20) */
  minWords?: number;
}

// ─── Section Detection ────────────────────────────────────────────────────────

interface Section {
  heading: string | null;
  headingLevel: number;       // 1 = H1, 2 = H2, 0 = no heading
  sectionIndex: number;
  text: string;
}

const HEADING_PATTERNS = [
  /^(#{1,6})\s+(.+)$/,                    // Markdown: # Heading, ## Heading
  /^(\d+\.)+\s+(.+)$/,                    // Numbered: 1. Section, 1.1 Sub
  /^[A-Z][A-Z\s]{4,}$/,                   // ALL CAPS HEADING
];

function detectHeading(line: string): { level: number; text: string } | null {
  // Markdown headings
  const mdMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (mdMatch) {
    return { level: mdMatch[1].length, text: mdMatch[2].trim() };
  }

  // Numbered sections: 1. Title or 1.1 Title
  const numberedMatch = line.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);
  if (numberedMatch) {
    const depth = numberedMatch[1].split('.').length;
    return { level: depth, text: numberedMatch[2].trim() };
  }

  // ALL CAPS heading (must be a full line, not mid-paragraph)
  if (/^[A-Z][A-Z\s]{4,40}$/.test(line.trim()) && !line.includes('.')) {
    return { level: 2, text: line.trim() };
  }

  return null;
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentLines: string[] = [];
  let currentHeading: string | null = null;
  let currentLevel = 0;
  let sectionIndex = 0;

  const flushSection = () => {
    const body = currentLines.join('\n').trim();
    if (body.length > 0 || currentHeading) {
      sections.push({
        heading: currentHeading,
        headingLevel: currentLevel,
        sectionIndex: sectionIndex++,
        text: body,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const heading = detectHeading(line.trim());
    if (heading) {
      flushSection();
      currentHeading = heading.text;
      currentLevel = heading.level;
    } else {
      currentLines.push(line);
    }
  }

  flushSection();

  // If no sections were detected, treat the whole text as one section
  if (sections.length === 0) {
    sections.push({ heading: null, headingLevel: 0, sectionIndex: 0, text });
  }

  return sections;
}

// ─── Sentence Splitter ────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  const protected_ = text
    .replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S|U\.K)\./g, '$1<DOT>')
    .replace(/\b([A-Z])\./g, '$1<DOT>');

  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'])/);

  return raw
    .map(s => s.replace(/<DOT>/g, '.').trim())
    .filter(s => s.length > 0);
}

// ─── Paragraph Splitter ───────────────────────────────────────────────────────

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 10);
}

// ─── Word Count ───────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── Importance Heuristics ────────────────────────────────────────────────────

const DEFINITION_SIGNALS = [
  /\bis\s+(?:a|an|the)\b/i,
  /\bdefined?\s+as\b/i,
  /\brefers?\s+to\b/i,
  /\bmeans?\b/i,
  /\brepresents?\b/i,
];

const EVIDENCE_SIGNALS = [
  /\b\d+(?:\.\d+)?%\b/,
  /\baccording\s+to\b/i,
  /\bresult(?:s|ed)?\b/i,
  /\bproved?\b/i,
  /\bmeasured?\b/i,
];

const PROCEDURE_SIGNALS = [
  /\bstep\s+\d+\b/i,
  /\bfirst(?:ly)?\b/i,
  /\bthen\b/i,
  /\bfinally\b/i,
  /\bto\s+(?:run|start|deploy|install|configure)\b/i,
];

export function classifyChunkType(text: string): ChunkType {
  const def  = DEFINITION_SIGNALS.filter(p => p.test(text)).length;
  const proc = PROCEDURE_SIGNALS.filter(p => p.test(text)).length;
  const ev   = EVIDENCE_SIGNALS.filter(p => p.test(text)).length;

  if (def  >= 2) return 'definition';
  if (proc >= 2) return 'paragraph';
  if (ev   >= 2) return 'paragraph';
  if (def  >= 1) return 'definition';
  return 'paragraph';
}

export function scoreImportance(
  text: string,
  headingLevel: number,
  paragraphIndex: number,
  totalParagraphs: number
): number {
  const isIntro      = paragraphIndex === 0;
  const isConclusion = paragraphIndex >= totalParagraphs - 2;

  const defScore  = Math.min(DEFINITION_SIGNALS.filter(p => p.test(text)).length * 0.15, 0.3);
  const evScore   = Math.min(EVIDENCE_SIGNALS.filter(p => p.test(text)).length * 0.1, 0.2);
  const posScore  = isIntro ? 0.3 : isConclusion ? 0.2 : 0.1;
  // H1 = 0.3, H2 = 0.2, H3 = 0.1, no heading = 0
  const headScore = headingLevel > 0 ? Math.max(0, (4 - headingLevel) * 0.1) : 0;

  return Math.min(0.4 + defScore + evScore + posScore + headScore, 1.0);
}

// ─── Main Chunker ─────────────────────────────────────────────────────────────

/**
 * Split text into semantically coherent chunks, respecting section, paragraph,
 * and sentence boundaries in that priority order.
 */
export function semanticChunk(text: string, options: ChunkOptions = {}): SemanticChunk[] {
  const {
    targetWords      = 150,
    maxWords         = 300,
    overlapSentences = 1,
    minWords         = 20,
  } = options;

  const sections = splitIntoSections(text);
  const result: SemanticChunk[] = [];

  for (const section of sections) {
    const paragraphs = splitParagraphs(
      section.heading
        ? `${section.heading}\n\n${section.text}`
        : section.text
    );

    let currentSentences: string[] = [];
    let currentWords = 0;
    let paragraphIndex = 0;

    const flush = (isComplete: boolean) => {
      if (currentSentences.length === 0) return;
      const chunkText = currentSentences.join(' ');
      const words = countWords(chunkText);
      if (words < minWords) return;

      const chunkType = classifyChunkType(chunkText);
      const importance = scoreImportance(
        chunkText,
        section.headingLevel,
        paragraphIndex,
        paragraphs.length
      );

      result.push({
        text: chunkText,
        chunkType,
        wordCount: words,
        sentenceCount: currentSentences.length,
        position: {
          sectionIndex:   section.sectionIndex,
          paragraphIndex,
        },
        importance,
        sectionHeading: section.heading ?? undefined,
        isComplete,
      });
    };

    for (let p = 0; p < paragraphs.length; p++) {
      paragraphIndex = p;
      const sentences = splitSentences(paragraphs[p]);

      for (const sentence of sentences) {
        const sw = countWords(sentence);

        if (currentWords + sw > maxWords && currentSentences.length > 0) {
          flush(false);
          const overlap = currentSentences.slice(-overlapSentences);
          currentSentences = overlap;
          currentWords = overlap.reduce((s, o) => s + countWords(o), 0);
        }

        currentSentences.push(sentence);
        currentWords += sw;

        if (currentWords >= targetWords) {
          flush(false);
          const overlap = currentSentences.slice(-overlapSentences);
          currentSentences = overlap;
          currentWords = overlap.reduce((s, o) => s + countWords(o), 0);
        }
      }

      // Paragraph boundary — natural flush point
      if (currentWords >= minWords) {
        flush(true);
        const overlap = currentSentences.slice(-overlapSentences);
        currentSentences = overlap;
        currentWords = overlap.reduce((s, o) => s + countWords(o), 0);
      }
    }

    if (currentSentences.length > 0 && currentWords >= minWords) {
      flush(true);
    }
  }

  return result;
}

/** Drop-in replacement for old chunker — string array output. */
export function chunk(text: string, _sizeHint?: number): string[] {
  return semanticChunk(text).map(c => c.text);
}