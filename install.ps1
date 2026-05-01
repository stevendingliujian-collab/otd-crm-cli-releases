# OTD CRM CLI Installer (Windows PowerShell)
# Usage: irm https://github.com/stevendingliujian-collab/otd-crm-cli-releases/releases/latest/download/install.ps1 | iex

$ErrorActionPreference = "Stop"

$RELEASES_REPO = "stevendingliujian-collab/otd-crm-cli-releases"
$GITHUB_API    = "https://api.github.com/repos/$RELEASES_REPO/releases/latest"

Write-Host ""
Write-Host "🚀 OTD CRM CLI Installer" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
try {
  $nodeVersion = (node -v 2>$null)
  if (-not $nodeVersion) { throw }
} catch {
  Write-Host "❌ Node.js is not installed." -ForegroundColor Red
  Write-Host ""
  Write-Host "Install Node.js 18+ first:" -ForegroundColor Yellow
  Write-Host "  winget install OpenJS.NodeJS.LTS"
  Write-Host "  or download from: https://nodejs.org/"
  exit 1
}

$nodeMajor = [int]($nodeVersion.TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 18) {
  Write-Host "❌ Node.js 18+ required (found $nodeVersion)" -ForegroundColor Red
  Write-Host "   Upgrade from: https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# ── 2. Fetch latest release tgz URL ──────────────────────────────────────────
Write-Host "🔍 Fetching latest release..."

try {
  $release = Invoke-RestMethod -Uri $GITHUB_API -UseBasicParsing
} catch {
  Write-Host "❌ Could not fetch release info from GitHub." -ForegroundColor Red
  Write-Host "   Check your network or visit:"
  Write-Host "   https://github.com/$RELEASES_REPO/releases"
  exit 1
}

$asset  = $release.assets | Where-Object { $_.name -like "*.tgz" } | Select-Object -First 1
$tgzUrl = $asset.browser_download_url
$version = $release.tag_name

if (-not $tgzUrl) {
  Write-Host "❌ No .tgz asset found in latest release." -ForegroundColor Red
  exit 1
}

Write-Host "📦 Latest version: $version" -ForegroundColor Cyan
Write-Host "📥 Downloading from: $tgzUrl" -ForegroundColor DarkGray

# ── 3. Install globally via npm ───────────────────────────────────────────────
Write-Host ""
Write-Host "⚙️  Installing (this may take a moment)..."
npm install -g $tgzUrl

# ── 4. Verify ─────────────────────────────────────────────────────────────────
Write-Host ""
try {
  $installedVersion = crm --version 2>$null
  Write-Host "✅ CRM CLI installed: $installedVersion" -ForegroundColor Green
} catch {
  Write-Host "⚠️  crm command not found in PATH." -ForegroundColor Yellow
  Write-Host "   Restart your terminal and try again."
  Write-Host "   If the issue persists, run: npm config get prefix"
  Write-Host "   and add the 'bin' folder to your PATH."
  exit 1
}

# ── 5. First-time setup hint ──────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Initialize config:    crm config init"
Write-Host "  2. Login (browser):      crm auth device"
Write-Host "     Login (password):     crm auth login"
Write-Host "  3. Verify:               crm auth whoami"
Write-Host ""
Write-Host "  crm --help               # Show all commands"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
