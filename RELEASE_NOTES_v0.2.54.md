# CRM CLI v0.2.54

发布日期：2026-06-30

## 新增

- 新增 `crm followup comment <followupId>`，用于给跟进记录添加评论
- `followup create` 支持可选 `--related-title`、`--file-id`、`--at-user`

## 变更

- 跟进创建请求按后端 camelCase 参数名提交
- 补充了跟进创建与评论命令的测试覆盖
