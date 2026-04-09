"use strict";
/**
 * Task comment command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentCommand = commentCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const CommentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string(),
    taskId: zod_1.z.string().optional().nullable(),
    createdTime: zod_1.z.string().optional().nullable(),
}).passthrough();
function commentCommand(task) {
    task
        .command('comment')
        .description('Create a task comment')
        .argument('<id>', 'Task ID')
        .requiredOption('-c, --content <content>', 'Comment content')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const requestBody = {
                taskId: id,
                content: options.content,
            };
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/task/createComment', requestBody, {
                traceId,
            });
            // Validate response
            const validated = CommentSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.comment',
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
                formatter_1.formatter.success(`✓ Comment created successfully`);
                console.log(`\nComment ID: ${validated.id}`);
                console.log(`Task ID: ${id}`);
                console.log(`Content: ${validated.content}`);
                if (validated.createdTime)
                    console.log(`Created: ${validated.createdTime}`);
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
//# sourceMappingURL=comment.js.map