"use strict";
/**
 * Contract commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractCommands = contractCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const statuses_1 = require("./statuses");
function contractCommands(program) {
    const contract = program
        .command('contract')
        .description('Contract management commands');
    (0, search_1.searchCommand)(contract);
    (0, get_1.getCommand)(contract);
    (0, create_1.createCommand)(contract);
    (0, update_1.updateCommand)(contract);
    (0, statuses_1.statusesCommand)(contract);
}
//# sourceMappingURL=index.js.map