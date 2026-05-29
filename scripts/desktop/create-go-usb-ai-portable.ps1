#!/usr/bin/env pwsh

# =============================================================================
# GoUsbAi 一键绿色离线打包脚本 (U盘版)
# 用途：将 GoUsbAi 项目打包成U盘绿色便携版，支持离线运行
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GoUsbAi Portable Packaging Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 获取项目根目录（脚本在 scripts/desktop/ 下，需要上两级）
$projectRoot = Resolve-Path "$PSScriptRoot\..\.."
$portableDir = Join-Path $projectRoot "portable"

Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host "Portable dir: $portableDir`n" -ForegroundColor Gray

# 步骤 1：创建便携版目录
Write-Host "[1/6] Creating portable directory..." -ForegroundColor Yellow
if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
}
New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
New-Item -ItemType Directory -Path "$portableDir\workspace" -Force | Out-Null
New-Item -ItemType Directory -Path "$portableDir\workspace\tools" -Force | Out-Null
New-Item -ItemType Directory -Path "$portableDir\workspace\image" -Force | Out-Null

Write-Host "  ✓ Directory created: $portableDir" -ForegroundColor Green

# 步骤 2：复制核心文件
Write-Host "`n[2/6] Copying core files..." -ForegroundColor Yellow

$coreFiles = @(
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "config.json",
    "AGENTS.md",
    "SOUL.md",
    "USER.md",
    "IDENTITY.md",
    "TOOLS.md",
    "BOOT.md",
    "BOOTSTRAP.md",
    "HEARTBEAT.md",
    "README.md",
    ".npmrc"
)

foreach ($file in $coreFiles) {
    $srcPath = Join-Path $projectRoot $file
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $portableDir $file) -Force
        Write-Host "  ✓ Copied: $file" -ForegroundColor Gray
    }
}

# 步骤 3：复制必要目录
Write-Host "`n[3/6] Copying required directories..." -ForegroundColor Yellow

$requiredDirs = @(
    "packages/go-usb-ai",
    "packages/go-usb-ai-core",
    "packages/go-usb-ai-runtime",
    "packages/go-usb-ai-kernel",
    "packages/go-usb-ai-mcp",
    "packages/go-usb-ai-service",
    "packages/go-usb-ai-server",
    "packages/go-usb-ai-ui",
    "packages/go-usb-ai-openclaw-compat",
    "packages/go-usb-ai-windows-mcp",
    "packages/extensions",
    "apps/desktop",
    "config",
    "docs",
    "scripts",
    "skills"
)

foreach ($dir in $requiredDirs) {
    $srcPath = Join-Path $projectRoot $dir
    $destPath = Join-Path $portableDir $dir
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
        Write-Host "  ✓ Copied: $dir" -ForegroundColor Gray
    }
}

# 步骤 4：复制 node_modules (离线版关键)
Write-Host "`n[4/6] Copying node_modules (for offline use)..." -ForegroundColor Yellow

$nodeModulesDir = Join-Path $projectRoot "node_modules"
if (Test-Path $nodeModulesDir) {
    Copy-Item -Path $nodeModulesDir -Destination (Join-Path $portableDir "node_modules") -Recurse -Force
    Write-Host "  ✓ node_modules copied (offline mode ready)" -ForegroundColor Green
} else {
    Write-Host "  ✗ node_modules not found, run 'pnpm install' first" -ForegroundColor Red
    exit 1
}

# 步骤 5：创建启动脚本
Write-Host "`n[5/6] Creating launcher scripts..." -ForegroundColor Yellow

# 创建 go-usb-ai-start.bat
$startBat = @"
@echo off
cd /d "%~dp0"
echo ========================================
echo   GoUsbAi Portable Launcher
echo ========================================
echo.
echo Starting GoUsbAi Desktop...
echo.
call pnpm -C apps/desktop dev
pause
"@

$startBat | Out-File -FilePath (Join-Path $portableDir "go-usb-ai-start.bat") -Encoding ASCII

# 创建 go-usb-ai-server.bat
$serverBat = @"
@echo off
cd /d "%~dp0"
echo ========================================
echo   GoUsbAi Server Launcher
echo ========================================
echo.
echo Starting GoUsbAi Server...
echo.
call pnpm -C packages/go-usb-ai dev:build serve
pause
"@

$serverBat | Out-File -FilePath (Join-Path $portableDir "go-usb-ai-server.bat") -Encoding ASCII

# 创建 README-portable.txt
$readmePortable = @"
========================================
  GoUsbAi 绿色便携版 (U盘版)
========================================

使用说明：
1. 将整个 GoUsbAi-Portable 文件夹复制到U盘
2. 在目标电脑上运行 go-usb-ai-start.bat 启动桌面版
3. 或运行 go-usb-ai-server.bat 启动服务器版
4. 首次使用需要确保目标电脑已安装 Node.js 18+

离线功能：
- 所有依赖已内置，无需联网安装
- Playwright MCP 已预装
- Windows MCP 已预装
- 本地 Ollama AI 模型需要单独安装

配置说明：
- 主配置文件：config.json
- MCP 配置：config.json -> mcp.servers
- Playwright 浏览器路径：workspace/tools/chrome-win64-portable

========================================
"@

$readmePortable | Out-File -FilePath (Join-Path $portableDir "README-portable.txt") -Encoding UTF8

Write-Host "  ✓ Launcher scripts created" -ForegroundColor Green

# 步骤 6：打包压缩
Write-Host "`n[6/6] Creating portable archive..." -ForegroundColor Yellow

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "GoUsbAi-Portable-$timestamp.zip"
$archivePath = Join-Path $projectRoot $archiveName

if (Test-Path $archivePath) {
    Remove-Item -Force $archivePath
}

# 使用 .NET 压缩
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($portableDir, $archivePath)

Write-Host "  ✓ Archive created: $archivePath" -ForegroundColor Green

# 完成
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Portable Packaging Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nOutput: $archivePath" -ForegroundColor Yellow
Write-Host "Portable directory: $portableDir" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Copy $archiveName to USB drive" -ForegroundColor Gray
Write-Host "  2. Extract on target machine" -ForegroundColor Gray
Write-Host "  3. Run go-usb-ai-start.bat" -ForegroundColor Gray
Write-Host "`n"
