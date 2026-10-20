$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) {
  Write-Host 'Missing .env. Copy .env.example to .env and fill in the required settings.' -ForegroundColor Yellow
  exit 1
}
if ((-not (Test-Path -LiteralPath 'node_modules/express/package.json')) -or
    (-not (Test-Path -LiteralPath 'node_modules/ejs/package.json')) -or
    (-not (Test-Path -LiteralPath 'node_modules/dotenv/package.json'))) {
  npm ci
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node server.js
exit $LASTEXITCODE
