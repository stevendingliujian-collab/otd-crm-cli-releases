# CRM CLI v0.2.48

发布日期：2026-05-26

## 新增功能

- 补充发布流程文档中的版本号更新步骤，避免直接复用旧版本发版。
- `task` 命令更新为当前任务入口，统一对接 TMS 接口。
- `task update` 新增 `--update-property`，可显式指定可更新字段。
- `task` 相关命令切换到 `/api/tms/taskItem/*` 与 `/api/tms/comment/*`。
- 新增 `crm-tms` skill，并同步更新 `crm-cli` 主 skill 的任务说明。

## 相关变化

- `task` 命令支持更清晰的更新字段提示，降低误用风险。
- 发布包已同步包含最新 `skills/` 内容。
