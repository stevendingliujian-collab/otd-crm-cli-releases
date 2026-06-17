"use strict";
/**
 * Project commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectCommands = projectCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const delete_1 = require("./delete");
const stages_1 = require("./stages");
const companies_1 = require("./companies");
const help_1 = require("../../utils/help");
function projectCommands(program) {
    const project = program
        .command('project')
        .description('Project management commands (项目管理)')
        .alias('proj');
    (0, help_1.addCommandGroupHelp)(project, {
        command: 'project',
        resource: 'project',
        searchExample: 'crm project search --help',
        getExample: 'crm project get --help',
        extraNotes: ['Alias crm proj is equivalent to crm project.'],
    });
    (0, search_1.searchCommand)(project);
    (0, get_1.getCommand)(project);
    (0, create_1.createCommand)(project);
    (0, update_1.updateCommand)(project);
    (0, delete_1.deleteCommand)(project);
    (0, stages_1.stagesCommand)(project);
    (0, companies_1.companiesCommand)(project);
}
//# sourceMappingURL=index.js.map