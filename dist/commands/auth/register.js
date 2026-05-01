"use strict";
/**
 * Register command — full self-registration flow
 * 1. Collect tenant + admin info
 * 2. Auto-send SMS verification code
 * 3. User inputs code
 * 4. Register tenant
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommand = registerCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const axios_1 = __importDefault(require("axios"));
const formatter_1 = require("../../core/output/formatter");
const config_manager_1 = require("../../core/config/config-manager");
const zod_1 = require("zod");
const RegisterResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tenantId: zod_1.z.string(),
    name: zod_1.z.string(),
    adminId: zod_1.z.string(),
    adminName: zod_1.z.string(),
    adminPhoneNumber: zod_1.z.string(),
    limitUserCount: zod_1.z.number(),
    password: zod_1.z.string(),
});
/**
 * Parse ABP response (text/plain JSON, possibly double-encoded)
 */
function parseAbp(data) {
    if (typeof data === 'string') {
        if (data.length === 0)
            return null;
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'string') {
                try {
                    return JSON.parse(parsed);
                }
                catch {
                    return parsed;
                }
            }
            return parsed;
        }
        catch {
            return data;
        }
    }
    return data;
}
const axiosConfig = {
    headers: { 'Accept': 'text/plain', 'Content-Type': 'application/json' },
    transformResponse: [(d) => parseAbp(d)],
};
function registerCommand(auth) {
    auth
        .command('register')
        .description('Register a new tenant (sends SMS code, then creates account)')
        .option('--tenant-name <name>', 'Tenant name')
        .option('--admin-name <name>', 'Admin name')
        .option('--phone <phone>', 'Admin phone number')
        .option('--email <email>', 'Admin email (optional)')
        .option('--password <password>', 'Admin password')
        .option('--sms-code <code>', 'SMS verification code (skip auto-send if provided)')
        .option('--aff-code <code>', 'Affiliate code (optional)')
        .option('--profile <profile>', 'Profile name (default: "default")')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Interactive mode (recommended)
  $ crm auth register

  # Non-interactive: provide all info + SMS code
  $ crm auth register \\
      --tenant-name "My Company" \\
      --admin-name "张三" \\
      --phone 13800138000 \\
      --password "MyPassword123" \\
      --sms-code 123456

  # Non-interactive: auto-send SMS, then provide code
  $ crm auth register --tenant-name "My Company" --admin-name "张三" \\
      --phone 13800138000 --password "MyPassword123"

Notes:
  - Interactive mode: auto-sends SMS after you enter phone number
  - Non-interactive with --sms-code: skips SMS sending
  - Non-interactive without --sms-code: auto-sends, then waits for code input
  - SMS code valid for 5 minutes, 60s cooldown between sends
  - After registration, use 'crm auth login' to sign in
`)
        .action(async (options, command) => {
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = options.profile || globalOpts.profile || 'default';
            const isJson = globalOpts.json || options.json;
            // Get API URL
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            const apiUrl = profileConfig.api_url.replace(/\/$/, '');
            // --- Collect info ---
            let { tenantName, adminName, phone, email, password, smsCode, affCode } = options;
            // If all required CLI args provided, skip interactive prompts
            const allProvided = tenantName && adminName && phone && password;
            if (!allProvided) {
                // Interactive mode
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'tenantName',
                        message: 'Tenant name:',
                        when: !tenantName,
                        validate: (i) => i.trim() ? true : 'Required',
                    },
                    {
                        type: 'input',
                        name: 'adminName',
                        message: 'Admin name:',
                        when: !adminName,
                        validate: (i) => i.trim() ? true : 'Required',
                    },
                    {
                        type: 'input',
                        name: 'phone',
                        message: 'Phone number:',
                        when: !phone,
                        validate: (i) => {
                            if (!i.trim())
                                return 'Required';
                            if (!/^1[3-9]\d{9}$/.test(i.trim()))
                                return 'Invalid format (11 digits, starts with 13-19)';
                            return true;
                        },
                    },
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Email (optional):',
                        when: !email,
                    },
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Password:',
                        mask: '*',
                        when: !password,
                        validate: (i) => i.trim() ? true : 'Required',
                    },
                    {
                        type: 'input',
                        name: 'affCode',
                        message: 'Affiliate code (optional):',
                        when: !affCode,
                    },
                ]);
                tenantName = tenantName || answers.tenantName;
                adminName = adminName || answers.adminName;
                phone = phone || answers.phone;
                email = email || answers.email;
                password = password || answers.password;
                affCode = affCode || answers.affCode;
                // Auto-send SMS code
                if (!smsCode) {
                    if (!isJson)
                        console.log('\n📱 Sending SMS verification code...');
                    try {
                        const smsResp = await axios_1.default.post(`${apiUrl}/api/tenant/selfRegister/getSmsCode`, { phoneNumber: phone.trim() }, axiosConfig);
                        const smsData = smsResp.data;
                        if (smsData?.message && !smsData?.success && !isJson) {
                            // Some error responses come as 200 with message
                            const errMsg = smsData.message;
                            if (errMsg.includes('已存在')) {
                                throw new Error('手机号已存在，不允许注册');
                            }
                        }
                        if (!isJson) {
                            formatter_1.formatter.success('SMS code sent!');
                            console.log('Check your phone. Code expires in 5 minutes.\n');
                        }
                    }
                    catch (err) {
                        let msg = err.message || 'Failed to send SMS';
                        if (err.response?.data) {
                            const d = err.response.data;
                            msg = typeof d === 'string' ? (JSON.parse(d)?.message || d) : (d.message || msg);
                        }
                        if (msg.includes('过于频繁'))
                            msg += ' (Wait 60s and try again)';
                        if (msg.includes('已存在'))
                            msg += ' (Use login instead)';
                        if (isJson) {
                            console.error(JSON.stringify({ error: { code: 'SMS_FAILED', message: msg } }, null, 2));
                        }
                        else {
                            formatter_1.formatter.error(`SMS failed: ${msg}`);
                        }
                        process.exit(1);
                    }
                }
            }
            // --- Get SMS code ---
            if (!smsCode) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'smsCode',
                        message: 'SMS verification code:',
                        validate: (i) => i.trim() ? true : 'Required',
                    },
                ]);
                smsCode = answers.smsCode;
            }
            // --- Register ---
            if (!isJson)
                console.log('🚀 Registering tenant...');
            const body = {
                tenantName: tenantName.trim(),
                adminName: adminName.trim(),
                phoneNumber: phone.trim(),
                password: password,
                smsCode: smsCode.trim(),
            };
            if (email?.trim())
                body.email = email.trim();
            if (affCode?.trim())
                body.affCode = affCode.trim();
            const regResp = await axios_1.default.post(`${apiUrl}/api/tenant/selfRegister/register`, body, axiosConfig);
            const validated = RegisterResponseSchema.parse(regResp.data);
            // Save tenant info to profile
            await config_manager_1.configManager.set('tenant_id', validated.tenantId, profile);
            await config_manager_1.configManager.set('tenant_name', validated.name, profile);
            if (isJson) {
                console.log(JSON.stringify({
                    success: true,
                    tenantId: validated.tenantId,
                    tenantName: validated.name,
                    adminId: validated.adminId,
                    adminName: validated.adminName,
                    adminPhoneNumber: validated.adminPhoneNumber,
                    limitUserCount: validated.limitUserCount,
                }, null, 2));
            }
            else {
                formatter_1.formatter.success('Registered!');
                console.log(`\nTenant: ${validated.name} (${validated.tenantId})`);
                console.log(`Admin:  ${validated.adminName} (${validated.adminId})`);
                console.log(`Phone:  ${validated.adminPhoneNumber}`);
                console.log(`Users:  ${validated.limitUserCount} max`);
                console.log(`\nProfile "${profile}" saved. Next: crm auth login --username ${validated.adminPhoneNumber} --password <pwd>`);
            }
        }
        catch (error) {
            let message = 'Registration failed';
            let hint = '';
            if (error.response?.data) {
                const d = error.response.data;
                message = typeof d === 'string' ? (JSON.parse(d)?.message || d) : (d.message || message);
            }
            else if (error.message) {
                message = error.message;
            }
            if (message.includes('验证码') || message.includes('过期')) {
                hint = 'Code incorrect or expired. Run register again to resend.';
            }
            else if (message.includes('已存在')) {
                hint = 'Phone/email already registered. Use login instead.';
            }
            const isJson = command.optsWithGlobals()?.json || options.json;
            if (isJson) {
                console.error(JSON.stringify({ error: { code: 'REGISTER_FAILED', message, hint } }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Register failed: ${message}`);
                if (hint)
                    console.error(`\n💡 ${hint}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=register.js.map