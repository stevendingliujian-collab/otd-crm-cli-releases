"use strict";
/**
 * Search receive records command
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
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    actualPayer: zod_1.z.string().optional().nullable(),
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
        .option('--customer <name>', 'Filter by customer name')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract <code>', 'Filter by contract code')
        .option('--payer <name>', 'Filter by payer name')
        .option('--from <date>', 'Pay date from (YYYY-MM-DD)')
        .option('--to <date>', 'Pay date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Search all payment records for a customer
  $ crm receive search --customer-id 3a1973c6-0a85-b26f-1bbd-d236ff3e0250

  # Search by customer name
  $ crm receive search --customer "北京科技"

  # Search payments for a contract code
  $ crm receive search --contract HT-2026-001

  # Search payments in date range
  $ crm receive search --from 2026-01-01 --to 2026-03-31

  # Export as JSON
  $ crm receive search --customer-id <id> --json > payments.json

Notes:
  - --customer does partial name match
  - --contract filters by contract code (not ID)
  - Date range uses ISO format (YYYY-MM-DD)
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const filter = {};
            if (options.customer)
                filter.CustomName = options.customer;
            if (options.customerId)
                filter.CustomId = options.customerId;
            if (options.contract)
                filter.ContractCode = options.contract;
            if (options.payer)
                filter.Receiver = options.payer;
            if (options.from)
                filter.ActualPayDateStart = new Date(options.from).toISOString();
            if (options.to)
                filter.ActualPayDateEnd = new Date(options.to + 'T23:59:59').toISOString();
            const params = {
                maxResultCount: parseInt(options.size),
                skipCount: (parseInt(options.page) - 1) * parseInt(options.size),
                Filter: filter,
            };
            const response = await client.post('/api/crm/FinanceReceive/getList', params, { traceId });
            const validated = SearchReceivesResponseSchema.parse(response);
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: ['id', 'customName', 'actualPayAmount', 'actualPayDate', 'actualPayer'],
                    headers: {
                        id: 'ID',
                        customName: 'Customer',
                        actualPayAmount: 'Amount',
                        actualPayDate: 'Pay Date',
                        actualPayer: 'Payer',
                    },
                });
                console.log(`Found ${validated.totalCount} receive records\n`);
                console.log(output);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message }, trace_id: traceId }));
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
//# sourceMappingURL=search.js.map