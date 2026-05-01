"use strict";
/**
 * Search invoice records command
 * Uses Receive/getList — returns receivable items with invoice summary fields.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ReceivableWithInvoiceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contractCode: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    collectionCycle: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    unInvoiceAmount: zod_1.z.number().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceStatus: zod_1.z.number().optional().nullable(),
    owner: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(ReceivableWithInvoiceSchema),
}).passthrough();
function searchCommand(invoice) {
    invoice
        .command('search')
        .description('Search receivable items with invoice status')
        .option('--customer <name>', 'Filter by customer name (partial match)')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract <code>', 'Filter by contract code')
        .option('--invoiced', 'Show only fully invoiced items (invoiceStatus=2)')
        .option('--uninvoiced', 'Show only un-invoiced items (invoiceStatus=0)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Search invoiced receivables by customer name
  $ crm invoice search --customer "润弘"

  # Show only fully invoiced items
  $ crm invoice search --invoiced --customer-id <id>

  # Show items not yet invoiced
  $ crm invoice search --uninvoiced

  # Search by contract code
  $ crm invoice search --contract SO20260408001

  # Export as JSON
  $ crm invoice search --customer "润弘" --json

Notes:
  - Returns receivable items (应收款项) with their invoice summary
  - invoiceStatus: 0=未开票, 1=部分开票, 2=已开票
  - Use 'crm invoice get <id>' with the returned ID to see individual invoice records
  - Use 'crm invoice create --receivable-id <id>' to add an invoice record
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const filter = {};
            if (options.customer)
                filter.customName = options.customer;
            if (options.customerId)
                filter.customId = options.customerId;
            if (options.contract)
                filter.contractCode = options.contract;
            if (options.invoiced)
                filter.invoiceStatus = 2;
            if (options.uninvoiced)
                filter.invoiceStatus = 0;
            const params = {
                pageIndex: parseInt(options.page),
                pageSize: parseInt(options.size),
                filter,
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
                    fields: ['id', 'customName', 'contractCode', 'collectionCycle', 'invoiceAmount', 'unInvoiceAmount', 'invoiceDate'],
                    headers: {
                        id: 'ID',
                        customName: 'Customer',
                        contractCode: 'Contract',
                        collectionCycle: 'Cycle',
                        invoiceAmount: 'Invoiced',
                        unInvoiceAmount: 'Remaining',
                        invoiceDate: 'Invoice Date',
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