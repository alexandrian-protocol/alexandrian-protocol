# @alexandrian/api

Minimal API surface for Docker and health checks. Serves `/` and `/health`; other routes return 503 until implemented.

Core protocol logic lives in `packages/protocol` and is tested independently.

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
