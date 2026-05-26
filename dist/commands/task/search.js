"use strict";
/**
 * TMS task search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
function searchCommand(task) {
    task
        .command('search')
        .description('Search task items')
        .option('-k, --keyword <keyword>', 'Fuzzy search keyword')
        .option('--title <title>', 'Task title')
        .option('--status <status>', 'Task status')
        .option('--priority <priority>', 'Task priority')
        .option('--responsible-user-id <id>', 'Responsible user ID')
        .option('--check-user-id <id>', 'Check user ID')
        .option('--parent-task-id <id>', 'Parent task ID')
        .option('--related-id <id>', 'Related resource ID')
        .option('--related-type <type>', 'Related resource type')
        .option('--task-custom-type-id <id>', 'Custom task type ID')
        .option('--tag-id <id>', 'Filter by a single tag ID')
        .option('--plan-start-after <date>', 'Plan start date >= (YYYY-MM-DD)')
        .option('--plan-start-before <date>', 'Plan start date <= (YYYY-MM-DD)')
        .option('--plan-done-after <date>', 'Plan done date >= (YYYY-MM-DD)')
        .option('--plan-done-before <date>', 'Plan done date <= (YYYY-MM-DD)')
        .option('--overdue', 'Show only overdue tasks')
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const filter = {};
            if (options.keyword)
                filter.fuzzySearch = options.keyword;
            if (options.title)
                filter.title = options.title;
            if (options.status)
                filter.status = options.status;
            if (options.priority)
                filter.priority = options.priority;
            if (options.responsibleUserId)
                filter.responsibleUserId = options.responsibleUserId;
            if (options.checkUserId)
                filter.checkUserId = options.checkUserId;
            if (options.parentTaskId)
                filter.parentTaskId = options.parentTaskId;
            if (options.relatedId)
                filter.relatedId = options.relatedId;
            if (options.relatedType)
                filter.relatedType = options.relatedType;
            if (options.taskCustomTypeId)
                filter.taskCustomTypeId = options.taskCustomTypeId;
            if (options.tagId)
                filter.tagIds = [options.tagId];
            if (options.planStartAfter)
                filter.planStartDateStart = options.planStartAfter;
            if (options.planStartBefore)
                filter.planStartDateEnd = options.planStartBefore;
            if (options.planDoneAfter)
                filter.planDoneDateStart = options.planDoneAfter;
            if (options.planDoneBefore)
                filter.planDoneDateEnd = options.planDoneBefore;
            if (options.overdue)
                filter.isOverdue = true;
            const requestBody = {
                skipCount: (parseInt(options.page, 10) - 1) * parseInt(options.size, 10),
                maxResultCount: parseInt(options.size, 10),
                sorting: options.sorting,
                filter,
            };
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Request filter:');
                console.log(JSON.stringify(filter, null, 2));
            }
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/tms/taskItem/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = task_1.TaskListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.search',
                resource_type: 'task',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: globalOpts.fields?.split(',') || ['id', 'title', 'status', 'priority', 'responsibleUserName', 'planDoneDate'],
                    headers: {
                        id: 'ID',
                        title: 'Title',
                        status: 'Status',
                        priority: 'Priority',
                        responsibleUserName: 'Responsible',
                        planDoneDate: 'Due Date',
                    },
                });
                console.log(output);
                if (validated.totalCount > 0) {
                    console.log(`\nTotal: ${validated.totalCount} tasks`);
                    // Show overdue count if applicable
                    if (options.overdue) {
                        console.log(`⚠️  All shown tasks are overdue`);
                    }
                }
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message, hint: cliError.hint }, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.error(`${cliError.code}: ${cliError.message}`);
                if (cliError.hint)
                    formatter_1.formatter.info(`Hint: ${cliError.hint}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=search.js.map