$ErrorActionPreference = 'Stop'

$repoDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$dataDir = Join-Path $repoDir '.tmp\postgres-dev'
$logDir = Join-Path $repoDir '.tmp\logs'
$pgBin = $env:PRODIVIX_PG_BIN

if (-not $pgBin) {
  $pgBin = [Environment]::GetEnvironmentVariable('PRODIVIX_PG_BIN', 'User')
}

if (-not $pgBin) {
  $pgBin = [Environment]::GetEnvironmentVariable('PRODIVIX_PG_BIN', 'Machine')
}

if (-not $pgBin -or -not (Test-Path (Join-Path $pgBin 'pg_ctl.exe'))) {
  throw 'Could not find PostgreSQL bin directory. Set PRODIVIX_PG_BIN to the folder containing pg_ctl.exe.'
}

$initdb = Join-Path $pgBin 'initdb.exe'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$createdb = Join-Path $pgBin 'createdb.exe'
$psql = Join-Path $pgBin 'psql.exe'

$env:PGCLIENTENCODING = 'UTF8'
$env:LC_MESSAGES = 'C'
$env:LANG = 'C'

New-Item -ItemType Directory -Path $dataDir, $logDir -Force | Out-Null

if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
  Write-Host '[dev-db] Initializing local PostgreSQL data directory...'
  $passwordFile = Join-Path $env:TEMP 'prodivix-postgres-password.txt'
  [System.IO.File]::WriteAllText($passwordFile, 'postgres', [System.Text.UTF8Encoding]::new($false))
  try {
    & $initdb -D $dataDir -U postgres -A scram-sha-256 "--pwfile=$passwordFile"
    if ($LASTEXITCODE -ne 0) {
      throw "initdb failed with exit code $LASTEXITCODE"
    }
  } finally {
    Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
  }
}

$confPath = Join-Path $dataDir 'postgresql.conf'
$hbaPath = Join-Path $dataDir 'pg_hba.conf'
$conf = Get-Content -LiteralPath $confPath -Raw -Encoding UTF8
$conf = $conf -replace '(?m)^#?port\s*=.*$', 'port = 55432'
$conf = $conf -replace '(?m)^#?listen_addresses\s*=.*$', "listen_addresses = '127.0.0.1'"
[System.IO.File]::WriteAllText($confPath, $conf, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($hbaPath, "host all all 127.0.0.1/32 scram-sha-256`r`nhost all all ::1/128 scram-sha-256`r`n", [System.Text.UTF8Encoding]::new($false))

$env:PGPASSWORD = 'postgres'
$logPath = Join-Path $logDir 'postgres-dev.log'
& $pgCtl -D $dataDir status *> $null
if ($LASTEXITCODE -ne 0) {
  & $pgCtl -D $dataDir -l $logPath -o '-p 55432' start
  if ($LASTEXITCODE -ne 0) {
    throw "pg_ctl start failed with exit code $LASTEXITCODE"
  }
} else {
  Write-Host '[dev-db] PostgreSQL is already running.'
}

$databaseExists = & $psql -h 127.0.0.1 -p 55432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'prodivix';"
if ($LASTEXITCODE -ne 0) {
  throw "database existence check failed with exit code $LASTEXITCODE"
}

if ($databaseExists.Trim() -ne '1') {
  & $createdb -h 127.0.0.1 -p 55432 -U postgres prodivix
  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed with exit code $LASTEXITCODE"
  }
}

Write-Host '[dev-db] PostgreSQL is ready at 127.0.0.1:55432/prodivix.'
Write-Host '[dev-db] Keep this window open while developing.'
Wait-Event
