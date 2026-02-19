# Copy-paste commands (run from repo root)

| Command | What it runs |
|---------|----------------|
| `pnpm verify` | Full suite: install, build, contract tests, spec tests, integration tests, demo (one shot). Implemented in [scripts/run-m1-verification.mjs](../../scripts/run-m1-verification.mjs). |
| `pnpm demo:walkthrough` | Verbose walkthrough for reviewers; plain-language output (no dots). Run after `pnpm install`; script runs build first. |
| `pnpm install && pnpm build && pnpm demo` | Get started: install, build, then run demo. |
| `pnpm test:spec` | Unit + invariants + M1 demo test. |
| `pnpm test:protocol` | Hardhat contract tests. |
| `pnpm test:integration` | Integration tests (testnet smoke, subgraph, etc.). |
| `pnpm test` | test:protocol + test:spec + test:integration. |

---

## Clean M1 verification

Section headers + minimal output (dot reporters).

```bash
pnpm verify
```

## Demo walkthrough (human-readable, for grant reviewers)

**The only command needed for the M1 demo:** `pnpm demo:walkthrough`

Full loop with verbose output — no dots; test names and results in plain language. Use before posting to testnet or grant submission. Run from repo root after `pnpm install` (script runs `pnpm build` first).

```bash
pnpm demo:walkthrough
```

## Get started

```bash
pnpm install && pnpm build && pnpm demo
```

PowerShell (use `;` not `&&`):

```powershell
pnpm install; pnpm build; pnpm demo
```

## M1 demo test

```bash
pnpm test:spec
```

## CLI (alex)

From repo root after `pnpm build`. Use **Node 20 LTS** (Node 24 causes multiformats errors). Set `CHAIN_RPC_URL`, `REGISTRY_ADDRESS`, `PRIVATE_KEY` (or `DEPLOYER_PRIVATE_KEY`) for publish/query/settle/inspect/lineage.

**Important:** Use the double-dash `--` so arguments go to the CLI. Without it, `pnpm alex publish ...` will give a confusing pnpm error. Copy-paste exactly as below.

```bash
pnpm alex -- publish <envelope.json> --stake <wei> --query-fee <wei>
pnpm alex -- query "<search text>" --domain <domain>
pnpm alex -- settle <contentHash> --agent <address>
pnpm alex -- inspect <contentHash>
pnpm alex -- lineage <contentHash>
pnpm alex -- verify <contentHash> --expected <path/to/expected.json>
pnpm alex -- accounts list
```

Help:

```bash
pnpm alex -- --help
```

## Other

```bash
node scripts/demo.mjs
pnpm test:invariants
pnpm test:integration
pnpm test:protocol
pnpm test
pnpm deploy:local
docker compose -f docker/docker-compose.yml up --build
```
