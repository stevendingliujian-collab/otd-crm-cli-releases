"use strict";
/**
 * Customer commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerCommands = customerCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const assign_1 = require("./assign");
const help_1 = require("../../utils/help");
function customerCommands(program) {
    const customer = program
        .command('customer')
        .description('Customer management commands');
    (0, help_1.addCommandGroupHelp)(customer, {
        command: 'customer',
        resource: 'customer',
        searchExample: 'crm customer search --help',
        getExample: 'crm customer get --help',
    });
    (0, search_1.searchCommand)(customer);
    (0, get_1.getCommand)(customer);
    (0, create_1.createCommand)(customer);
    (0, update_1.updateCommand)(customer);
    (0, assign_1.assignCommand)(customer);
}
//# sourceMappingURL=index.js.map