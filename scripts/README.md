# CRM CLI 演示脚本使用指南

## 快速开始

### 1. 配置演示环境

```bash
cd ~/.openclaw/workspace-cto/crm-cli/scripts
./setup-demo-env.sh
```

**交互提示**:
- API 地址: 输入测试环境地址（默认: http://test.otdmes.com.cn:60027）
- 用户名: 输入测试账号（默认: demo）
- 密码: 输入密码
- 是否登录: Y（推荐）

**完成后**:
- ✅ 配置文件已更新（~/.crm/config.json）
- ✅ 已登录演示环境
- ✅ demo profile 可用

---

### 2. 运行演示场景

#### 场景 1: 基础 CRUD 演示

```bash
./demo-basic-crud.sh
```

**演示内容**:
- 搜索客户列表
- 查看客户详情
- 创建线索
- 搜索商机

**适用场景**: 向客户展示 CLI 基本功能

---

### 3. 手动演示

#### 验证配置

```bash
# 查看当前用户
crm auth whoami --profile demo --json

# 查看配置
cat ~/.crm/config.json | jq '.profiles.demo'
```

#### 搜索数据

```bash
# 搜索客户
crm customer search --profile demo --size 10 --json | jq '.items[0:5]'

# 搜索商机
crm opportunity search --profile demo --json | jq '.items[] | {name, customer: .customName, amount: .expectedTransAmount}'

# 搜索合同
crm contract search --profile demo --json | jq '.items[] | {name, amount, status: .contractStatusName}'
```

#### 创建数据

```bash
# 创建客户
crm customer create --profile demo --name "测试客户-$(date +%H%M)" --json

# 创建线索
crm clue create --profile demo --name "测试线索" --contact "张经理" --phone "13800138000" --json

# 创建商机（需要 customer-id）
CUSTOMER_ID=$(crm customer search --profile demo --size 1 --json | jq -r '.items[0].id')
crm opportunity create --profile demo --name "测试商机" --customer-id "$CUSTOMER_ID" --amount 100000 --json
```

---

## 演示技巧

### 1. 使用别名

添加到 `~/.bashrc` 或 `~/.zshrc`:

```bash
alias crm-demo='crm --profile demo'
alias crm-prod='crm --profile default'
```

使用:

```bash
crm-demo customer search
crm-prod customer search
```

### 2. 美化输出

```bash
# 使用 jq 格式化
crm customer search --profile demo --json | jq '.'

# 提取关键字段
crm customer search --profile demo --json | jq '.items[] | {name, owner, phone}'

# 表格化
crm customer search --profile demo --json | jq -r '.items[] | [.name, .owner, .phone] | @tsv' | column -t
```

### 3. 管道组合

```bash
# 搜索 + 过滤
crm customer search --profile demo --json | jq '.items[] | select(.owner == "张三")'

# 统计
crm opportunity search --profile demo --json | jq '.items | group_by(.businessProcessName) | map({stage: .[0].businessProcessName, count: length})'
```

---

## 演示前检查

运行检查脚本:

```bash
# 1. 检查配置
cat ~/.crm/config.json | jq '.profiles.demo'

# 2. 检查登录
crm auth whoami --profile demo --json

# 3. 检查数据
echo "客户数: $(crm customer search --profile demo --json | jq '.items | length')"
echo "商机数: $(crm opportunity search --profile demo --json | jq '.items | length')"
echo "线索数: $(crm clue search --profile demo --json | jq '.items | length')"
```

---

## 切换环境

### 临时使用

```bash
# 使用 demo 环境
crm customer search --profile demo

# 使用生产环境
crm customer search --profile default
```

### 设为默认

```bash
# 切换到 demo
crm config set current_profile demo

# 验证
crm auth whoami --json

# 切回生产
crm config set current_profile default
```

---

## 常见问题

### Q: 如何重置 demo 配置？

```bash
# 方法 1: 重新运行配置脚本
./setup-demo-env.sh

# 方法 2: 手动删除
cat ~/.crm/config.json | jq 'del(.profiles.demo)' > ~/.crm/config.json.tmp
mv ~/.crm/config.json.tmp ~/.crm/config.json
```

### Q: 如何恢复备份？

```bash
# 查看备份文件
ls -la ~/.crm/config.json.backup-*

# 恢复
cp ~/.crm/config.json.backup-20260402-HHMMSS ~/.crm/config.json
```

### Q: 演示环境和生产环境会冲突吗？

不会。每个 profile 完全独立：
- 独立 API 地址
- 独立认证 token
- 独立用户信息

### Q: 如何准备演示数据？

```bash
# 创建测试客户
crm customer create --profile demo --name "演示客户" --json

# 创建测试线索
crm clue create --profile demo --name "演示线索" --json

# 创建测试商机
CUSTOMER_ID=$(crm customer search --profile demo --size 1 --json | jq -r '.items[0].id')
crm opportunity create --profile demo --name "演示商机" --customer-id "$CUSTOMER_ID" --amount 500000 --json
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `setup-demo-env.sh` | 配置向导脚本 |
| `demo-basic-crud.sh` | 基础 CRUD 演示 |
| `README.md` | 本文档 |
| `../DEMO_SETUP.md` | 详细配置指南 |

---

**维护者**: Martin (CTO Agent)  
**最后更新**: 2026-04-02  
**版本**: v1.0
