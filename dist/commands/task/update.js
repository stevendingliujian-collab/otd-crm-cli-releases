"use strict";
/**
 * TMS task update command
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
const UPDATE_PROPERTY_HELP = [
    'title',
    'description',
    'responsibleUserId',
    'priority',
    'status',
    'planDoneDate',
    'planStartDate',
    'autoCompletion',
    'taskType',
    'taskCustomTypeId',
    'collaborationIds',
    'taskDocLinks',
];
const UPDATE_PROPERTY_SET = new Set(UPDATE_PROPERTY_HELP);
function inferUpdateProperty(options) {
    if (options.title !== undefined)
        return 'title';
    if (options.description !== undefined)
        return 'description';
    if (options.assigneeId !== undefined)
        return 'responsibleUserId';
    if (options.priority !== undefined)
        return 'priority';
    if (options.status !== undefined)
        return 'status';
    if (options.dueDate !== undefined)
        return 'planDoneDate';
    return undefined;
}
function buildTaskUpdateBody(updateProperty, options) {
    switch (updateProperty) {
        case 'title':
            return { title: options.title };
        case 'description':
            return { description: options.description };
        case 'responsibleUserId':
            return { responsibleUserId: options.assigneeId };
        case 'priority':
            return { priority: parseInt(String(options.priority), 10) };
        case 'status':
            return { status: parseInt(String(options.status), 10) };
        case 'planDoneDate':
            return { planDoneDate: options.dueDate };
        default:
            return {};
    }
}
function updateCommand(task) {
    task
        .command('update')
        .description('Update an existing task item')
        .argument('<id>', 'Task ID')
        .option('-t, --title <title>', 'Task title')
        .option('-d, --description <description>', 'Task description')
        .option('-a, --assignee-id <assigneeId>', 'Assignee user ID')
        .option('--priority <priority>', 'Task priority (number)')
        .option('--status <status>', 'Task status (number)')
        .option('--due-date <dueDate>', 'Due date (YYYY-MM-DD)')
        .option('--update-property <updateProperty>', `Field to update (${UPDATE_PROPERTY_HELP.join(', ')})`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const hasAnyField = ['title', 'description', 'assigneeId', 'priority', 'status', 'dueDate', 'updateProperty']
                .some((field) => options[field] !== undefined);
            if (!hasAnyField) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', `Available options: --update-property <${UPDATE_PROPERTY_HELP.join('|')}>, --title, --description, --assignee-id, --priority, --status, --due-date`);
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/tms/taskItem/get?id=${id}`, {
                traceId,
            });
            task_1.TaskSchema.parse(current);
            const updateProperty = options.updateProperty || inferUpdateProperty(options);
            if (!updateProperty) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'Unable to infer update property', `Specify --update-property explicitly. Supported values: ${UPDATE_PROPERTY_HELP.join(', ')}`);
            }
            if (!UPDATE_PROPERTY_SET.has(updateProperty)) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, `Unsupported update property: ${updateProperty}`, `Supported values: ${UPDATE_PROPERTY_HELP.join(', ')}`);
            }
            const item = buildTaskUpdateBody(updateProperty, options);
            const response = await client.post(`/api/tms/taskItem/updateTaskItem`, { id, updateProperty, item }, {
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
                if (validated.status !== undefined)
                    console.log(`Status: ${validated.status}`);
                if (validated.responsibleUserName)
                    console.log(`Responsible: ${validated.responsibleUserName}`);
                if (validated.planDoneDate)
                    console.log(`Due Date: ${validated.planDoneDate}`);
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