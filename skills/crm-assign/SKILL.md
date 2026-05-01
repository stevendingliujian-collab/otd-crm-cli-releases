# CRM 商机/客户转交

## 触发词
- 把XX商机转给XX
- 商机分配
- 客户转交
- 把XX客户分配给XX
- 转交商机
- 转交客户

## 功能说明
按名称查找商机或客户，按姓名查找负责人，执行分配并自动记录跟进。

## 参数
- `type`: 转交类型（opportunity/customer），根据触发词自动识别
- `keyword`: 商机/客户名称关键词（必填）
- `owner`: 新负责人姓名（必填）
- `reason`: 转交原因（可选，用于跟进记录）

## 执行流程

### 1. 查找目标对象

#### 商机转交
```bash
KEYWORD="$1"
OWNER="$2"

# 查找商机
OPP=$(crm opportunity search --keyword "$KEYWORD" --json | jq -r '.items[0]')
OPP_ID=$(echo $OPP | jq -r '.id')
OPP_NAME=$(echo $OPP | jq -r '.name')
CUSTOMER_NAME=$(echo $OPP | jq -r '.customName')
OLD_OWNER=$(echo $OPP | jq -r '.owner')

if [ "$OPP_ID" = "null" ]; then
  echo "❌ 未找到匹配的商机：$KEYWORD"
  exit 1
fi

echo "找到商机：$OPP_NAME - $CUSTOMER_NAME"
echo "当前负责人：$OLD_OWNER"
```

#### 客户转交
```bash
CUSTOMER=$(crm customer search --keyword "$KEYWORD" --json | jq -r '.items[0]')
CUSTOMER_ID=$(echo $CUSTOMER | jq -r '.id')
CUSTOMER_NAME=$(echo $CUSTOMER | jq -r '.name')
OLD_OWNER=$(echo $CUSTOMER | jq -r '.owner')
```

### 2. 执行分配

#### 商机分配
```bash
crm opportunity assign "$OPP_ID" --owner "$OWNER" --yes
```

#### 客户分配
```bash
crm customer assign "$CUSTOMER_ID" --owner "$OWNER" --yes
```

### 3. 记录跟进（商机转交时）
```bash
crm followup create \
  --related-id "$OPP_ID" \
  --related-type 0 \
  --related-title "$OPP_NAME - $CUSTOMER_NAME" \
  --content "商机负责人从【$OLD_OWNER】转交给【$OWNER】。原因：$REASON"
```

## 使用示例

### 示例 1：商机转交
**用户**：把指尖智擎的商机转给曹海亚

**Agent 执行**：
```bash
# 1. 查找商机
crm opportunity search --keyword "指尖智擎" --json
# 返回：MES系统 - 苏州指尖智擎科技有限公司，当前负责人：丁留建

# 2. 执行分配
crm opportunity assign "xxx-xxx" --owner "曹海亚" --yes

# 3. 记录跟进
crm followup create \
  --related-id "xxx-xxx" \
  --related-type 0 \
  --related-title "MES系统 - 苏州指尖智擎科技有限公司" \
  --content "商机负责人从【丁留建】转交给【曹海亚】"
```

### 示例 2：客户转交
**用户**：把霨冉智能这个客户分配给张三

**Agent 执行**：
```bash
# 1. 查找客户
crm customer search --keyword "霨冉智能" --json

# 2. 执行分配
crm customer assign "xxx-xxx" --owner "张三" --yes
```

## 输出格式

```markdown
✅ 商机转交成功

- **商机**：MES系统 - 苏州指尖智擎科技有限公司
- **原负责人**：丁留建
- **新负责人**：曹海亚
- **转交时间**：2026-03-31 17:30
- **跟进记录**：已自动创建
```

## 多结果处理
如果搜索返回多个匹配项：
```markdown
❌ 找到多个匹配的商机，请明确指定：

1. MES系统 - 苏州指尖智擎科技有限公司（负责人：丁留建）
2. WMS系统 - 苏州指尖智擎科技有限公司（负责人：曹海亚）

请使用完整名称或商机 ID 重新指定。
```

## 注意事项
- 转交后自动记录跟进，便于追溯
- 如果新负责人姓名匹配多人，列出候选让用户选择
- 客户转交不影响该客户下的商机负责人（商机负责人需单独转交）
