#!/usr/bin/env bash
# Start dev stack and redeploy contracts (bash / Git Bash / WSL)
# Run from repo root: ./scripts/start-dev.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Starting Docker stack (blockchain, IPFS, Redis, API)..."
docker compose -f docker/docker-compose.yml up -d

echo "Waiting for Hardhat node on :8545..."
for i in $(seq 1 30); do
  if curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "Hardhat node did not become ready. Check docker logs."
    exit 1
  fi
done

echo "Deploying contracts to localhost..."
cd "$ROOT/packages/protocol"
npx hardhat run scripts/deploy.cjs --network localhost

echo ""
echo "Done. Update packages/api/.env with the printed addresses if they changed."
echo "Start the API with: cd packages/api && pnpm start"
