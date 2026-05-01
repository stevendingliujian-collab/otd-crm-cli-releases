"use strict";
/**
 * Create receive (payment) record command
 * Uses Receive/createReceiveDetail (detailType: 0) — the correct frontend API.
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
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    receiveCode: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function createCommand(receive) {
    receive
        .command('create')
        .description('Create a new receive (payment) record (收款登记)')
        .requiredOption('--amount <number>', 'Receive amount', parseFloat)
        .requiredOption('--date <date>', 'Payment date (YYYY-MM-DD)')
        .requiredOption('--receivable-id <id>', 'Receivable item ID (应收款项ID)')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Create a payment record linked to a contract receivable item
  $ crm receive create --amount 115648.2 --date 2026-04-03 --receivable-id <receivable-id>

  # With remark
  $ crm receive create --amount 80000 --date 2026-04-15 --receivable-id <id> --remark "银行转账，流水号12345"

  # Output as JSON
  $ crm receive create --amount 50000 --date 2026-04-10 --receivable-id <id> --json

Notes:
  - --date format: YYYY-MM-DD
  - --receivable-id: the 应收款项 ID from the contract (use 'crm receivable search' to find it)
  - detailType: 0 (payment) is used internally
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const body = {
                receiveId: options.receivableId,
                detailType: 0,
                actualPayDate: new Date(options.date + 'T00:00:00.000Z').toISOString(),
                actualPayAmount: options.amount,
                remark: options.remark || '',
            };
            const response = await client.post('/api/crm/Receive/createReceiveDetail', body, { traceId });
            const parseResult = ReceiveDetailSchema.safeParse(response);
            const record = parseResult.success
                ? parseResult.data
                : (response && typeof response === 'object' ? response : {});
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'receive.create',
                resource_type: 'receive',
                resource_id: record.id,
                meta: { profile, api_url: '' },
                changes: { amount: options.amount, date: options.date },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: record, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Receive record created successfully');
                if (record.id)
                    formatter_1.formatter.info(`ID: ${record.id}`);
                if (record.actualPayAmount !== undefined && record.actualPayAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${record.actualPayAmount}`);
                if (record.actualPayDate)
                    formatter_1.formatter.info(`Pay Date: ${record.actualPayDate}`);
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