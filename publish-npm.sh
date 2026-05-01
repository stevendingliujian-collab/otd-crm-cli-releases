#!/bin/bash
# CRM CLI NPM Publish Script

set -e

echo "📦 Publishing @otd/crm-cli to npm registry..."

cd "$(dirname "$0")"

# Ensure clean build
npm run build

# Publish to npmjs.org
echo ""
echo "🔐 Please login to npm if not already logged in:"
echo "   npm adduser --registry https://registry.npmjs.org"
echo ""
echo "Then publish with:"
echo "   npm publish --registry https://registry.npmjs.org"
echo ""

# Try to publish
npm publish --registry https://registry.npmjs.org || {
  echo ""
  echo "❌ Publish failed. Common issues:"
  echo "   1. Not logged in: Run 'npm adduser'"
  echo "   2. Version already exists: Bump version in package.json"
  echo "   3. Network issue: Check your connection"
  exit 1
}

echo ""
echo "✅ Published successfully!"
echo ""
echo "📦 Install with:"
echo "   npm install -g @otd/crm-cli"
echo ""
echo "🔗 View on npm:"
echo "   https://www.npmjs.com/package/@otd/crm-cli"
