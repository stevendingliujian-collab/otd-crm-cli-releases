"use strict";
/**
 * Task create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
function createCommand(task) {
    task
        .command('create')
        .description('Create a new task')
        .requiredOption('-t, --title <title>', 'Task title')
        .option('-d, --description <description>', 'Task description')
        .option('-a, --assignee-id <assigneeId>', 'Assignee user ID')
        .option('--priority <priority>', 'Task priority (number)')
        .option('--status <status>', 'Task status (number)')
        .option('--due-date <dueDate>', 'Due date (YYYY-MM-DD)')
        .option('--related-id <relatedId>', 'Related resource ID')
        .option('--related-type <relatedType>', 'Related resource type (number)')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const requestBody = {
                title: options.title,
            };
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
            if (options.relatedId)
                requestBody.relatedId = options.relatedId;
            if (options.relatedType)
                requestBody.relatedType = parseInt(options.relatedType, 10);
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/task/create', requestBody, {
                traceId,
            });
            // Validate response
            const validated = task_1.TaskSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.create',
                resource_type: 'task',
                resource_id: validated.id,
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
                formatter_1.formatter.success(`✓ Task created successfully`);
                console.log(`\nTask ID: ${validated.id}`);
                console.log(`Title: ${validated.title}`);
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
//# sourceMappingURL=create.js.map