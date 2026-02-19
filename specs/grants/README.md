# Grant reviewer entry point

One place for reviewers: M1 (done) and M2 (planned), separated clearly. Links only what matters.

---

## M1 — What to run

From **repo root:**

```bash
pnpm install && pnpm build && pnpm demo
```

Then: `pnpm test:spec` or **`pnpm verify`** (full check: build + tests + demo).

| Goal | Command |
|------|---------|
| Clean M1 verification | `pnpm verify` |
| Demo walkthrough (verbose) | `pnpm demo:walkthrough` |
| Contract tests | `pnpm test:protocol` |
| Deploy local | `pnpm deploy:local` |

Full list: [COMMANDS.md](COMMANDS.md)

---

## M1 — What to read

| Doc | Purpose |
|-----|--------|
| [Main README](../../README.md) | Repo overview, M1 evidence, M2 planned |
| [specs/M1-DEMO.md](../M1-DEMO.md) | What M1 proves |
| [specs/PROTOCOL-SPEC.md](../PROTOCOL-SPEC.md) | Canonical serialization, KB types |
| [specs/INVARIANTS.md](../INVARIANTS.md) | Protocol and economic invariants |
| [specs/ARCHITECTURE.md](../ARCHITECTURE.md) | Core vs runtime, testing |
| [specs/TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | Windows, Node |
| [REVIEW.md](REVIEW.md) | Reviewer notes |
| [AUDIT-READINESS.md](AUDIT-READINESS.md) | Self-assessment |

Testnet: [specs/TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md). Subgraph: [subgraph/README.md](../../subgraph/README.md).

---

## M2 — Planned only

M2 is **not built**. One sentence: slash/deprecation, query metrics in subgraph, smart-account compatibility (ERC-165/1271/EIP-712), demo on testnet. Details: [specs/m2/](../m2/).
