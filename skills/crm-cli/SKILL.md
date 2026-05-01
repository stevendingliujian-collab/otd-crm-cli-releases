# CRM CLI Skill

**OTD CRM 命令行工具 — v0.2.x**

## 功能说明

CRM CLI 是一个完整的 CRM 命令行工具，支持查询、创建、更新、分配等所有操作。
优先使用 CLI 完成所有 CRM 操作，无需依赖 MCP。

## 前置条件

1. **已安装**（全局安装）：
   ```bash
   npm install -g https://github.com/stevendingliujian-collab/otd-crm-cli-releases/releases/latest/download/otd-crm-cli-latest.tgz
   ```
2. **已登录**：`crm auth login`（Token 有效期 7 天）

验证是否可用：
```bash
crm --version     # 应输出 0.2.x
crm auth whoami   # 应输出当前登录用户
```

## 所有可用命令

| 命令族 | 子命令 | 说明 |
|-------|--------|------|
| `crm auth` | login / logout / whoami / device | 认证管理 |
| `crm customer` | search / get / create / update / assign | 客户 |
| `crm clue` | search / get / create / update / convert | 线索 |
| `crm opportunity` | search / get / create / update / assign / stage / stages | 商机 |
| `crm contract` | search / get / create / update / statuses | 合同 |
| `crm followup` | search / get / create / update | 跟进记录 |
| `crm task` | search / get / create / update / assign / comment / statuses | 任务 |
| `crm contact` | search / get / create / update | 联系人 |
| `crm receive` | search / get / create / update | 回款记录 |
| `crm receivable` | search | 应收款 |
| `crm invoice` | search / get / create / update | 发票 |
| `crm update` | — | 升级 CLI 到最新版本 |

## 常用查询命令

### 搜索客户
```bash
crm customer search --keyword 科技 --json
crm customer search --keyword 科技 --size 50 --json
```

### 搜索商机
```bash
crm opportunity search --json
crm opportunity search --keyword 项目 --stage 方案 --json
crm opportunity search --owner 曹海亚 --size 200 --json
```

### 搜索线索
```bash
crm clue search --keyword 张三 --json
```

### 搜索跟进记录
```bash
crm followup search --json
crm followup search --date-after 2026-03-27 --json           # 某日期后
crm followup search --date-before 2026-04-14 --json          # 某日期前
crm followup search --date-after 2026-03-27 --date-before 2026-04-14 --json
crm followup search --opportunity-id <opp_id> --json         # 按商机
crm followup search --customer-id <customer_id> --json       # 按客户
```

### 获取详情
```bash
crm customer get <customer_id> --json
crm clue get <clue_id> --json
crm opportunity get <opp_id> --json
crm contract get <contract_id> --json
```

## 创建操作

### 创建跟进记录
```bash
crm followup create \
  --related-id <opp_id> \
  --related-type 0 \
  --related-title "商机名称" \
  --content "跟进内容描述" \
  --json
```
> `--related-type`：0=商机，1=客户，2=联系人

### 创建线索
```bash
crm clue create --name "线索名称" --contact 张三 --phone 13800000000 --json
```

### 创建任务
```bash
crm task create --title "任务标题" --related-id <opp_id> --related-type opportunity --json
```

## 更新操作

### 更新商机
```bash
crm opportunity update <opp_id> --stage 谈判 --yes --json
crm opportunity update <opp_id> --amount 500000 --yes --json
```

### 更新客户
```bash
crm customer update <customer_id> --industry 制造业 --yes --json
```

### 更新跟进
```bash
crm followup update <followup_id> --content "更新内容" --yes --json
```

## 分配操作

```bash
crm opportunity assign <opp_id> --owner "曹海亚" --yes
crm customer assign <customer_id> --owner "张三" --yes
crm task assign <task_id> --owner "李明" --yes
```

## 全局参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `--json` | JSON 输出（脚本必加） | `--json` |
| `--keyword` | 搜索关键词 | `--keyword 科技` |
| `--page` | 页码（从 1 开始） | `--page 1` |
| `--size` | 每页数量（最大 200） | `--size 50` |
| `--owner` | 按负责人筛选 | `--owner 曹海亚` |
| `-y, --yes` | 跳过确认提示 | `--yes` |
| `--profile` | 切换账号配置 | `--profile staging` |

## JSON 返回格式

```json
{
  "totalCount": 96,
  "items": [
    {
      "id": "uuid",
      "name": "公司名称",
      "owner": "负责人姓名",
      "ownerId": "负责人ID"
    }
  ]
}
```

## 错误处理

命令失败时返回 JSON 错误（输出到 stderr）：

```json
{
  "success": false,
  "error": {
    "code": "AUTH_401",
    "message": "Token expired",
    "hint": "Run 'crm auth login' to re-authenticate",
    "trace_id": "trc_xxx"
  }
}
```

**常见错误**：
- `AUTH_401`：Token 过期 → 执行 `crm auth login`
- `BIZ_404`：资源不存在
- `SYSTEM_500`：服务器错误 → 稍后重试

## 升级 CLI

```bash
crm update          # 交互式升级
crm update --check  # 只检查版本，不升级
crm update --force  # 强制升级，不询问
```

## 技术信息

- **语言**: TypeScript + Node.js
- **认证**: 用户名密码登录，Token 加密存储于 `~/.crm/`
- **仓库**: https://github.com/stevendingliujian-collab/otd-crm-cli
- **Releases**: https://github.com/stevendingliujian-collab/otd-crm-cli-releases
