"use strict";
/**
 * Receivable (应收款) commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivableCommands = receivableCommands;
const search_1 = require("./search");
function receivableCommands(program) {
    const receivable = program
        .command('receivable')
        .description('Receivable (应收款项) management commands');
    (0, search_1.searchCommand)(receivable);
}
//# sourceMappingURL=index.js.map