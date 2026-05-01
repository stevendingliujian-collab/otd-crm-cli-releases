"use strict";
/**
 * Invoice update command
 * Uses Receive/updateReceiveDetail (detailType: 1).
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
    receiveId: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoiceCode: zod_1.z.string().optional().nullable(),
    invoiceType: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(invoice) {
    invoice
        .command('update <id>')
        .description('Update an existing invoice record')
        .requiredOption('--receivable-id <id>', 'Parent receivable item ID (required for update)')
        .option('--amount <number>', 'Invoice amount', parseFloat)
        .option('--date <date>', 'Invoice date (YYYY-MM-DD)')
        .option('--invoice-number <string>', 'Invoice number (code)')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Fill in invoice number after issuing
  $ crm invoice update <detailId> --receivable-id <receiveId> --invoice-number INV-2026-001

  # Update invoice date and amount
  $ crm invoice update <detailId> --receivable-id <receiveId> --date 2026-04-01 --amount 100000

  # Add remark
  $ crm invoice update <detailId> --receivable-id <receiveId> --remark "增值税专用发票，已邮寄"

Notes:
  - <id> is the invoice detail record ID (from 'crm invoice create' output)
  - --receivable-id is required: the parent 应收款项 ID (from 'crm invoice create' output)
  - --date format: YYYY-MM-DD
  - Use 'crm invoice get <receivableId>' to check current invoice records
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.invoiceNumber && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --invoice-number, --remark', { available_options: ['--amount', '--date', '--invoice-number', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            // Get current invoice data via parent receivable
            const receiveData = await client.post(`/api/crm/Receive/get?id=${options.receivableId}`, {}, { traceId });
            const invoices = receiveData?.invoices ?? [];
            const current = invoices.find((inv) => inv.id === id);
            if (!current) {
                throw new Error(`Invoice record "${id}" not found in receivable "${options.receivableId}". Use 'crm invoice get ${options.receivableId}' to see available invoice IDs.`);
            }
            const body = {
                id: current.id,
                receiveId: current.receiveId,
                detailType: 1,
                invoiceAmount: options.amount !== undefined ? options.amount : current.invoiceAmount,
                invoiceDate: options.date
                    ? new Date(options.date + 'T00:00:00.000Z').toISOString()
                    : current.invoiceDate,
                invoiceCode: options.invoiceNumber ?? current.invoiceCode ?? null,
                remark: options.remark ?? current.remark ?? '',
                invoiceTypeId: current.invoiceTypeId ?? null,
                invoiceType: current.invoiceType ?? null,
                isInvoice: current.isInvoice ?? null,
                financeInvoiceId: current.financeInvoiceId ?? null,
                financeReceiveId: current.financeReceiveId ?? null,
                receiveCode: current.receiveCode ?? null,
                actualPayDate: null,
                actualPayAmount: null,
                resourceFiles: current.resourceFiles ?? [],
            };
            const response = await client.post(`/api/crm/Receive/updateReceiveDetail?id=${id}`, body, { traceId });
            const parseResult = InvoiceDetailSchema.safeParse(response);
            const updated = parseResult.success ? parseResult.data : { id, ...body };
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'invoice.update',
                resource_type: 'invoice',
                resource_id: id,
                meta: { profile, api_url: '' },
                changes: {
                    fields_updated: ['amount', 'date', 'invoiceNumber', 'remark'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Invoice record updated successfully');
                formatter_1.formatter.info(`ID: ${id}`);
                if (body.invoiceCode)
                    formatter_1.formatter.info(`Invoice No: ${body.invoiceCode}`);
                if (body.invoiceAmount !== undefined && body.invoiceAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${body.invoiceAmount}`);
                if (body.invoiceDate)
                    formatter_1.formatter.info(`Invoice Date: ${body.invoiceDate}`);
                if (body.remark)
                    formatter_1.formatter.info(`Remark: ${body.remark}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
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