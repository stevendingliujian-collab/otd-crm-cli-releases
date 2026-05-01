#!/bin/bash
# OTD CRM CLI Installer (macOS / Linux)
# Usage: curl -fsSL https://github.com/stevendingliujian-collab/otd-crm-cli-releases/releases/latest/download/install.sh | bash

set -e

RELEASES_REPO="stevendingliujian-collab/otd-crm-cli-releases"
GITHUB_API="https://api.github.com/repos/${RELEASES_REPO}/releases/latest"

echo ""
echo "🚀 OTD CRM CLI Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js is not installed."
  echo ""
  echo "Please install Node.js 18+ first:"
  echo "  macOS:  brew install node"
  echo "  Linux:  https://nodejs.org/en/download/package-manager"
  echo ""
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Node.js 18+ is required (found $(node -v))"
  echo "   Please upgrade: https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# ── 2. Fetch latest release tgz URL ──────────────────────────────────────────
echo "🔍 Fetching latest release..."

# Try curl first, fall back to wget
if command -v curl &>/dev/null; then
  RELEASE_JSON=$(curl -fsSL "$GITHUB_API")
else
  RELEASE_JSON=$(wget -qO- "$GITHUB_API")
fi

TGZ_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep '\.tgz"' | head -1 | cut -d '"' -f 4)
VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | cut -d '"' -f 4)

if [ -z "$TGZ_URL" ]; then
  echo "❌ Could not fetch release info from GitHub."
  echo "   Check your network or visit:"
  echo "   https://github.com/${RELEASES_REPO}/releases"
  exit 1
fi

echo "📦 Latest version: $VERSION"
echo "📥 Downloading from: $TGZ_URL"

# ── 3. Install globally via npm ───────────────────────────────────────────────
echo ""
echo "⚙️  Installing (this may take a moment)..."
npm install -g "$TGZ_URL"

# ── 4. Verify ─────────────────────────────────────────────────────────────────
echo ""
if command -v crm &>/dev/null; then
  INSTALLED_VERSION=$(crm --version 2>/dev/null || echo "unknown")
  echo "✅ CRM CLI installed: $INSTALLED_VERSION"
else
  echo "⚠️  crm command not found in PATH."
  echo "   npm global bin: $(npm config get prefix)/bin"
  echo "   Add it to your PATH:"
  echo '   export PATH="$(npm config get prefix)/bin:$PATH"'
  exit 1
fi

# ── 5. First-time setup hint ──────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Initialize config:    crm config init"
echo "  2. Login (browser):      crm auth device"
echo "     Login (password):     crm auth login"
echo "  3. Verify:               crm auth whoami"
echo ""
echo "  crm --help               # Show all commands"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
