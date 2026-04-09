"use strict";
/**
 * Auth login command
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const auth_manager_1 = require("../../core/auth/auth-manager");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const config_manager_1 = require("../../core/config/config-manager");
const zod_1 = require("zod");
const LoginResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userName: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    token: zod_1.z.string(),
    roles: zod_1.z.array(zod_1.z.string()).optional(),
});
function loginCommand(auth) {
    auth
        .command('login')
        .description('Login to CRM with username and password')
        .option('--username <username>', 'Username (email or phone number)')
        .option('--password <password>', 'Password')
        .addHelpText('after', `
Examples:
  # Interactive login (prompts for username and password)
  $ crm auth login
  
  # Login with command-line arguments
  $ crm auth login --username admin --password secret
  
  # Login to a specific profile
  $ crm auth login --profile staging --username admin --password secret
  
  # Login and output as JSON
  $ crm auth login --json

Notes:
  - Credentials are stored securely in ~/.crm/credentials.json
  - Default profile is "default" (use --profile to switch)
  - Token is automatically used for subsequent commands
  - Login uses two-step authentication (tenant discovery + login)
  - Use 'crm auth whoami' to verify current login status
  - Use 'crm auth logout' to clear credentials
`)
        .action(async (options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Prompt for credentials if not provided
            let { username, password } = options;
            if (!username || !password) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'username',
                        message: 'Username:',
                        when: !username,
                        validate: (input) => {
                            if (!input || input.trim().length === 0) {
                                return 'Username is required';
                            }
                            return true;
                        },
                    },
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Password:',
                        mask: '*',
                        when: !password,
                        validate: (input) => {
                            if (!input || input.trim().length === 0) {
                                return 'Password is required';
                            }
                            return true;
                        },
                    },
                ]);
                username = username || answers.username;
                password = password || answers.password;
            }
            // Show loading indicator
            if (!globalOpts.json) {
                console.log('🔐 Logging in...');
            }
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Get tenant ID by login credentials
            if (!globalOpts.json) {
                console.log('   Getting tenant information...');
            }
            const tenantResponse = await client.post('/api/Tenants/getTenantsByLogin', {
                emailPhoneNumber: username,
                password,
            });
            // Validate tenant response
            const tenants = zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
            })).parse(tenantResponse);
            if (tenants.length === 0) {
                throw new Error('No tenant found for this account');
            }
            const tenantId = tenants[0].id;
            const tenantName = tenants[0].name;
            if (!globalOpts.json) {
                console.log(`   Tenant: ${tenantName}`);
                console.log('   Authenticating...');
            }
            // Step 2: Login with tenant ID
            const response = await client.post('/api/app/account/login', {
                name: username,
                password,
            }, {
                headers: {
                    __tenant: tenantId,
                },
            });
            // Validate response
            const validated = LoginResponseSchema.parse(response);
            const { id, userName, name: realName, token, roles } = validated;
            // Store token
            await auth_manager_1.authManager.setToken(profile, token);
            // Store user info in config
            await config_manager_1.configManager.set('user_id', id, profile);
            await config_manager_1.configManager.set('username', userName, profile);
            await config_manager_1.configManager.set('tenant_id', tenantId, profile);
            await config_manager_1.configManager.set('tenant_name', tenantName, profile);
            if (realName) {
                await config_manager_1.configManager.set('user_name', realName, profile);
            }
            if (roles && roles.length > 0) {
                await config_manager_1.configManager.set('roles', roles.join(','), profile);
            }
            if (globalOpts.json) {
                console.log(JSON.stringify({
                    success: true,
                    profile,
                    user_id: id,
                    username: userName,
                    user_name: realName,
                    roles,
                }, null, 2));
            }
            else {
                formatter_1.formatter.success('Logged in successfully!');
                console.log(`\nProfile: ${profile}`);
                console.log(`Tenant: ${tenantName}`);
                console.log(`User: ${realName || userName}`);
                console.log(`User ID: ${id}`);
                if (roles && roles.length > 0) {
                    console.log(`Roles: ${roles.join(', ')}`);
                }
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
                formatter_1.formatter.error(`Login failed: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                }
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=login.js.map