$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'dev-environment.ps1')

$repoDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$config = Get-ProdivixLocalPostgresConfig
$env:BACKEND_DB_URL = $config.DatabaseUrl

Push-Location -LiteralPath $repoDir
try {
  & pnpm run dev:backend
  if ($LASTEXITCODE -ne 0) {
    throw "Backend development server exited with code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
