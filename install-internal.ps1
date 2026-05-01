# CRM CLI Installer for Windows (企业内网版 - 从公司 Gitea 安装)
# Usage: Invoke-WebRequest http://dev.otdmes.com.cn:3334/OTD/otd-crm-cli/raw/branch/main/install-internal.ps1 -OutFile install.ps1; .\install.ps1

Write-Host "🚀 Installing OTD CRM CLI (企业内网版)..." -ForegroundColor Green

# Configuration - 公司 Gitea
$GIT_REPO = "http://dev.otdmes.com.cn:3334/OTD/otd-crm-cli.git"
$INSTALL_DIR = "$HOME\.crm-cli"

# Check Node.js
try {
  $NODE_VERSION = node -v 2>$null
  if (-not $NODE_VERSION) {
    throw "Node.js not found"
  }
  Write-Host "✅ Node.js: $NODE_VERSION" -ForegroundColor Green
} catch {
  Write-Host "❌ Node.js 未安装" -ForegroundColor Red
  Write-Host ""
  Write-Host "请先安装 Node.js:"
  Write-Host "  Download from: https://nodejs.org/"
  Write-Host "  Or with winget: winget install OpenJS.NodeJS.LTS"
  exit 1
}

# Check if Git is available
$GIT_AVAILABLE = $false
try {
  $gitVersion = git --version 2>$null
  if ($gitVersion) {
    $GIT_AVAILABLE = $true
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
  }
} catch {
  # Git not available
}

if (-not $GIT_AVAILABLE) {
  Write-Host "❌ Git 未安装" -ForegroundColor Red
  Write-Host ""
  Write-Host "请先安装 Git:"
  Write-Host "  winget install Git.Git"
  Write-Host "  Or download from: https://git-scm.com/download/win"
  exit 1
}

# Installation
Write-Host ""
Write-Host "📦 从公司 Gitea 安装..." -ForegroundColor Yellow

if (Test-Path $INSTALL_DIR) {
  Write-Host "📦 更新现有安装..." -ForegroundColor Yellow
  Set-Location $INSTALL_DIR
  git pull origin main
} else {
  Write-Host "📦 克隆仓库..." -ForegroundColor Yellow
  $parentDir = Split-Path $INSTALL_DIR -Parent
  if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
  }
  git clone $GIT_REPO $INSTALL_DIR
  Set-Location $INSTALL_DIR
}

# Install dependencies
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install

# Build
Write-Host "🔨 编译 CLI..." -ForegroundColor Yellow
npm run build

# Link globally
Write-Host "🔗 全局链接..." -ForegroundColor Yellow
npm link

# Verify
Write-Host ""
Write-Host "✅ 安装完成！" -ForegroundColor Green
Write-Host ""

try {
  $CRM_VERSION = crm --version 2>$null
  Write-Host "📦 CRM CLI 版本：$CRM_VERSION" -ForegroundColor Cyan
} catch {
  Write-Host "📦 CRM CLI 已安装（版本检查失败）" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 快速开始:" -ForegroundColor Cyan
Write-Host "   crm auth device    # 设备授权登录（推荐）" -ForegroundColor White
Write-Host "   crm auth login     # 用户名密码登录" -ForegroundColor White
Write-Host "   crm --help         # 查看所有命令" -ForegroundColor White
Write-Host ""
Write-Host "📚 文档:" -ForegroundColor Cyan
Write-Host "   https://otdmes.feishu.cn/docx/EG4zd9l2IoaUrxxrFbtcyqxWnWg" -ForegroundColor White
Write-Host ""
