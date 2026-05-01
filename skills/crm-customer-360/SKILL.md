# CRM 客户360全景速览（Skill 2）

## 触发词
- 查一下XX客户
- XX公司什么情况
- XX客户信息
- 给我XX客户的资料
- 客户360

## 功能说明
一句话查询，3秒内返回客户全貌。适用于拜访前、接电话时、准备报价时快速恢复上下文。

## 优先级
**P0** — 每天多次使用

## 信息维度

### 1. 基本信息
- 公司名、行业、规模、地区
- 客户等级（A/B/C）

### 2. 联系人
- 关键对接人、职位、电话/微信
- 主要联系人标记

### 3. 历史成交
- 已成交项目清单、总金额、最近成交时间
- 项目类型分布

### 4. 当前商机
- 在跟商机、阶段、预计金额、预计成交日

### 5. 最近动态
- 最后一次沟通记录（时间+内容摘要）

### 6. 财务状态
- 应收款、回款记录

## 执行流程

### Step 1: 搜索客户
```bash
crm customer search --keyword "{关键词}" --json > /tmp/customer_search.json
CUSTOMER_ID=$(cat /tmp/customer_search.json | jq -r '.items[0].id')
```

### Step 2: 获取客户详情
```bash
crm customer get $CUSTOMER_ID --json > /tmp/customer_detail.json
```

### Step 3: 查询关联商机
```bash
crm opportunity search --keyword "{客户名}" --json > /tmp/customer_opps.json
```

### Step 4: 查询历史合同
```bash
crm contract search --keyword "{客户名}" --json > /tmp/customer_contracts.json
```

### Step 5: 查询最近跟进
```bash
# 客户跟进（related_type=1）
crm followup search --related-id $CUSTOMER_ID --related-type 1 --size 3 --json > /tmp/customer_followups.json
```

### Step 6: 查询收款记录（如有合同）
```bash
# 获取合同ID列表，查询收款
CONTRACT_IDS=$(cat /tmp/customer_contracts.json | jq -r '.items[].id')
for id in $CONTRACT_IDS; do
  crm receive search --contract $id --json
done
```

## 输出格式

```
📋 {公司名} — {行业} | {地区}
⭐ 客户等级: {A/B/C}

👤 联系人
- {姓名}（{职位}）{电话} {微信标记}
- {姓名}（{职位}）{电话}

💰 历史成交
- 累计: {X}个项目 / ¥{XX}万 / 最近: {YYYY-MM}
- MES一期（¥18万，2025-06）
- WMS升级（¥12万，2024-11）

📊 当前商机
- {商机名}（¥{XX}万，{阶段}）预计: {YYYY-MM}

💬 最后沟通（{X}天前）
"{跟进内容摘要，限50字}..."
下一步: {nextPlan}

⚠️ 应收款: ¥{X}万（逾期{X}天）
```

## 参数
- `keyword`: 客户名称关键词（必填）
- `--detail`: 显示完整跟进记录（可选）
- `--no-finance`: 不显示财务信息（可选）

## 错误处理
1. 搜索无结果：提示"未找到匹配客户，请检查关键词"
2. 多个匹配：显示候选列表，让用户选择
3. 收款查询失败：跳过财务部分，不影响其他信息

## 注意事项
1. 联系人信息从 `customer.contacts[]` 获取，包含完整的电话、职位等
2. 历史成交从 `contract search` 获取，按 `signedDate` 倒序
3. 当前商机需要排除已关闭的（closeDate 不为空）
4. 收款记录通过合同ID关联查询
5. 跟进记录 `related_type=1` 表示客户跟进
