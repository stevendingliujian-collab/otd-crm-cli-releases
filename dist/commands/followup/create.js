"use strict";
/**
 * Followup create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const followup_1 = require("../../schemas/resources/followup");
function createCommand(followup) {
    followup
        .command('create')
        .description('Create a new followup record')
        .requiredOption('--related-id <id>', 'Related object ID (UUID)')
        .requiredOption('--related-type <type>', 'Related type (0-7)', parseInt)
        .requiredOption('--type <type>', 'Followup type (1-4)', parseInt)
        .requiredOption('--content <content>', 'Followup content')
        .option('--related-title <title>', 'Related object title')
        .option('--next-plan <plan>', 'Next plan')
        .option('--date <date>', 'Followup date (ISO format)')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const body = {
                relatedId: options.relatedId,
                relatedType: options.relatedType,
                type: options.type,
                content: options.content,
            };
            if (options.relatedTitle)
                body.relatedTitle = options.relatedTitle;
            if (options.nextPlan)
                body.nextPlan = options.nextPlan;
            if (options.date)
                body.followUpDate = options.date;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/followup/create', body, {
                traceId,
            });
            // Validate response
            const validated = followup_1.FollowupSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'followup.create',
                resource_type: 'followup',
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
                formatter_1.formatter.success('✓ Followup record created successfully!');
                console.log(`\nFollowup ID: ${validated.id}`);
                console.log(`Content: ${validated.content}`);
                console.log(`Type: ${validated.type}`);
                console.log(`Owner: ${validated.owner || 'N/A'}`);
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