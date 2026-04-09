"use strict";
/**
 * Clue commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clueCommands = clueCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const convert_1 = require("./convert");
const create_1 = require("./create");
const update_1 = require("./update");
function clueCommands(program) {
    const clue = program
        .command('clue')
        .description('Clue (lead) management commands');
    (0, search_1.searchCommand)(clue);
    (0, get_1.getCommand)(clue);
    (0, convert_1.convertCommand)(clue);
    (0, create_1.createCommand)(clue);
    (0, update_1.updateCommand)(clue);
}
//# sourceMappingURL=index.js.map