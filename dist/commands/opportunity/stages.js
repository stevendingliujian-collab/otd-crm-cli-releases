"use strict";
/**
 * Opportunity stages command
 * List all available opportunity stages (business processes)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stagesCommand = stagesCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
// Schema for data dictionary detail (stage)
const StageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string(),
    displayText: zod_1.z.string(),
    order: zod_1.z.number(),
    extraProperties: zod_1.z.object({
        businessProbability: zod_1.z.number().optional(),
    }).passthrough().nullable().optional(),
}).passthrough();
const StagesResponseSchema = zod_1.z.array(StageSchema);
function stagesCommand(opportunity) {
    opportunity
        .command('stages')
        .description('List all opportunity stages (business processes)')
        .action(async (_options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Make API request
            // Note: Using project API as a workaround since business module doesn't have this endpoint
            // Backend should add /api/crm/business/getStages or similar
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get('/api/crm/project/getProjectStatussByCode', {
                params: { code: 'BusinessProcess' },
                traceId,
            });
            // Validate response
            const validated = StagesResponseSchema.parse(response);
            // Transform to simpler format
            const stages = validated
                .map(stage => ({
                id: stage.id,
                code: stage.code,
                name: stage.displayText,
                order: stage.order,
                probability: stage.extraProperties?.businessProbability || 0,
            }))
                .sort((a, b) => a.order - b.order);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.stages',
                resource_type: 'opportunity',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(stages, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(stages, {
                    format: 'table',
                    fields: ['order', 'name', 'code', 'probability'],
                    headers: {
                        order: 'Order',
                        name: 'Stage Name',
                        code: 'Code',
                        probability: 'Win Rate (%)',
                    },
                });
                console.log(output);
                console.log(`\nTotal: ${stages.length} stages`);
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
//# sourceMappingURL=stages.js.map