# Milestone 1 — Grant reviewer entry point

Single place for reviewers. All details live in the linked docs.

---

## Start here

From **repo root:**

```bash
pnpm install && pnpm build && pnpm demo
```
(PowerShell: `pnpm install; pnpm build; pnpm demo`)

Then run the M1 demo test: `pnpm test:spec`

---

## Commands

Full list: **[COMMANDS.md](COMMANDS.md)**

| Goal | Command |
|------|---------|
| Clean M1 verification | `pnpm verify` |
| Demo walkthrough (verbose) | `pnpm demo:walkthrough` |
| Contract tests | `pnpm test:protocol` |
| Deploy local | `pnpm deploy:local` |

---

## Key links

| Doc | Purpose |
|-----|---------|
| [Main README](../../README.md) | Repo overview, M1 deliverables |
| [specs/M1-DEMO.md](../M1-DEMO.md) | What M1 proves |
| [specs/PROTOCOL-SPEC.md](../PROTOCOL-SPEC.md) | Canonical serialization, KB types |
| [specs/INVARIANTS.md](../INVARIANTS.md) | Protocol and economic invariants |
| [specs/ARCHITECTURE.md](../ARCHITECTURE.md) | Core vs runtime, testing |
| [specs/TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | Windows, Node versions |
| [REVIEW.md](REVIEW.md) | Reviewer notes, CLI `--`, troubleshooting |
| [AUDIT-READINESS.md](AUDIT-READINESS.md) | Nine-pillar self-assessment |

**More:** [specs/ECONOMIC-ASSUMPTIONS.md](../ECONOMIC-ASSUMPTIONS.md), [specs/GAS.md](../GAS.md), [specs/TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md), [specs/serialization-test-vectors.md](../serialization-test-vectors.md), [test-vectors/canonical/](../../test-vectors/canonical/), [subgraph/README.md](../../subgraph/README.md).

**M2 (Sepolia, roadmap, video script):** [specs/m2/](../m2/)
