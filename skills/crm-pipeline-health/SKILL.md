# CRM 商机 Pipeline 巡检（批量扫描）

> **说明**：本 skill 负责**批量扫描**所有活跃商机，找出需要关注的风险信号，生成巡检报告。
> 如需对**单个商机**做深度六维评分 + 行业 playbook 分析，请使用 `crm-health-check` skill（触发词：商机健康度 / 商机诊断）。

## 触发词
- 查下商机情况
- 商机巡检
- 今天有什么商机需要关注
- pipeline 状态
- pipeline 巡检
- 有哪些商机需要跟进

## 功能说明
自动扫描所有**活跃商机**，检测跟进滞后、阶段停滞、数据缺失等多维风险信号，生成优先级巡检报告。

## 优先级
**P0** — 每天早上 / 每周一执行

## 排除规则
**以下阶段的商机不纳入巡检**：
- `输单` — 已丢失
- `赢单` — 已成交
- `取消` — 已取消
- `暂停` — 暂时搁置

只关注**活跃推进中**的商机：线索、方案、报价、谈判、合同等阶段。

---

## 检查维度

### 🔴 紧急（必须今天处理）
1. **跟进滞后**：超过 7 天未跟进
2. **逾期未关闭**：预计成交日已过期，商机仍在活跃状态
3. **阶段严重停滞**：停留在同一阶段超过阶段建议时长的 **2 倍**（见下表）

### 🟡 关注（本周需安排）
4. **阶段停滞预警**：停留在同一阶段超过阶段建议时长的 **1.5 倍**
5. **即将到期**：预计成交日在 7 天内
6. **大单滞后**：金额超过 30 万且超过 14 天未跟进

### ⚠️ 数据风险（影响预测准确性）
7. **关键字段缺失**：进入报价/谈判/待签约阶段但无预计成交日期
8. **金额缺失**：进入报价阶段以后仍无预计金额（影响管道预测）
9. **描述空洞**：进入方案阶段以后商机描述仍为空（无法判断推进方向）

### 🟢 本周正常推进
- 近 7 天有跟进记录的活跃商机

---

## 阶段建议停留时长（用于停滞判断）

> 阶段停滞以 `lastModificationTime` 作为近似代理（CRM 无 stage_changed_at 字段）。

| 标准阶段 | 建议时长 | 1.5× 预警 | 2× 紧急 | 匹配的 CRM 阶段关键词 |
|----------|----------|-----------|---------|----------------------|
| 初步接触 | 14 天 | 21 天 | 28 天 | 线索、初步、意向、拜访 |
| 需求确认 | 21 天 | 32 天 | 42 天 | 需求、确认、调研中 |
| 调研/诊断 | 25 天 | 38 天 | 50 天 | 调研、诊断、现场 |
| 方案设计 | 21 天 | 32 天 | 42 天 | 方案、设计、演示 |
| 报价/商务 | 30 天 | 45 天 | 60 天 | 报价、商务、议价 |
| 谈判/采购 | 45 天 | 68 天 | 90 天 | 谈判、合同、采购 |
| 待签约   | 21 天 | 32 天 | 42 天 | 待签、签约、收款 |

**阶段映射规则**：将 `businessProcessName` 语义匹配到上表中最接近的标准阶段，取对应阈值。无法匹配时使用默认阈值 21 天（1.5×=32天，2×=42天）。

---

## 执行流程

### Step 1: 获取所有商机（含分页检查）
```bash
crm opportunity search --size 200 --json > /tmp/crm_opps.json

# ⚠️ 分页检查：totalCount 超过返回数量时自动补全
TOTAL=$(jq '.totalCount' /tmp/crm_opps.json)
FETCHED=$(jq '.items | length' /tmp/crm_opps.json)

if [ "$TOTAL" -gt "$FETCHED" ]; then
  echo "⚠️ 数据截断：共 $TOTAL 条，当前仅获取 $FETCHED 条，正在补全..."
  PAGE=2
  cp /tmp/crm_opps.json /tmp/crm_opps_all.json
  while [ $(( ($PAGE - 1) * 200 )) -lt "$TOTAL" ]; do
    crm opportunity search --size 200 --page $PAGE --json > /tmp/crm_opps_page.json
    jq -s '{totalCount: .[0].totalCount, items: (.[0].items + .[1].items)}' \
      /tmp/crm_opps_all.json /tmp/crm_opps_page.json > /tmp/crm_opps_merged.json
    mv /tmp/crm_opps_merged.json /tmp/crm_opps_all.json
    PAGE=$((PAGE + 1))
  done
  mv /tmp/crm_opps_all.json /tmp/crm_opps.json
  echo "✅ 已获取全部 $(jq '.items | length' /tmp/crm_opps.json) 条商机"
fi
```

### Step 2: 定义排除阶段
```bash
EXCLUDE_STAGES='["输单", "赢单", "取消", "暂停"]'
```

### Step 3: 分析各维度信号

使用 jq 分析，**所有查询均排除非活跃阶段**：

```bash
TODAY=$(date +%Y-%m-%d)
TODAY_TS=$(date +%s)

# 🔴 1. 超过7天未跟进
jq --arg today "$TODAY" '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.lastFollowUpDate != null) |
  select((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 > 7) |
  {name, customName, expectedTransAmount, lastFollowUpDate, businessProcessName,
   days_no_followup: ((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 | floor)}
' /tmp/crm_opps.json

# 🔴 2. 预计成交日已过期（逾期未关闭）
jq --arg today "$TODAY" '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.expectedCompleteDate != null) |
  select((.expectedCompleteDate | split("T")[0]) < $today) |
  {name, customName, expectedTransAmount, expectedCompleteDate, businessProcessName}
' /tmp/crm_opps.json

# 🔴 3. 阶段严重停滞（lastModificationTime 超过2×阈值）
# 注：Claude 根据阶段名称语义映射到对应阈值后计算
jq '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.lastModificationTime != null) |
  {name, customName, businessProcessName, lastModificationTime, expectedTransAmount,
   days_in_stage: ((now - (.lastModificationTime | split(".")[0] | strptime("%Y-%m-%dT%H:%M:%S") | mktime)) / 86400 | floor)}
' /tmp/crm_opps.json

# 🟡 4. 即将到期（7天内）
jq --arg today "$TODAY" '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.expectedCompleteDate != null) |
  select((.expectedCompleteDate | split("T")[0]) >= $today) |
  select(((.expectedCompleteDate | split("T")[0] | strptime("%Y-%m-%d") | mktime) - now) / 86400 <= 7) |
  {name, customName, expectedTransAmount, expectedCompleteDate, businessProcessName}
' /tmp/crm_opps.json

# 🟡 5. 大单滞后（>30万 且 14天未跟进）
jq '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.expectedTransAmount != null and .expectedTransAmount > 300000) |
  select(.lastFollowUpDate != null) |
  select((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 > 14) |
  {name, customName, expectedTransAmount, businessProcessName, lastFollowUpDate,
   days_no_followup: ((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 | floor)}
' /tmp/crm_opps.json

# ⚠️ 6. 数据风险：进入报价/谈判/待签约 但无预计成交日
jq '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.businessProcessName | test("报价|谈判|合同|采购|待签|签约"; "i")) |
  select(.expectedCompleteDate == null or .expectedCompleteDate == "") |
  {name, customName, businessProcessName, expectedTransAmount}
' /tmp/crm_opps.json

# ⚠️ 7. 数据风险：进入报价阶段以后但无金额
jq '
  .items[] |
  select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) |
  select(.businessProcessName | test("报价|谈判|合同|采购|待签|签约"; "i")) |
  select(.expectedTransAmount == null or .expectedTransAmount == 0) |
  {name, customName, businessProcessName, expectedCompleteDate}
' /tmp/crm_opps.json
```

### Step 4: 统计汇总
```bash
# 活跃商机总数
ACTIVE_TOTAL=$(jq '[.items[] | select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not)] | length' /tmp/crm_opps.json)

# 活跃商机总金额（万元）
TOTAL_AMOUNT=$(jq '([.items[] | select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) | .expectedTransAmount // 0] | add) / 10000' /tmp/crm_opps.json)

# 本周有跟进的商机数
FOLLOWEDUP=$(jq '[.items[] | select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not) | select(.lastFollowUpDate != null) | select((now - (.lastFollowUpDate | split("T")[0] | strptime("%Y-%m-%d") | mktime)) / 86400 <= 7)] | length' /tmp/crm_opps.json)

# 各阶段分布
jq '[.items[] | select(.businessProcessName as $s | ["输单","赢单","取消","暂停"] | index($s) | not)] | group_by(.businessProcessName) | map({stage: .[0].businessProcessName, count: length}) | sort_by(.count) | reverse' /tmp/crm_opps.json
```

### Step 5: 综合分析并输出报告

在输出报告前，Claude 需要做以下判断：
- **阶段停滞**：对每条商机的 `days_in_stage` 结合阶段名称做语义映射，对照阈值表判断是 🔴 严重停滞（>2×）还是 🟡 预警（>1.5×）
- **优先级排序**：🔴 紧急项按金额从高到低，🟡 关注项同理
- **大单高亮**：金额 ≥ 30 万的商机在所有分类中加 💰 标记

---

## 输出格式

```
📊 Pipeline 巡检报告 — {日期}

🔴 紧急（必须今天处理）共 X 项
1. 💰 [商机名] | {客户} | ¥{金额}万 | {阶段} | ⏰ {X}天未跟进
2. [商机名] | {客户} | ¥{金额}万 | {阶段} | 📅 逾期 {X} 天（成交日：{日期}）
3. [商机名] | {客户} | ¥{金额}万 | {阶段} | 🧊 阶段停滞 {X} 天（建议上限 {Y} 天）

🟡 关注（本周需安排）共 X 项
4. [商机名] | {客户} | ¥{金额}万 | {阶段} | 阶段停滞 {X} 天
5. [商机名] | {客户} | ¥{金额}万 | {阶段} | 预计成交还剩 {X} 天

⚠️ 数据风险（影响管道预测）共 X 项
6. [商机名] | {客户} | {阶段} | 缺预计成交日
7. [商机名] | {客户} | {阶段} | 缺金额（报价阶段金额为空）

🟢 本周正常推进
本周有跟进: {X} 个商机（共 {活跃总数} 个活跃商机）

💰 大单跟踪（>30万）
- [商机名] | {客户} | ¥{金额}万 | {阶段} | 最后跟进: {X}天前

📊 活跃商机池
- 总计: {X} 个活跃商机 | 管道总值: ¥{XX}万
- 阶段分布: 需求确认 {X}个 | 方案设计 {X}个 | 报价 {X}个 | 谈判 {X}个 | ...
- 🚨 本次发现 {Y} 个需要今天处理的紧急信号
```

---

## 阈值配置（可调整）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `no_followup_urgent` | 7 天 | 超过此天数未跟进视为紧急 |
| `large_deal_followup` | 14 天 | 大单超过此天数未跟进视为关注 |
| `large_deal_threshold` | 300,000 元 | 大单金额阈值（元） |
| `upcoming_days` | 7 天 | 预计成交日在此天数内视为关注 |
| `exclude_stages` | 输单/赢单/取消/暂停 | 排除的阶段 |
| `stage_stale_1_5x` | 见阶段表 | 各阶段建议停留时长 ×1.5 为预警线 |
| `stage_stale_2x` | 见阶段表 | 各阶段建议停留时长 ×2 为紧急线 |

---

## 与其他 Skill 的关系

| Skill | 用途 | 区别 |
|-------|------|------|
| **本 Skill（pipeline-health）** | 批量巡检所有活跃商机，发现风险信号 | 广度扫描，轻量快速 |
| **crm-health-check** | 对单个商机做六维深度评分 + 行业 playbook 分析 | 深度诊断，触发词：商机健康度/商机诊断 |
| **Skill 3 跟进提醒** | 聚焦"今天要做什么"的行动清单 | 执行层 |
| **Skill 6 收入预测** | 使用管道数据进行预测 | 预测层 |

## 注意事项
1. `lastFollowUpDate` 格式为 ISO 时间戳，计算时取日期部分
2. `expectedTransAmount` 单位是元，显示时转换为万元
3. **阶段停滞使用 `lastModificationTime` 近似**（CRM 无 stage_changed_at 字段），若商机有其他字段更新，实际停滞时间可能比显示的短
4. 暂停阶段的商机不纳入日常巡检，如需查看可单独查询
5. 如某商机被标记为紧急，建议使用 `crm-health-check` skill 做进一步深度分析
