"use strict";
/**
 * Receivable (应收款) commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivableCommands = receivableCommands;
const search_1 = require("./search");
const help_1 = require("../../utils/help");
function receivableCommands(program) {
    const receivable = program
        .command('receivable')
        .description('Receivable (应收款项) management commands');
    (0, help_1.addCommandGroupHelp)(receivable, {
        command: 'receivable',
        resource: 'receivable item',
        searchExample: 'crm receivable search --help',
        getExample: 'crm receivable search --help',
        extraNotes: ['This command group currently has search only; use returned receivable IDs with receive/invoice commands where documented.'],
    });
    (0, search_1.searchCommand)(receivable);
}
//# sourceMappingURL=index.js.map