"use strict";
/**
 * Search invoices command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const param_builder_1 = require("../../utils/param-builder");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const InvoiceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    invoiceNumber: zod_1.z.string().optional().nullable(),
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
}).passthrough();
const SearchInvoicesResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(InvoiceSchema),
}).passthrough();
function searchCommand(invoice) {
    invoice
        .command('search')
        .description('Search invoices')
        .option('--keyword <keyword>', 'Search keyword')
        .option('--contract <contractId>', 'Filter by contract ID')
        .option('--status <status>', 'Filter by status')
        .option('--from <date>', 'Invoice date from (YYYY-MM-DD)')
        .option('--to <date>', 'Invoice date to (YYYY-MM-DD)')
        .option('--page <number>', 'Page number (default: 1)', '1')
        .option('--size <number>', 'Page size (default: 20)', '20')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const params = (0, param_builder_1.buildPagedRequest)({
                keyword: options.keyword,
                page: parseInt(options.page),
                size: parseInt(options.size),
            });
            console.error(`[DEBUG] Calling /api/crm/invoice/getList with params:`, JSON.stringify(params));
            const response = await client.post('/api/crm/invoice/getList', params, {
                traceId,
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response).substring(0, 200));
            const validated = SearchInvoicesResponseSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: ['id', 'invoiceNumber', 'contractName', 'amount', 'invoiceDate', 'status'],
                    headers: {
                        id: 'ID',
                        invoiceNumber: 'Invoice #',
                        contractName: 'Contract',
                        amount: 'Amount',
                        invoiceDate: 'Invoice Date',
                        status: 'Status',
                    },
                });
                console.log(`Found ${validated.totalCount} invoices\n`);
                console.log(output);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            console.error(`[ERROR] Invoice search failed:`);
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