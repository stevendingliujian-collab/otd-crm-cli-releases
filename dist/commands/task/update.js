"use strict";
/**
 * Task update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
function updateCommand(task) {
    task
        .command('update')
        .description('Update an existing task')
        .argument('<id>', 'Task ID')
        .option('-t, --title <title>', 'Task title')
        .option('-d, --description <description>', 'Task description')
        .option('-a, --assignee-id <assigneeId>', 'Assignee user ID')
        .option('--priority <priority>', 'Task priority (number)')
        .option('--status <status>', 'Task status (number)')
        .option('--due-date <dueDate>', 'Due date (YYYY-MM-DD)')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const requestBody = {
                id,
            };
            if (options.title)
                requestBody.title = options.title;
            if (options.description)
                requestBody.description = options.description;
            if (options.assigneeId)
                requestBody.assigneeId = options.assigneeId;
            if (options.priority)
                requestBody.priority = parseInt(options.priority, 10);
            if (options.status)
                requestBody.status = parseInt(options.status, 10);
            if (options.dueDate)
                requestBody.dueDate = options.dueDate;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post(`/api/crm/task/update?id=${id}`, requestBody, {
                traceId,
            });
            // Validate response
            const validated = task_1.TaskSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.update',
                resource_type: 'task',
                resource_id: id,
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
                formatter_1.formatter.success(`✓ Task updated successfully`);
                console.log(`\nTask ID: ${validated.id}`);
                console.log(`Title: ${validated.title}`);
                if (validated.statusName)
                    console.log(`Status: ${validated.statusName}`);
                if (validated.assignee)
                    console.log(`Assignee: ${validated.assignee}`);
                if (validated.dueDate)
                    console.log(`Due Date: ${validated.dueDate}`);
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
//# sourceMappingURL=update.js.map