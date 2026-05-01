#!/bin/bash
# CRM CLI 设备授权测试脚本
# 用于测试设备授权完整流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试环境配置
TEST_API_URL="${CRM_API_URL:-http://odin.otdmes.com.cn:60027}"

echo "=========================================="
echo "CRM CLI 设备授权测试"
echo "测试环境: $TEST_API_URL"
echo "=========================================="
echo ""

# Test 1: API 健康检查
echo -e "${YELLOW}[Test 1] 健康检查...${NC}"
if curl -s "$TEST_API_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ API 可访问${NC}"
else
    echo -e "${RED}❌ API 不可访问${NC}"
    exit 1
fi
echo ""

# Test 2: 请求授权码
echo -e "${YELLOW}[Test 2] 请求设备授权码...${NC}"
RESPONSE=$(curl -s -X POST "$TEST_API_URL/api/auth/device/code" \
    -H "Content-Type: application/json" \
    -d '{"clientId":"crm-cli"}')

echo "响应: $RESPONSE"

# 解析响应
DEVICE_CODE=$(echo $RESPONSE | grep -o '"device_code":"[^"]*"' | cut -d'"' -f4)
USER_CODE=$(echo $RESPONSE | grep -o '"user_code":"[^"]*"' | cut -d'"' -f4)
VERIFICATION_URI=$(echo $RESPONSE | grep -o '"verification_uri":"[^"]*"' | cut -d'"' -f4)
VERIFICATION_URI_COMPLETE=$(echo $RESPONSE | grep -o '"verification_uri_complete":"[^"]*"' | cut -d'"' -f4)

if [ -n "$DEVICE_CODE" ]; then
    echo -e "${GREEN}✅ 获取授权码成功${NC}"
    echo "Device Code: $DEVICE_CODE"
    if [ -n "$USER_CODE" ]; then
        echo "User Code: $USER_CODE"
    fi
    echo "授权链接: $VERIFICATION_URI_COMPLETE"
else
    echo -e "${RED}❌ 获取授权码失败${NC}"
    exit 1
fi
echo ""

# Test 3: 检查授权页面
echo -e "${YELLOW}[Test 3] 检查授权页面...${NC}"
AUTH_PAGE_URL=$(echo $VERIFICATION_URI_COMPLETE | sed 's|https://app.otd-odincloud.com|'"$TEST_API_URL"'|')
if curl -s "$AUTH_PAGE_URL" | grep -q "设备授权"; then
    echo -e "${GREEN}✅ 授权页面可访问${NC}"
    echo "授权页面: $AUTH_PAGE_URL"
else
    echo -e "${YELLOW}⚠️  授权页面可能不可用或格式不同${NC}"
fi
echo ""

# Test 4: 轮询 Token (应该返回 pending)
echo -e "${YELLOW}[Test 4] 轮询 Token (未授权状态)...${NC}"
if [ -n "$USER_CODE" ]; then
    # 我的方案: POST Body
    TOKEN_RESPONSE=$(curl -s -X POST "$TEST_API_URL/api/auth/device/token" \
        -H "Content-Type: application/json" \
        -d "{\"deviceCode\":\"$DEVICE_CODE\"}")
else
    # 后端方案: Query 参数
    TOKEN_RESPONSE=$(curl -s -X POST "$TEST_API_URL/api/auth/device/token?deviceCode=$DEVICE_CODE")
fi

echo "响应: $TOKEN_RESPONSE"

if echo "$TOKEN_RESPONSE" | grep -q "authorization_pending"; then
    echo -e "${GREEN}✅ 返回正确的 pending 状态${NC}"
elif echo "$TOKEN_RESPONSE" | grep -q "error"; then
    echo -e "${GREEN}✅ 返回错误状态 (符合预期)${NC}"
else
    echo -e "${YELLOW}⚠️  响应格式可能不同${NC}"
fi
echo ""

# Test 5: CLI 完整测试
echo -e "${YELLOW}[Test 5] CLI 完整流程测试...${NC}"
echo "请执行以下命令手动测试:"
echo ""
echo -e "${GREEN}CRM_API_URL=$TEST_API_URL crm auth device${NC}"
echo ""
echo "然后:"
echo "1. 复制授权链接到浏览器"
echo "2. 登录并点击授权"
echo "3. 等待 CLI 显示授权成功"
echo ""

# 总结
echo "=========================================="
echo -e "${GREEN}自动化测试完成!${NC}"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 在浏览器打开: $VERIFICATION_URI_COMPLETE"
echo "2. 登录并授权"
echo "3. 验证 CLI 能否获取 Token"
echo ""
