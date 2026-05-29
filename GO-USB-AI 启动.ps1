# GO-USB-AI Startup Script
# Usage: Right-click "Run with PowerShell" or execute in terminal: .\GO-USB-AI 启动.ps1
param(
    [switch]$Build,
    [switch]$NoBuild
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

trap {
    Write-Host ""
    Write-Host "[FATAL ERROR] Script execution failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press Enter to exit..." -ForegroundColor Gray
    Read-Host
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       GO-USB-AI Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$needBuild = $false

if ($Build) {
    $needBuild = $true
}
elseif (-not $NoBuild) {
    if (-not (Test-Path "packages/go-usb-ai/ui-dist/index.html")) {
        Write-Host "[INFO] ui-dist directory not found, will build frontend..." -ForegroundColor Yellow
        $needBuild = $true
    }
}

if ($needBuild) {
    Write-Host ""
    Write-Host "[1/2] Building frontend UI..." -ForegroundColor Green
    try {
        & pnpm -C packages/go-usb-ai-ui build
        if ($LASTEXITCODE -ne 0) {
            throw "pnpm build failed: $LASTEXITCODE"
        }
    } catch {
        Write-Host ""
        Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
        Write-Host "Details: $_" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Host "[2/2] Copying frontend resources..." -ForegroundColor Green
    try {
        & node packages/go-usb-ai/scripts/copy-ui-dist.mjs
        if ($LASTEXITCODE -ne 0) {
            throw "node copy failed: $LASTEXITCODE"
        }
    } catch {
        Write-Host ""
        Write-Host "[ERROR] Resource copy failed" -ForegroundColor Red
        Write-Host "Details: $_" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host ""
}

# Step 1: Stop old service
Write-Host "[Step 1/2] Checking and stopping old service..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stoppedOldService = $false
try {
    $listeningProcess = netstat -ano | Select-String ":55667" | Select-String "LISTENING"
    if ($listeningProcess) {
        Write-Host "[DETECTED] Found running GO-USB-AI service" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Running process information:" -ForegroundColor Gray
        $listeningProcess | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        Write-Host ""
        
        # Extract PID
        $pidLine = $listeningProcess.Line
        $parts = $pidLine -split '\s+'
        $processId = $parts[-1]
        
        if ($processId -and $processId -match '^\d+$') {
            Write-Host "[ACTION] Stopping process (PID: $processId)..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            
            # Verify stopped
            $verifyStop = netstat -ano | Select-String ":55667" | Select-String "LISTENING"
            if (-not $verifyStop) {
                Write-Host "[SUCCESS] Old service stopped" -ForegroundColor Green
                $stoppedOldService = $true
            } else {
                Write-Host "[WARNING] Process still running, may need manual close" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[INFO] Cannot extract process PID" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[DETECTED] No running service found" -ForegroundColor Green
    }
} catch {
    Write-Host "[INFO] Error checking old service: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# Step 2: Start new service
Write-Host "[Step 2/2] Starting GO-USB-AI service..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Frontend URL: http://127.0.0.1:55667" -ForegroundColor Cyan
Write-Host "API URL: http://127.0.0.1:55667/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop service" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check port again
$portInUse = $false
try {
    $netstat = netstat -ano | Select-String ":55667" | Select-String "LISTENING"
    if ($netstat) {
        Write-Host "[ERROR] Port 55667 still in use, cannot start" -ForegroundColor Red
        Write-Host ""
        Write-Host "Process information:" -ForegroundColor Gray
        $netstat | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        Write-Host ""
        Write-Host "Suggestions:" -ForegroundColor Yellow
        Write-Host "  1. Manually close the process using the port" -ForegroundColor Gray
        Write-Host "  2. Or restart your computer" -ForegroundColor Gray
        Write-Host ""
        $portInUse = $true
    }
} catch {
    Write-Host "[INFO] Port check failed, will attempt to start" -ForegroundColor Yellow
}

if (-not $portInUse) {
    Write-Host "Preparing to start service..." -ForegroundColor Green
    Write-Host "Project root: $ProjectRoot" -ForegroundColor Gray
    Write-Host ""
    
    $env:GOUSB_AI_HOME = $ProjectRoot
    
    try {
        Write-Host "[EXECUTING] pnpm dev:build serve..." -ForegroundColor Cyan
        & pnpm -C packages/go-usb-ai dev:build serve
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Service startup failed (exit code: $exitCode)" -ForegroundColor Red
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  1. Dependencies not installed - Run 'pnpm install'" -ForegroundColor Gray
            Write-Host "  2. Port in use - Check process information above" -ForegroundColor Gray
            Write-Host "  3. Config file error - Check config.json" -ForegroundColor Gray
            Write-Host "  4. Node.js version incompatible - Use Node.js 20+" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "Service stopped normally" -ForegroundColor Yellow
        }
    } catch {
        Write-Host ""
        Write-Host "[ERROR] Exception occurred during service startup" -ForegroundColor Red
        Write-Host "Exception: $_" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Suggestions:" -ForegroundColor Gray
        Write-Host "  1. Check Node.js version: node --version" -ForegroundColor Gray
        Write-Host "  2. Check pnpm version: pnpm --version" -ForegroundColor Gray
        Write-Host "  3. Reinstall dependencies: pnpm install" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
