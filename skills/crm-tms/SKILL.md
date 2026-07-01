# CRM TMS Skill

**OTD TMS 命令行与接口使用指南**

## 功能说明

该 skill 面向 TMS 模块，优先使用 `crm task` 命令完成任务、评论、状态流转、列表查询、工时与关联操作。

## 前置条件

1. 已安装 CRM CLI
2. 已登录：`crm auth login`

验证可用性：

```bash
crm --version
crm auth whoami
crm task --help
```

## 命令入口

| 命令 | 说明 |
|------|------|
| `crm task search` | 查询任务列表 |
| `crm task get <id>` | 查询任务详情 |
| `crm task create` | 创建任务 |
| `crm task update <id>` | 更新任务字段 |
| `crm task assign <id>` | 分配责任人 |
| `crm task comment <id>` | 新增任务评论 |
| `crm task statuses` | 查看任务状态动作 |

## 更新任务时的字段

`crm task update` 支持通过 `--update-property` 明确要更新的属性。

可用值：

- `title`
- `description`
- `responsibleUserId`
- `priority`
- `status`
- `planDoneDate`
- `planStartDate`
- `autoCompletion`
- `taskType`
- `taskCustomTypeId`
- `collaborationIds`
- `taskDocLinks`

示例：

```bash
crm task update <task_id> --update-property title --title "新标题" --json
crm task update <task_id> --update-property description --description "新说明" --json
crm task update <task_id> --update-property responsibleUserId --assignee-id <user_id> --json
```

## 常见操作

### 1. 查询任务列表

```bash
crm task search --keyword "需求" --size 20 --json
```

### 2. 查看任务详情

```bash
crm task get <task_id> --json
```

### 3. 创建任务

```bash
crm task create --title "新任务" --description "说明" --json
crm task create --title "新任务" --related-id <relatedId> --related-type 5 --sub-related-type Opportunities --related-name "关联项名称" --json
```

创建 CRM 来源任务时：

- `--related-type` 固定传 `5`，表示 `OtdCrm`
- `--sub-related-type` 传 CRM 来源模块字符串：`Leads`、`Contacts`、`Opportunities`、`Accounts`、`Contracts`、`Projects`、`Procurements`、`Delivery`
- `--related-id` 传来源项 ID
- `--related-name` 传来源项名称

### 4. 更新负责人

```bash
crm task assign <task_id> --owner "张三" --yes --json
```

### 5. 添加评论

```bash
crm task comment <task_id> --content "已处理" --json
```

## 接口对齐原则

- 任务相关接口统一使用 `/api/tms/taskItem/*`
- 评论接口统一使用 `/api/tms/comment/*`
- 任务状态流转接口统一使用 `/api/tms/taskItem/{start|done|check|reject|stop|cancel}`
