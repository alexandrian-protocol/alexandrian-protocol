import { createHash } from "crypto";

function hashPair(left: string, right: string): string {
  return createHash("sha256").update(`${left}${right}`).digest("hex");
}

export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return "0".repeat(64);
  }

  let layer = leaves.slice();
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? layer[i];
      next.push(hashPair(left, right));
    }
    layer = next;
  }
  return layer[0];
}
