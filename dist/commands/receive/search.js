"use strict";
/**
 * Search receives command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ReceiveSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    receiveDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchReceivesResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(ReceiveSchema),
}).passthrough();
function searchCommand(receive) {
    receive
        .command('search')
        .description('Search receive (payment) records')
        .option('--keyword <keyword>', 'Search keyword')
        .option('--contract <contractId>', 'Filter by contract ID')
        .option('--customer-id <customerId>', 'Filter by customer ID')
        .option('--status <status>', 'Filter by status')
        .option('--from <date>', 'Receive date from (YYYY-MM-DD)')
        .option('--to <date>', 'Receive date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .addHelpText('after', `
Examples:
  # Search all payment records for a customer
  $ crm receive search --customer-id 3a1973c6-0a85-b26f-1bbd-d236ff3e0250
  
  # Search payments for a contract
  $ crm receive search --contract abc123-def456
  
  # Search payments in date range
  $ crm receive search --from 2026-01-01 --to 2026-03-31
  
  # Search by keyword
  $ crm receive search --keyword "银行转账"
  
  # Export as JSON
  $ crm receive search --customer-id xxx --json > payments.json

Notes:
  - Use --customer-id for customer 360° view
  - Date range filters use ISO format (YYYY-MM-DD)
  - Use --json for machine-readable output
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // Build filter object
            const filter = {};
            if (options.keyword) {
                filter.LikeString = options.keyword;
            }
            if (options.contract) {
                filter.ContractId = options.contract;
            }
            if (options.customerId) {
                filter.CustomId = options.customerId;
            }
            if (options.status) {
                filter.Status = options.status;
            }
            if (options.from) {
                filter.ReceiveDateStart = new Date(options.from).toISOString();
            }
            if (options.to) {
                filter.ReceiveDateEnd = new Date(options.to + 'T23:59:59').toISOString();
            }
            const params = {
                maxResultCount: parseInt(options.size),
                skipCount: (parseInt(options.page) - 1) * parseInt(options.size),
                Filter: filter,
            };
            console.error(`[DEBUG] Calling /api/crm/receive/getList with params:`, JSON.stringify(params));
            const response = await client.post('/api/crm/receive/getList', params, {
                traceId,
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response).substring(0, 200));
            const validated = SearchReceivesResponseSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: ['id', 'contractName', 'amount', 'receiveDate', 'status'],
                    headers: {
                        id: 'ID',
                        contractName: 'Contract',
                        amount: 'Amount',
                        receiveDate: 'Receive Date',
                        status: 'Status',
                    },
                });
                console.log(`Found ${validated.totalCount} receive records\n`);
                console.log(output);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            console.error(`[ERROR] Receive search failed:`);
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
//# sourceMappingURL=search.js.map