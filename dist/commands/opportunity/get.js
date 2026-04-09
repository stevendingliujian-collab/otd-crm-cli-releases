"use strict";
/**
 * Opportunity get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
function getCommand(opportunity) {
    opportunity
        .command('get <id>')
        .description('Get opportunity (sales deal) details by ID')
        .addHelpText('after', `
Examples:
  # Get opportunity by ID
  $ crm opportunity get a1b2c3d4-e5f6-7890-abcd-ef1234567890
  
  # Get opportunity and export as JSON
  $ crm opportunity get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json
  
  # Get opportunity with specific fields
  $ crm opportunity get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --fields id,name,stage,amount,expectedDate

Notes:
  - ID must be a valid UUID (36 characters)
  - Returns full opportunity details including:
    - Customer information
    - Stage/process status
    - Expected amount and close date
    - Sales rep (owner)
    - Follow-up history summary
  - Use --json for machine-readable output
  - Short alias: 'crm opp get <id>'
`)
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get("/api/crm/business/getBusinessById", { params: { id }, traceId });
            const validated = opportunity_1.OpportunityResponseSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.get',
                resource_type: 'opportunity',
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
                const output = formatter_1.formatter.format(validated, {
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