"use strict";
/**
 * Receive commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveCommands = receiveCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
function receiveCommands(program) {
    const receive = program
        .command('receive')
        .description('Receive (payment) management commands');
    (0, search_1.searchCommand)(receive);
    (0, get_1.getCommand)(receive);
    (0, create_1.createCommand)(receive);
}
//# sourceMappingURL=index.js.map