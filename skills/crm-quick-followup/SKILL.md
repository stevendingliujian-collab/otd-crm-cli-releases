# CRM 快速创建跟进

## 触发词
- 记录跟进
- 跟进XX商机
- 记一下XX的跟进
- 添加跟进记录
- XX商机跟进

## 功能说明
通过商机名称快速创建跟进记录，自动填充 related_id/type/title，省去手动查 ID 的步骤。

## 参数
- `keyword`: 商机名称关键词（必填）
- `content`: 跟进内容（必填）
- `type`: 跟进类型，默认 1（电话）
  - 1: 电话
  - 2: 拜访
  - 3: 微信/QQ
  - 4: 邮件
  - 5: 其他
- `next_plan`: 下一步计划（可选）

## 执行流程

### 1. 按名称查找商机
```bash
KEYWORD="$1"
OPP=$(crm opportunity search --keyword "$KEYWORD" --json | jq -r '.items[0]')
OPP_ID=$(echo $OPP | jq -r '.id')
OPP_NAME=$(echo $OPP | jq -r '.name')
CUSTOMER_NAME=$(echo $OPP | jq -r '.customName')

if [ "$OPP_ID" = "null" ]; then
  echo "❌ 未找到匹配的商机：$KEYWORD"
  exit 1
fi

echo "找到商机：$OPP_NAME - $CUSTOMER_NAME"
```

### 2. 确认并创建跟进
```bash
# 显示匹配的商机，确认后创建
crm followup create \
  --related-id "$OPP_ID" \
  --related-type 0 \
  --related-title "$OPP_NAME - $CUSTOMER_NAME" \
  --content "$CONTENT" \
  --type "$TYPE" \
  --next-plan "$NEXT_PLAN"
```

### 3. 确认结果
```bash
echo "✅ 跟进记录已创建"
echo "商机：$OPP_NAME"
echo "内容：$CONTENT"
```

## 使用示例

### 示例 1：简单跟进
**用户**：记录一下元朔智感的跟进，今天电话沟通了需求

**Agent 执行**：
```bash
crm opportunity search --keyword "元朔智感" --json
# 找到商机 ID

crm followup create \
  --related-id "xxx-xxx" \
  --related-type 0 \
  --related-title "MES系统 - 元朔智感（南通）科技有限公司" \
  --content "电话沟通需求，客户确认3月底前需要完成选型" \
  --type 1
```

### 示例 2：带下一步计划
**用户**：指尖智擎商机跟进，今天拜访了客户，下周三安排技术交流

**Agent 执行**：
```bash
crm followup create \
  --related-id "xxx-xxx" \
  --related-type 0 \
  --related-title "MES系统 - 苏州指尖智擎科技有限公司" \
  --content "现场拜访，与技术负责人沟通了需求细节" \
  --type 2 \
  --next-plan "下周三安排技术交流会"
```

## 输出格式

```markdown
✅ 跟进记录已创建

- **商机**：MES系统 - 元朔智感（南通）科技有限公司
- **类型**：电话
- **内容**：电话沟通需求，客户确认3月底前需要完成选型
- **下一步**：（无）
- **创建时间**：2026-03-31 17:30
```

## 注意事项
- 如果搜索返回多个商机，列出候选让用户选择
- `related_title` 必须传，否则 CRM 界面不显示归属商机
- 跟进日期默认为当天，可通过 `--date` 指定其他日期
