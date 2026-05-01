"use strict";
/**
 * Clue get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const clue_1 = require("../../schemas/resources/clue");
function getCommand(clue) {
    clue
        .command('get <id>')
        .description('Get clue (lead) details by ID')
        .addHelpText('after', `
Examples:
  # Get clue by ID
  $ crm clue get a1b2c3d4-e5f6-7890-abcd-ef1234567890
  
  # Get clue and export as JSON
  $ crm clue get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json
  
  # Get clue with specific fields
  $ crm clue get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --fields id,name,owner,status

Notes:
  - ID must be a valid UUID (36 characters)
  - Returns full clue details including contact info and qualification status
  - Use 'crm clue convert <id>' to convert this clue to a customer
  - Use --json for machine-readable output
`)
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get("/api/crm/clue/getClueById", { params: { id }, traceId });
            const validated = clue_1.ClueResponseSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.get',
                resource_type: 'clue',
                resource_id: id,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(validated.data, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(validated.data, {
                    format: 'table',
                });
                console.log(output);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message, hint: cliError.hint }, trace_id: traceId }));
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
//# sourceMappingURL=get.js.map