# CRM 周跟进汇总

## 触发词
- 本周跟进汇总
- 周报
- 跟进情况
- 这周跟进了哪些
- 销售周报

## 功能说明
汇总指定时间范围内的跟进记录，按商机/客户聚合，生成结构化报告，用于周会汇报和销售复盘。

## 参数
- `days`: 汇总天数，默认 7 天
- `owner`: 可选，按跟进人筛选

## 执行流程

### 1. 计算日期范围
```bash
START=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "-7 days" +%Y-%m-%d)
END=$(date +%Y-%m-%d)
```

### 2. 查询跟进记录
```bash
crm followup search --date-after $START --date-before $END --json
```

### 3. 按商机聚合
```bash
crm followup search --date-after $START --date-before $END --json | jq '
  .items | 
  group_by(.relatedTitle) | 
  map({
    opportunity: .[0].relatedTitle,
    customer: .[0].customName,
    count: length,
    records: map({date: .followUpDate, content: .content, type: .followUpTypeName})
  }) |
  sort_by(-.count)
'
```

## 输出格式

```markdown
## 本周跟进汇总（2026-03-24 ~ 2026-03-31）

### 📊 概览
- 总跟进次数：12 次
- 涉及商机：5 个
- 涉及客户：4 家

---

### 🏢 元朔智感（南通）MES（3 次）
- **03-28** [电话] 与张副总确认需求范围，已认可我们方案
- **03-26** [拜访] 现场调研生产线，识别 5 个关键痛点
- **03-25** [微信] 发送初步报价，等待反馈

### 🏢 指尖智擎 MES（2 次）
- **03-30** [电话] 初步沟通需求，6月前需要上线
- **03-27** [微信] 建立联系，约下周拜访

### 🏢 霨冉智能 MES（1 次）
- **03-29** [邮件] 发送方案，等待回复

---

### 📈 下周重点
1. 元朔智感：推动签约
2. 指尖智擎：完成现场调研
3. 霨冉智能：电话跟进方案反馈
```

## 统计维度
- 按商机聚合跟进次数
- 按跟进类型分布（电话/拜访/微信/邮件）
- 按负责人统计（如有多人）

## 使用场景
- 周一晨会汇报
- 销售复盘
- 管理层审阅
