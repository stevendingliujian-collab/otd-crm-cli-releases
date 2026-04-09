"use strict";
/**
 * Customer get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const customer_1 = require("../../schemas/resources/customer");
// API 直接返回数据对象,不需要包装
const GetResponseSchema = customer_1.CustomerSchema;
function getCommand(customer) {
    customer
        .command('get <id>')
        .description('Get customer details by ID')
        .addHelpText('after', `
Examples:
  # Get customer by ID
  $ crm customer get a1b2c3d4-e5f6-7890-abcd-ef1234567890
  
  # Get customer and export as JSON
  $ crm customer get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --json
  
  # Get customer with specific fields (table format)
  $ crm customer get a1b2c3d4-e5f6-7890-abcd-ef1234567890 --fields id,name,industry,contact

Notes:
  - ID must be a valid UUID (36 characters)
  - Returns full customer details including contact info, address, and metadata
  - Use --json for machine-readable output
  - Use --fields to customize output columns (table format only)
`)
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get("/api/crm/custom/getCustomById", { params: { id }, traceId });
            // Validate response
            const validated = GetResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'customer.get',
                resource_type: 'customer',
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