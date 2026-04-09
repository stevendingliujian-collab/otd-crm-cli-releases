#!/bin/bash
# CRM CLI Installer
# Usage: curl -fsSL https://www.otd-odincloud.com/install-crm-cli.sh | bash

set -e

echo "🚀 Installing OTD CRM CLI..."

# Configuration
GIT_REPO="https://github.com/stevendingliujian-collab/otd-crm-cli-releases.git"
INSTALL_DIR="$HOME/.openclaw/workspace-cto/crm-cli"
NODE_VERSION=$(node -v 2>/dev/null || echo "none")

# Check Node.js
if [ "$NODE_VERSION" = "none" ]; then
  echo "❌ Node.js is not installed."
  echo ""
  echo "Please install Node.js first:"
  echo "  macOS:   brew install node"
  echo "  Linux:   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
  echo "  Windows: Download from https://nodejs.org/"
  exit 1
fi

echo "✅ Node.js detected: $NODE_VERSION"

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
  echo "📦 Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "📦 Cloning repository..."
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$GIT_REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building CLI..."
npm run build

# Link globally
echo "🔗 Linking CLI globally..."
npm link

# Verify
echo ""
echo "✅ Installation complete!"
echo ""
CRM_VERSION=$(crm --version 2>/dev/null || echo "unknown")
echo "📦 CRM CLI version: $CRM_VERSION"
echo ""
echo "🚀 Quick start:"
echo "   crm auth device    # Login with device authorization"
echo "   crm auth login     # Login with username/password"
echo "   crm --help         # Show all commands"
echo ""
echo "📚 Documentation:"
echo "   https://otdmes.feishu.cn/docx/EG4zd9l2IoaUrxxrFbtcyqxWnWg"
echo ""
