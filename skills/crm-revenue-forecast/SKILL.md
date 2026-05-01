# CRM 收入预测（Skill 6）

## 触发词
- 预测一下收入
- 这个月能收多少
- 收入预测
- 销售预测
- Q2 能成交多少

## 功能说明
按商机阶段和历史转化率，加权计算未来1-3个月的预期收入。

## 优先级
**P1** — 每周/每月初执行

## 计算逻辑

### 阶段概率映射
| 阶段 | 概率 | 说明 |
|------|------|------|
| 线索 | 10% | 初步接触 |
| 方案 | 25% | 需求确认/方案沟通 |
| 报价 | 50% | 已报价 |
| 谈判 | 75% | 商务谈判中 |
| 口头承诺 | 90% | 等待签约 |

### 加权收入计算
```
加权收入 = Σ(商机金额 × 阶段概率)
```

### 确定性分级
- **高确定**（谈判+口头承诺）：概率 ≥ 75%
- **中确定**（报价阶段）：概率 50%
- **低确定**（线索+方案）：概率 ≤ 25%

## 执行流程

### Step 1: 获取所有商机（含分页检查）
```bash
crm opportunity search --size 200 --json > /tmp/crm_opps.json

# ⚠️ 分页检查：totalCount 超过返回数量时自动补全
TOTAL=$(jq '.totalCount' /tmp/crm_opps.json)
FETCHED=$(jq '.items | length' /tmp/crm_opps.json)

if [ "$TOTAL" -gt "$FETCHED" ]; then
  echo "⚠️ 数据截断：共 $TOTAL 条商机，当前仅获取 $FETCHED 条，正在补全..."
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

### Step 2: 按月份和阶段分组
```bash
# 定义阶段概率
STAGE_PROB='{
  "线索": 0.10,
  "方案": 0.25,
  "报价": 0.50,
  "谈判": 0.75,
  "口头承诺": 0.90
}'

# 计算加权金额
cat /tmp/crm_opps.json | jq --argjson prob "$STAGE_PROB" '
  .items[] |
  select(.expectedCompleteDate != null) |
  select(.expectedTransAmount != null and .expectedTransAmount > 0) |
  {
    name,
    customName,
    amount: .expectedTransAmount,
    stage: .businessProcessName,
    month: (.expectedCompleteDate | split("T")[0] | split("-")[0:2] | join("-")),
    probability: ($prob[.businessProcessName] // 0.10),
    weighted: ((.expectedTransAmount // 0) * ($prob[.businessProcessName] // 0.10))
  }
' | jq -s 'group_by(.month) | map({
  month: .[0].month,
  total: (map(.amount) | add),
  weighted: (map(.weighted) | add),
  count: length,
  deals: .
})'
```

### Step 3: 计算确定性分级
```bash
# 高确定（谈判+口头承诺）
cat /tmp/crm_opps.json | jq '
  [.items[] | 
   select(.businessProcessName == "谈判" or .businessProcessName == "口头承诺") |
   .expectedTransAmount // 0] | add'

# 中确定（报价）
cat /tmp/crm_opps.json | jq '
  [.items[] | 
   select(.businessProcessName == "报价") |
   .expectedTransAmount // 0] | add'

# 低确定（线索+方案）
cat /tmp/crm_opps.json | jq '
  [.items[] | 
   select(.businessProcessName == "线索" or .businessProcessName == "方案") |
   .expectedTransAmount // 0] | add'
```

## 输出格式

```
📈 收入预测（截至 {日期}）

{当月} 预计
- 加权预测: ¥{XX}万
- 全额金额: ¥{XX}万
- 商机数量: {X}个
  ├─ 🟢 高确定: ¥{XX}万（谈判+口头承诺）
  ├─ 🟡 中确定: ¥{XX}万（报价阶段）
  └─ ⚪ 低确定: ¥{XX}万（线索+方案）

{下月} 预计
- 加权预测: ¥{XX}万
- 全额金额: ¥{XX}万

{下下月} 预计
- 加权预测: ¥{XX}万

💡 详细清单（本月高确定）
- [{客户}] {商机名} — ¥{XX}万（{阶段}）
- [{客户}] {商机名} — ¥{XX}万（{阶段}）

⚠️ 风险提示
- 如果只算"高确定"，{当月}仅 ¥{XX}万
- {X}个商机缺失预计成交日期，未纳入预测
```

## 参数
- `--months 3`: 预测未来几个月（默认3）
- `--conservative`: 使用保守概率（每阶段降低10%）
- `--owner 丁留建`: 只预测指定负责人的商机

## 与 CRM 阶段的映射
CRM 中的 `businessProcessName` 对应关系：
- "线索" / "Survey" → 10%
- "方案" / "Proposal" → 25%
- "报价" / "Quote" → 50%
- "谈判" / "Negotiation" → 75%
- "口头承诺" / "Verbal" → 90%

如果遇到未知阶段，默认使用 10%。

## 注意事项
1. `expectedTransAmount` 单位是元，显示时转换为万元
2. `expectedCompleteDate` 为空的商机不计入预测（提示警告）
3. CRM 返回 `expectedTransProbability`（如 "10%"），但建议使用上述标准概率
4. 历史准确率可通过对比实际成交来校准概率
