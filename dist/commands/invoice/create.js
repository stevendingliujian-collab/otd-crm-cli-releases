"use strict";
/**
 * Create invoice record command
 * Uses Receive/createReceiveDetail (detailType: 1) — the correct frontend API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const ReceiveDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    receiveId: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoiceCode: zod_1.z.string().optional().nullable(),
    invoiceType: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function createCommand(invoice) {
    invoice
        .command('create')
        .description('Create a new invoice record (开票登记)')
        .requiredOption('--amount <number>', 'Invoice amount', parseFloat)
        .requiredOption('--date <date>', 'Invoice date (YYYY-MM-DD)')
        .requiredOption('--receivable-id <id>', 'Receivable item ID (应收款项ID)')
        .option('--invoice-number <string>', 'Invoice number / code')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Create an invoice linked to a contract receivable item
  $ crm invoice create --amount 115648.2 --date 2026-03-31 --receivable-id <receivable-id>

  # With optional fields
  $ crm invoice create --amount 100000 --date 2026-04-15 --receivable-id <id> --invoice-number INV-2026-001 --remark "开票备注"

  # Output as JSON
  $ crm invoice create --amount 100000 --date 2026-04-10 --receivable-id <id> --json

Notes:
  - --date format: YYYY-MM-DD
  - --receivable-id: the 应收款项 ID from the contract (use 'crm receivable search' to find it)
  - detailType: 1 (invoice) is used internally
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const body = {
                receiveId: options.receivableId,
                detailType: 1,
                invoiceDate: new Date(options.date + 'T00:00:00.000Z').toISOString(),
                invoiceAmount: options.amount,
                remark: options.remark || '',
            };
            if (options.invoiceNumber) {
                body.invoiceCode = options.invoiceNumber;
            }
            const response = await client.post('/api/crm/Receive/createReceiveDetail', body, { traceId });
            const parseResult = ReceiveDetailSchema.safeParse(response);
            const record = parseResult.success
                ? parseResult.data
                : (response && typeof response === 'object' ? response : {});
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'invoice.create',
                resource_type: 'invoice',
                resource_id: record.id,
                meta: { profile, api_url: '' },
                changes: { amount: options.amount, date: options.date },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: record, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Invoice record created successfully');
                if (record.id)
                    formatter_1.formatter.info(`ID: ${record.id}`);
                if (record.invoiceCode)
                    formatter_1.formatter.info(`Invoice No: ${record.invoiceCode}`);
                if (record.invoiceAmount !== undefined && record.invoiceAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${record.invoiceAmount}`);
                if (record.invoiceDate)
                    formatter_1.formatter.info(`Invoice Date: ${record.invoiceDate}`);
                if (record.receiveId)
                    formatter_1.formatter.info(`Receivable ID: ${record.receiveId}`);
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