"use strict";
/**
 * Followup comment command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentCommand = commentCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const FollowupCommentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string(),
    followUpId: zod_1.z.string().optional().nullable(),
    createdTime: zod_1.z.string().optional().nullable(),
}).passthrough();
function commentCommand(followup) {
    followup
        .command('comment')
        .description('Create a comment for a followup record')
        .argument('<id>', 'Followup record ID')
        .requiredOption('-c, --content <content>', 'Comment content')
        .option('--file-id <id...>', 'Attach file ID(s)')
        .option('--at-user <id...>', 'Mention user ID(s)')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Add a simple comment to a followup
  $ crm followup comment <followupId> --content "已补充方案，客户确认下周回电"

  # Add a comment with attachments and mentions
  $ crm followup comment <followupId> \\
      --content "发送了报价单，请查收" \\
      --file-id <fileId1> <fileId2> \\
      --at-user <userId1> <userId2> \\
      --json

Notes:
  - Comments must belong to a followup record
  - --file-id and --at-user accept multiple values
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const requestBody = {
                followUpId: id,
                content: options.content,
            };
            if (options.fileId) {
                requestBody.resourceFiles = (Array.isArray(options.fileId) ? options.fileId : [options.fileId])
                    .map((fileId) => ({ fileId }));
            }
            if (options.atUser) {
                requestBody.atUsers = Array.isArray(options.atUser) ? options.atUser : [options.atUser];
            }
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/crmcomment/create', requestBody, { traceId });
            const validated = FollowupCommentSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'followup.comment',
                resource_type: 'followup',
                resource_id: id,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                formatter_1.formatter.success('✓ Followup comment created successfully');
                console.log(`\nComment ID: ${validated.id}`);
                console.log(`Followup ID: ${id}`);
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