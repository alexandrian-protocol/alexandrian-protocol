# Milestone reviewer entry point

One place for reviewers: M1 (done) and M2 (planned), separated clearly. Links only what matters.

**Alexandrian** is the protocol (primitive: Knowledge Block, canonical identity, provenance, atomic royalty settlement). **Alexandria** is the library (indexes, organizes, exposes KBs for discovery and query). Agents query via Alexandria and settle via the Alexandrian Protocol; discovery is application-layer, settlement is protocol-layer, intent is agent-defined.

---

## M1 — What to run

From **repo root:**

```bash
pnpm start:here
```

(This runs install → build → demo. Or step by step: `pnpm install && pnpm build && pnpm demo`.)

Then: `pnpm test:spec` or **`pnpm verify`** (full check: build + tests + demo).

| Goal | Command |
|------|---------|
| Clean M1 verification | `pnpm verify` |
| Demo walkthrough (verbose) | `pnpm demo:walkthrough` |
| Contract tests | `pnpm test:protocol` |
| Deploy local | `pnpm deploy:local` |

Full command list and troubleshooting: see **alexandrian-protocol-v2 docs** on Desktop.

---

## M1 — What to read

| Doc | Purpose |
|-----|--------|
| [Main README](../../README.md) | Repo overview, M1 evidence, M2 planned |
| [M1-DEMO.md](../M1-DEMO.md) | What M1 proves |
| [PROTOCOL-SPEC.md](../PROTOCOL-SPEC.md) | Canonical serialization, KB types |
| [INVARIANTS.md](../INVARIANTS.md) | Protocol and economic invariants |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Core vs runtime, testing |
| [REVIEW.md](REVIEW.md) | Reviewer notes |
| [AUDIT-READINESS.md](AUDIT-READINESS.md) | Self-assessment |
| [SUBGRAPH.md](../SUBGRAPH.md) | Subgraph & GraphQL — live endpoint, example query |

Testnet: [TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md). Subgraph: [SUBGRAPH.md](../SUBGRAPH.md) (live query) or [subgraph/README.md](../../subgraph/README.md) (build/deploy).

---

## M2 — Planned only

M2 is **not built**. One sentence: slash/deprecation, query metrics in subgraph, smart-account compatibility (ERC-165/1271/EIP-712), demo on testnet.
