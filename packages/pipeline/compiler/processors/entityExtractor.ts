/**
 * Entity Extractor
 *
 * Pattern-based Named Entity Recognition (NER) without external APIs.
 * Identifies typed entities relevant to the Alexandrian Protocol domain
 * and general knowledge documents.
 *
 * Entity types:
 *   PERSON      — Human names (capitalized multi-word patterns)
 *   ORG         — Organizations, companies, protocols
 *   CONCEPT     — Technical concepts and domain terms
 *   ASSET       — Tokens, currencies, financial instruments
 *   ROLE        — Functional roles (curator, agent, validator)
 *   MECHANISM   — Protocol mechanisms and processes
 *   LOCATION    — Geographic references
 *   DATE        — Temporal references
 *   METRIC      — Quantitative values with units
 *
 * For production: swap extractEntities() internals for a proper NER model
 * (spaCy via Python bridge, Hugging Face NER, or OpenAI function calling)
 * — the interface is identical.
 */

export type EntityType =
  | 'PERSON'
  | 'ORG'
  | 'CONCEPT'
  | 'ASSET'
  | 'ROLE'
  | 'MECHANISM'
  | 'LOCATION'
  | 'DATE'
  | 'METRIC'
  | 'OTHER';

export interface Entity {
  text: string;
  type: EntityType;
  /** 0–1 confidence score */
  confidence: number;
  /** Character offsets in the source text */
  start: number;
  end: number;
  /** How many times this entity appears in the chunk */
  frequency: number;
}

// ─── Pattern Definitions ─────────────────────────────────────────────────────

interface PatternRule {
  type: EntityType;
  patterns: RegExp[];
  confidence: number;
}

const RULES: PatternRule[] = [
  // ── Crypto / DeFi assets ────────────────────────────────────────────────────
  {
    type: 'ASSET',
    confidence: 0.95,
    patterns: [
      /\b(XANDER|ETH|BTC|USDC|USDT|DAI|WETH|SOL|MATIC|ARB|OP)\b/g,
      /\b[A-Z]{2,6}\s+token\b/gi,
      /\b[A-Z]{2,6}\s+coin\b/gi,
      /\b\d+(?:\.\d+)?\s+(?:XANDER|ETH|BTC|USDC|tokens?)\b/gi,
    ],
  },

  // ── Protocol mechanisms ─────────────────────────────────────────────────────
  {
    type: 'MECHANISM',
    confidence: 0.9,
    patterns: [
      /\b(?:KYA\s+staking|knowledge\s+staking|stake\s+slashing|slash(?:ing)?(?:\s+mechanism)?)\b/gi,
      /\b(?:staking|unstaking|slashing|redistribution|settlement|royalt(?:y|ies))\b/gi,
      /\b(?:proof\s+of\s+\w+|consensus\s+mechanism|smart\s+contract)\b/gi,
      /\b(?:on-chain|off-chain|cross-chain|L2|layer\s+2|rollup)\b/gi,
      /\b(?:RAG|retrieval-augmented\s+generation|vector\s+search|semantic\s+search)\b/gi,
    ],
  },

  // ── Roles / actors ───────────────────────────────────────────────────────────
  {
    type: 'ROLE',
    confidence: 0.85,
    patterns: [
      /\b(?:curator|agent|validator|slasher|publisher|contributor|consumer|operator)\b/gi,
      /\b(?:AI\s+agent|autonomous\s+agent|knowledge\s+curator|content\s+creator)\b/gi,
      /\b(?:deployer|owner|stakeholder|recipient)\b/gi,
    ],
  },

  // ── Organizations / protocols ────────────────────────────────────────────────
  {
    type: 'ORG',
    confidence: 0.85,
    patterns: [
      /\b(?:Alexandrian\s+Protocol|Story\s+Protocol|Ethereum|Anthropic|OpenAI|Hardhat)\b/g,
      /\b(?:OpenZeppelin|Uniswap|Aave|Compound|Chainlink)\b/g,
      // Capitalized multi-word orgs: "Acme Corp", "Some Foundation"
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Corp|Inc|Ltd|Foundation|Protocol|DAO|Labs|Network)\b/g,
    ],
  },

  // ── Technical concepts ───────────────────────────────────────────────────────
  {
    type: 'CONCEPT',
    confidence: 0.8,
    patterns: [
      /\b(?:Knowledge\s+Block|knowledge\s+graph|content\s+hash|fingerprint)\b/gi,
      /\b(?:cryptographic\s+identity|citation\s+chain|provenance|attribution)\b/gi,
      /\b(?:embedding|vector|semantic\s+chunking|entity\s+extraction|NER)\b/gi,
      /\b(?:IPFS|Filecoin|Redis|RediSearch|ERC-20|ERC20|NFT)\b/g,
      /\b(?:license(?:\s+type)?|intellectual\s+property|IP\s+rights?)\b/gi,
      /\b(?:micropayment|payment\s+rail|settlement\s+layer|trust\s+layer)\b/gi,
    ],
  },

  // ── Locations ────────────────────────────────────────────────────────────────
  {
    type: 'LOCATION',
    confidence: 0.75,
    patterns: [
      /\b(?:mainnet|testnet|Sepolia|Goerli|Base|Arbitrum|Optimism|Polygon)\b/g,
      // Standard geo locations — capitalized multi-word
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?\b/g,
    ],
  },

  // ── Dates / time ─────────────────────────────────────────────────────────────
  {
    type: 'DATE',
    confidence: 0.9,
    patterns: [
      /\b(?:Q[1-4]\s+\d{4}|\d{4}\s+Q[1-4])\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
    ],
  },

  // ── Metrics / quantities ──────────────────────────────────────────────────────
  {
    type: 'METRIC',
    confidence: 0.85,
    patterns: [
      /\b\d+(?:\.\d+)?%\b/g,
      /\b\d+(?:,\d{3})*(?:\.\d+)?\s+(?:XANDER|ETH|tokens?|blocks?|chunks?|queries|ms|seconds?)\b/gi,
      /\b\d+(?:\.\d+)?\s*(?:KB|MB|GB|TB)\b/gi,
    ],
  },

  // ── Person names ─────────────────────────────────────────────────────────────
  // Kept last and low-confidence since capitalization is ambiguous
  {
    type: 'PERSON',
    confidence: 0.6,
    patterns: [
      /\b(?:Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
      // Two capitalized words that aren't known ORGs — heuristic, low confidence
    ],
  },
];

// ─── Stop words to filter out false positives ─────────────────────────────────

const STOP_WORDS = new Set([
  'The', 'This', 'That', 'These', 'Those', 'A', 'An', 'It', 'Its',
  'In', 'On', 'At', 'To', 'For', 'Of', 'By', 'With', 'From', 'Into',
  'And', 'Or', 'But', 'Not', 'No', 'So', 'If', 'As', 'Up', 'Do',
  'When', 'Where', 'How', 'What', 'Which', 'Who', 'Why',
  'Step', 'Note', 'See', 'Use', 'Each', 'All', 'Some', 'Any',
]);

// ─── Core extraction ─────────────────────────────────────────────────────────

function deduplicateEntities(entities: Entity[]): Entity[] {
  const seen = new Map<string, Entity>();

  for (const entity of entities) {
    const key = entity.text.toLowerCase();
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Keep the higher-confidence version, sum frequency
      if (entity.confidence > existing.confidence) {
        seen.set(key, { ...entity, frequency: existing.frequency + entity.frequency });
      } else {
        seen.set(key, { ...existing, frequency: existing.frequency + entity.frequency });
      }
    } else {
      seen.set(key, entity);
    }
  }

  return Array.from(seen.values());
}

function scoreImportance(entity: Entity, textLength: number): number {
  // Boost by type priority
  const typePriority: Record<EntityType, number> = {
    MECHANISM: 1.0,
    CONCEPT:   0.9,
    ASSET:     0.9,
    ROLE:      0.8,
    ORG:       0.8,
    METRIC:    0.7,
    PERSON:    0.7,
    LOCATION:  0.6,
    DATE:      0.5,
    OTHER:     0.3,
  };

  const frequencyBoost = Math.min(entity.frequency * 0.1, 0.3);
  const positionBoost  = entity.start < textLength * 0.2 ? 0.1 : 0; // Early mentions matter more

  return Math.min(
    (typePriority[entity.type] * entity.confidence) + frequencyBoost + positionBoost,
    1.0
  );
}

/**
 * Extract typed entities from a text chunk.
 *
 * @param text - The text to extract entities from
 * @returns Array of Entity objects sorted by importance
 */
export function extractEntitiesTyped(text: string): Entity[] {
  const found: Entity[] = [];

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      // Reset regex state
      const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const raw = match[0].trim();

        // Skip stop words and very short matches
        if (STOP_WORDS.has(raw) || raw.length < 2) continue;

        found.push({
          text: raw,
          type: rule.type,
          confidence: rule.confidence,
          start: match.index,
          end: match.index + raw.length,
          frequency: 1,
        });
      }
    }
  }

  const deduplicated = deduplicateEntities(found);

  // Score and sort by importance
  return deduplicated
    .map(e => ({ ...e, confidence: scoreImportance(e, text.length) }))
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Simple string-only API — drop-in replacement for the old extractEntities stub.
 * Returns entity text strings for backward compatibility.
 */
export function extractEntities(text: string): string[] {
  return extractEntitiesTyped(text)
    .slice(0, 15)                          // Top 15 most important
    .map(e => e.text);
}

/**
 * Group entities by type — useful for KB metadata and UI display.
 */
export function groupEntitiesByType(entities: Entity[]): Record<EntityType, string[]> {
  const groups = {} as Record<EntityType, string[]>;

  for (const entity of entities) {
    if (!groups[entity.type]) groups[entity.type] = [];
    if (!groups[entity.type].includes(entity.text)) {
      groups[entity.type].push(entity.text);
    }
  }

  return groups;
}