"use strict";
/**
 * Device authorization commands
 *
 * Implements OAuth 2.0 Device Authorization Grant (RFC 8628)
 * https://tools.ietf.org/html/rfc8628
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceLoginCommand = deviceLoginCommand;
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const config_manager_1 = require("../../core/config/config-manager");
const auth_manager_1 = require("../../core/auth/auth-manager");
const error_handler_1 = require("../../core/errors/error-handler");
/**
 * Device login command
 */
function deviceLoginCommand(auth) {
    auth
        .command('device')
        .description('Login using device authorization flow')
        .option('--json', 'Output in JSON format')
        .option('--profile <profile>', 'Profile to use (default: default)', 'default')
        .addHelpText('after', `
Flow:
  1) Request code: POST /api/auth/device/code
  2) Open AUTH_URL in browser and click "Authorize"
  3) CLI polls token: POST /api/auth/device/token?deviceCode=<device_code>
  4) Save token locally, then verify with: crm auth whoami --json

Important:
  - device_code is for polling token
  - user_code/code in the URL is for browser authorization page
  - Authorization link expires in 5 minutes

Common errors:
  - authorization_pending: User has not clicked authorize yet
  - expired_token: Link/code expired; run 'crm auth device' again
  - AUTH_401_EXPIRED (whoami): local token expired; login again

Examples:
  crm auth device
  crm auth device --json
  crm auth device --profile prod
  crm auth whoami --json
`)
        .action(async (options) => {
        try {
            await handleDeviceLogin(options);
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({
                    error: 'DEVICE_LOGIN_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }));
            }
            else {
                error_handler_1.errorHandler.handle(error);
            }
            process.exit(1);
        }
    });
}
/**
 * Handle device login flow
 */
async function handleDeviceLogin(options) {
    const config = await config_manager_1.configManager.load();
    const profile = config.profiles[options.profile];
    if (!profile) {
        throw new Error(`Profile "${options.profile}" not found. Run "crm config init" first.`);
    }
    const apiUrl = profile.api_url || 'https://app.otd-odincloud.com';
    // Step 1: Request device code
    const deviceCodeData = await requestDeviceCode(apiUrl);
    // Step 2: Display authorization URL
    if (options.json) {
        // JSON output for AI agents
        console.log(JSON.stringify(deviceCodeData, null, 2));
    }
    else {
        // Human-friendly output
        displayAuthorizationInstructions(deviceCodeData);
    }
    // Step 3: Poll for token
    const tokenData = await pollForToken(apiUrl, deviceCodeData.device_code, deviceCodeData.interval, deviceCodeData.expires_in, options.json);
    // Step 4: Save token
    await auth_manager_1.authManager.setToken(options.profile, tokenData.access_token);
    // Step 5: Display success message
    if (options.json) {
        console.log(JSON.stringify({
            success: true,
            user_id: tokenData.user_id,
            user_name: tokenData.user_name,
            expires_in: tokenData.expires_in,
        }));
    }
    else {
        console.log('\n✅ Authorization successful!');
        console.log(`User: ${tokenData.user_name}`);
        console.log(`CRM User ID: ${tokenData.user_id}`);
        console.log(`Token expires in: ${Math.floor(tokenData.expires_in / 86400)} days`);
    }
}
/**
 * Request device code from server
 */
async function requestDeviceCode(apiUrl) {
    try {
        const response = await axios_1.default.post(`${apiUrl}/api/auth/device/code`, { client_id: 'crm-cli' }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.response) {
                throw new Error(axiosError.response.data?.message ||
                    axiosError.response.data?.error ||
                    `Server error: ${axiosError.response.status}`);
            }
            else if (axiosError.request) {
                throw new Error('No response from server. Please check your network connection.');
            }
        }
        throw error;
    }
}
/**
 * Display authorization instructions to user
 */
function displayAuthorizationInstructions(data) {
    const authUrl = data.verification_uri_complete || `${data.verification_uri}?code=${encodeURIComponent(data.device_code)}`;
    const userCode = data.user_code || data.device_code;
    console.log('\n🔐 Device Authorization\n');
    console.log('Opening authorization page in browser...\n');
    console.log(`  ${authUrl}\n`);
    // Machine-friendly single-line output for copy/paste or grep in noisy terminals
    console.log(`AUTH_URL=${authUrl}`);
    console.log(`User Code: ${userCode}`);
    console.log(`Expires in: ${Math.floor(data.expires_in / 60)} minutes\n`);
    // Auto-open browser (cross-platform)
    // Use spawn with direct args to avoid shell quoting/% expansion issues
    try {
        const platform = process.platform;
        let cmd;
        let args;
        if (platform === 'darwin') {
            cmd = 'open';
            args = [authUrl];
        }
        else if (platform === 'win32') {
            // rundll32 passes URL directly without shell interpretation
            cmd = 'rundll32';
            args = ['url.dll,FileProtocolHandler', authUrl];
        }
        else {
            cmd = 'xdg-open';
            args = [authUrl];
        }
        (0, child_process_1.spawn)(cmd, args, { detached: true, stdio: 'ignore' }).unref();
    }
    catch (error) {
        // If auto-open fails, user can still copy the URL
        console.log('⚠️  Browser auto-open failed. Please copy the URL above manually.\n');
    }
    console.log('Waiting for authorization...');
}
/**
 * Poll for access token
 *
 * Uses 1-second polling interval for faster response (instead of server's 5s).
 * Handles 'slow_down' error by backing off when requested.
 */
async function pollForToken(apiUrl, deviceCode, _serverInterval, expiresIn, jsonMode) {
    // Use 1-second interval for faster response (user clicks authorize -> CLI knows in 1s)
    const pollInterval = 1;
    const maxAttempts = Math.ceil(expiresIn / pollInterval);
    let attempt = 0;
    let backoffUntil = 0; // Track when we can resume polling after slow_down
    while (attempt < maxAttempts) {
        attempt++;
        // Check if we're in backoff period
        if (Date.now() < backoffUntil) {
            const remainingBackoff = Math.ceil((backoffUntil - Date.now()) / 1000);
            if (!jsonMode) {
                process.stdout.write(`[waiting ${remainingBackoff}s...]`);
            }
            await sleep(1000);
            continue;
        }
        // Wait before polling
        await sleep(pollInterval * 1000);
        try {
            const response = await axios_1.default.post(`${apiUrl}/api/auth/device/token?deviceCode=${encodeURIComponent(deviceCode)}`, {}, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            // Check if authorization is complete
            // Support both OAuth standard (access_token) and BasicManagement (Token)
            if (response.data.access_token || response.data.token) {
                return {
                    access_token: response.data.access_token || response.data.token,
                    user_id: response.data.user_id || (response.data.id ? String(response.data.id) : undefined),
                    user_name: response.data.user_name || response.data.userName || response.data.UserName,
                    expires_in: response.data.expires_in,
                };
            }
            // Check for errors
            if (response.data.error) {
                if (response.data.error === 'authorization_pending') {
                    // Still waiting, show progress
                    if (!jsonMode) {
                        process.stdout.write('.');
                    }
                    continue;
                }
                if (response.data.error === 'slow_down') {
                    // Server asks us to slow down - back off for the requested interval
                    const backoffSeconds = response.data.interval || 5;
                    backoffUntil = Date.now() + (backoffSeconds * 1000);
                    if (!jsonMode) {
                        process.stdout.write(`[slow down: waiting ${backoffSeconds}s]`);
                    }
                    continue;
                }
                if (response.data.error === 'expired_token') {
                    throw new Error('Authorization expired. Please try again.');
                }
                throw new Error(response.data.message || response.data.error);
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                const err = axiosError.response?.data?.error;
                const errCode = typeof err === 'string' ? err : err?.message || err?.code;
                if (errCode === 'authorization_pending') {
                    // Still waiting
                    if (!jsonMode) {
                        process.stdout.write('.');
                    }
                    continue;
                }
                if (errCode === 'slow_down') {
                    const backoffSeconds = axiosError.response?.data?.interval || 5;
                    backoffUntil = Date.now() + (backoffSeconds * 1000);
                    if (!jsonMode) {
                        process.stdout.write(`[slow down: waiting ${backoffSeconds}s]`);
                    }
                    continue;
                }
                if (errCode === 'expired_token') {
                    throw new Error('Authorization expired. Please try again.');
                }
            }
            throw error;
        }
    }
    throw new Error('Authorization timeout. Please try again.');
}
/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=device.js.map