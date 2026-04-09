"use strict";
/**
 * Auth whoami command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoamiCommand = whoamiCommand;
const auth_manager_1 = require("../../core/auth/auth-manager");
const config_manager_1 = require("../../core/config/config-manager");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
function whoamiCommand(auth) {
    auth
        .command('whoami')
        .description('Show current user and authentication status')
        .addHelpText('after', `
Examples:
  # Show current user info
  $ crm auth whoami
  
  # Show info for a specific profile
  $ crm auth whoami --profile staging
  
  # Output as JSON
  $ crm auth whoami --json

Notes:
  - Displays current login user, profile, and token expiration
  - Automatically validates token expiration
  - Shows API URL configuration
  - Use --profile to check different profile credentials
  - Returns error if not logged in
`)
        .action(async (_options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Get token
            const token = await auth_manager_1.authManager.getValidToken(profile);
            const payload = auth_manager_1.authManager.decodeToken(token);
            // Get profile config
            const profileConfig = await config_manager_1.configManager.getProfileConfig(profile);
            // Get stored user info from config
            const userId = await config_manager_1.configManager.get('user_id', profile);
            const username = await config_manager_1.configManager.get('username', profile);
            const userName = await config_manager_1.configManager.get('user_name', profile);
            const expiresAt = new Date(payload.exp * 1000).toISOString();
            const now = Date.now();
            const timeLeft = payload.exp * 1000 - now;
            const daysLeft = Math.floor(timeLeft / 86400000);
            if (globalOpts.json) {
                console.log(JSON.stringify({
                    profile,
                    user_id: userId || payload.user_id,
                    username: username || 'unknown',
                    user_name: userName,
                    api_url: profileConfig.api_url,
                    token_expires_at: expiresAt,
                    days_left: daysLeft,
                }, null, 2));
            }
            else {
                console.log(`Profile: ${profile}`);
                console.log(`User: ${userName || username || userId || payload.user_id}`);
                console.log(`User ID: ${userId || payload.user_id}`);
                console.log(`API URL: ${profileConfig.api_url}`);
                console.log(`Token expires: ${expiresAt}`);
                if (daysLeft > 0) {
                    console.log(`Time remaining: ${daysLeft} days`);
                }
                else {
                    console.log(`⚠️  Token expired ${-daysLeft} days ago`);
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
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                }
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=whoami.js.map