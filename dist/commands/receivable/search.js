"use strict";
/**
 * Receivable (应收款) search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const ReceivableSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contractCode: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    plannedPayDate: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    unActualPayAmount: zod_1.z.number().optional().nullable(),
    collectionCycle: zod_1.z.string().optional().nullable(),
    owner: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(ReceivableSchema),
}).passthrough();
function searchCommand(receivable) {
    receivable
        .command('search')
        .description('Search receivable items (应收款项)')
        .option('--customer <name>', 'Filter by customer name')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract <code>', 'Filter by contract code')
        .option('--planned-from <date>', 'Planned pay date from (YYYY-MM-DD)')
        .option('--planned-to <date>', 'Planned pay date to (YYYY-MM-DD)')
        .option('--actual-from <date>', 'Actual pay date from (YYYY-MM-DD)')
        .option('--actual-to <date>', 'Actual pay date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Search by planned payment date range
  $ crm receivable search --planned-from 2026-04-01 --planned-to 2026-06-30

  # Search by customer name
  $ crm receivable search --customer "北京科技"

  # Search receivables for a specific contract
  $ crm receivable search --contract HT-2026-001

  # Combine filters
  $ crm receivable search --customer "北京科技" --planned-from 2026-01-01

  # Export as JSON
  $ crm receivable search --planned-from 2026-04-01 --json

Notes:
  - --planned-from/to filters by 计划收款日期
  - --actual-from/to filters by 实际收款日期
  - --contract filters by contract code (not ID)
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
            if (options.plannedFrom)
                filter.PlannedPayDateStart = new Date(options.plannedFrom).toISOString();
            if (options.plannedTo)
                filter.PlannedPayDateEnd = new Date(options.plannedTo + 'T23:59:59').toISOString();
            if (options.actualFrom)
                filter.ActualPayDateStart = new Date(options.actualFrom).toISOString();
            if (options.actualTo)
                filter.ActualPayDateEnd = new Date(options.actualTo + 'T23:59:59').toISOString();
            const params = {
                maxResultCount: parseInt(options.size),
                skipCount: (parseInt(options.page) - 1) * parseInt(options.size),
                Filter: filter,
            };
            const response = await client.post('/api/crm/Receive/getList', params, { traceId });
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
                    fields: ['contractCode', 'customName', 'plannedPayDate', 'amount', 'actualPayAmount', 'unActualPayAmount'],
                    headers: {
                        contractCode: 'Contract',
                        customName: 'Customer',
                        plannedPayDate: 'Planned Date',
                        amount: 'Amount',
                        actualPayAmount: 'Paid',
                        unActualPayAmount: 'Outstanding',
                    },
                });
                console.log(`Found ${validated.totalCount} receivable items\n`);
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