"use strict";
/**
 * Register SMS code command
 * POST /api/tenant/selfRegister/getSmsCode
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSmsCommand = registerSmsCommand;
const axios_1 = __importDefault(require("axios"));
const formatter_1 = require("../../core/output/formatter");
const config_manager_1 = require("../../core/config/config-manager");
const zod_1 = require("zod");
const SmsCodeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().optional(),
    message: zod_1.z.string().optional(),
    code: zod_1.z.number().optional(),
});
function registerSmsCommand(auth) {
    auth
        .command('register-sms')
        .description('Send SMS verification code for tenant self-registration')
        .option('--phone <phone>', 'Phone number to receive verification code')
        .option('--profile <profile>', 'Profile name (default: "default")')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Interactive mode
  $ crm auth register-sms

  # With command-line argument
  $ crm auth register-sms --phone 13800138000

  # Output as JSON
  $ crm auth register-sms --phone 13800138000 --json

Notes:
  - If the phone number is already registered, the request will be rejected
  - SMS codes are valid for 5 minutes
  - Cannot resend within 60 seconds
  - Use 'crm auth register' after receiving the code to complete registration
`)
        .action(async (options, command) => {
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = options.profile || globalOpts.profile || 'default';
            // Prompt for phone number if not provided
            let { phone } = options;
            if (!phone) {
                const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const answers = await inquirer.default.prompt([
                    {
                        type: 'input',
                        name: 'phone',
                        message: 'Phone number:',
                        validate: (input) => {
                            if (!input || input.trim().length === 0) {
                                return 'Phone number is required';
                            }
                            if (!/^1[3-9]\d{9}$/.test(input.trim())) {
                                return 'Invalid phone number format (must be 11 digits starting with 13-19)';
                            }
                            return true;
                        },
                    },
                ]);
                phone = answers.phone;
            }
            const phoneNumber = phone.trim();
            // Show loading indicator
            if (!globalOpts.json && !options.json) {
                console.log('📱 Sending SMS verification code...');
            }
            // Get API URL from profile config
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            const apiUrl = profileConfig.api_url.replace(/\/$/, '');
            const response = await axios_1.default.post(`${apiUrl}/api/tenant/selfRegister/getSmsCode`, { phoneNumber }, {
                headers: {
                    'Accept': 'text/plain',
                    'Content-Type': 'application/json',
                },
                transformResponse: [(d) => {
                        if (typeof d === 'string') {
                            if (d.length === 0)
                                return null;
                            try {
                                const parsed = JSON.parse(d);
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
                                return d;
                            }
                        }
                        return d;
                    }],
            });
            // Validate response
            const validated = SmsCodeResponseSchema.parse(response.data);
            if (globalOpts.json || options.json) {
                console.log(JSON.stringify({ success: true, message: validated.message || 'SMS code sent' }, null, 2));
            }
            else {
                formatter_1.formatter.success('SMS verification code sent successfully!');
                console.log('\nCheck your phone for the code.');
                console.log('Code expires in 5 minutes.');
            }
        }
        catch (error) {
            let message = 'Failed to send SMS code';
            let hint = '';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    try {
                        const parsed = JSON.parse(data);
                        message = parsed.message || message;
                    }
                    catch {
                        message = data;
                    }
                }
                else if (data.message) {
                    message = data.message;
                }
            }
            else if (error.message) {
                message = error.message;
            }
            if (message.includes('过于频繁')) {
                hint = 'Please wait 60 seconds before requesting a new code.';
            }
            else if (message.includes('已存在')) {
                hint = 'This phone number is already registered. Use login instead.';
            }
            if (globalOpts.json || options.json) {
                console.error(JSON.stringify({
                    error: {
                        code: 'REGISTER_SMS_FAILED',
                        message,
                        hint,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`SMS failed: ${message}`);
                if (hint) {
                    console.error(`\n💡 ${hint}`);
                }
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=register-sms.js.map