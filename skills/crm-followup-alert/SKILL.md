# CRM 超期未跟进预警

## 触发词
- 哪些商机没跟进
- 超期商机
- 跟进预警
- 未跟进的商机
- 商机跟进检查

## 功能说明
查询超过指定天数未跟进的商机，按优先级排序输出，帮助销售及时发现被遗漏的商机。

## 参数
- `days`: 未跟进天数阈值，默认 7 天
- `owner`: 可选，按负责人筛选

## 执行流程

### 1. 查询所有商机（含分页检查）
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

### 2. 筛选超期商机
使用 jq 筛选 `lastFollowUpDate` 早于阈值日期或为空的商机：
```bash
DAYS=${1:-7}
THRESHOLD=$(date -v-${DAYS}d +%Y-%m-%d 2>/dev/null || date -d "-${DAYS} days" +%Y-%m-%d)

cat /tmp/crm_opps.json | jq -r --arg th "$THRESHOLD" '
  .items[] | 
  select(.lastFollowUpDate < $th or .lastFollowUpDate == null) |
  {
    name: .name,
    customer: .customName,
    owner: .owner,
    stage: .businessProcessName,
    amount: .expectedTransAmount,
    lastFollowUp: (.lastFollowUpDate // "从未跟进"),
    daysOverdue: (if .lastFollowUpDate then ((now | strftime("%Y-%m-%d") | strptime("%Y-%m-%d") | mktime) - (.lastFollowUpDate | strptime("%Y-%m-%d") | mktime)) / 86400 | floor else 999 end)
  }
' | jq -s 'sort_by(-.daysOverdue)'
```

### 3. 输出格式
按超期天数降序排列，输出：
- 商机名称
- 客户名称
- 负责人
- 当前阶段
- 预计金额
- 上次跟进日期
- 超期天数

## 输出示例

```markdown
## 超过 7 天未跟进的商机（共 3 个）

| 商机 | 客户 | 负责人 | 阶段 | 金额 | 上次跟进 | 超期 |
|------|------|--------|------|------|----------|------|
| MES系统 | 霨冉智能 | 丁留建 | 需求确认 | 50万 | 2026-02-10 | 49天 |
| WMS项目 | 某科技 | 曹海亚 | 方案报价 | 30万 | 2026-03-15 | 16天 |
| CRM定制 | 某制造 | 丁留建 | 初步接触 | 20万 | 从未 | - |

⚠️ 建议立即跟进前 2 个高优先级商机
```

## 建议行动
- 超过 14 天：立即电话联系
- 超过 7 天：发送邮件或微信跟进
- 从未跟进：优先处理，确认商机有效性
