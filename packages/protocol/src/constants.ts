/**
 * Protocol Neutrality Commitment
 *
 * The protocol treats all curators identically. No curator address receives
 * privileged treatment in:
 * - Royalty settlement
 * - Reputation scoring
 * - Query ranking
 * - Semantic discovery
 * - Economic incentives
 *
 * Verification: grep codebase for FOUNDER, ARCHITECT — should return ZERO
 * results in settlement, ranking, or discovery logic.
 *
 * @see docs/INVARIANTS.md
 */
export const PROTOCOL_NEUTRALITY = true as const;
