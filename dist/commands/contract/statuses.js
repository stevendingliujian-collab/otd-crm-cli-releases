"use strict";
/**
 * Contract statuses command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusesCommand = statusesCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
// Schema for data dictionary detail (status)
const StatusSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string(),
    displayText: zod_1.z.string(),
    order: zod_1.z.number(),
    description: zod_1.z.string().nullable().optional(),
}).passthrough();
const StatusesResponseSchema = zod_1.z.array(StatusSchema);
function statusesCommand(contract) {
    contract
        .command('statuses')
        .description('Get contract status list')
        .action(async (_options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Make API request
            // Note: Using project API as a workaround since contract module doesn't have this endpoint
            // Backend should add /api/crm/contract/getStatuses or similar
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get('/api/crm/project/getProjectStatussByCode', {
                params: { code: 'ContractStatus' },
                traceId,
            });
            // Validate response
            const validated = StatusesResponseSchema.parse(response);
            // Transform to simpler format
            const statuses = validated
                .map(status => ({
                id: status.id,
                code: status.code,
                name: status.displayText,
                order: status.order,
                description: status.description || '',
            }))
                .sort((a, b) => a.order - b.order);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contract.statuses',
                resource_type: 'contract',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(statuses, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(statuses, {
                    format: 'table',
                    fields: ['order', 'name', 'code'],
                    headers: {
                        order: 'Order',
                        name: 'Status Name',
                        code: 'Code',
                    },
                });
                console.log(output);
                console.log(`\nTotal: ${statuses.length} statuses`);
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
//# sourceMappingURL=statuses.js.map