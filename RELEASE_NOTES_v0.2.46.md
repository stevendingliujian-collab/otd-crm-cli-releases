# CRM CLI v0.2.46

发布日期：2026-05-21

## 新增功能

- 新增通用查询命令组：
  - `crm dict list --code <code>` 查询数据字典。
  - `crm user search/get` 查询人员。
  - `crm company list/search` 查询公司。
- `crm customer create/update` 补齐地区字段：
  - `salesRegion`
  - `country`
  - `province`
  - `city`
  - `district`

## 相关变化

- `customer update/assign` 改为 full update 保留式 payload，避免更新时漏传已有业务字段。
- `project stages/companies` 继续保留兼容入口，内部复用通用字典和公司查询能力。
- 更新 CLI skill 说明，补充通用基础资料查询和客户地区字段更新示例。
