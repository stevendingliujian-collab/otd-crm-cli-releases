#!/bin/bash
# 演示场景 1: 基础 CRUD 操作
# 展示 CLI 的基本功能：搜索、查询、创建

PROFILE="${1:-demo}"

echo "═══════════════════════════════════════"
echo "  CRM CLI 基础功能演示"
echo "═══════════════════════════════════════"
echo "  Profile: $PROFILE"
echo "═══════════════════════════════════════"
echo ""

sleep 1

# 1. 搜索客户
echo "📋 场景 1: 搜索客户列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ crm customer search --profile $PROFILE --size 5 --json | jq"
echo ""
crm customer search --profile $PROFILE --size 5 --json | jq '.items[0:3] | .[] | {序号: (.id[0:8]), 客户名称: .name, 负责人: .owner}'
echo ""

sleep 2

# 2. 获取客户详情
echo "🔍 场景 2: 查看客户详情"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CUSTOMER_ID=$(crm customer search --profile $PROFILE --size 1 --json 2>/dev/null | jq -r '.items[0].id // empty')

if [ -z "$CUSTOMER_ID" ]; then
  echo "⚠️  暂无客户数据，跳过此演示"
else
  echo "$ crm customer get \"$CUSTOMER_ID\" --profile $PROFILE --json | jq"
  echo ""
  crm customer get "$CUSTOMER_ID" --profile $PROFILE --json 2>/dev/null | jq '{
    客户ID: (.id[0:8]),
    客户名称: .name,
    负责人: .owner,
    行业: .industry,
    创建时间: .creationTime[0:10]
  }' || echo "⚠️  查询失败"
fi
echo ""

sleep 2

# 3. 创建测试线索
echo "✏️  场景 3: 创建线索"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CLUE_NAME="演示线索-$(date +%H%M%S)"
echo "$ crm clue create --profile $PROFILE --name \"$CLUE_NAME\" --json | jq"
echo ""

CLUE_RESULT=$(crm clue create --profile $PROFILE --name "$CLUE_NAME" --json 2>/dev/null || echo "{}")
if echo "$CLUE_RESULT" | jq -e '.id' > /dev/null 2>&1; then
  echo "$CLUE_RESULT" | jq '{
    状态: "✅ 创建成功",
    线索ID: (.id[0:8]),
    线索名称: .name,
    创建时间: .creationTime[0:19]
  }'
else
  echo "⚠️  创建失败（可能需要权限或必填字段）"
fi
echo ""

sleep 2

# 4. 搜索商机
echo "💼 场景 4: 搜索商机"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ crm opportunity search --profile $PROFILE --size 5 --json | jq"
echo ""
crm opportunity search --profile $PROFILE --size 5 --json 2>/dev/null | jq '.items[0:3] | .[] | {
  商机名称: .name,
  客户: .customName,
  金额: .expectedTransAmount,
  阶段: .businessProcessName
}' || echo "⚠️  暂无商机数据"
echo ""

sleep 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 基础演示完成！"
echo ""
echo "💡 更多命令:"
echo "  crm --help                     # 查看所有命令"
echo "  crm customer --help            # 查看客户模块命令"
echo "  crm opportunity stages --json  # 查看商机阶段"
echo ""
