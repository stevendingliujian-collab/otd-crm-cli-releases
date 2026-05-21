# CRM 项目管理

## 触发词
- 项目
- 查询项目
- 项目阶段
- 运维到期
- 更新项目
- 创建项目
- 项目状态
- 项目跟进

## 功能说明
通过 CRM CLI 管理项目全生命周期：查询、创建、更新阶段/状态/运维到期时间、添加跟进记录。

## 字典规则（重要）

| 字典编码 | 用途 | 存储方式 | 传参方式 |
|----------|------|----------|----------|
| `ProjectType` | 项目类型 | 存 id → `projectTypeId` | 传 id / code / 名称均可 |
| `MarketingProject` | 项目状态 | 存 id → `projectStatusId` | 传 id / code / 名称均可 |
| `ProjectStage` | 项目阶段 | 存 code + name | 传 id / code / 名称均可 |

查看可用字典值：
```bash
crm dict list --code ProjectStage --json           # 项目阶段
crm dict list --code MarketingProject --json       # 项目状态
crm dict list --code ProjectType --json            # 项目类型
crm company list --json                            # 公司列表
```
> 兼容入口仍可用：`crm project stages --json`、`crm project companies --json`。

## 查询项目

### 搜索项目列表
```bash
crm project search --json
crm project search --keyword "关键词" --json
crm project search --customer-name "客户名" --json
crm project search --stage-code "阶段code" --json
crm project search --owner "负责人" --json
crm project search --maintenance-expire-start 2026-01-01 --maintenance-expire-end 2026-12-31 --json
crm project search --include-finished --json
```

### 获取项目详情
```bash
crm project get <project_id> --json
```

**返回关键字段**：
```json
{
  "id": "uuid",
  "name": "项目名称",
  "code": "项目编号",
  "customName": "客户名称",
  "contractName": "合同名称",
  "projectStage": "项目阶段名称",
  "projectStageCode": "阶段code",
  "projectStatusName": "项目状态名称",
  "projectTypeName": "项目类型名称",
  "maintenanceExpire": "运维到期时间",
  "owner": "跟进人员",
  "projectManager": "项目经理",
  "companyName": "公司名称"
}
```

## 创建项目

```bash
crm project create \
  --name "项目名称" \
  --company-id <company_id> \
  --project-type "项目类型(id/code/名称)" \
  --json
```

**必填参数**：
- `--name`：项目名称
- `--company-id`：公司ID
- `--project-type`：项目类型（传 id / code / 名称均可）

**可选参数**：
- `--code`：项目编号（不传则自动生成）
- `--customer-id`：客户ID（自动补齐 customName）
- `--contract-id`：合同ID（自动补齐 contractName / contractCode）
- `--stage`：项目阶段（传 id / code / 名称均可）
- `--project-status`：项目状态（传 id / code / 名称均可）
- `--maintenance-expire`：运维到期时间（YYYY-MM-DD）
- `--owner-id`：跟进人员ID
- `--owner`：跟进人员姓名
- `--project-manager-id`：项目经理ID
- `--project-manager`：项目经理姓名
- `--plan-start-date`：立项时间
- `--plan-online-date`：预期验收时间

**自动补齐规则**：
- `--company-name`：不传则按 companyId 自动查询
- `--customer-name`：不传则按 customerId 自动查询
- `--contract-name` / `--contract-code`：不传则按 contractId 自动查询

### 完整示例
```bash
crm project create \
  --name "XX公司MES系统实施" \
  --company-id "3a1dfff0-e669-b131-92e7-e4278b1276ed" \
  --project-type "实施项目" \
  --customer-id "xxx-customer-id" \
  --contract-id "xxx-contract-id" \
  --stage "需求" \
  --maintenance-expire 2027-12-31 \
  --owner "张三" \
  --owner-id "xxx-owner-id" \
  --json
```

## 更新项目

```bash
crm project update <project_id> [options] --json
```

**工作原理**：先查询现有数据，再用指定字段覆盖，实现精确字段更新。

**不可修改字段**：合同、客户、公司（关联关系不允许通过 update 修改）

### 常用更新场景

#### 更新项目阶段
```bash
crm project update <project_id> --stage "实施中" --json
```

#### 更新运维到期时间
```bash
crm project update <project_id> --maintenance-expire 2027-12-31 --json
```

#### 更新项目状态
```bash
crm project update <project_id> --project-status "进行中" --json
```

#### 更新项目经理
```bash
crm project update <project_id> --project-manager "李四" --project-manager-id "xxx" --json
```

#### 多字段同时更新
```bash
crm project update <project_id> \
  --stage "验收" \
  --real-online-date 2026-06-01 \
  --confirm-date 2026-06-15 \
  --json
```

## 删除项目

```bash
crm project delete <project_id> --json
```

## 项目跟进记录

跟进记录使用通用的 followup 命令，`--related-type` 传 `project`（值为4）。

### 添加项目跟进
```bash
crm followup create \
  --related-id <project_id> \
  --related-type project \
  --related-title "项目名称" \
  --type phone \
  --content "跟进内容，至少10个字符" \
  --date 2026-05-11 \
  --json
```

### 查询项目跟进记录
```bash
crm followup search --related-type 4 --json
```

## 使用示例

### 示例 1：查询即将到期的项目
**用户**：查一下今年运维到期的项目

**Agent 执行**：
```bash
crm project search --maintenance-expire-start 2026-01-01 --maintenance-expire-end 2026-12-31 --json
```

### 示例 2：更新项目阶段并记录跟进
**用户**：把XX项目阶段改为实施中，记录一下今天开了启动会

**Agent 执行**：
```bash
# 1. 搜索项目
crm project search --keyword "XX" --json
# 获取 project_id 和 name

# 2. 更新阶段
crm project update <project_id> --stage "实施中" --json

# 3. 添加跟进记录
crm followup create \
  --related-id <project_id> \
  --related-type project \
  --related-title "XX项目" \
  --type visit \
  --content "今天召开项目启动会，确认了实施计划和里程碑节点" \
  --date 2026-05-11 \
  --json
```

### 示例 3：创建新项目
**用户**：给XX客户创建一个MES实施项目

**Agent 执行**：
```bash
# 1. 查询客户ID
crm customer search --keyword "XX" --json
# 获取 customer_id

# 2. 查询公司列表（获取 company_id）
crm company list --json

# 3. 查看项目类型
crm dict list --code ProjectType --json

# 4. 创建项目
crm project create \
  --name "XX客户MES系统实施" \
  --company-id <company_id> \
  --project-type "实施项目" \
  --customer-id <customer_id> \
  --stage "需求" \
  --json
```

### 示例 4：查询项目当前状态
**用户**：XX项目现在什么阶段了

**Agent 执行**：
```bash
crm project search --keyword "XX" --json
# 或
crm project get <project_id> --json
```

**输出关键信息**：
- 项目阶段：`projectStage`
- 项目状态：`projectStatusName`
- 运维到期：`maintenanceExpire`
- 跟进人员：`owner`
- 项目经理：`projectManager`

## 注意事项

1. **阶段传参灵活**：`--stage` 和 `--project-type`、`--project-status` 都支持传 id / code / 名称，CLI 自动转换
2. **名称自动补齐**：只传 ID 时，CLI 会自动查询对应名称填入
3. **更新是增量的**：只覆盖你指定的字段，其他字段保持不变
4. **跟进记录通用**：使用 `crm followup create --related-type project` 即可
5. **JSON 输出**：AI Agent 调用时务必加 `--json` 参数
