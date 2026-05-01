# CRM 发票追踪（Skill 10）

## 触发词
- 发票情况
- 开票进度
- 哪些已开票
- 发票追踪
- 开票统计

## 功能说明
追踪发票状态，找出已开票未收款的项目，协助催款。

## 优先级
**P1** — 每周/每月执行，配合应收款分析

## 数据来源
`crm invoice search` 返回发票数据，包括：
- 合同名称、发票金额、实际收款金额
- 计划收款日期、收款周期

## 执行流程

### Step 1: 获取所有发票记录
```bash
crm invoice search --size 200 --json 2>&1 | grep -v "^\[DEBUG\]" > /tmp/crm_invoices.json
```

### Step 2: 汇总统计
```bash
cat /tmp/crm_invoices.json | jq '{
  totalCount,
  total_invoiceAmount_wan: ([.items[].invoiceAmount // 0] | add / 10000 | floor),
  total_actualPayAmount_wan: ([.items[].actualPayAmount // 0] | add / 10000 | floor),
  uncollected_wan: (([.items[].invoiceAmount // 0] | add) - ([.items[].actualPayAmount // 0] | add)) / 10000 | floor
}'
```

### Step 3: 已开票未收款
```bash
cat /tmp/crm_invoices.json | jq '
  [.items[] | 
   select(.invoiceAmount > 0) |
   select(.actualPayAmount == null or .actualPayAmount == 0)] |
  sort_by(-.invoiceAmount)'
```

### Step 4: 按合同汇总
```bash
cat /tmp/crm_invoices.json | jq '
  [.items[] | select(.invoiceAmount > 0)] |
  group_by(.contractCode) |
  map({
    contract: .[0].contractName,
    invoiced: (map(.invoiceAmount) | add),
    collected: (map(.actualPayAmount // 0) | add)
  }) |
  sort_by(-.invoiced) |
  .[:10]'
```

## 输出格式

```
🧾 发票追踪 — {日期}

📊 总览
- 发票记录: {X}条
- 已开票总额: ¥{XX}万
- 已收款: ¥{XX}万
- 未收款: ¥{XX}万

🔴 已开票未收款 Top 5
- {合同名} | 开票¥{X}万 | {收款周期}
- {合同名} | 开票¥{X}万 | {收款周期}

📋 按合同汇总（开票金额 Top 5）
- {合同名}: 开票¥{X}万，已收¥{X}万
- {合同名}: 开票¥{X}万，已收¥{X}万

💡 建议行动
1. 优先催收 {合同名}，已开票未收款金额最大
```

## 参数
- `--contract 合同ID`: 按合同筛选
- `--from 2026-01-01`: 开票日期起始
- `--to 2026-03-31`: 开票日期结束
- `--unpaid-only`: 只显示未收款的

## 字段说明

| 字段 | 说明 |
|------|------|
| `invoiceAmount` | 已开票金额 |
| `actualPayAmount` | 实际已收金额 |
| `plannedPayDate` | 计划收款日期 |
| `collectionCycle` | 收款周期（如"首付款"、"验收款"） |
| `contractCode` | 合同编号 |
| `contractName` | 合同名称 |

## 与其他 Skill 的关系
- **Skill 9 应收款分析**：应收款更全面（包含未开票），本 Skill 聚焦已开票部分
- **Skill 2 客户360**：可调用本 Skill 获取客户发票详情

## 注意事项
1. CLI 输出包含 DEBUG 信息，需要过滤 `grep -v "^\[DEBUG\]"`
2. `actualPayAmount` 为 null 或 0 表示未收款
3. 金额单位是元，显示时转换为万元
