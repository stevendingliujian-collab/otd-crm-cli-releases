# CRM CLI v0.2.47

发布日期：2026-05-22

## 新增功能

- `clue`、`contact`、`contract`、`followup`、`invoice`、`receive`、`task` 的 `update` 统一改为先查询当前数据，再执行 full update。

## 相关变化

- full update 流程会保留已有业务字段，降低因局部参数覆盖导致字段丢失的风险。
- `opportunity update` 继续保持 `updatePartial` 策略，同时补齐专项测试覆盖。
