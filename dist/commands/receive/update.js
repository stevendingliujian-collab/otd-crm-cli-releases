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
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    receiveDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
}).passthrough();
function updateCommand(receive) {
    receive
        .command('update <id>')
        .description('Update an existing receive record')
        .option('--amount <number>', 'Receive amount', parseFloat)
        .option('--date <date>', 'Receive date (YYYY-MM-DD)')
        .option('--status <status>', 'Receive status')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.amount === undefined && !options.date && !options.status && !options.remark) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --amount, --date, --status, --remark', { available_options: ['--amount', '--date', '--status', '--remark'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get(`/api/crm/receive/getReceiveById?id=${id}`, { traceId });
            const currentData = ReceiveDetailSchema.parse(current);
            const body = {
                id: currentData.id,
                contractId: currentData.contractId,
            };
            body.amount = options.amount !== undefined ? options.amount : currentData.amount;
            body.receiveDate = options.date ?? currentData.receiveDate;
            body.status = options.status ?? currentData.status;
            body.remark = options.remark ?? currentData.remark ?? '';
            const response = await client.post(`/api/crm/receive/update?id=${id}`, body, { traceId });
            const updated = ReceiveDetailSchema.parse(response);
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
                    fields_updated: ['amount', 'date', 'status', 'remark'].filter(k => options[k === 'date' ? 'date' : k] !== undefined),
                },
            });
            if (options.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Receive record updated successfully');
                formatter_1.formatter.info(`ID: ${updated.id}`);
                if (updated.contractName)
                    formatter_1.formatter.info(`Contract: ${updated.contractName}`);
                if (updated.amount !== undefined && updated.amount !== null)
                    formatter_1.formatter.info(`Amount: ¥${updated.amount}`);
                if (updated.receiveDate)
                    formatter_1.formatter.info(`Date: ${updated.receiveDate}`);
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