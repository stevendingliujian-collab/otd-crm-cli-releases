"use strict";
/**
 * Task commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTaskCommands = registerTaskCommands;
const search_1 = require("./search");
const get_1 = require("./get");
const create_1 = require("./create");
const update_1 = require("./update");
const assign_1 = require("./assign");
const statuses_1 = require("./statuses");
const comment_1 = require("./comment");
function registerTaskCommands(program) {
    const task = program
        .command('task')
        .description('Task management commands');
    (0, search_1.searchCommand)(task);
    (0, get_1.getCommand)(task);
    (0, create_1.createCommand)(task);
    (0, update_1.updateCommand)(task);
    (0, assign_1.assignCommand)(task);
    (0, statuses_1.statusesCommand)(task);
    (0, comment_1.commentCommand)(task);
}
//# sourceMappingURL=index.js.map