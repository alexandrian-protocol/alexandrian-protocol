/**
 * Mapping snippets for additional events — add to main src/mapping.ts when wiring.
 * Requires: BigInt from @graphprotocol/graph-ts; KBQueried, KBDeprecated from generated ABI.
 */

// In handleKBRegistered, add:
//   kb.queryCount = BigInt.fromI32(0);
//   kb.totalFeesEarned = BigInt.fromI32(0);
//   kb.deprecated = false;
//   kb.supersededBy = null;

// Add:
// export function handleKBQueried(event: KBQueried): void {
//   let kb = KnowledgeBlock.load(event.params.kbId.toHexString());
//   if (!kb) return;
//   kb.queryCount = kb.queryCount.plus(BigInt.fromI32(1));
//   kb.totalFeesEarned = kb.totalFeesEarned.plus(event.params.fee);
//   kb.save();
// }

// export function handleKBDeprecated(event: KBDeprecated): void {
//   let kb = KnowledgeBlock.load(event.params.kbId.toHexString());
//   if (!kb) return;
//   kb.deprecated = true;
//   kb.supersededBy = event.params.successor;
//   kb.save();
// }
