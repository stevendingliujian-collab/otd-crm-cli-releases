"use strict";
/**
 * Contact commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactCommands = contactCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
function contactCommands(program) {
    const contact = program
        .command('contact')
        .description('Contact management commands');
    (0, search_1.searchCommand)(contact);
    (0, get_1.getCommand)(contact);
    (0, create_1.createCommand)(contact);
    (0, update_1.updateCommand)(contact);
}
//# sourceMappingURL=index.js.map