"use strict";
/**
 * Task search command
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
        .description('Search tasks')
        .option('-k, --keyword <keyword>', 'Search keyword (task title)')
        .option('--status <status>', 'Task status (pending, started, done, checked, rejected, stopped, canceled, active, all)', 'all')
        .option('--assignee <assignee>', 'Assignee name')
        .option('--priority <priority>', 'Task priority (low, normal, high, urgent)')
        // Due date filters (P1 priority)
        .option('--due-after <date>', 'Due date >= (YYYY-MM-DD)')
        .option('--due-before <date>', 'Due date <= (YYYY-MM-DD)')
        .option('--overdue', 'Show only overdue tasks (due date < today)')
        // Creation time filters
        .option('--created-after <date>', 'Created time >= (YYYY-MM-DD)')
        .option('--created-before <date>', 'Created time <= (YYYY-MM-DD)')
        // Pagination
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build filter object (lowercase for old API format)
            const filter = {};
            // Keyword filter
            if (options.keyword) {
                filter.likeString = options.keyword;
            }
            // Status filter
            if (options.status && options.status !== 'all') {
                filter.status = options.status;
            }
            // Assignee filter
            if (options.assignee) {
                filter.assignee = options.assignee;
            }
            // Priority filter
            if (options.priority) {
                filter.priority = options.priority;
            }
            // Due date filters
            if (options.dueAfter) {
                filter.planDoneDateFrom = options.dueAfter;
            }
            if (options.dueBefore) {
                filter.planDoneDateTo = options.dueBefore;
            }
            // Overdue filter (due date < today)
            if (options.overdue) {
                const today = new Date().toISOString().split('T')[0];
                filter.planDoneDateTo = today;
                // Also filter out completed/checked tasks
                if (!options.status || options.status === 'all') {
                    filter.status = 'active'; // active = pending + started
                }
            }
            // Creation time filters
            if (options.createdAfter) {
                filter.creationTimeStart = new Date(options.createdAfter).toISOString();
            }
            if (options.createdBefore) {
                filter.creationTimeEnd = new Date(options.createdBefore + 'T23:59:59').toISOString();
            }
            // Build request body (Task uses old pageIndex/pageSize format)
            const requestBody = {
                pageIndex: parseInt(options.page, 10),
                pageSize: parseInt(options.size, 10),
                filter,
            };
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Request filter:');
                console.log(JSON.stringify(filter, null, 2));
            }
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/task/getList', requestBody, {
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
                    fields: globalOpts.fields?.split(',') || [
                        'id',
                        'title',
                        'statusName',
                        'priorityName',
                        'assignee',
                        'planDoneDate',
                    ],
                    headers: {
                        id: 'ID',
                        title: 'Title',
                        statusName: 'Status',
                        priorityName: 'Priority',
                        assignee: 'Assignee',
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
                console.error(JSON.stringify({
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                        trace_id: traceId,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                }
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=search.js.map