"use strict";
/**
 * Invoice commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceCommands = invoiceCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
function invoiceCommands(program) {
    const invoice = program
        .command('invoice')
        .description('Invoice management commands');
    (0, search_1.searchCommand)(invoice);
    (0, get_1.getCommand)(invoice);
    (0, create_1.createCommand)(invoice);
    (0, update_1.updateCommand)(invoice);
}
//# sourceMappingURL=index.js.map