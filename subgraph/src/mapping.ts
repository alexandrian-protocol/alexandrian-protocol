/**
 * Alexandrian Protocol — KnowledgeRegistry subgraph mapping.
 * Indexes KBRegistered. Additional event handlers in subgraph/m2/.
 */
import { Bytes } from "@graphprotocol/graph-ts";
import { KBRegistered } from "../generated/KnowledgeRegistry/KnowledgeRegistry";
import { KnowledgeBlock } from "../generated/schema";

export function handleKBRegistered(event: KBRegistered): void {
  let kb = new KnowledgeBlock(event.params.kbId.toHexString());
  kb.curator = event.params.curator;
  kb.artifactType = event.params.artifactType;
  kb.parentCount = event.params.parentCount.toI32();
  kb.timestamp = event.block.timestamp;
  kb.blockNumber = event.block.number;

  let parentRefs = event.params.parents;
  let parents: Bytes[] = [];
  for (let i = 0; i < parentRefs.length; i++) {
    parents.push(parentRefs[i]);
  }
  kb.parents = parents;

  kb.save();
}
