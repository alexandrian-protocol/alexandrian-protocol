# Copy-paste commands (run from repo root)

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
