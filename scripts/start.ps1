param(
    [switch]$SkipInfra,
    [switch]$SkipFrontend,
    [switch]$SkipMigrate,
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AdminWebDir = Join-Path $ProjectRoot "admin-web"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Step {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory = $ProjectRoot,
        [string]$ErrorMessage
    )

    Push-Location $WorkingDirectory
    try {
        & $FilePath @ArgumentList
        if ($LASTEXITCODE -ne 0) {
            throw $ErrorMessage
        }
    }
    finally {
        Pop-Location
    }
}

Set-Location $ProjectRoot

if (-not $SkipInfra) {
    if (Test-CommandExists "docker") {
        Write-Step "Starting postgres and redis with docker compose"
        try {
            Invoke-Step -FilePath "docker" -ArgumentList @("compose", "up", "-d", "postgres", "redis") -ErrorMessage "Failed to start docker services."
        }
        catch {
            Write-Warning "Docker compose startup failed. If your database and redis are already running, you can ignore this."
        }
    }
    else {
        Write-Warning "Docker not found. Skipping postgres/redis startup."
    }
}

if (-not $SkipFrontend) {
    if (-not (Test-Path $AdminWebDir)) {
        throw "admin-web directory not found."
    }

    if (-not (Test-CommandExists "npm")) {
        throw "npm is required to build admin-web."
    }

    Write-Step "Installing admin-web dependencies"
    Invoke-Step -FilePath "npm" -ArgumentList @("install") -WorkingDirectory $AdminWebDir -ErrorMessage "npm install failed in admin-web."

    Write-Step "Building admin-web"
    Invoke-Step -FilePath "npm" -ArgumentList @("run", "build") -WorkingDirectory $AdminWebDir -ErrorMessage "npm run build failed in admin-web."
}

if (-not $SkipMigrate) {
    Write-Step "Running database migrations"
    Invoke-Step -FilePath "python" -ArgumentList @("-m", "alembic", "upgrade", "head") -ErrorMessage "alembic upgrade failed."
}

if (-not $SkipSeed) {
    Write-Step "Seeding demo data"
    Invoke-Step -FilePath "python" -ArgumentList @("scripts/seed_demo_data.py") -ErrorMessage "seed_demo_data.py failed."
}

Write-Step "Starting backend at http://127.0.0.1:8000/admin"
Invoke-Step -FilePath "python" -ArgumentList @("-m", "uvicorn", "--app-dir", $ProjectRoot, "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", $ProjectRoot) -ErrorMessage "uvicorn failed to start."
