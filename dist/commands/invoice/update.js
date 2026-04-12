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
    invoiceNumber: zod_1.z.string().optional().nullable(),
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(invoice) {
    invoice
        .command('update <id>')
        .description('Update an existing invoice record')
        .option('--amount <number>', 'Invoice amount', parseFloat)
        .option('--date <date>', 'Invoice date (YYYY-MM-DD)')
        .option('--status <status>', 'Invoice status')
        .option('--invoice-number <string>', 'Invoice number')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.status && !options.invoiceNumber && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --status, --invoice-number, --remark', { available_options: ['--amount', '--date', '--status', '--invoice-number', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/crm/invoice/getInvoiceById?id=${id}`, { traceId });
            const currentData = InvoiceDetailSchema.parse(current);
            const body = {
                id: currentData.id,
                contractId: currentData.contractId,
            };
            body.amount = options.amount !== undefined ? options.amount : currentData.amount;
            body.invoiceDate = options.date ?? currentData.invoiceDate;
            body.status = options.status ?? currentData.status;
            body.invoiceNumber = options.invoiceNumber ?? currentData.invoiceNumber;
            body.remark = options.remark ?? currentData.remark ?? '';
            const response = await client.post(`/api/crm/invoice/update?id=${id}`, body, { traceId });
            const updated = InvoiceDetailSchema.parse(response);
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
                    fields_updated: ['amount', 'date', 'status', 'invoiceNumber', 'remark'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Invoice record updated successfully');
                formatter_1.formatter.info(`ID: ${updated.id}`);
                if (updated.contractName)
                    formatter_1.formatter.info(`Contract: ${updated.contractName}`);
                if (updated.invoiceNumber)
                    formatter_1.formatter.info(`Invoice Number: ${updated.invoiceNumber}`);
                if (updated.amount !== undefined && updated.amount !== null)
                    formatter_1.formatter.info(`Amount: ¥${updated.amount}`);
                if (updated.invoiceDate)
                    formatter_1.formatter.info(`Date: ${updated.invoiceDate}`);
                if (updated.status)
                    formatter_1.formatter.info(`Status: ${updated.status}`);
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