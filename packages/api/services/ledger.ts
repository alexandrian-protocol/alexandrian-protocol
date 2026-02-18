/**
 * Ledger math stub for economic-invariants tests when @alexandrian/api is not present.
 * Implements the contract asserted by tests/invariants/economic-invariants.test.ts.
 */
import { createHash } from "crypto";

export const RS_MIN = 0;
export const RS_MAX = 2;

const HALF_LIFE_DAYS = 30;
const DECAY_PER_DAY = Math.pow(0.5, 1 / HALF_LIFE_DAYS);

export function clampRS(rs: number): number {
  if (rs < RS_MIN) return RS_MIN;
  if (rs > RS_MAX) return RS_MAX;
  return rs;
}

export function freshnessMultiplier(createdAtIso: string): number {
  const created = new Date(createdAtIso).getTime();
  const now = Date.now();
  const daysAgo = (now - created) / (24 * 60 * 60 * 1000);
  if (daysAgo <= 0) return 1;
  const f = Math.pow(DECAY_PER_DAY, daysAgo);
  return Math.min(1, Math.max(0, f));
}

const TIER_RS: Record<number, number> = { 0: 0, 1: 0.5, 2: 1, 3: 2 };

export function meetsTier(rs: number, tier: number): boolean {
  const min = TIER_RS[tier] ?? 0;
  return rs >= min;
}

export function computePayout(base: number, rs: number, freshness: number): number {
  const r = clampRS(rs);
  const p = base * r * freshness;
  const rounded = Math.round(p * 1e6) / 1e6;
  return Math.max(0, rounded);
}

export function ledgerLeafHash(contentHash: string, amount: number): string {
  const data = JSON.stringify({ contentHash, amount });
  return createHash("sha256").update(data, "utf8").digest("hex");
}
