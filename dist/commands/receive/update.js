"use strict";
/**
 * Receive update command
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
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    actualPayer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(receive) {
    receive
        .command('update <id>')
        .description('Update an existing receive record')
        .option('--amount <number>', 'Receive amount', parseFloat)
        .option('--date <date>', 'Receive date (YYYY-MM-DD)')
        .option('--payer <name>', 'Payer name')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Update receive amount
  $ crm receive update <id> --amount 50000

  # Update receive date and payer
  $ crm receive update <id> --date 2026-04-01 --payer "张三"

  # Update remark
  $ crm receive update <id> --remark "已到账，银行流水号 12345678"

  # Update multiple fields at once
  $ crm receive update <id> --amount 80000 --date 2026-04-15 --payer "李四"

  # Output as JSON
  $ crm receive update <id> --amount 50000 --json

Notes:
  - At least one option must be provided
  - --date format: YYYY-MM-DD
  - Use 'crm receive get <id>' to check current values before updating
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.payer && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --payer, --remark', { available_options: ['--amount', '--date', '--payer', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/crm/FinanceReceive/getFinanceReceiveById?id=${id}`, { traceId });
            const currentParseResult = ReceiveDetailSchema.safeParse(current);
            const currentData = currentParseResult.success
                ? currentParseResult.data
                : (current && typeof current === 'object' ? current : null);
            if (!currentData || !currentData.id) {
                throw new Error(`Receive record not found or unreadable (id: ${id})`);
            }
            const body = {
                id: currentData.id,
                customId: currentData.customId,
                customName: currentData.customName,
            };
            body.actualPayAmount = options.amount !== undefined ? options.amount : currentData.actualPayAmount;
            body.actualPayDate = options.date
                ? new Date(options.date).toISOString()
                : currentData.actualPayDate;
            body.actualPayer = options.payer ?? currentData.actualPayer ?? '';
            body.remark = options.remark ?? currentData.remark ?? '';
            const response = await client.post(`/api/crm/FinanceReceive/update?id=${id}`, body, { traceId });
            const parseResult = ReceiveDetailSchema.safeParse(response);
            const updated = parseResult.success ? parseResult.data : { id, ...body };
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'receive.update',
                resource_type: 'receive',
                resource_id: id,
                meta: {
                    profile,
                    api_url: client['axiosInstance']?.defaults?.baseURL || '',
                },
                changes: {
                    fields_updated: ['amount', 'date', 'payer', 'remark'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Receive record updated successfully');
                formatter_1.formatter.info(`ID: ${updated.id}`);
                if (updated.code)
                    formatter_1.formatter.info(`Code: ${updated.code}`);
                if (updated.customName)
                    formatter_1.formatter.info(`Customer: ${updated.customName}`);
                if (updated.actualPayAmount !== undefined && updated.actualPayAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${updated.actualPayAmount}`);
                if (updated.actualPayDate)
                    formatter_1.formatter.info(`Pay Date: ${updated.actualPayDate}`);
                if (updated.actualPayer)
                    formatter_1.formatter.info(`Payer: ${updated.actualPayer}`);
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