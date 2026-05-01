"use strict";
/**
 * Search receive (payment) records command
 * Uses Receive/getActualReceiveList — the correct frontend API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ReceiveDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    receiveId: zod_1.z.string().optional().nullable(),
    contractCode: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    collectionCycle: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayRemark: zod_1.z.string().optional().nullable(),
    paymentMethodCode: zod_1.z.string().optional().nullable(),
    owner: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(ReceiveDetailSchema),
}).passthrough();
function searchCommand(receive) {
    receive
        .command('search')
        .description('Search receive (payment) records')
        .option('--customer <name>', 'Filter by customer name (partial match)')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract <code>', 'Filter by contract code')
        .option('--from <date>', 'Pay date from (YYYY-MM-DD)')
        .option('--to <date>', 'Pay date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Search payment records by customer name
  $ crm receive search --customer "润弘"

  # Search by customer ID
  $ crm receive search --customer-id 3a1f58d9-4e81-4096-a1c0-5ecae79140fd

  # Search by contract code
  $ crm receive search --contract SO20260408001

  # Search payments in date range
  $ crm receive search --from 2026-01-01 --to 2026-06-30

  # Export as JSON
  $ crm receive search --customer "润弘" --json

Notes:
  - Returns actual payment detail records (detailType: 0)
  - Each record shows the parent receivable context (contract, customer, collection cycle)
  - Use 'crm receivable search' to find receivable IDs for 'crm receive get'
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
            // Subtract 1 second from start so server's strict ">" includes the start date.
            if (options.from) {
                const d = new Date(options.from + 'T00:00:00');
                d.setSeconds(d.getSeconds() - 1);
                filter.actualPayDateStart = d.toISOString().replace('Z', '').split('.')[0];
            }
            if (options.to)
                filter.actualPayDateEnd = options.to + 'T23:59:59';
            filter.sortAsc = false;
            const params = {
                pageIndex: parseInt(options.page),
                pageSize: parseInt(options.size),
                filter,
            };
            const response = await client.post('/api/crm/Receive/getActualReceiveList', params, { traceId });
            const parseResult = SearchResponseSchema.safeParse(response);
            const validated = parseResult.success
                ? parseResult.data
                : {
                    totalCount: Array.isArray(response?.items) ? response.items.length : 0,
                    items: Array.isArray(response?.items) ? response.items : [],
                };
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: ['id', 'customName', 'contractCode', 'collectionCycle', 'actualPayAmount', 'actualPayDate'],
                    headers: {
                        id: 'ID',
                        customName: 'Customer',
                        contractCode: 'Contract',
                        collectionCycle: 'Cycle',
                        actualPayAmount: 'Amount',
                        actualPayDate: 'Pay Date',
                    },
                });
                console.log(`Found ${validated.totalCount} payment records\n`);
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