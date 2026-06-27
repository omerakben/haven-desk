$ErrorActionPreference = "Stop"

$AppName = "Haven Desk"
$RepoUrl = if ($env:HAVEN_DESK_REPO) { $env:HAVEN_DESK_REPO } else { "https://github.com/omerakben/swiss-knife.git" }
$Branch = if ($env:HAVEN_DESK_BRANCH) { $env:HAVEN_DESK_BRANCH } else { "main" }
$InstallDir = if ($env:HAVEN_DESK_HOME) { $env:HAVEN_DESK_HOME } else { Join-Path $HOME "HavenDesk" }
$AppUrl = if ($env:HAVEN_DESK_URL) { $env:HAVEN_DESK_URL } else { "http://localhost:4141" }

function Write-Step([string]$Message) {
  Write-Host $Message -ForegroundColor White
}

function Write-Ok([string]$Message) {
  Write-Host "  OK  " -ForegroundColor Green -NoNewline
  Write-Host $Message
}

function Write-Note([string]$Message) {
  Write-Host "  NOTE  " -ForegroundColor Yellow -NoNewline
  Write-Host $Message
}

function Stop-WithMessage([string]$Message) {
  Write-Host "  ERR  " -ForegroundColor Red -NoNewline
  Write-Host $Message
  exit 1
}

function Test-Command([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-Docker {
  if (-not (Test-Command "docker")) { return $false }
  for ($i = 0; $i -lt 180; $i++) {
    $ErrorActionPreference = "Continue"
    try {
      docker info 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) {
        $ErrorActionPreference = "Stop"
        return $true
      }
    } catch { }
    $ErrorActionPreference = "Stop"
    Start-Sleep -Seconds 1
  }
  return $false
}

Write-Step "$AppName quick start"

if (-not $IsWindows -and $PSVersionTable.PSVersion.Major -ge 6) {
  Stop-WithMessage "This installer is for Windows. Use install.sh on macOS."
}

if (-not (Test-Command "git")) {
  if (Test-Command "winget") {
    Write-Note "Git is missing. Installing Git with winget."
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Git install failed. Install Git manually, then rerun this command." }
    $env:Path = "$env:ProgramFiles\Git\cmd;$env:Path"
  } else {
    Stop-WithMessage "Git is required and winget is not available. Install Git, then rerun this command."
  }
}

if (Test-Path (Join-Path $InstallDir ".git")) {
  Write-Step "Updating $InstallDir"
  git -C $InstallDir fetch --depth 1 origin $Branch
  git -C $InstallDir checkout $Branch
  git -C $InstallDir pull --ff-only origin $Branch
  Write-Ok "Repository updated"
} elseif ((Test-Path $InstallDir) -and ((Get-ChildItem -LiteralPath $InstallDir -Force | Select-Object -First 1) -ne $null)) {
  Stop-WithMessage "$InstallDir exists and is not an empty Haven Desk checkout. Set HAVEN_DESK_HOME to another folder and rerun."
} else {
  Write-Step "Downloading Haven Desk to $InstallDir"
  git clone --depth 1 --branch $Branch $RepoUrl $InstallDir
  if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Repository download failed." }
  Write-Ok "Repository downloaded"
}

Set-Location -LiteralPath $InstallDir

Write-Step "Installing prerequisites"
powershell -ExecutionPolicy Bypass -File ".\swiss.ps1" setup
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Setup failed. Review the output above." }

$dockerBin = Join-Path $env:ProgramFiles "Docker\Docker\resources\bin"
if ((Test-Path $dockerBin) -and ($env:Path -notlike "*$dockerBin*")) {
  $env:Path = "$dockerBin;$env:Path"
}

if ((Test-Command "docker") -and -not (Wait-Docker)) {
  $dockerExe = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerExe) {
    Write-Note "Starting Docker Desktop. Accept any first-run prompts if they appear."
    Start-Process -FilePath $dockerExe | Out-Null
    if (-not (Wait-Docker)) {
      Stop-WithMessage "Docker Desktop did not become ready. Open Docker Desktop, finish setup, then run: cd `"$InstallDir`"; .\swiss.ps1 up"
    }
  }
}

Write-Step "Starting Haven Desk"
powershell -ExecutionPolicy Bypass -File ".\swiss.ps1" up
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Start failed. Review the output above." }

Start-Process $AppUrl | Out-Null
Write-Step "Ready"
Write-Ok "Haven Desk: $AppUrl"
