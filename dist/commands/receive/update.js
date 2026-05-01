"use strict";
/**
 * Receive update command
 * Uses Receive/updateReceiveDetail (detailType: 0).
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
const ReceiveDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    receiveId: zod_1.z.string().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    receiveCode: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(receive) {
    receive
        .command('update <id>')
        .description('Update an existing payment record')
        .requiredOption('--receivable-id <id>', 'Parent receivable item ID (required for update)')
        .option('--amount <number>', 'Payment amount', parseFloat)
        .option('--date <date>', 'Payment date (YYYY-MM-DD)')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Update payment amount
  $ crm receive update <detailId> --receivable-id <receiveId> --amount 50000

  # Update payment date and remark
  $ crm receive update <detailId> --receivable-id <receiveId> --date 2026-04-01 --remark "银行转账，流水号12345"

Notes:
  - <id> is the payment detail record ID (from 'crm receive create' output)
  - --receivable-id is required: the parent 应收款项 ID (from 'crm receive create' output)
  - --date format: YYYY-MM-DD
  - Use 'crm receive get <receivableId>' to check current payment records
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --remark', { available_options: ['--amount', '--date', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            // Get current payment data via parent receivable
            const receiveData = await client.post(`/api/crm/Receive/get?id=${options.receivableId}`, {}, { traceId });
            const payments = receiveData?.actualReceives ?? [];
            const current = payments.find((p) => p.id === id);
            if (!current) {
                throw new Error(`Payment record "${id}" not found in receivable "${options.receivableId}". Use 'crm receive get ${options.receivableId}' to see available payment IDs.`);
            }
            const body = {
                id: current.id,
                receiveId: current.receiveId,
                detailType: 0,
                actualPayAmount: options.amount !== undefined ? options.amount : current.actualPayAmount,
                actualPayDate: options.date
                    ? new Date(options.date + 'T00:00:00.000Z').toISOString()
                    : current.actualPayDate,
                remark: options.remark ?? current.remark ?? '',
                receiveCode: current.receiveCode ?? null,
                invoiceCode: current.invoiceCode ?? null,
                invoiceTypeId: current.invoiceTypeId ?? null,
                invoiceType: current.invoiceType ?? null,
                isInvoice: current.isInvoice ?? null,
                financeInvoiceId: current.financeInvoiceId ?? null,
                financeReceiveId: current.financeReceiveId ?? null,
                invoiceDate: null,
                invoiceAmount: null,
                resourceFiles: current.resourceFiles ?? [],
            };
            const response = await client.post(`/api/crm/Receive/updateReceiveDetail?id=${id}`, body, { traceId });
            const parseResult = ReceiveDetailSchema.safeParse(response);
            const updated = parseResult.success ? parseResult.data : { id, ...body };
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'receive.update',
                resource_type: 'receive',
                resource_id: id,
                meta: { profile, api_url: '' },
                changes: {
                    fields_updated: ['amount', 'date', 'remark'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Payment record updated successfully');
                formatter_1.formatter.info(`ID: ${id}`);
                if (body.actualPayAmount !== undefined && body.actualPayAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${body.actualPayAmount}`);
                if (body.actualPayDate)
                    formatter_1.formatter.info(`Pay Date: ${body.actualPayDate}`);
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