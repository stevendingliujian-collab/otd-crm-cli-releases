"use strict";
/**
 * Get receive record command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const FinanceReceiveDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    actualPayDate: zod_1.z.string().optional().nullable(),
    actualPayAmount: zod_1.z.number().optional().nullable(),
    actualPayer: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    creationTime: zod_1.z.string().optional().nullable(),
}).passthrough();
function getCommand(receive) {
    receive
        .command('get <id>')
        .description('Get a receive record by ID')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  $ crm receive get 3a1973c6-0a85-b26f-1bbd-d236ff3e0250
  $ crm receive get <id> --json
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const data = await client.get(`/api/crm/FinanceReceive/getFinanceReceiveById?id=${id}`, { traceId });
            const record = FinanceReceiveDetailSchema.parse(data);
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(record));
            }
            else {
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
                if (record.remark)
                    formatter_1.formatter.info(`Remark: ${record.remark}`);
                if (record.creationTime)
                    formatter_1.formatter.info(`Created: ${record.creationTime}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message }, trace_id: traceId }));
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
//# sourceMappingURL=get.js.map