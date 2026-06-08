---
name: crm-tenant-register
description: Register a new OTD CRM tenant from the CLI using phone SMS verification. Use when the user wants to self-register/open/create a tenant, send a registration SMS code, test tenant registration manually, or complete the two-step flow through `crm auth register-sms` and `crm auth register-tenant`.
---

# CRM 租户自注册

## 功能说明

用 CLI 完成租户自注册。流程固定分两步：

1. 先给手机号发送验证码。
2. 再用公司名、管理员信息、手机号、邮箱、密码和短信验证码注册租户。

这两个步骤是公开注册流程，不要求先执行 `crm auth login`。但会使用当前 profile 的 `api_url`，需要切换环境时使用全局参数 `--profile`。

## 命令

### 发送手机号验证码

```bash
crm auth register-sms --phone-number 13800000000
```

JSON 输出：

```bash
crm auth register-sms --phone-number 13800000000 --json
```

对应接口：

```text
POST /api/tenant/selfRegister/getSmsCode
```

请求体：

```json
{
  "phoneNumber": "13800000000"
}
```

### 注册租户

参数方式：

```bash
crm auth register-tenant \
  --tenant-name "公司名称" \
  --admin-name "管理员姓名" \
  --phone-number 13800000000 \
  --email admin@example.com \
  --password "登录密码" \
  --sms-code 123456
```

交互方式：

```bash
crm auth register-tenant
```

JSON 输出：

```bash
crm auth register-tenant \
  --tenant-name "公司名称" \
  --admin-name "管理员姓名" \
  --phone-number 13800000000 \
  --email admin@example.com \
  --password "登录密码" \
  --sms-code 123456 \
  --json
```

对应接口：

```text
POST /api/tenant/selfRegister/register
```

请求体：

```json
{
  "tenantName": "公司名称",
  "adminName": "管理员姓名",
  "phoneNumber": "13800000000",
  "email": "admin@example.com",
  "password": "登录密码",
  "smsCode": "123456"
}
```

## 手动测试流程

推荐用两个终端并行交互，避免验证码等待时打断注册命令上下文：

1. 终端 A 发送验证码：

   ```bash
   crm auth register-sms --phone-number 13800000000
   ```

2. 手机收到验证码后，在终端 B 启动注册交互：

   ```bash
   crm auth register-tenant
   ```

3. 按提示填写：

   ```text
   Company name: 公司名称
   Admin name: 管理员姓名
   Phone number: 13800000000
   Email: admin@example.com
   Password: 登录密码
   SMS code: 手机收到的验证码
   ```

4. 注册成功后记录输出中的租户 ID、租户名、管理员邮箱和手机号。

如果要测试指定环境：

```bash
crm --profile staging auth register-sms --phone-number 13800000000
crm --profile staging auth register-tenant
```

## Agent 执行规范

- 先执行 `register-sms`，不要直接让用户填验证码，除非用户明确说验证码已经收到。
- 如果用户要手动测试，启动 CLI 交互即可，不要替用户猜测短信验证码。
- 如果用户提供了全部字段和验证码，优先用参数方式执行 `register-tenant`，便于复现和日志排查。
- 如果用户未提供密码或验证码，使用交互方式，避免把敏感值写进命令历史。
- `--json` 适合脚本、自动化和测试断言；人工测试默认普通输出即可。
- 注册接口成功返回完整租户信息，不要在最终答复里暴露返回体中的 `password` 字段。

## 常见问题

- 验证码未收到：重新运行 `crm auth register-sms --phone-number <手机号>`，确认手机号无误。
- 验证码过期或错误：重新发送验证码，再用新验证码注册。
- 接口环境不对：检查 `crm config get api_url` 或使用 `crm --profile <name> ...`。
- 注册成功后需要登录：执行 `crm auth login --username <手机号或邮箱> --password <密码>`。
