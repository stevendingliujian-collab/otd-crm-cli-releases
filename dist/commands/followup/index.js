"use strict";
/**
 * Followup commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.followupCommands = followupCommands;
const search_1 = require("./search");
const create_1 = require("./create");
const get_1 = require("./get");
const update_1 = require("./update");
function followupCommands(program) {
    const followup = program
        .command('followup')
        .description('Followup record management commands');
    (0, search_1.searchCommand)(followup);
    (0, get_1.getCommand)(followup);
    (0, create_1.createCommand)(followup);
    (0, update_1.updateFollowupCommand)(followup);
}
//# sourceMappingURL=index.js.map