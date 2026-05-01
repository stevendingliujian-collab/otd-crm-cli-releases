#!/bin/bash
# CRM CLI Release Script
# Pushes compiled code to the public releases repository

set -e

echo "📦 Publishing CRM CLI to releases repository..."

# Configuration
DEV_REPO="$(pwd)"
RELEASES_REPO="$HOME/.openclaw/workspace-cto/crm-cli-releases"
RELEASES_REMOTE="https://github.com/stevendingliujian-collab/otd-crm-cli-releases.git"

# Get version
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

echo "📦 Version: $VERSION"
echo "🏷️  Tag: $TAG"

# Ensure clean build
echo ""
echo "🔨 Building CLI..."
npm run build

# Clone or update releases repository
if [ -d "$RELEASES_REPO" ]; then
  echo "📦 Updating releases repository..."
  cd "$RELEASES_REPO"
  git pull origin main
else
  echo "📦 Cloning releases repository..."
  git clone "$RELEASES_REMOTE" "$RELEASES_REPO"
  cd "$RELEASES_REPO"
fi

# Copy compiled code and essential files
echo "📦 Copying files to releases repository..."

# Clean old files (keep .git)
find . -maxdepth 1 -type f ! -name "README.md" ! -name ".gitignore" ! -name "LICENSE" -delete
rm -rf bin dist package.json install.sh install.ps1 2>/dev/null || true

# Copy files
cp -r "$DEV_REPO/bin" ./
cp -r "$DEV_REPO/dist" ./
cp "$DEV_REPO/package.json" ./
cp "$DEV_REPO/README.md" ./
cp "$DEV_REPO/install.sh" ./
cp "$DEV_REPO/install.ps1" ./

# Commit and push
echo "🚀 Pushing to releases repository..."
git add -A
git commit -m "Release v$VERSION

Automated release from development repository.

## Changes
- CLI v$VERSION
- Compiled JavaScript code
- Installation scripts"
git tag "$TAG"
git push origin main
git push origin "$TAG"

# Create GitHub Release so the Releases API returns the latest version
echo "📢 Creating GitHub Release..."
gh release create "$TAG" \
  --repo stevendingliujian-collab/otd-crm-cli-releases \
  --title "CRM CLI $TAG" \
  --notes "Automated release from development repository.

## Version
- CLI $VERSION
- Compiled JavaScript code
- Installation scripts"

echo ""
echo "✅ Release published successfully!"
echo ""
echo "📦 Release: https://github.com/stevendingliujian-collab/otd-crm-cli-releases"
echo "🏷️  Tag: https://github.com/stevendingliujian-collab/otd-crm-cli-releases/tree/$TAG"
echo ""
echo "📥 Install:"
echo "   curl -fsSL https://www.otd-odincloud.com/install-crm-cli.sh | bash"
echo ""
echo "🔄 Update:"
echo "   crm update"
