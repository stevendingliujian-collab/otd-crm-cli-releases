"use strict";
/**
 * Search invoices command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const InvoiceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoicer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchInvoicesResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(InvoiceSchema),
}).passthrough();
function searchCommand(invoice) {
    invoice
        .command('search')
        .description('Search invoice records')
        .option('--customer <name>', 'Filter by customer name')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract <code>', 'Filter by contract code')
        .option('--invoicer <name>', 'Filter by invoicer name')
        .option('--from <date>', 'Invoice date from (YYYY-MM-DD)')
        .option('--to <date>', 'Invoice date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Search all invoices for a customer
  $ crm invoice search --customer-id 3a1973c6-0a85-b26f-1bbd-d236ff3e0250

  # Search by customer name
  $ crm invoice search --customer "北京科技"

  # Search invoices for a contract code
  $ crm invoice search --contract HT-2026-001

  # Search invoices in date range
  $ crm invoice search --from 2026-01-01 --to 2026-03-31

  # Export as JSON
  $ crm invoice search --customer-id <id> --json > invoices.json

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
            if (options.invoicer)
                filter.Invoicer = options.invoicer;
            if (options.from)
                filter.InvoiceDateStart = new Date(options.from).toISOString();
            if (options.to)
                filter.InvoiceDateEnd = new Date(options.to + 'T23:59:59').toISOString();
            const params = {
                maxResultCount: parseInt(options.size),
                skipCount: (parseInt(options.page) - 1) * parseInt(options.size),
                Filter: filter,
            };
            const response = await client.post('/api/crm/FinanceInvoice/getList', params, { traceId });
            const parseResult = SearchInvoicesResponseSchema.safeParse(response);
            const validated = parseResult.success
                ? parseResult.data
                : { totalCount: Array.isArray(response?.items) ? response.items.length : 0, items: Array.isArray(response?.items) ? response.items : [] };
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: ['id', 'code', 'customName', 'invoiceAmount', 'invoiceDate', 'invoicer'],
                    headers: {
                        id: 'ID',
                        code: 'Invoice No',
                        customName: 'Customer',
                        invoiceAmount: 'Amount',
                        invoiceDate: 'Invoice Date',
                        invoicer: 'Invoicer',
                    },
                });
                console.log(`Found ${validated.totalCount} invoice records\n`);
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