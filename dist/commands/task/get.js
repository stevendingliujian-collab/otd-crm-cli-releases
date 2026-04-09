"use strict";
/**
 * Task get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
function getCommand(task) {
    task
        .command('get')
        .description('Get task details by ID')
        .argument('<id>', 'Task ID')
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get(`/api/crm/task/get?id=${id}`, {
                traceId,
            });
            // Validate response
            const validated = task_1.TaskSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.get',
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
                const output = formatter_1.formatter.format([validated], {
                    format: 'table',
                });
                console.log(output);
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
//# sourceMappingURL=get.js.map