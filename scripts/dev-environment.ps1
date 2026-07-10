$script:ProdivixRepoDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$script:ProdivixDevEnvironmentImported = $false

function ConvertFrom-ProdivixDotEnvValue {
  param(
    [AllowEmptyString()]
    [string]$Value,
    [string]$Path,
    [int]$LineNumber
  )

  $parsedValue = $Value.Trim()
  if ($parsedValue.Length -eq 0) {
    return ''
  }

  $quote = $parsedValue[0]
  if ($quote -eq '"' -or $quote -eq "'") {
    if ($parsedValue.Length -lt 2 -or $parsedValue[$parsedValue.Length - 1] -ne $quote) {
      throw "Invalid quoted value in ${Path}:$LineNumber."
    }

    return $parsedValue.Substring(1, $parsedValue.Length - 2)
  }

  $commentMatch = [System.Text.RegularExpressions.Regex]::Match($parsedValue, '\s+#')
  if ($commentMatch.Success) {
    return $parsedValue.Substring(0, $commentMatch.Index).TrimEnd()
  }

  return $parsedValue
}

function Import-ProdivixDevEnvironment {
  param(
    [string]$Path = (Join-Path $script:ProdivixRepoDir '.env.local')
  )

  if ($script:ProdivixDevEnvironmentImported) {
    return
  }

  $script:ProdivixDevEnvironmentImported = $true
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  $values = [ordered]@{}
  $lineNumber = 0
  foreach ($rawLine in Get-Content -LiteralPath $Path -Encoding UTF8) {
    $lineNumber += 1
    $line = $rawLine.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith('#')) {
      continue
    }

    if ($line.StartsWith('export ')) {
      $line = $line.Substring(7).TrimStart()
    }

    $separatorIndex = $line.IndexOf('=')
    if ($separatorIndex -le 0) {
      throw "Invalid environment entry in ${Path}:$lineNumber. Expected NAME=value."
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    if ($name -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
      throw "Invalid environment variable name '$name' in ${Path}:$lineNumber."
    }

    $rawValue = $line.Substring($separatorIndex + 1)
    $values[$name] = ConvertFrom-ProdivixDotEnvValue -Value $rawValue -Path $Path -LineNumber $lineNumber
  }

  foreach ($entry in $values.GetEnumerator()) {
    $existingValue = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
    if ($null -eq $existingValue) {
      [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
  }
}

function Get-ProdivixLocalPostgresConfig {
  Import-ProdivixDevEnvironment

  $databaseUrl = $env:BACKEND_DB_URL
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = 'postgres://postgres:postgres@127.0.0.1:55456/prodivix?sslmode=disable'
  }

  try {
    $uri = [System.Uri]::new($databaseUrl)
  } catch {
    throw "BACKEND_DB_URL is not a valid PostgreSQL URL: $($_.Exception.Message)"
  }

  if (-not $uri.IsAbsoluteUri -or @('postgres', 'postgresql') -notcontains $uri.Scheme) {
    throw 'BACKEND_DB_URL must use the postgres:// or postgresql:// scheme.'
  }

  $hostName = $uri.Host.ToLowerInvariant()
  if (@('127.0.0.1', 'localhost', '::1') -notcontains $hostName) {
    throw 'The native development PostgreSQL script only accepts a loopback BACKEND_DB_URL host.'
  }

  $port = $uri.Port
  if ($port -lt 1) {
    $port = 5432
  }

  if ($port -gt 65535) {
    throw 'BACKEND_DB_URL contains an invalid PostgreSQL port.'
  }

  [string[]]$userInfo = $uri.UserInfo -split ':', 2
  $userName = [System.Uri]::UnescapeDataString($userInfo[0])
  $password = if ($userInfo.Length -gt 1) {
    [System.Uri]::UnescapeDataString($userInfo[1])
  } else {
    ''
  }
  $database = [System.Uri]::UnescapeDataString($uri.AbsolutePath.Trim([char[]]@('/')))

  if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($database)) {
    throw 'BACKEND_DB_URL must include a PostgreSQL user and database name.'
  }

  $pgBin = $env:PRODIVIX_PG_BIN
  if ([string]::IsNullOrWhiteSpace($pgBin)) {
    $pgBin = [Environment]::GetEnvironmentVariable('PRODIVIX_PG_BIN', 'User')
  }
  if ([string]::IsNullOrWhiteSpace($pgBin)) {
    $pgBin = [Environment]::GetEnvironmentVariable('PRODIVIX_PG_BIN', 'Machine')
  }

  [PSCustomObject]@{
    DatabaseUrl = $databaseUrl
    Host = $hostName
    Port = $port
    User = $userName
    Password = $password
    Database = $database
    PgBin = $pgBin
  }
}
