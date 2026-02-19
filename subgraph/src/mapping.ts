/**
 * Alexandrian Protocol — KnowledgeRegistry subgraph mapping.
 * Exact 1:1 with KBRegistered; one event, no settlement/deprecation (those are separate contracts).
 */
import { KBRegistered } from "../generated/KnowledgeRegistry/KnowledgeRegistry";
import { KnowledgeBlock } from "../generated/schema";

export function handleKBRegistered(event: KBRegistered): void {
  let kb = new KnowledgeBlock(event.params.kbId.toHexString());
  kb.curator = event.params.curator;
  kb.artifactType = event.params.artifactType;
  kb.parentCount = event.params.parentCount.toI32();
  kb.timestamp = event.block.timestamp;
  kb.blockNumber = event.block.number;

  // Lineage: event emits bytes32[] parents so the subgraph has full lineage (no getKB() needed)
  let parentRefs = event.params.parents;
  let parents: Bytes[] = [];
  for (let i = 0; i < parentRefs.length; i++) {
    parents.push(parentRefs[i]);
  }
  kb.parents = parents;

  kb.save();
}
