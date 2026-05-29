#!/usr/bin/env pwsh

# =============================================================================
# 安装 Playwright MCP 和浏览器
# 用途：为 GoUsbAi 提供浏览器自动化能力
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Playwright MCP Installation Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 步骤 1：安装 Playwright MCP
Write-Host "[1/3] Installing @playwright/mcp..." -ForegroundColor Yellow
npm install @playwright/mcp

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Playwright MCP installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Installation failed" -ForegroundColor Red
    exit 1
}

# 步骤 2：安装 Playwright 浏览器
Write-Host "`n[2/3] Installing Playwright browsers..." -ForegroundColor Yellow
npx playwright install chromium

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Playwright Chromium installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Browser installation failed (can be installed manually)" -ForegroundColor Yellow
}

# 步骤 3：配置浏览器路径（使用便携浏览器）
Write-Host "`n[3/3] Configuring browser paths..." -ForegroundColor Yellow

# 默认使用便携浏览器
$defaultBrowserPath = "./workspace/tools/chrome-win64-portable"
$customBrowserPath = Read-Host "Use custom Chromium portable path? (leave empty to use default: $defaultBrowserPath)"

if ([string]::IsNullOrEmpty($customBrowserPath)) {
    $customBrowserPath = $defaultBrowserPath
}

if (Test-Path "$customBrowserPath\chrome.exe") {
    Write-Host "  ✓ Custom browser found: $customBrowserPath\chrome.exe" -ForegroundColor Green
    
    # 更新配置
    $configPath = "./config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        
        # 更新 Playwright MCP 配置
        $config.mcp.servers.playwright.args = @(
            "@playwright/mcp@latest",
            "--browser=chrome",
            "--executable-path=$customBrowserPath\chrome.exe",
            "--user-data-dir=$customBrowserPath\chrome_profile",
            "--headless=false"
        )
        
        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
        Write-Host "  ✓ Config updated" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ Browser not found at specified path" -ForegroundColor Red
    Write-Host "  Please ensure chrome.exe exists in the specified directory" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Installation Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nTest MCP integration:" -ForegroundColor Yellow
Write-Host "  1. Start GoUsbAi Desktop" -ForegroundColor Gray
Write-Host "  2. Create a new agent with Playwright MCP enabled" -ForegroundColor Gray
Write-Host "  3. Test browser automation" -ForegroundColor Gray
Write-Host "`n"
