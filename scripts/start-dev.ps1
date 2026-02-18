# Start dev stack and redeploy contracts (Windows PowerShell)
# Run from repo root: .\scripts\start-dev.ps1
# Usage: docker compose must be in docker/ with -f docker/docker-compose.yml from root

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "Starting Docker stack (blockchain, IPFS, Redis, API)..." -ForegroundColor Cyan
Set-Location $root
docker compose -f docker/docker-compose.yml up -d

Write-Host "Waiting for Hardhat node on :8545..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
do {
  Start-Sleep -Seconds 2
  try {
    $null = Invoke-WebRequest -Uri "http://localhost:8545" -Method Post -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 2
    break
  } catch {
    $attempt++
    if ($attempt -ge $maxAttempts) {
      Write-Error "Hardhat node did not become ready in time. Check docker logs."
    }
  }
} while ($true)

Write-Host "Deploying contracts to localhost..." -ForegroundColor Cyan
Set-Location $root\packages\protocol
npx hardhat run scripts/deploy.cjs --network localhost

Write-Host ""
Write-Host "Done. Update packages/api/.env with the printed addresses if they changed." -ForegroundColor Green
Write-Host "Start the API with: cd packages/api; pnpm start" -ForegroundColor Green
