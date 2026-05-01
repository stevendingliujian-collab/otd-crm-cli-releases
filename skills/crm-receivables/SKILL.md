# CRM 应收款分析（Skill 9）

## 触发词
- 应收款
- 账款情况
- 欠款
- 收款情况
- 逾期账款
- 回款分析

## 功能说明
分析应收账款状态，找出逾期未收款项，支持按客户、合同、日期范围筛选。

## 优先级
**P1** — 每周/每月执行，现金流管理核心

## 数据来源
`crm receive search` 返回丰富的收款数据，包括：
- 合同总额、已收、未收、逾期、30天内到期
- 每条记录的逾期天数、开票状态、回款状态

## 执行流程

### Step 1: 获取所有收款记录
```bash
crm receive search --size 200 --json > /tmp/crm_receives.json
```

### Step 2: 提取汇总数据
```bash
cat /tmp/crm_receives.json | jq '{
  totalCount,
  totalAmount_wan: (.totalAmount / 10000 | floor),
  actualPayAmount_wan: (.actualPayAmount / 10000 | floor),
  unActualPayAmount_wan: (.unActualPayAmount / 10000 | floor),
  dueAmount_wan: (.dueAmount / 10000 | floor),
  expire30Amount_wan: (.expire30Amount / 10000 | floor),
  收款率: ((.actualPayAmount / .totalAmount * 100) | floor)
}'
```

### Step 3: 分析逾期账款
```bash
# 逾期未收款（dueDays < 0 且未收）
cat /tmp/crm_receives.json | jq '
  [.items[] | 
   select(.dueDays != null and .dueDays < 0) |
   select(.actualPayAmount == null or .actualPayAmount == 0)] |
  sort_by(-.amount) |
  .[:10]'
```

### Step 4: 30天内到期
```bash
# 即将到期（dueDays > 0 且 <= 30）
cat /tmp/crm_receives.json | jq '
  [.items[] | 
   select(.dueDays != null and .dueDays > 0 and .dueDays <= 30) |
   select(.actualPayAmount == null or .actualPayAmount == 0)]'
```

### Step 5: 按客户汇总
```bash
cat /tmp/crm_receives.json | jq '
  [.items[] | select(.actualPayAmount == null or .actualPayAmount == 0)] |
  group_by(.customName) |
  map({
    customer: .[0].customName,
    count: length,
    total: (map(.amount) | add)
  }) |
  sort_by(-.total) |
  .[:10]'
```

## 输出格式

```
💰 应收款分析 — {日期}

📊 总览
- 合同总额: ¥{XX}万
- 已收款: ¥{XX}万（{X}%）
- 未收款: ¥{XX}万（{X}%）
- 逾期金额: ¥{XX}万（占未收款 {X}%）
- 30天内到期: ¥{XX}万

🔴 逾期未收款 Top 5
- [{客户}] {合同名} | ¥{X}万 | 逾期 {X} 天
- [{客户}] {合同名} | ¥{X}万 | 逾期 {X} 天

⚠️ 30天内到期
- [{客户}] {合同名} | ¥{X}万 | {X}天后到期

📋 按客户汇总（未收款 Top 5）
- {客户}: ¥{X}万（{X}笔）
- {客户}: ¥{X}万（{X}笔）

💡 建议行动
1. 优先催收 {客户}，逾期最久/金额最大
2. 本周联系 {X} 个即将到期客户
```

## 参数
- `--customer 客户名`: 按客户筛选
- `--contract 合同ID`: 按合同筛选
- `--from 2026-01-01`: 起始日期
- `--to 2026-03-31`: 结束日期
- `--overdue-only`: 只显示逾期

## 字段说明

| 字段 | 说明 |
|------|------|
| `dueDays` | 距到期天数，负数表示已逾期 |
| `receiveStatus` | 0=未收，1=部分，2=已收 |
| `actualPayAmount` | 实际已收金额 |
| `unActualPayAmount` | 未收金额 |
| `invoiceStatus` | 0=未开票，1=部分，2=已开票 |
| `returnStatus` | 回款状态描述（文本） |
| `plannedPayDate` | 计划收款日期 |
| `collectionCycle` | 收款周期（如"首付款"、"验收款"） |

## 与其他 Skill 的关系
- **Skill 2 客户360**：可调用本 Skill 获取客户应收款详情
- **每日仪表盘**：可包含逾期金额预警

## 注意事项
1. `dueDays` 为负表示已逾期，正数表示还有几天到期
2. 数据包含未来计划（如质保金），注意 `returnStatus` 描述
3. 金额单位是元，显示时转换为万元
