"use strict";
/**
 * Tenant self-register commands
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantRegisterCommands = tenantRegisterCommands;
const inquirer_1 = __importDefault(require("inquirer"));
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const config_manager_1 = require("../../core/config/config-manager");
const error_handler_1 = require("../../core/errors/error-handler");
const formatter_1 = require("../../core/output/formatter");
function parseAbpResponse(data) {
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
const SmsCodeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
}).passthrough();
const TenantRegisterResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().nullable().optional(),
    adminId: zod_1.z.string().optional(),
    admin: zod_1.z.object({
        userName: zod_1.z.string().optional(),
        name: zod_1.z.string().nullable().optional(),
        surname: zod_1.z.string().nullable().optional(),
        email: zod_1.z.string().nullable().optional(),
        phoneNumber: zod_1.z.string().nullable().optional(),
    }).passthrough().nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
    creationTime: zod_1.z.string().optional(),
}).passthrough();
function validateRequired(value, label) {
    if (!value || value.trim().length === 0) {
        return `${label} is required`;
    }
    return true;
}
function validateEmail(value) {
    if (!value || value.trim().length === 0) {
        return true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email format is invalid';
    }
    return true;
}
function normalizeOptionalEmail(value) {
    if (!value) {
        return undefined;
    }
    const normalized = value.trim();
    if (!normalized || normalized === '无' || normalized.toLowerCase() === 'null') {
        return undefined;
    }
    return normalized;
}
function getCommonHeaders() {
    return {
        Accept: 'text/plain',
        'Content-Type': 'application/json',
    };
}
function tenantRegisterCommands(auth) {
    auth
        .command('register-sms')
        .description('Send SMS code for tenant self-registration')
        .option('--phone-number <phoneNumber>', 'Phone number to receive SMS code')
        .addHelpText('after', `
Examples:
  $ crm auth register-sms --phone-number 13800000000
  $ crm --profile staging auth register-sms --phone-number 13800000000 --json
`)
        .action(async (options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            let { phoneNumber } = options;
            if (!phoneNumber) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'phoneNumber',
                        message: 'Phone number:',
                        validate: (input) => validateRequired(input, 'Phone number'),
                    },
                ]);
                phoneNumber = answers.phoneNumber;
            }
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            const apiUrl = profileConfig.api_url.replace(/\/$/, '');
            const response = await axios_1.default.post(`${apiUrl}/api/tenant/selfRegister/getSmsCode`, { phoneNumber }, {
                headers: getCommonHeaders(),
                timeout: profileConfig.timeout,
                transformResponse: [(data) => parseAbpResponse(data)],
            });
            const validated = SmsCodeResponseSchema.parse(response.data);
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                formatter_1.formatter.success('SMS code sent successfully!');
                console.log(`Phone number: ${phoneNumber}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Send SMS code failed: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\nHint: ${cliError.hint}`);
                }
            }
            process.exit(1);
        }
    });
    auth
        .command('register-tenant')
        .description('Register a tenant with SMS verification code')
        .option('--tenant-name <tenantName>', 'Company or tenant name')
        .option('--admin-name <adminName>', 'Administrator display name')
        .option('--phone-number <phoneNumber>', 'Administrator phone number')
        .option('--email <email>', 'Administrator email')
        .option('--password <password>', 'Administrator login password')
        .option('--sms-code <smsCode>', 'SMS verification code')
        .addHelpText('after', `
Examples:
  $ crm auth register-tenant
  $ crm auth register-tenant --tenant-name "OTD Demo" --admin-name "Admin" --phone-number 13800000000 --email admin@example.com --password secret123 --sms-code 123456
  $ crm --profile staging auth register-tenant --json
`)
        .action(async (options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            let { tenantName, adminName, phoneNumber, email, password, smsCode, } = options;
            if (!tenantName || !adminName || !phoneNumber || !email || !password || !smsCode) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'tenantName',
                        message: 'Company name:',
                        when: !tenantName,
                        validate: (input) => validateRequired(input, 'Company name'),
                    },
                    {
                        type: 'input',
                        name: 'adminName',
                        message: 'Admin name:',
                        when: !adminName,
                        validate: (input) => validateRequired(input, 'Admin name'),
                    },
                    {
                        type: 'input',
                        name: 'phoneNumber',
                        message: 'Phone number:',
                        when: !phoneNumber,
                        validate: (input) => validateRequired(input, 'Phone number'),
                    },
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Email:',
                        when: !email,
                        validate: validateEmail,
                    },
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Password:',
                        mask: '*',
                        when: !password,
                        validate: (input) => validateRequired(input, 'Password'),
                    },
                    {
                        type: 'input',
                        name: 'smsCode',
                        message: 'SMS code:',
                        when: !smsCode,
                        validate: (input) => validateRequired(input, 'SMS code'),
                    },
                ]);
                tenantName = tenantName || answers.tenantName;
                adminName = adminName || answers.adminName;
                phoneNumber = phoneNumber || answers.phoneNumber;
                email = email || answers.email;
                password = password || answers.password;
                smsCode = smsCode || answers.smsCode;
            }
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            const apiUrl = profileConfig.api_url.replace(/\/$/, '');
            const normalizedEmail = normalizeOptionalEmail(email);
            const body = {
                tenantName,
                adminName,
                phoneNumber,
                password,
                smsCode,
                ...(normalizedEmail ? { email: normalizedEmail } : {}),
            };
            const response = await axios_1.default.post(`${apiUrl}/api/tenant/selfRegister/register`, body, {
                headers: getCommonHeaders(),
                timeout: profileConfig.timeout,
                transformResponse: [(data) => parseAbpResponse(data)],
            });
            const validated = TenantRegisterResponseSchema.parse(response.data);
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                formatter_1.formatter.success('Tenant registered successfully!');
                console.log(`\nTenant ID: ${validated.id}`);
                console.log(`Tenant: ${validated.name || '(unnamed)'}`);
                console.log(`Package: ${validated.packageName || validated.packageCode || 'N/A'}`);
                console.log(`User Count: ${validated.userCount ?? 0}`);
                console.log(`Customer Limit: ${validated.limitCustomerCount ?? 0}`);
                console.log(`User Limit: ${validated.limitUserCount ?? 0}`);
                console.log(`AI Remaining: ${validated.monthlyAiRemainingCount ?? 0}`);
                console.log(`Storage GB: ${validated.storageGb ?? 0}`);
                console.log(`Can Self Renew: ${validated.canSelfRenew ? 'Yes' : 'No'}`);
                console.log(`Active: ${validated.isActive ? 'Yes' : 'No'}`);
                console.log(`Created At: ${validated.creationTime || 'N/A'}`);
                console.log(`Activation End: ${validated.activationEndDate || 'N/A'}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Tenant registration failed: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\nHint: ${cliError.hint}`);
                }
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=register.js.map