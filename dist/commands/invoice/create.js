"use strict";
/**
 * Create invoice record command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const InvoiceDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoicer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function createCommand(invoice) {
    invoice
        .command('create')
        .description('Create a new invoice record')
        .requiredOption('--contract <contractId>', 'Contract ID to associate')
        .requiredOption('--amount <number>', 'Invoice amount', parseFloat)
        .requiredOption('--date <date>', 'Invoice date (YYYY-MM-DD)')
        .option('--invoice-number <string>', 'Invoice number (code)')
        .option('--invoicer <name>', 'Invoicer name')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Create a basic invoice record
  $ crm invoice create --contract 3a1973c6-0a85-b26f-1bbd-d236ff3e0250 --amount 100000 --date 2026-04-10

  # Create with invoice number and invoicer
  $ crm invoice create --contract <contractId> --amount 100000 --date 2026-04-15 --invoice-number INV-2026-001 --invoicer "财务部"

  # Create with remark
  $ crm invoice create --contract <contractId> --amount 50000 --date 2026-04-10 --remark "增值税专用发票"

  # Output as JSON
  $ crm invoice create --contract <contractId> --amount 100000 --date 2026-04-10 --json

Notes:
  - --contract is the contract ID (use 'crm contract search' to find it)
  - --date format: YYYY-MM-DD
  - Creating an invoice record automatically updates contract invoiced status
  - --invoice-number can be filled in later with 'crm invoice update <id> --invoice-number'
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const body = {
                code: options.invoiceNumber || '',
                invoiceAmount: options.amount,
                invoiceDate: new Date(options.date).toISOString(),
                invoicer: options.invoicer || '',
                remark: options.remark || '',
                contracts: [
                    {
                        id: options.contract,
                        receives: [],
                    },
                ],
            };
            const response = await client.post('/api/crm/FinanceInvoice/create', body, { traceId });
            const record = InvoiceDetailSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'invoice.create',
                resource_type: 'invoice',
                resource_id: record.id,
                meta: {
                    profile,
                    api_url: client['axiosInstance']?.defaults?.baseURL || '',
                },
                changes: {
                    contract: options.contract,
                    amount: options.amount,
                    date: options.date,
                },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: record, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Invoice record created successfully');
                formatter_1.formatter.info(`ID: ${record.id}`);
                if (record.code)
                    formatter_1.formatter.info(`Invoice No: ${record.code}`);
                if (record.customName)
                    formatter_1.formatter.info(`Customer: ${record.customName}`);
                if (record.invoiceAmount !== undefined && record.invoiceAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${record.invoiceAmount}`);
                if (record.invoiceDate)
                    formatter_1.formatter.info(`Invoice Date: ${record.invoiceDate}`);
                if (record.invoicer)
                    formatter_1.formatter.info(`Invoicer: ${record.invoicer}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
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
//# sourceMappingURL=create.js.map