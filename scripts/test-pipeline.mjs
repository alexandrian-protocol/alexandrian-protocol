#!/usr/bin/env node
/**
 * Quick pipeline test — run from repo root:
 *   node scripts/test-pipeline.mjs
 */
import { AlexandrianPipeline } from "../packages/pipeline/dist/index.js";

const pipeline = new AlexandrianPipeline();
const result = await pipeline.runFromText(
  "The Alexandrian Protocol enables knowledge licensing.",
  { quiet: true }
);
console.log("Blocks:", result.blocks.length);
console.log("Fingerprint:", result.fingerprint.slice(0, 20) + "...");
console.log("Block 0 text:", result.blocks[0]?.text?.slice(0, 50) + "...");
