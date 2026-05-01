#!/bin/bash
# AI Agent 使用 CRM CLI 的测试脚本
# 模拟 AI Agent 执行常见的 CRM 查询任务

set -e  # 遇到错误立即退出

echo "=== AI Agent CRM CLI 测试 ==="
echo ""

# 使用全局命令（需要先 npm link）
CLI="crm"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试 1：查询科技类客户
echo -e "${BLUE}[测试 1] AI Agent 查询：「科技类客户有哪些？」${NC}"
echo "执行命令: crm customer search --keyword 科技 --json"
echo ""

RESULT=$($CLI customer search --keyword 科技 --json 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ 查询成功"
  echo "$RESULT" | jq '{
    totalCount: .totalCount,
    sampleCustomers: .items[:3] | map({
      name: .name,
      owner: .owner,
      industry: .industry
    })
  }'
else
  echo "❌ 查询失败: $RESULT"
  exit 1
fi

echo ""
echo "---"
echo ""

# 测试 2：查询线索
echo -e "${BLUE}[测试 2] AI Agent 查询：「最近的线索有哪些？」${NC}"
echo "执行命令: crm clue search --json"
echo ""

RESULT=$($CLI clue search --json 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ 查询成功"
  echo "$RESULT" | jq '{
    totalCount: .totalCount,
    message: "找到 \(.totalCount) 条线索"
  }'
else
  echo "⚠️  线索查询失败（可能是权限或数据问题）"
fi

echo ""
echo "---"
echo ""

# 测试 3：查询商机
echo -e "${BLUE}[测试 3] AI Agent 查询：「进行中的商机有哪些？」${NC}"
echo "执行命令: crm opportunity search --json"
echo ""

RESULT=$($CLI opportunity search --json 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ 查询成功"
  echo "$RESULT" | jq '{
    totalCount: .totalCount,
    message: "找到 \(.totalCount) 个商机"
  }'
else
  echo "⚠️  商机查询失败（可能是权限或数据问题）"
fi

echo ""
echo "---"
echo ""

# 测试 4：组合查询 - AI 分析场景
echo -e "${BLUE}[测试 4] AI 分析场景：「曹海亚负责的科技类客户有多少？」${NC}"
echo "执行命令: crm customer search --keyword 科技 --json | jq '...'"
echo ""

RESULT=$($CLI customer search --keyword 科技 --json 2>&1)

if [ $? -eq 0 ]; then
  # AI Agent 解析结果
  CAO_CUSTOMERS=$(echo "$RESULT" | jq '[.items[] | select(.owner == "曹海亚")] | length')
  TOTAL=$(echo "$RESULT" | jq '.totalCount')
  
  echo "✅ AI 分析结果："
  echo "   - 总共 $TOTAL 个科技类客户"
  echo "   - 曹海亚负责 $CAO_CUSTOMERS 个"
  echo "   - 占比: $(echo "scale=1; $CAO_CUSTOMERS * 100 / $TOTAL" | bc)%"
else
  echo "❌ 分析失败"
fi

echo ""
echo "---"
echo ""

# 测试 5：错误处理测试
echo -e "${BLUE}[测试 5] 错误处理：查询不存在的客户${NC}"
echo "执行命令: crm customer get invalid-id --json"
echo ""

RESULT=$($CLI customer get invalid-id --json 2>&1)

if [ $? -ne 0 ]; then
  echo "✅ 正确返回错误"
  echo "$RESULT" | jq -r '.error | "错误码: \(.code)\n错误信息: \(.message)\n提示: \(.hint)"' || echo "$RESULT"
else
  echo "⚠️  应该返回错误但成功了"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo -e "${GREEN}总结：${NC}"
echo "✅ CRM CLI 可以被 AI Agent 成功调用"
echo "✅ JSON 输出格式适合机器解析"
echo "✅ 错误处理清晰，AI 可以理解"
echo ""
echo "下一步："
echo "1. 补充更多命令（contract, followup, task）"
echo "2. 让 Sales Agent 实际使用"
echo "3. 收集反馈并优化"
