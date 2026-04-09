"use strict";
/**
 * Clue convert command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCommand = convertCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ConvertResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.object({
        customer_id: zod_1.z.string(),
        opportunity_id: zod_1.z.string().optional(),
    }),
    meta: zod_1.z.object({
        trace_id: zod_1.z.string(),
        timestamp: zod_1.z.string(),
    }),
});
function convertCommand(clue) {
    clue
        .command('convert <id>')
        .description('Convert clue (lead) to customer')
        .option('--create-opportunity', 'Also create an opportunity after conversion', false)
        .addHelpText('after', `
Examples:
  # Convert clue to customer (basic)
  $ crm clue convert a1b2c3d4-e5f6-7890-abcd-ef1234567890
  
  # Convert clue and create opportunity in one step
  $ crm clue convert a1b2c3d4-e5f6-7890-abcd-ef1234567890 --create-opportunity
  
  # Convert and export result as JSON
  $ crm clue convert a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json

Notes:
  - ID must be a valid clue UUID (36 characters)
  - Returns the new customer_id after conversion
  - If --create-opportunity is used, also returns opportunity_id
  - This is a write operation (requires appropriate permissions)
  - Cannot be undone (but you can delete the created customer if needed)
  - Use --json for machine-readable output
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post(`/clues/${id}/convert`, {
                create_opportunity: options.createOpportunity,
            }, { traceId });
            const validated = ConvertResponseSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.convert',
                resource_type: 'clue',
                resource_id: id,
                changes: {
                    create_opportunity: options.createOpportunity,
                    customer_id: validated.data.customer_id,
                    opportunity_id: validated.data.opportunity_id,
                },
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(validated.data, null, 2));
            }
            else {
                formatter_1.formatter.success(`Clue converted to customer: ${validated.data.customer_id}`);
                if (validated.data.opportunity_id) {
                    console.log(`Opportunity created: ${validated.data.opportunity_id}`);
                }
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
//# sourceMappingURL=convert.js.map