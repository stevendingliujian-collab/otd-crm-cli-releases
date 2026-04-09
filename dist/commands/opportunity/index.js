"use strict";
/**
 * Opportunity commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityCommands = opportunityCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const assign_1 = require("./assign");
const stages_1 = require("./stages");
const stage_1 = require("./stage");
function opportunityCommands(program) {
    const opportunity = program
        .command('opportunity')
        .description('Opportunity management commands')
        .alias('opp');
    (0, search_1.searchCommand)(opportunity);
    (0, get_1.getCommand)(opportunity);
    (0, create_1.createCommand)(opportunity);
    (0, update_1.updateCommand)(opportunity);
    (0, assign_1.assignCommand)(opportunity);
    (0, stages_1.stagesCommand)(opportunity);
    (0, stage_1.stageCommand)(opportunity);
}
//# sourceMappingURL=index.js.map