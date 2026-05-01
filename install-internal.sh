#!/bin/bash
# CRM CLI Installer (企业内网版 - 从公司 Gitea 安装)
# Usage: curl -fsSL http://dev.otdmes.com.cn:3334/OTD/otd-crm-cli/raw/branch/main/install-internal.sh | bash

set -e

echo "🚀 Installing OTD CRM CLI (企业内网版)..."

# Configuration - 公司 Gitea
GIT_REPO="http://dev.otdmes.com.cn:3334/OTD/otd-crm-cli.git"
INSTALL_DIR="$HOME/.crm-cli"

# Check Node.js
NODE_VERSION=$(node -v 2>/dev/null || echo "none")

if [ "$NODE_VERSION" = "none" ]; then
  echo "❌ Node.js 未安装"
  echo ""
  echo "请先安装 Node.js:"
  echo "  macOS:   brew install node"
  echo "  Linux:   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
  exit 1
fi

echo "✅ Node.js: $NODE_VERSION"

# Check if Git is available
if command -v git &> /dev/null; then
  GIT_AVAILABLE=true
  echo "✅ Git: $(git --version)"
else
  echo "❌ Git 未安装"
  echo ""
  echo "请先安装 Git:"
  echo "  macOS:   brew install git"
  echo "  Linux:   sudo apt-get install git"
  exit 1
fi

# Installation
echo ""
echo "📦 从公司 Gitea 安装..."

if [ -d "$INSTALL_DIR" ]; then
  echo "📦 更新现有安装..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "📦 克隆仓库..."
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$GIT_REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Install dependencies
echo "📦 安装依赖..."
npm install

# Build
echo "🔨 编译 CLI..."
npm run build

# Link globally
echo "🔗 全局链接..."
npm link

# Verify
echo ""
echo "✅ 安装完成！"
echo ""

CRM_VERSION=$(crm --version 2>/dev/null || echo "unknown")
echo "📦 CRM CLI 版本：$CRM_VERSION"
echo ""
echo "🚀 快速开始:"
echo "   crm auth device    # 设备授权登录（推荐）"
echo "   crm auth login     # 用户名密码登录"
echo "   crm --help         # 查看所有命令"
echo ""
echo "📚 文档:"
echo "   https://otdmes.feishu.cn/docx/EG4zd9l2IoaUrxxrFbtcyqxWnWg"
echo ""
