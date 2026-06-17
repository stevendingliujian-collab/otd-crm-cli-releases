# CRM CLI v0.2.50

发布日期：2026-06-17

## 新增功能

- 增强 CLI help 文案，明确提示先看 `crm <command> <subcommand> --help` 再传可选参数。
- 为主 command 和 `get/search` 子命令补充 AI 友好的使用约束，减少把 `code`、`name`、`keyword` 当作 `id` 的误用。
- `search` 输出增加“主要用于拿 ID”的指引，`get` 输出增加“只能按 ID 读取单条记录”的指引。

## 相关变化

- `crm --help`、各模块 help 页面和常见子命令 help 都已同步更新。
- 发布包将随本次版本一起包含新的 help 文案。
