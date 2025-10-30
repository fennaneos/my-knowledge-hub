#Requires -Version 7
<#
.SYNOPSIS
  Vendors Freqtrade into a Docusaurus project and wires basic dev scripts.

.NOTES
  Run from the root of your project (the folder that contains package.json / docusaurus.config.js).
#>

# ------------------ EDITABLE SETTINGS ------------------
# Where to put Freqtrade inside your repo:
$TargetDir        = "tools/freqtrade"      # relative to repo root
$UseSubmodule     = $true                  # set $false to copy instead of submodule
$FreqtradeRepo    = "https://github.com/freqtrade/freqtrade.git"
$FreqtradeRef     = "stable"               # could be 'stable' or 'develop'

# Python interpreter to use for venv (py works on Windows if the launcher is installed)
$PythonExe        = "py"                   # or "python", or full path
$VenvDir          = "tools/.venv-freqtrade"

# Create a sample Docusaurus lab helper page? (non-destructive; only if file doesn't exist)
$CreateLabHelper  = $true
$LabPagePath      = "src/pages/lab-helper.tsx"

# ------------------------------------------------------

function Assert-Tool($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Error "Required tool '$name' not found in PATH. Please install it and re-run."
    exit 1
  }
}

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

function Update-GitIgnore([string]$path) {
  $lines = @()
  if (Test-Path $path) { $lines = Get-Content $path -Raw }
  $extras = @"
# --- Freqtrade vendored ---
$VenvDir/
$TargetDir/.env*
$TargetDir/user_data/*
!$TargetDir/user_data/backtesting/
!$TargetDir/user_data/strategies/
$TargetDir/.mypy_cache/
$TargetDir/.pytest_cache/
$TargetDir/.vscode/
"@
  if (-not ($lines -match "\-\-\- Freqtrade vendored \-\-\-")) {
    Add-Content -Path $path -Value $extras
    Write-Host "Updated .gitignore"
  } else {
    Write-Host ".gitignore already has Freqtrade section; skipping."
  }
}

function Update-NetlifyToml([string]$path) {
  if (-not (Test-Path $path)) {
    # minimal file
@"
[build]
  command = "npm run build"
  publish = "build"

[functions]
  node_bundler = "esbuild"
"@ | Out-File -Encoding utf8 $path
    Write-Host "Created netlify.toml"
    return
  }

  $raw = Get-Content $path -Raw
  if ($raw -notmatch "\[functions\]") {
    $raw += "`n`n[functions]`n  node_bundler = \"esbuild\"`n"
  }
  # We don't need a special ignore here; Netlify won't execute Python unless you tell it to.
  Set-Content -Path $path -Value $raw -Encoding utf8
  Write-Host "Updated netlify.toml"
}

function Update-PackageJson([string]$path) {
  if (-not (Test-Path $path)) { Write-Warning "package.json not found; skipping npm script wiring."; return }
  $json = Get-Content $path -Raw | ConvertFrom-Json

  if (-not $json.scripts) { $json | Add-Member -NotePropertyName scripts -NotePropertyValue (@{}) }

  $json.scripts."freq:venv"     = "$PythonExe -m venv $VenvDir"
  $json.scripts."freq:install"  = "$VenvDir/Scripts/python -m pip install --upgrade pip && $VenvDir/Scripts/pip install -e ."
  $json.scripts."freq:config"   = "$VenvDir/Scripts/freqtrade new-config --config $TargetDir/user_data/config.json --selection quickstart --overwrite"
  $json.scripts."freq:ui"       = "docker compose -f $TargetDir/docker-compose.yml up ftui"
  $json.scripts."freq:backtest" = "$VenvDir/Scripts/freqtrade backtesting --config $TargetDir/user_data/config.json --strategy SampleStrategy"
  $json.scripts."freq:dry"      = "$VenvDir/Scripts/freqtrade trade --dry-run --config $TargetDir/user_data/config.json"

  ($json | ConvertTo-Json -Depth 100) | Set-Content -Encoding utf8 $path
  Write-Host "Added npm scripts: freq:*"
}

function Create-DockerCompose([string]$path) {
@"
services:
  ftbot:
    image: freqtradeorg/freqtrade:stable
    container_name: ftbot
    volumes:
      - ./:/freqtrade
    working_dir: /freqtrade
    command: >
      trade
      --dry-run
      --config user_data/config.json
    restart: unless-stopped
    ports:
      - "127.0.0.1:3005:3000"
  ftui:
    image: freqtradeorg/freqtrade:stable
    container_name: ftui
    volumes:
      - ./:/freqtrade
    working_dir: /freqtrade
    command: >
      webserver
      --config user_data/config.json
      --host 0.0.0.0
      --port 8080
    ports:
      - "127.0.0.1:8080:8080"
"@ | Out-File -Encoding utf8 $path
  Write-Host "Created $path"
}

function Create-LabHelper([string]$path) {
  if (Test-Path $path) { Write-Host "$path already exists; skipping."; return }
@"
import React from 'react';
import Layout from '@theme/Layout';

export default function LabHelper(): JSX.Element {
  return (
    <Layout title="Trading Lab" description="Freqtrade local helper">
      <div style={{maxWidth: 900, margin: '0 auto', padding: 16}}>
        <h1>Trading Lab (Local Freqtrade)</h1>
        <p>Run <code>npm run freq:ui</code> locally, then open the UI:</p>
        <p><a className="button button--primary" href="http://localhost:8080" target="_blank" rel="noreferrer">Open Freqtrade UI</a></p>
        <p style={{opacity:.75}}>This site is static on Netlify; the bot/UI run on your machine or server.</p>
      </div>
    </Layout>
  );
}
"@ | Out-File -Encoding utf8 $path
  Write-Host "Created helper page at $path (route: /lab-helper)"
}

# --- Start ---
Assert-Tool git
Assert-Tool $PythonExe

# 1) Ensure target folders
Ensure-Dir (Split-Path -Parent $TargetDir)
Ensure-Dir $TargetDir
Ensure-Dir (Split-Path -Parent $VenvDir)

# 2) Vendor Freqtrade
if ($UseSubmodule) {
  # add submodule only if not present
  if (-not (Test-Path (Join-Path $TargetDir ".git"))) {
    git submodule add -b $FreqtradeRef $FreqtradeRepo $TargetDir
  } else {
    Write-Host "Submodule already present at $TargetDir"
  }
  git submodule update --init --recursive $TargetDir
} else {
  $tmp = Join-Path $env:TEMP ("freqtrade-" + [guid]::NewGuid())
  git clone --depth 1 --branch $FreqtradeRef $FreqtradeRepo $tmp
  Copy-Item -Recurse -Force "$tmp\*" $TargetDir
  Remove-Item -Recurse -Force $tmp
}

# 3) Create docker-compose inside target dir
Create-DockerCompose (Join-Path $TargetDir "docker-compose.yml")

# 4) Python venv + editable install
Write-Host "Creating venv at $VenvDir ..."
& $PythonExe -m venv $VenvDir
& "$VenvDir\Scripts\python.exe" -m pip install --upgrade pip
# editable install from the vendored path
Push-Location $TargetDir
& "..\..\$VenvDir\Scripts\pip.exe" install -e .
Pop-Location

# 5) Bootstrap user_data
Ensure-Dir (Join-Path $TargetDir "user_data")
& "$VenvDir\Scripts\freqtrade.exe" new-config --config "$TargetDir\user_data\config.json" --selection quickstart --overwrite

# 6) .gitignore / package.json / netlify.toml
Update-GitIgnore ".gitignore"
Update-PackageJson "package.json"
Update-NetlifyToml "netlify.toml"

# 7) Optional Docusaurus helper page
if ($CreateLabHelper) { Create-LabHelper $LabPagePath }

Write-Host "`n✅ Done."
Write-Host "Next steps:"
Write-Host "  1) Commit the changes (submodule or files under $TargetDir)."
Write-Host "  2) Run 'npm run freq:dry'  (paper trading in console) or 'npm run freq:ui' then open http://localhost:8080"
Write-Host "  3) Link to '/lab-helper' from your navbar or lab page if you want a button."
