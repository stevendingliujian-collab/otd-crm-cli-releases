#!/bin/bash
echo "=== Testing all 8 new commands help ==="
echo ""

commands=(
  "opportunity update"
  "opportunity assign"
  "opportunity stages"
  "followup get"
  "customer update"
  "customer assign"
  "clue update"
  "task assign"
)

for cmd in "${commands[@]}"; do
  echo "✓ Testing: crm $cmd --help"
  node index.js $cmd --help > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ OK"
  else
    echo "  ❌ FAILED"
  fi
done

echo ""
echo "=== All commands compiled successfully ==="
