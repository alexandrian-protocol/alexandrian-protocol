/**
 * Alexandrian Protocol — Canonical serialization for content-addressed KBs
 *
 * RFC 8785 (JCS) style: deterministic JSON. Same content → same hash.
 * Merges jcs + derivedEnvelope.
 */

import { createHash } from "crypto";
import { CID } from "multiformats";
import * as sha2 from "multiformats/hashes/sha2";
import type { CanonicalEnvelope, CanonicalDerivation, CanonicalPayload } from "./schema/canonicalEnvelope.js";

// ─────────────────────────────────────────────────────────────────────────────
// JCS
// ─────────────────────────────────────────────────────────────────────────────

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number in canonical input");
    return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return JSON.stringify(String(value));
  if (Array.isArray(value)) {
    const parts = value.map((v) => canonicalize(v));
    return "[" + parts.join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as object).sort();
    const parts = keys.map((k) => JSON.stringify(k) + ":" + canonicalize((value as Record<string, unknown>)[k]));
    return "{" + parts.join(",") + "}";
  }
  throw new Error("Unsupported type for canonicalization");
}

export function sortSources<T extends { sources?: string[] }>(envelope: T): T {
  if (!envelope.sources || envelope.sources.length <= 1) return envelope;
  return { ...envelope, sources: [...envelope.sources].sort() };
}

/** @deprecated Use sortSources. */
export function sortParents<T extends { sources?: string[]; parents?: string[] }>(envelope: T): T {
  const arr = envelope.sources ?? envelope.parents;
  if (!arr || arr.length <= 1) return envelope;
  const key = "sources" in envelope && envelope.sources ? "sources" : "parents";
  return { ...envelope, [key]: [...arr].sort() } as T;
}

export function contentHashFromCanonical(canonicalJson: string): string {
  const digest = createHash("sha256").update(canonicalJson, "utf8").digest("hex");
  return "0x" + digest;
}

export async function cidV1FromCanonical(canonicalJson: string): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson);
  const digest = await sha2.sha256.digest(bytes);
  const cid = CID.createV1(0x55, digest);
  return cid.toString();
}

function normalizeForHash(envelope: Record<string, unknown>): Record<string, unknown> {
  const out = { ...envelope };
  delete out.parents;
  const arr = (out.sources ?? (envelope as { parents?: string[] }).parents) as string[] | undefined;
  out.sources = arr && arr.length > 1 ? [...arr].sort() : (arr ?? []);
  return out;
}

export function contentHashFromEnvelope(envelope: Record<string, unknown>): string {
  const normalized = normalizeForHash(envelope);
  const canonical = canonicalize(normalized);
  return contentHashFromCanonical(canonical);
}

export async function cidV1FromEnvelope(envelope: Record<string, unknown>): Promise<string> {
  const normalized = normalizeForHash(envelope);
  const canonical = canonicalize(normalized);
  return cidV1FromCanonical(canonical);
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived Envelope Builder
// ─────────────────────────────────────────────────────────────────────────────

export interface DerivedEnvelopeInput {
  domain: string;
  sources: string[];
  derivation: {
    type: CanonicalDerivation["type"];
    inputs: CanonicalDerivation["inputs"];
    recipe: CanonicalDerivation["recipe"];
  };
  payload: CanonicalPayload;
}

export function buildDerivedEnvelope(input: DerivedEnvelopeInput): CanonicalEnvelope {
  const sources = [...input.sources].map((p) => (p.startsWith("0x") ? p : "0x" + p)).sort();
  const envelope: CanonicalEnvelope = {
    type: input.payload.type,
    domain: input.domain,
    sources,
    payload: input.payload,
    derivation: {
      type: input.derivation.type,
      inputs: input.derivation.inputs.map((i) => ({
        kbId: i.kbId.startsWith("0x") ? i.kbId : "0x" + i.kbId,
        selectors: i.selectors,
      })),
      recipe: input.derivation.recipe,
    },
  };
  return sortSources(envelope) as CanonicalEnvelope;
}
