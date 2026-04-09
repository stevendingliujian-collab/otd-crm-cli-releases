# CRM CLI Installer for Windows (PowerShell)
# Supports both Git and npm installation methods
# Usage: Invoke-WebRequest https://www.otd-odincloud.com/install-crm-cli.ps1 -OutFile install.ps1; .\install.ps1

Write-Host "🚀 Installing OTD CRM CLI..." -ForegroundColor Green

# Configuration
$GIT_REPO = "https://github.com/stevendingliujian-collab/otd-crm-cli-releases.git"
$INSTALL_DIR = "$HOME\.crm-cli"

# Check Node.js
try {
  $NODE_VERSION = node -v 2>$null
  if (-not $NODE_VERSION) {
    throw "Node.js not found"
  }
  Write-Host "✅ Node.js detected: $NODE_VERSION" -ForegroundColor Green
} catch {
  Write-Host "❌ Node.js is not installed." -ForegroundColor Red
  Write-Host ""
  Write-Host "Please install Node.js first:"
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
    Write-Host "✅ Git detected: $gitVersion" -ForegroundColor Green
  }
} catch {
  # Git not available
}

# Installation method selection
if ($GIT_AVAILABLE) {
  # Method 1: Install from Git repository
  Write-Host ""
  Write-Host "📦 Installing from Git repository..." -ForegroundColor Yellow
  
  if (Test-Path $INSTALL_DIR) {
    Write-Host "📦 Updating existing installation..." -ForegroundColor Yellow
    Set-Location $INSTALL_DIR
    git pull origin main
  } else {
    Write-Host "📦 Cloning repository..." -ForegroundColor Yellow
    $parentDir = Split-Path $INSTALL_DIR -Parent
    if (-not (Test-Path $parentDir)) {
      New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    git clone $GIT_REPO $INSTALL_DIR
    Set-Location $INSTALL_DIR
  }
  
  # Install dependencies
  Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
  npm install
  
  # Build
  Write-Host "🔨 Building CLI..." -ForegroundColor Yellow
  npm run build
  
  # Link globally
  Write-Host "🔗 Linking CLI globally..." -ForegroundColor Yellow
  npm link
  
} else {
  # Method 2: Install via npm (no Git required)
  Write-Host ""
  Write-Host "⚠️  Git not found, installing via npm..." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Note: This installs the latest published version from npm." -ForegroundColor Cyan
  Write-Host "For development version, please install Git first." -ForegroundColor Cyan
  Write-Host ""
  
  try {
    Write-Host "📦 Installing from npm registry..." -ForegroundColor Yellow
    npm install -g @otd/crm-cli
    
    Write-Host ""
    Write-Host "✅ Installation complete!" -ForegroundColor Green
  } catch {
    Write-Host ""
    Write-Host "❌ npm installation failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "  winget install Git.Git" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or download from: https://git-scm.com/download/win" -ForegroundColor Cyan
    exit 1
  }
}

# Verify installation
Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""

try {
  $CRM_VERSION = crm --version 2>$null
  Write-Host "📦 CRM CLI version: $CRM_VERSION" -ForegroundColor Cyan
} catch {
  Write-Host "📦 CRM CLI installed (version check failed)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Quick start:" -ForegroundColor Cyan
Write-Host "   crm auth device    # Login with device authorization" -ForegroundColor White
Write-Host "   crm auth login     # Login with username/password" -ForegroundColor White
Write-Host "   crm --help         # Show all commands" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   https://otdmes.feishu.cn/docx/EG4zd9l2IoaUrxxrFbtcyqxWnWg" -ForegroundColor White
Write-Host ""
