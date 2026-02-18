/**
 * Royalty graph scale — performance tests for EconomicInvariants graph traversal.
 *
 * Benchmarks:
 * - findCycles (DFS cycle detection)
 * - findAllPaths (path enumeration)
 * - calculateDistribution (payout traversal)
 * - calculateTotalObligation (recursive obligation)
 * - validateRoyaltyDAG (cycles + paths)
 *
 * Graph shapes: linear chain, binary tree, wide fan-out.
 */
import { describe, it, expect } from "vitest";
import {
  EconomicInvariants,
  type RoyaltyNode,
  type RoyaltyEdge,
} from "@alexandrian/protocol/core";

function mkNode(
  id: string,
  creator: string,
  baseRoyalty: number,
  parents: RoyaltyEdge[]
): RoyaltyNode {
  return { id, creator, baseRoyalty, parents };
}

function mkEdge(from: string, to: string, share: number): RoyaltyEdge {
  return { from, to, share };
}

/** Linear chain: node_1 → node_2 → ... → node_n (node_1 is leaf, node_n is root). Share per edge keeps path total < 100% (avoids fp precision). */
function buildChain(n: number): RoyaltyNode[] {
  const nodes: RoyaltyNode[] = [];
  const sharePerEdge = n > 1 ? Math.floor((99.9 / (n - 1)) * 100) / 100 : 0;
  const baseRoyalty = Math.max(0, 100 - sharePerEdge);
  for (let i = 1; i <= n; i++) {
    const id = `node_${i}`;
    const creator = `0x${id.padStart(40, "0")}`;
    const parents: RoyaltyEdge[] =
      i < n ? [mkEdge(id, `node_${i + 1}`, sharePerEdge)] : [];
    nodes.push(mkNode(id, creator, baseRoyalty, parents));
  }
  return nodes;
}

/** Binary tree: 2^depth nodes, root at node_1, leaves at deepest level */
function buildBinaryTree(depth: number): RoyaltyNode[] {
  const nodes: RoyaltyNode[] = [];
  const total = Math.pow(2, depth) - 1;
  for (let i = 1; i <= total; i++) {
    const id = `node_${i}`;
    const creator = `0x${String(i).padStart(40, "0")}`;
    const left = 2 * i;
    const right = 2 * i + 1;
    const parents: RoyaltyEdge[] = [];
    if (left <= total) parents.push(mkEdge(id, `node_${left}`, 5));
    if (right <= total) parents.push(mkEdge(id, `node_${right}`, 5));
    nodes.push(mkNode(id, creator, parents.length === 0 ? 90 : 80, parents));
  }
  return nodes;
}

/** Fan-out: one root, N children (single level) */
function buildFanOut(n: number): RoyaltyNode[] {
  const nodes: RoyaltyNode[] = [];
  const root = mkNode("root", "0xroot", 10, []);
  nodes.push(root);
  for (let i = 0; i < n; i++) {
    const id = `child_${i}`;
    nodes.push(
      mkNode(id, `0x${String(i).padStart(40, "0")}`, 80, [
        mkEdge(id, "root", 20),
      ])
    );
  }
  return nodes;
}

function nodesToMap(nodes: RoyaltyNode[]): Map<string, RoyaltyNode> {
  const m = new Map<string, RoyaltyNode>();
  nodes.forEach((n) => m.set(n.id, n));
  return m;
}

describe("Royalty graph scale", () => {
  describe("Linear chain", () => {
    const sizes = [10, 100, 500, 1000];

    for (const n of sizes) {
      it(`findCycles on chain of ${n} nodes completes in < 50ms`, () => {
        const nodes = buildChain(n);
        const start = performance.now();
        const cycles = EconomicInvariants.findCycles(nodes);
        const elapsed = performance.now() - start;
        expect(cycles).toHaveLength(0);
        expect(elapsed).toBeLessThan(50);
      });

      it(`findAllPaths on chain of ${n} nodes completes in < 100ms`, () => {
        const nodes = buildChain(n);
        const start = performance.now();
        const paths = EconomicInvariants.findAllPaths(nodes);
        const elapsed = performance.now() - start;
        expect(paths.length).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(100);
      });

      it(`calculateDistribution on chain of ${n} nodes completes in < 50ms`, () => {
        const nodes = buildChain(n);
        const nodeMap = nodesToMap(nodes);
        const leafId = "node_1";
        const start = performance.now();
        const dist = EconomicInvariants.calculateDistribution(
          leafId,
          nodeMap,
          1000
        );
        const elapsed = performance.now() - start;
        expect(dist.size).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(50);
      });

      it(`calculateTotalObligation on chain of ${n} nodes completes in < 50ms`, () => {
        const nodes = buildChain(n);
        const nodeMap = nodesToMap(nodes);
        const leafId = "node_1";
        const start = performance.now();
        const obligation = EconomicInvariants.calculateTotalObligation(
          leafId,
          nodeMap
        );
        const elapsed = performance.now() - start;
        expect(obligation).toBeGreaterThanOrEqual(0);
        expect(elapsed).toBeLessThan(50);
      });

      it(`validateRoyaltyDAG on chain of ${n} nodes completes in < 100ms`, () => {
        const nodes = buildChain(n);
        const start = performance.now();
        const valid = EconomicInvariants.validateRoyaltyDAG(nodes);
        const elapsed = performance.now() - start;
        expect(valid).toBe(true);
        expect(elapsed).toBeLessThan(100);
      });
    }
  });

  describe("Binary tree", () => {
    const depths = [4, 6, 8]; // 15, 63, 255 nodes

    for (const d of depths) {
      const n = Math.pow(2, d) - 1;
      it(`findCycles on binary tree (${n} nodes, depth ${d}) completes in < 50ms`, () => {
        const nodes = buildBinaryTree(d);
        const start = performance.now();
        const cycles = EconomicInvariants.findCycles(nodes);
        const elapsed = performance.now() - start;
        expect(cycles).toHaveLength(0);
        expect(elapsed).toBeLessThan(50);
      });

      it(`findAllPaths on binary tree (${n} nodes) completes in < 500ms`, () => {
        const nodes = buildBinaryTree(d);
        const start = performance.now();
        const paths = EconomicInvariants.findAllPaths(nodes);
        const elapsed = performance.now() - start;
        expect(paths.length).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(500);
      });

      it(`calculateDistribution on binary tree (${n} nodes) completes in < 100ms`, () => {
        const nodes = buildBinaryTree(d);
        const nodeMap = nodesToMap(nodes);
        const start = performance.now();
        const dist = EconomicInvariants.calculateDistribution(
          "node_1",
          nodeMap,
          1000
        );
        const elapsed = performance.now() - start;
        expect(dist.size).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(100);
      });

      it(`validateRoyaltyDAG on binary tree (${n} nodes) completes in < 200ms`, () => {
        const nodes = buildBinaryTree(d);
        const start = performance.now();
        const valid = EconomicInvariants.validateRoyaltyDAG(nodes);
        const elapsed = performance.now() - start;
        expect(valid).toBe(true);
        expect(elapsed).toBeLessThan(200);
      });
    }
  });

  describe("Fan-out (wide DAG)", () => {
    const widths = [50, 200, 500];

    for (const w of widths) {
      it(`findCycles on fan-out of ${w} children completes in < 50ms`, () => {
        const nodes = buildFanOut(w);
        const start = performance.now();
        const cycles = EconomicInvariants.findCycles(nodes);
        const elapsed = performance.now() - start;
        expect(cycles).toHaveLength(0);
        expect(elapsed).toBeLessThan(50);
      });

      it(`findAllPaths on fan-out of ${w} children completes in < 200ms`, () => {
        const nodes = buildFanOut(w);
        const start = performance.now();
        const paths = EconomicInvariants.findAllPaths(nodes);
        const elapsed = performance.now() - start;
        expect(paths.length).toBe(w);
        expect(elapsed).toBeLessThan(200);
      });

      it(`calculateDistribution on fan-out of ${w} children completes in < 100ms`, () => {
        const nodes = buildFanOut(w);
        const nodeMap = nodesToMap(nodes);
        const start = performance.now();
        const dist = EconomicInvariants.calculateDistribution(
          "child_0",
          nodeMap,
          1000
        );
        const elapsed = performance.now() - start;
        expect(dist.size).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(100);
      });

      it(`validateRoyaltyDAG on fan-out of ${w} children completes in < 100ms`, () => {
        const nodes = buildFanOut(w);
        const start = performance.now();
        const valid = EconomicInvariants.validateRoyaltyDAG(nodes);
        const elapsed = performance.now() - start;
        expect(valid).toBe(true);
        expect(elapsed).toBeLessThan(100);
      });
    }
  });

  describe("Cycle detection", () => {
    it("detects cycle in small graph", () => {
      const nodes: RoyaltyNode[] = [
        mkNode("a", "0xa", 50, [mkEdge("a", "b", 50)]),
        mkNode("b", "0xb", 50, [mkEdge("b", "c", 50)]),
        mkNode("c", "0xc", 50, [mkEdge("c", "a", 50)]),
      ];
      const cycles = EconomicInvariants.findCycles(nodes);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it("validateNoCycles throws on cycle", () => {
      const nodes: RoyaltyNode[] = [
        mkNode("a", "0xa", 50, [mkEdge("a", "b", 50)]),
        mkNode("b", "0xb", 50, [mkEdge("b", "a", 50)]),
      ];
      expect(() => EconomicInvariants.validateNoCycles(nodes)).toThrow(/Cycle/);
    });
  });
});
