$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$CockpitUrl = if ($env:COCKPIT_URL) { $env:COCKPIT_URL } else { "http://localhost:4141" }

Set-Location $RepoRoot

Clear-Host
Write-Host "Haven Desk early-access setup"
Write-Host "This guided setup starts the local stack on your machine."
Write-Host ""

if (-not (Test-Path ".\swiss.ps1")) {
  Write-Host "Could not find the Haven Desk launcher at .\swiss.ps1."
  Write-Host "Make sure this setup file is inside the downloaded Haven Desk folder."
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "Step 1 of 3: checking and installing prerequisites when possible..."
.\swiss.ps1 setup

Write-Host ""
Write-Host "Step 2 of 3: starting Haven Desk..."
.\swiss.ps1 up

Write-Host ""
Write-Host "Step 3 of 3: opening Haven Desk in your browser..."
Start-Process $CockpitUrl

Write-Host ""
Write-Host "Haven Desk should now be open at $CockpitUrl"
Write-Host "If anything looks wrong, run .\swiss.ps1 doctor in this folder."
Write-Host ""
Read-Host "Press Enter to close this window"
