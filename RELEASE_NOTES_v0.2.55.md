# CRM CLI v0.2.55

发布日期：2026-07-01

## 新增

- `crm task create` 支持 `--related-name`，创建任务时可传关联项名称
- `crm task create` 支持 `--sub-related-type`，用于 CRM 来源任务的来源模块

## 变更

- 完善 `crm task create --help`，补充来源类型枚举：`0 Meeting`、`1 ThirdParty`、`2 Others`、`3 Project`、`4 Manually`、`5 OtdCrm`
- 补充 CRM 来源模块说明：`Leads`、`Contacts`、`Opportunities`、`Accounts`、`Contracts`、`Projects`、`Procurements`、`Delivery`
- 更新 CRM CLI / TMS skill 中的任务创建示例
