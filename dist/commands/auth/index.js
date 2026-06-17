"use strict";
/**
 * Auth commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCommands = authCommands;
const login_1 = require("./login");
const logout_1 = require("./logout");
const whoami_1 = require("./whoami");
const device_1 = require("./device");
const register_1 = require("./register");
function authCommands(program) {
    const auth = program
        .command('auth')
        .description('Authentication commands')
        .addHelpText('after', `
How to choose a subcommand:
  - Use login/device to authenticate before CRM data commands.
  - Use whoami to verify the active profile and tenant.
  - Use logout to clear saved credentials.

Where to find optional parameters:
  - This page lists only auth subcommands.
  - Run 'crm auth <subcommand> --help' before using optional parameters.
`);
    (0, login_1.loginCommand)(auth);
    (0, logout_1.logoutCommand)(auth);
    (0, whoami_1.whoamiCommand)(auth);
    (0, device_1.deviceLoginCommand)(auth);
    (0, register_1.tenantRegisterCommands)(auth);
}
//# sourceMappingURL=index.js.map