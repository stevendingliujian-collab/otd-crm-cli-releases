# CRM 每日销售仪表盘

## 触发词
- 早上好
- 今天销售情况
- 销售仪表盘
- 每日汇报
- 开始工作

## 功能说明
聚合 Skill 0-3，每天早上一次性推送完整的销售状态概览。

## 优先级
**P0** — 每天早上自动执行

## 包含内容

### 1️⃣ 数据质量快报（Skill 0 精简版）
只显示必须修复的问题，不展开详细列表。

### 2️⃣ 商机健康度（Skill 1 精简版）
- 紧急商机（逾期/未跟进）
- 大单状态

### 3️⃣ 今日跟进清单（Skill 3）
- 今日到期
- 已逾期

### 4️⃣ 收入预测快照（Skill 6 精简版）
- 本月预测
- 高确定金额

## 执行流程

### Step 1: 获取数据（含分页检查）
```bash
# 获取商机数据
crm opportunity search --size 200 --json > /tmp/crm_opps.json

# ⚠️ 分页检查：如果 totalCount > 返回数量，自动补全所有页
TOTAL=$(jq '.totalCount' /tmp/crm_opps.json)
FETCHED=$(jq '.items | length' /tmp/crm_opps.json)
if [ "$TOTAL" -gt "$FETCHED" ]; then
  echo "⚠️ 商机数据截断（$FETCHED/$TOTAL），正在补全..."
  PAGE=2; cp /tmp/crm_opps.json /tmp/crm_opps_all.json
  while [ $(( ($PAGE - 1) * 200 )) -lt "$TOTAL" ]; do
    crm opportunity search --size 200 --page $PAGE --json > /tmp/crm_opps_page.json
    jq -s '{totalCount: .[0].totalCount, items: (.[0].items + .[1].items)}' \
      /tmp/crm_opps_all.json /tmp/crm_opps_page.json > /tmp/crm_opps_merged.json
    mv /tmp/crm_opps_merged.json /tmp/crm_opps_all.json; PAGE=$((PAGE + 1))
  done
  mv /tmp/crm_opps_all.json /tmp/crm_opps.json
fi

# 获取客户数据（同理）
crm customer search --size 200 --json > /tmp/crm_customers.json
TOTAL=$(jq '.totalCount' /tmp/crm_customers.json)
FETCHED=$(jq '.items | length' /tmp/crm_customers.json)
if [ "$TOTAL" -gt "$FETCHED" ]; then
  PAGE=2; cp /tmp/crm_customers.json /tmp/crm_customers_all.json
  while [ $(( ($PAGE - 1) * 200 )) -lt "$TOTAL" ]; do
    crm customer search --size 200 --page $PAGE --json > /tmp/crm_customers_page.json
    jq -s '{totalCount: .[0].totalCount, items: (.[0].items + .[1].items)}' \
      /tmp/crm_customers_all.json /tmp/crm_customers_page.json > /tmp/crm_customers_merged.json
    mv /tmp/crm_customers_merged.json /tmp/crm_customers_all.json; PAGE=$((PAGE + 1))
  done
  mv /tmp/crm_customers_all.json /tmp/crm_customers.json
fi
```

### Step 2: 数据质量检查（快速）
```bash
# 只统计数量，不详细展开
MISSING_AMOUNT=$(cat /tmp/crm_opps.json | jq '[.items[] | select(.expectedTransAmount == null or .expectedTransAmount == 0)] | length')
MISSING_DATE=$(cat /tmp/crm_opps.json | jq '[.items[] | select(.expectedCompleteDate == null)] | length')
MISSING_CONTACT=$(cat /tmp/crm_opps.json | jq '[.items[] | select(.contacts == null or (.contacts | length) == 0)] | length')
```

### Step 3: 商机健康度检查
```bash
# 超过7天未跟进
OVERDUE=$(cat /tmp/crm_opps.json | jq '[.items[] | select(.lastFollowUpDate != null) | select((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 > 7)] | length')

# 大单列表
LARGE_DEALS=$(cat /tmp/crm_opps.json | jq '[.items[] | select(.expectedTransAmount != null and .expectedTransAmount > 300000)] | length')
```

### Step 4: 收入预测（本月）
```bash
CURRENT_MONTH=$(date +%Y-%m)
FORECAST=$(cat /tmp/crm_opps.json | jq --arg month "$CURRENT_MONTH" '
  [.items[] | 
   select(.expectedCompleteDate != null) |
   select(.expectedCompleteDate | startswith($month)) |
   .expectedTransAmount // 0] | add // 0'
)
```

## 输出格式

```
☀️ 早安，Steven！{日期} 销售仪表盘

📋 数据质量
- ⚠️ {X} 个商机需补全（缺金额/日期/联系人）
- ✅ 数据完整率 {X}%

🎯 今日重点
🔴 需立即跟进: {X} 个商机超 7 天未联系
🟡 本周到期: {X} 个商机
💰 大单关注: {X} 个（>30万）

📅 今日跟进清单
1. [{客户}] {事项} — 逾期 {X} 天
2. [{客户}] {事项}
3. [{客户}] {事项}

📈 {当月}收入预测
- 加权预测: ¥{XX}万
- 高确定: ¥{XX}万（{X}个商机在谈判/签约阶段）

💡 建议行动
1. 优先跟进 {商机名}（逾期最久/金额最大）
2. 补全 {商机名} 的联系人信息
```

## 定时执行
建议配置 OpenClaw HEARTBEAT，每天早上 8:30 自动推送。

## 与单独 Skill 的关系
- 仪表盘是精简聚合版，快速了解全貌
- 如果需要详细信息，可以单独调用对应 Skill：
  - "详细看一下数据质量" → Skill 0
  - "商机巡检详情" → Skill 1
  - "今天跟进什么" → Skill 3
  - "收入预测详情" → Skill 6

## 注意事项
1. 仪表盘以简洁为主，每个模块只显示最关键的数字
2. 如果某个模块数据异常（如逾期商机 > 5），自动展开详情
3. 根据 Steven 的偏好，可调整显示内容
