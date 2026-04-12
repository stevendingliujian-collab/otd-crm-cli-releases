"use strict";
/**
 * Invoice update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const error_codes_1 = require("../../constants/error-codes");
const InvoiceDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoicer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(invoice) {
    invoice
        .command('update <id>')
        .description('Update an existing invoice record')
        .option('--amount <number>', 'Invoice amount', parseFloat)
        .option('--date <date>', 'Invoice date (YYYY-MM-DD)')
        .option('--invoice-number <string>', 'Invoice number (code)')
        .option('--invoicer <name>', 'Invoicer name')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Fill in invoice number after issuing
  $ crm invoice update <id> --invoice-number INV-2026-001

  # Update invoice date and amount
  $ crm invoice update <id> --date 2026-04-01 --amount 100000

  # Update multiple fields at once
  $ crm invoice update <id> --invoice-number INV-2026-001 --date 2026-04-15 --amount 100000

  # Add remark
  $ crm invoice update <id> --remark "增值税专用发票，已邮寄"

  # Output as JSON
  $ crm invoice update <id> --invoice-number INV-2026-001 --json

Notes:
  - At least one option must be provided
  - --date format: YYYY-MM-DD
  - --invoice-number sets the invoice code field
  - Use 'crm invoice get <id>' to check current values before updating
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.invoiceNumber && !options.invoicer && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --invoice-number, --invoicer, --remark', { available_options: ['--amount', '--date', '--invoice-number', '--invoicer', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/crm/FinanceInvoice/getFinanceInvoiceById?id=${id}`, { traceId });
            const currentData = InvoiceDetailSchema.parse(current);
            const body = {
                id: currentData.id,
                customId: currentData.customId,
                customName: currentData.customName,
            };
            body.invoiceAmount = options.amount !== undefined ? options.amount : currentData.invoiceAmount;
            body.invoiceDate = options.date
                ? new Date(options.date).toISOString()
                : currentData.invoiceDate;
            body.code = options.invoiceNumber ?? currentData.code ?? '';
            body.invoicer = options.invoicer ?? currentData.invoicer ?? '';
            body.remark = options.remark ?? currentData.remark ?? '';
            const response = await client.post(`/api/crm/FinanceInvoice/update?id=${id}`, body, { traceId });
            const parseResult = InvoiceDetailSchema.safeParse(response);
            const updated = parseResult.success ? parseResult.data : { id, ...body };
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'invoice.update',
                resource_type: 'invoice',
                resource_id: id,
                meta: {
                    profile,
                    api_url: client['axiosInstance']?.defaults?.baseURL || '',
                },
                changes: {
                    fields_updated: ['amount', 'date', 'invoiceNumber', 'invoicer', 'remark'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Invoice record updated successfully');
                formatter_1.formatter.info(`ID: ${updated.id}`);
                if (updated.code)
                    formatter_1.formatter.info(`Invoice No: ${updated.code}`);
                if (updated.customName)
                    formatter_1.formatter.info(`Customer: ${updated.customName}`);
                if (updated.invoiceAmount !== undefined && updated.invoiceAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${updated.invoiceAmount}`);
                if (updated.invoiceDate)
                    formatter_1.formatter.info(`Invoice Date: ${updated.invoiceDate}`);
                if (updated.invoicer)
                    formatter_1.formatter.info(`Invoicer: ${updated.invoicer}`);
                if (updated.remark)
                    formatter_1.formatter.info(`Remark: ${updated.remark}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json) {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: { code: cliError.code, message: cliError.message, hint: cliError.hint },
                    trace_id: traceId,
                }));
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
//# sourceMappingURL=update.js.map