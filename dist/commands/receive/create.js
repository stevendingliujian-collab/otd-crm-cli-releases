"use strict";
/**
 * Create receive record command
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
    code: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    actualPayer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function createCommand(receive) {
    receive
        .command('create')
        .description('Create a new receive (payment) record')
        .requiredOption('--amount <number>', 'Receive amount', parseFloat)
        .requiredOption('--date <date>', 'Receive date (YYYY-MM-DD)')
        .option('--customer-name <name>', 'Customer name')
        .option('--payer <name>', 'Payer name')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Create a basic receive record
  $ crm receive create --amount 50000 --date 2026-04-10

  # Create with customer, payer and remark
  $ crm receive create --amount 80000 --date 2026-04-15 --customer-name "北京科技" --payer "张三" --remark "银行转账，流水号12345"

  # Output as JSON
  $ crm receive create --amount 50000 --date 2026-04-10 --json

Notes:
  - --date format: YYYY-MM-DD
  - Creates a standalone receive record; link to contract receivable items via the web interface
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const body = {
                customName: options.customerName || '',
                actualPayAmount: options.amount,
                actualPayDate: new Date(options.date).toISOString(),
                actualPayer: options.payer || '',
                remark: options.remark || '',
                fileIds: [],
            };
            const response = await client.post('/api/crm/FinanceReceive/create', body, { traceId });
            const record = ReceiveDetailSchema.parse(response);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'receive.create',
                resource_type: 'receive',
                resource_id: record.id,
                meta: {
                    profile,
                    api_url: client['axiosInstance']?.defaults?.baseURL || '',
                },
                changes: {
                    amount: options.amount,
                    date: options.date,
                },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: record, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Receive record created successfully');
                formatter_1.formatter.info(`ID: ${record.id}`);
                if (record.code)
                    formatter_1.formatter.info(`Code: ${record.code}`);
                if (record.customName)
                    formatter_1.formatter.info(`Customer: ${record.customName}`);
                if (record.actualPayAmount !== undefined && record.actualPayAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${record.actualPayAmount}`);
                if (record.actualPayDate)
                    formatter_1.formatter.info(`Pay Date: ${record.actualPayDate}`);
                if (record.actualPayer)
                    formatter_1.formatter.info(`Payer: ${record.actualPayer}`);
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