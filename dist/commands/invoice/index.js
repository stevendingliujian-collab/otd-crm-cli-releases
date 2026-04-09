"use strict";
/**
 * Invoice commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceCommands = invoiceCommands;
const search_1 = require("./search");
const get_1 = require("./get");
function invoiceCommands(program) {
    const invoice = program
        .command('invoice')
        .description('Invoice management commands');
    (0, search_1.searchCommand)(invoice);
    (0, get_1.getCommand)(invoice);
}
//# sourceMappingURL=index.js.map