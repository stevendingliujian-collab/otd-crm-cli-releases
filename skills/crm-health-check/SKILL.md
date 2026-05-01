---
name: crm-health-check
description: CRM 商机健康度检查 v2 — 单个商机深度诊断，六维评分 + 行业 playbook + 行动建议
tags: [crm, sales, health-check]
---

# CRM 商机健康度检查 v2

## 触发词
- 商机健康度
- 商机诊断
- 检查 XX 商机
- 分析 XX 商机
- 商机风险评估

## 参数
- `keyword`：商机名称关键词（必填）；或直接提供 `id`

---

## 执行流程

### 第 1 步：查找商机

```bash
crm opportunity search --keyword "<keyword>" --size 5 --json
# 取第一条结果的 id
crm opportunity get <id> --json
```

### 第 2 步：排除非活跃商机

若当前阶段属于以下任一，直接停止并输出提示，不执行分析：
- 赢单 / 输单 / 取消 / 暂停 / 关闭

> 输出：「该商机当前状态为"[阶段名]"，不属于活跃推进状态，不执行健康度分析。」

### 第 3 步：并行拉取关联数据

```bash
crm opportunity products <id> --json          # 关联产品（用于 playbook 识别）
crm contact search --customer-id <cid> --json  # 联系人列表
crm followup search --related-id <id> --related-type 0 --size 50 --json  # 跟进记录（取最近50条）
crm customer get <cid> --json                  # 客户详情（含行业字段）
crm opportunity search --customer-id <cid> --size 10 --json  # 历史商机（可选，判断老客户/历史输单）
```

### 第 4 步：预处理

**4.1 阶段标准化**
将 CRM 实际阶段名语义映射到 7 个标准阶段（在评分模型文件中定义）：
初步接触 / 需求确认 / 调研诊断 / 方案设计 / 报价商务 / 谈判采购 / 待签约

**4.2 日期与跟进计算**
- 从跟进记录列表直接计算最近跟进日期（不依赖 `lastFollowUpDate` 字段，该字段格式可能不一致）
- 统计近 7 天、近 30 天跟进次数

**4.3 跟进内容分类**（语义判断）
- 维护型：节日问候、"持续跟进中"、客户未回复
- 信息补充型：发资料、简单交流
- 推进型：约会议、调研访谈、方案汇报、报价讲解、合同确认

**4.4 联系人角色推断**
从联系人职位/备注/跟进内容推断：决策者 / 使用负责人 / IT / 采购财务 / 窗口人

**4.5 客户画像标签推断**
结合客户行业、规模、跟进内容推断：企业规模 / 决策模式 / 数字化基础 / 项目紧迫度 / 竞争态势

**4.6 Playbook 选择**
综合以下信息语义匹配最合适的一个 playbook：
- 商机名称（权重最高）
- 商机描述
- 所有关联产品名称（可能多个）
- 客户所属行业

匹配目标：
- `manufacturing_mes`：MES / MOM / 生产管理 / 制造执行
- `manufacturing_wms`：WMS / 仓储管理 / 仓储物流
- `manufacturing_otd`：OTD / 供产销协同 / 计划交付 / 交付管理
- `crm_saas`：CRM / LTC / 销售管理 / 订阅型 SaaS
- `legacy_replacement`：替换旧系统 / 替换竞品
- `generic`：无法匹配时使用通用规则

多个信号指向不同 playbook 时，优先根据商机名称+描述判断核心方向。

**匹配后，读取对应 playbook 文件**：
`~/.claude/skills/crm-health-check/reference/{playbook_name}.md`

**同时读取评分细则**：
`~/.claude/skills/crm-health-check/reference/scoring_model.md`

### 第 5 步：六维度评分

按 `scoring_model.md` 中的详细规则逐项评分：

| 维度 | 满分 |
|------|------|
| A 基础数据完备度 | 15 |
| B 互动活跃度 | 20 |
| C 关键角色覆盖度 | 20 |
| D 阶段证据完备度 | 25 |
| E 行业适配度 | 10 |
| F 风险修正项 | 10（默认满分，按风险扣减） |

总分 = A + B + C + D + E + F

### 第 6 步：生成诊断结论

输出以下判断（业务判断，不只是数据罗列）：
1. 当前商机真实状态（在推进？在拖延？已阻塞？）
2. 最大短板维度
3. 当前最关键的推进缺口
4. 未来 1–2 周最应该做的事
5. 哪些动作暂不建议做

### 第 7 步：输出结构化报告

报告包含以下 9 节：

```
## 商机健康度分析报告：[商机名称] — [客户名称]

### 1. 商机概览
名称 / 客户 / 行业 / 当前阶段（标准化后）/ 预计金额 / 预计成交日期
客户画像标签 / 适用 Playbook

### 2. 健康度总分与等级
综合得分：XX / 100
等级：🟢健康 / 🟡需关注 / 🟠高风险可挽救 / 🔴高风险

各维度得分表（维度 / 得分 / 满分 / 简要说明）

### 3. 核心结论
（业务判断，2–4 条，不是数据描述）

### 4. 正常项 ✅
（已做好的部分）

### 5. 风险项 ⚠️
每条格式：风险名称（扣X分）/ 现状描述 / 影响分析

### 6. 行业化分析
对比 [Playbook名] 的最佳实践，当前商机差距分析

### 7. 下一步行动建议
**今天必须做**：
**本周必须推进**：
**下周观察点**：
**暂不建议做**：

### 8. 推荐沟通策略
面向老板/管理层：
面向使用部门：
面向 IT/采购：

### 9. 总体结论
（一句话判断：当前状态 + 关键突破口 + 若不突破的预期走向）
```

---

## 健康度等级速查

| 分数 | 等级 | 行动建议 |
|------|------|---------|
| 85–100 | 🟢 健康 | 正常推进，争取提速 |
| 70–84 | 🟡 需关注 | 有明显短板，需修正打法 |
| 50–69 | 🟠 高风险可挽救 | 1–2 周内必须突破，否则将滑落 |
| 0–49 | 🔴 高风险 | 重估投入策略，可能需要止损决策 |

---

## Reference 文件索引

- `reference/scoring_model.md` — 六维度评分详细规则
- `reference/manufacturing_mes.md` — MES/生产管理 playbook
- `reference/manufacturing_wms.md` — WMS/仓储管理 playbook
- `reference/manufacturing_otd.md` — OTD/供产销协同 playbook
- `reference/crm_saas.md` — CRM/销售管理 SaaS playbook
- `reference/legacy_replacement.md` — 替换旧系统 playbook
- `reference/generic.md` — 通用 playbook（无匹配时使用）
