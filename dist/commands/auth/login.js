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
const axios_1 = __importDefault(require("axios"));
const auth_manager_1 = require("../../core/auth/auth-manager");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const config_manager_1 = require("../../core/config/config-manager");
const zod_1 = require("zod");
/**
 * Parse an ABP response that may come back as text/plain containing JSON.
 * Handles double-encoded strings (JSON string inside JSON string).
 */
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
        .option('--tenant-id <id>', 'Skip tenant discovery and use this tenant ID directly (use "" for single-tenant deployments)')
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

  # Local/on-premise single-tenant deployment (skip tenant discovery, no __tenant header)
  $ crm auth login --tenant-id ""

  # Local deployment with a known fixed tenant ID (skip tenant discovery)
  $ crm auth login --tenant-id "3a1234ab-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

Notes:
  - Credentials are stored securely in ~/.crm/credentials.json
  - Default profile is "default" (use --profile to switch)
  - Token is automatically used for subsequent commands
  - Cloud deployments: two-step authentication (tenant discovery + login)
  - Local/on-premise deployments: configure tenant_id in profile to skip discovery
      crm config set tenant_id ""                       # single-tenant, no header
      crm config set tenant_id "3a1234ab-xxxx-..."      # fixed tenant
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
            // Use raw axios (no CRMClient interceptors) to control __tenant header precisely.
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            const apiUrl = profileConfig.api_url.replace(/\/$/, '');
            const commonHeaders = { Accept: 'text/plain', 'Content-Type': 'application/json' };
            // --- Determine tenant ID (three-tier resolution) ---
            //
            // Priority 1: --tenant-id CLI flag (explicit override, even empty string)
            // Priority 2: tenant_id already in profile config (set via `crm config set tenant_id`)
            // Priority 3: Run tenant discovery via /api/Tenants/getTenantsByLogin
            //
            // tenant_id === ""  → single-tenant mode: login without __tenant header
            // tenant_id !== ""  → send __tenant: <id> header
            let tenantId;
            let tenantName;
            let skipDiscovery = false;
            if (options.tenantId !== undefined) {
                // --tenant-id was explicitly passed (including --tenant-id "")
                tenantId = options.tenantId;
                skipDiscovery = true;
            }
            else if (profileConfig.tenant_id !== undefined && profileConfig.tenant_id !== null) {
                // Profile has a pre-configured tenant_id (set via `crm config set tenant_id`)
                tenantId = profileConfig.tenant_id;
                tenantName = profileConfig.tenant_name;
                skipDiscovery = true;
            }
            if (skipDiscovery) {
                if (!globalOpts.json) {
                    if (tenantId) {
                        console.log(`   Using tenant: ${tenantName || tenantId}`);
                    }
                    else {
                        console.log('   Single-tenant mode (no tenant header)');
                    }
                    console.log('   Authenticating...');
                }
            }
            else {
                // Step 1: Discover tenant ID from credentials
                if (!globalOpts.json) {
                    console.log('   Getting tenant information...');
                }
                const tenantRaw = await axios_1.default.post(`${apiUrl}/api/Tenants/getTenantsByLogin`, { emailPhoneNumber: username, password }, { headers: commonHeaders, transformResponse: [(d) => parseAbpResponse(d)] });
                const tenants = zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() })).parse(tenantRaw.data);
                if (tenants.length === 0) {
                    throw new Error('No tenant found for this account');
                }
                tenantId = tenants[0].id;
                tenantName = tenants[0].name;
                if (!globalOpts.json) {
                    console.log(`   Tenant: ${tenantName}`);
                    console.log('   Authenticating...');
                }
            }
            // Step 2: Login — send __tenant header only when tenant ID is non-empty
            const loginHeaders = { ...commonHeaders };
            if (tenantId) {
                loginHeaders['__tenant'] = tenantId;
            }
            const loginRaw = await axios_1.default.post(`${apiUrl}/api/app/account/login`, { name: username, password }, {
                headers: loginHeaders,
                transformResponse: [(d) => parseAbpResponse(d)],
            });
            // Validate response
            const validated = LoginResponseSchema.parse(loginRaw.data);
            const { id, userName, name: realName, token, roles } = validated;
            // Store token
            await auth_manager_1.authManager.setToken(profile, token);
            // Store user info in config
            await config_manager_1.configManager.set('user_id', id, profile);
            await config_manager_1.configManager.set('username', userName, profile);
            await config_manager_1.configManager.set('tenant_id', tenantId ?? '', profile);
            if (tenantName) {
                await config_manager_1.configManager.set('tenant_name', tenantName, profile);
            }
            // Always overwrite user_name so stale values from a previous user are cleared
            await config_manager_1.configManager.set('user_name', realName || userName, profile);
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
                    tenant_id: tenantId ?? '',
                    tenant_name: tenantName,
                    roles,
                }, null, 2));
            }
            else {
                formatter_1.formatter.success('Logged in successfully!');
                console.log(`\nProfile: ${profile}`);
                if (tenantName)
                    console.log(`Tenant: ${tenantName}`);
                else if (!tenantId)
                    console.log('Tenant: (single-tenant)');
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