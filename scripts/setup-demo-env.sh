#!/bin/bash
set -e

# CRM CLI 演示环境快速配置脚本
# 用途: 为客户演示创建独立的测试环境配置
# 作者: Martin (CTO Agent)
# 日期: 2026-04-02

echo "🚀 CRM CLI 演示环境配置向导"
echo "================================"
echo ""

# 检查依赖
if ! command -v jq &> /dev/null; then
    echo "❌ 错误: 需要安装 jq 工具"
    echo "   macOS: brew install jq"
    echo "   Ubuntu: sudo apt-get install jq"
    exit 1
fi

# 配置文件路径
CONFIG_FILE="$HOME/.crm/config.json"

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 配置文件不存在: $CONFIG_FILE"
  echo ""
  echo "请先运行以下命令初始化配置:"
  echo "  crm auth login"
  echo ""
  exit 1
fi

echo "📦 备份当前配置..."
BACKUP_FILE="$CONFIG_FILE.backup-$(date +%Y%m%d-%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "   备份文件: $BACKUP_FILE"
echo ""

# 检查是否已有 demo profile
CURRENT_CONFIG=$(cat "$CONFIG_FILE")
if echo "$CURRENT_CONFIG" | jq -e '.profiles.demo' > /dev/null 2>&1; then
  echo "⚠️  警告: demo profile 已存在"
  read -p "是否覆盖? (y/N): " OVERWRITE
  if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
    echo "❌ 取消配置"
    exit 0
  fi
  echo ""
fi

# 获取用户输入
echo "请输入演示环境配置:"
echo ""

read -p "1. API 地址 (默认: http://test.otdmes.com.cn:60027): " TEST_API_URL
TEST_API_URL=${TEST_API_URL:-http://test.otdmes.com.cn:60027}

read -p "2. 用户名 (默认: demo): " TEST_USERNAME
TEST_USERNAME=${TEST_USERNAME:-demo}

read -p "3. 是否现在登录? (Y/n): " DO_LOGIN
DO_LOGIN=${DO_LOGIN:-Y}

echo ""

# 使用 jq 添加 demo profile
echo "📝 写入配置..."
cat "$CONFIG_FILE" | jq ".profiles.demo = {
  \"api_url\": \"$TEST_API_URL\",
  \"timeout\": 30000,
  \"username\": \"$TEST_USERNAME\"
}" > "$CONFIG_FILE.tmp"

mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "✅ demo profile 配置完成！"
echo ""

# 登录
if [ "$DO_LOGIN" = "Y" ] || [ "$DO_LOGIN" = "y" ]; then
  echo "🔐 登录演示环境..."
  echo ""
  
  # 使用 CLI 登录
  if crm auth login --profile demo --username "$TEST_USERNAME"; then
    echo ""
    echo "✅ 登录成功！"
    echo ""
    
    # 验证
    echo "🔍 验证配置..."
    crm auth whoami --profile demo --json | jq '{profile, user_name, api_url}'
  else
    echo ""
    echo "❌ 登录失败，请稍后手动登录:"
    echo "   crm auth login --profile demo --username $TEST_USERNAME"
  fi
else
  echo "⏭️  跳过登录"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 演示环境配置完成！"
echo ""
echo "📋 下一步操作:"
echo ""
echo "1. 验证配置:"
echo "   crm auth whoami --profile demo --json"
echo ""
echo "2. 搜索数据:"
echo "   crm customer search --profile demo --json | jq '.items[0:5]'"
echo ""
echo "3. 设为默认 profile（可选）:"
echo "   crm config set current_profile demo"
echo ""
echo "4. 使用别名（可选）:"
echo "   echo 'alias crm-demo=\"crm --profile demo\"' >> ~/.bashrc"
echo "   source ~/.bashrc"
echo "   crm-demo customer search"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示:"
echo "  - 配置文件: $CONFIG_FILE"
echo "  - 备份文件: $BACKUP_FILE"
echo "  - 查看文档: cat DEMO_SETUP.md"
echo ""
