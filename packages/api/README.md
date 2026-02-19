# @alexandrian/api

Minimal API stub for **Milestone 1**. Serves `/` and `/health` so the Docker stack can run without a full backend.

This stub exists solely to support demo orchestration in Milestone 1. Core protocol logic lives in `packages/protocol` and is tested independently.

- **M1:** Stub only — no ingest, query, or ledger. Other routes return 503.
- **M2:** Full implementation (ingest, query, ledger, Merkle proofs, etc.).

## Build & run

```bash
pnpm build   # from repo root builds protocol, pipeline, sdk, api
cd packages/api && pnpm start
```

Or start the full stack:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Optional .env

Copy `.env.example` to `.env` to override defaults. The Docker Compose `environment` block already sets RPC, Redis, and keys for local dev.
