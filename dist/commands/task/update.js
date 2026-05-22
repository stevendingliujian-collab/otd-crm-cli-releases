"use strict";
/**
 * Task update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
const error_codes_1 = require("../../constants/error-codes");
const TASK_UPDATE_ALLOWLIST = [
    'title',
    'description',
    'assigneeId',
    'priority',
    'status',
    'dueDate',
    'completedDate',
    'relatedId',
    'relatedType',
];
function buildTaskUpdateBody(current, options, id) {
    const body = { id };
    for (const field of TASK_UPDATE_ALLOWLIST) {
        if (current[field] !== undefined) {
            body[field] = current[field];
        }
    }
    if (options.title !== undefined)
        body.title = options.title;
    if (options.description !== undefined)
        body.description = options.description;
    if (options.assigneeId !== undefined)
        body.assigneeId = options.assigneeId;
    if (options.priority !== undefined)
        body.priority = parseInt(String(options.priority), 10);
    if (options.status !== undefined)
        body.status = parseInt(String(options.status), 10);
    if (options.dueDate !== undefined)
        body.dueDate = options.dueDate;
    return body;
}
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
            const hasAnyField = ['title', 'description', 'assigneeId', 'priority', 'status', 'dueDate']
                .some((field) => options[field] !== undefined);
            if (!hasAnyField) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --title, --description, --assignee-id, --priority, --status, --due-date');
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/crm/task/get?id=${id}`, {
                traceId,
            });
            const currentData = task_1.TaskSchema.parse(current);
            const requestBody = buildTaskUpdateBody(currentData, options, id);
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
//# sourceMappingURL=update.js.map