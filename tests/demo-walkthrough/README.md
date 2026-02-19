# Demo walkthrough — supporting tests

Tests run by **`pnpm demo:walkthrough`** (M1 demo for grant reviewers).

| Step | File (this folder) | Step 5 (Hardhat) |
|------|--------------------|------------------|
| 2 | `demo-protocol-walkthrough.test.ts` | — |
| 3 | `ingestion.test.ts` | — |
| 4 | `m1-demo.test.ts` | — |
| 5 | — | `packages/protocol/test/QuerySettleWalkthrough.test.js` |

Step 5 runs in the protocol package (Hardhat); the other three run here via Vitest.
