"use strict";
/**
 * Update followup command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFollowupCommand = updateFollowupCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const UpdateFollowupResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    code: zod_1.z.number().optional(),
}).passthrough();
function updateFollowupCommand(followup) {
    followup
        .command('update')
        .description('Update an existing followup record')
        .argument('<id>', 'Followup record ID')
        .option('--content <content>', 'Followup content')
        .option('--date <date>', 'Follow-up date (YYYY-MM-DD)')
        .option('--next-date <date>', 'Next follow-up date (YYYY-MM-DD)')
        .option('--type <type>', 'Follow-up type')
        .option('--result <result>', 'Follow-up result')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Get current followup data
            console.error(`[DEBUG] Fetching current followup data for ${id}...`);
            const current = await client.get(`/api/crm/followup/get?id=${id}`, { traceId });
            console.error(`[DEBUG] Current data:`, JSON.stringify(current));
            // Step 2: Build update payload (merge with current data)
            const updateData = {
                id: current.id || id,
                content: options.content || current.content,
                followUpDate: options.date || current.followUpDate,
                nextFollowUpDate: options.nextDate || current.nextFollowUpDate,
                followUpType: options.type || current.followUpType,
                followUpResult: options.result || current.followUpResult,
                // Preserve required fields
                relatedId: current.relatedId,
                relatedType: current.relatedType,
            };
            // Preserve other fields if exist
            if (current.ownerId)
                updateData.ownerId = current.ownerId;
            if (current.owner)
                updateData.owner = current.owner;
            console.error(`[DEBUG] Calling POST /api/crm/followup/update?id=${id} with data:`, JSON.stringify(updateData));
            // ID must be in URL query param per backend ABP convention
            const response = await client.post(`/api/crm/followup/update?id=${id}`, updateData, {
                params: { trace_id: traceId },
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response));
            const validated = UpdateFollowupResponseSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                console.log('✅ Followup record updated successfully');
                console.log(`ID: ${validated.id}`);
                if (validated.content)
                    console.log(`Content: ${validated.content}`);
                if (validated.followUpDate)
                    console.log(`Follow-up Date: ${validated.followUpDate}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            console.error(`[ERROR] Followup update failed:`);
            console.error(JSON.stringify({
                error: {
                    code: cliError.code,
                    message: cliError.message,
                    hint: cliError.hint,
                    trace_id: traceId,
                },
            }, null, 2));
            process.exit(1);
        }
    });
}
//# sourceMappingURL=update.js.map