"use strict";
/**
 * Auth logout command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutCommand = logoutCommand;
const auth_manager_1 = require("../../core/auth/auth-manager");
const formatter_1 = require("../../core/output/formatter");
function logoutCommand(auth) {
    auth
        .command('logout')
        .description('Logout from CRM')
        .action(async (_options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Delete token
            await auth_manager_1.authManager.deleteToken(profile);
            if (globalOpts.json) {
                console.log(JSON.stringify({
                    success: true,
                    profile,
                }, null, 2));
            }
            else {
                formatter_1.formatter.success('Logged out successfully');
                console.log(`Profile: ${profile}`);
            }
        }
        catch (error) {
            formatter_1.formatter.error(`Logout failed: ${error.message}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=logout.js.map