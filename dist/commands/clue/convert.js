"use strict";
/**
 * Clue convert command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCommand = convertCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
// ABP response: likely returns the new customer object or a simple success indicator
const ConvertResponseSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
}).passthrough();
function convertCommand(clue) {
    clue
        .command('convert <id>')
        .description('Convert clue (lead) to customer')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Convert clue to customer
  $ crm clue convert a1b2c3d4-e5f6-7890-abcd-ef1234567890

  # Convert and export result as JSON
  $ crm clue convert a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json

Notes:
  - ID must be a valid clue UUID (use 'crm clue search' to find it)
  - This is a write operation (requires appropriate permissions)
  - Cannot be undone
  - After conversion, use 'crm customer get <customerId>' to view the new customer
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post(`/api/crm/clue/convert?id=${id}`, {}, { traceId });
            const parseResult = ConvertResponseSchema.safeParse(response);
            const result = parseResult.success
                ? parseResult.data
                : (response && typeof response === 'object' ? response : {});
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.convert',
                resource_type: 'clue',
                resource_id: id,
                meta: { profile, api_url: '' },
                changes: { converted_to_customer: result.id || result.customId },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: result, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Clue converted to customer successfully');
                if (result.id)
                    formatter_1.formatter.info(`Customer ID: ${result.id}`);
                if (result.customName)
                    formatter_1.formatter.info(`Customer Name: ${result.customName}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: { code: cliError.code, message: cliError.message, hint: cliError.hint },
                    trace_id: traceId,
                }));
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
//# sourceMappingURL=convert.js.map