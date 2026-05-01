# CRM 每日跟进提醒（Skill 3）

## 触发词
- 今天要跟进什么
- 跟进提醒
- 待办事项
- 今天的任务
- 有什么需要跟进的

## 功能说明
每天早上推送待跟进清单，按紧急程度排序。防止商机因遗忘而丢失。

## 优先级
**P0** — 每天早上自动推送

## 检查维度

### 🔴 已逾期（必须今天处理）
- 过了跟进日期但还没做的
- 按逾期天数降序排列

### 🟡 今日到期
- 今天需要跟进的任务/商机

### 📋 本周待办
- 本周需要报价/回复/拜访的

### ⚠️ VIP 客户预警
- A级客户超过 15 天无任何动态

## 执行流程

### Step 1: 获取所有商机（含分页检查）
```bash
crm opportunity search --size 200 --json > /tmp/crm_opps.json

# ⚠️ 分页检查：totalCount 超过返回数量时自动补全
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
```

### Step 2: 分析跟进状态
```bash
TODAY=$(date +%Y-%m-%d)
WEEK_END=$(date -v+7d +%Y-%m-%d)  # macOS
# WEEK_END=$(date -d "+7 days" +%Y-%m-%d)  # Linux

# 计算每个商机距离最后跟进的天数
cat /tmp/crm_opps.json | jq --arg today "$TODAY" '
  .items[] |
  select(.lastFollowUpDate != null) |
  {
    name,
    customName,
    expectedTransAmount,
    lastFollowUpDate,
    businessProcessName,
    days_since: ((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 | floor)
  } |
  select(.days_since > 7)
' | jq -s 'sort_by(-.days_since)'
```

### Step 3: 获取 VIP 客户（A级）
```bash
crm customer search --size 200 --json | jq '
  .items[] |
  select(.customLevelName == "A") |
  {name, lastFollowUpDate, customLevelName}
'
```

### Step 4: 检查跟进记录中的 nextPlan
```bash
# 获取最近的跟进记录，检查 nextPlan 中是否有日期安排
crm followup search --size 50 --json | jq '
  .items[] |
  select(.nextPlan != null and .nextPlan != "") |
  {relatedTitle, nextPlan, followUpDate}
'
```

## 输出格式

```
📅 {日期} 跟进清单

🔴 已逾期（必须今天处理）
1. [{客户}] {商机/事项} — 逾期 {X} 天
2. [{客户}] {商机/事项} — 逾期 {X} 天

🟡 今日到期
3. [{客户}] {事项描述}
4. [{客户}] {事项描述}

📋 本周待办
5. [{客户}] 周{X}前发报价
6. [{客户}] 周{X}拜访

⚠️ VIP 沉默预警（A级客户）
- [{客户}] 已 {X} 天无动态
- [{客户}] 已 {X} 天无动态

📊 统计
- 今日待办: {X} 项
- 本周待办: {X} 项
- 逾期未处理: {X} 项
```

## 阈值配置
- `overdue_threshold`: 7（超过X天未跟进视为逾期）
- `vip_silent_days`: 15（VIP客户超过X天无动态预警）
- `vip_level`: "A"（VIP客户等级标识）

## 与其他 Skill 的关系
- **Skill 1 商机健康度巡检**：更宏观的视角，本 Skill 更聚焦于"今天要做什么"
- **Skill 0 数据质量检查**：建议先确保数据完整

## 注意事项
1. `lastFollowUpDate` 是商机/客户的最后跟进日期，不是下次跟进日期
2. 下次跟进安排目前只能从跟进记录的 `nextPlan` 字段文本中提取
3. `followup search` 支持 `--date-after` / `--date-before` 按跟进日期筛选；本 Skill 使用本地过滤是为了同时计算距上次跟进的天数
4. VIP 客户判断基于 `customLevelName == "A"`
