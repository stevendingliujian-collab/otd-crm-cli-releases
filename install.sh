#!/bin/bash
# CRM CLI Installer
# Supports both Git and npm installation methods
# Usage: curl -fsSL https://www.otd-odincloud.com/install-crm-cli.sh | bash

set -e

echo "🚀 Installing OTD CRM CLI..."

# Configuration
GIT_REPO="https://github.com/stevendingliujian-collab/otd-crm-cli-releases.git"
INSTALL_DIR="$HOME/.crm-cli"

# Check Node.js
NODE_VERSION=$(node -v 2>/dev/null || echo "none")

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

# Check if Git is available
if command -v git &> /dev/null; then
  GIT_AVAILABLE=true
  GIT_VERSION=$(git --version)
  echo "✅ Git detected: $GIT_VERSION"
else
  GIT_AVAILABLE=false
  echo "⚠️  Git not found"
fi

# Installation method selection
if [ "$GIT_AVAILABLE" = true ]; then
  # Method 1: Install from Git repository
  echo ""
  echo "📦 Installing from Git repository..."
  
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

  # Link globally (dist/ is pre-compiled in the releases repository)
  echo "🔗 Linking CLI globally..."
  npm link
  
else
  # Method 2: Install via npm (no Git required)
  echo ""
  echo "⚠️  Installing via npm (Git not available)..."
  echo ""
  echo "Note: This installs the latest published version from npm."
  echo "For development version, please install Git first."
  echo ""
  
  # Try to install from npm
  if npm install -g @otd/crm-cli 2>/dev/null; then
    echo ""
    echo "✅ Installation complete!"
  else
    echo ""
    echo "❌ npm installation failed."
    echo ""
    echo "Please install Git first:"
    echo "  macOS:   brew install git"
    echo "  Linux:   sudo apt-get install git"
    echo "  Windows: Download from https://git-scm.com/"
    exit 1
  fi
fi

# Verify installation
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
