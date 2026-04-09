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
function authCommands(program) {
    const auth = program
        .command('auth')
        .description('Authentication commands');
    (0, login_1.loginCommand)(auth);
    (0, logout_1.logoutCommand)(auth);
    (0, whoami_1.whoamiCommand)(auth);
    (0, device_1.deviceLoginCommand)(auth);
}
//# sourceMappingURL=index.js.map