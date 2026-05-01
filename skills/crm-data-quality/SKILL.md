# CRM 数据质量检查（Skill 0）

## 触发词
- 检查数据质量
- CRM 数据检查
- 数据完整性
- 哪些数据需要补全

## 功能说明
扫描 CRM 数据，找出缺失关键字段的记录。数据质量是所有分析的基础——"垃圾进，垃圾出"。

## 优先级
**P0** — 作为其他 Skill 的前置检查，每天早上执行

## 检查维度

### 🔴 必须修复（影响分析准确性）
- 商机缺失金额（expectedTransAmount 为空或为 0）
- 商机缺失阶段（businessProcessId 为空）
- 商机缺失预计成交日期（expectedCompleteDate 为空）
- 商机无联系人（contacts 为空数组）

### 🟡 建议补全（提升数据价值）
- 客户缺失行业信息（industryCode 为空）
- 客户缺失联系人（contacts 为空数组）
- 跟进记录缺失下一步计划（nextPlan 为空）

## 执行流程

### Step 1: 获取所有商机（含分页检查）
```bash
crm opportunity search --size 200 --json > /tmp/crm_opps.json

# ⚠️ 分页检查：totalCount 超过返回数量时自动补全
TOTAL=$(jq '.totalCount' /tmp/crm_opps.json)
FETCHED=$(jq '.items | length' /tmp/crm_opps.json)
if [ "$TOTAL" -gt "$FETCHED" ]; then
  echo "⚠️ 数据截断：共 $TOTAL 条商机，当前仅获取 $FETCHED 条，正在补全..."
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

### Step 2: 检查商机完整性
使用 jq 筛选问题记录：
```bash
# 缺失金额
cat /tmp/crm_opps.json | jq '[.items[] | select(.expectedTransAmount == null or .expectedTransAmount == 0)] | length'

# 缺失预计成交日期
cat /tmp/crm_opps.json | jq '[.items[] | select(.expectedCompleteDate == null)] | length'

# 无联系人
cat /tmp/crm_opps.json | jq '[.items[] | select(.contacts == null or (.contacts | length) == 0)] | length'
```

### Step 3: 获取所有客户（含分页检查）
```bash
crm customer search --size 200 --json > /tmp/crm_customers.json

# ⚠️ 分页检查
TOTAL=$(jq '.totalCount' /tmp/crm_customers.json)
FETCHED=$(jq '.items | length' /tmp/crm_customers.json)
if [ "$TOTAL" -gt "$FETCHED" ]; then
  echo "⚠️ 数据截断：共 $TOTAL 条客户，当前仅获取 $FETCHED 条，正在补全..."
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

### Step 4: 检查客户完整性
```bash
# 缺失行业
cat /tmp/crm_customers.json | jq '[.items[] | select(.industryCode == null or .industryCode == "")] | length'

# 无联系人
cat /tmp/crm_customers.json | jq '[.items[] | select(.contacts == null or (.contacts | length) == 0)] | length'
```

## 输出格式

```
📋 CRM 数据质量检查 — {日期}

🔴 必须修复（影响分析准确性）
- [商机] {名称} — 缺失: {字段}
- [商机] {名称} — 缺失: {字段}

🟡 建议补全（提升数据价值）
- [客户] {名称} — 缺失: {字段}
- [跟进] {日期} — 缺失: 下一步计划

📊 完整率统计
- 商机完整率: {X}% ({完整数}/{总数})
- 客户完整率: {X}% ({完整数}/{总数})

💡 建议优先处理金额超过 10 万的商机
```

## 阈值配置
可在调用时指定：
- `--min-amount 50000`：只检查金额超过 5 万的商机（默认检查所有）
- `--owner 丁留建`：只检查指定负责人的数据

## 注意事项
1. 商机的 `expectedTransAmount` 可能返回字符串或数字，需兼容处理
2. `contacts` 可能是 null 或空数组 `[]`，都视为缺失
3. 建议每天早上运行一次，作为每日仪表盘的一部分
