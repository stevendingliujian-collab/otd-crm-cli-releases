"use strict";
/**
 * Get invoice record command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const FinanceInvoiceDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().optional().nullable(),
    customId: zod_1.z.string().optional().nullable(),
    customName: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoicer: zod_1.z.string().optional().nullable(),
    invoiceTypeName: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    creationTime: zod_1.z.string().optional().nullable(),
}).passthrough();
function getCommand(invoice) {
    invoice
        .command('get <id>')
        .description('Get an invoice record by ID')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  $ crm invoice get 3a1973c6-0a85-b26f-1bbd-d236ff3e0250
  $ crm invoice get <id> --json
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const data = await client.get(`/api/crm/FinanceInvoice/getFinanceInvoiceById?id=${id}`, { traceId });
            const record = FinanceInvoiceDetailSchema.parse(data);
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(record));
            }
            else {
                formatter_1.formatter.info(`ID: ${record.id}`);
                if (record.code)
                    formatter_1.formatter.info(`Invoice No: ${record.code}`);
                if (record.customName)
                    formatter_1.formatter.info(`Customer: ${record.customName}`);
                if (record.invoiceAmount !== undefined && record.invoiceAmount !== null)
                    formatter_1.formatter.info(`Amount: ¥${record.invoiceAmount}`);
                if (record.invoiceDate)
                    formatter_1.formatter.info(`Invoice Date: ${record.invoiceDate}`);
                if (record.invoicer)
                    formatter_1.formatter.info(`Invoicer: ${record.invoicer}`);
                if (record.invoiceTypeName)
                    formatter_1.formatter.info(`Type: ${record.invoiceTypeName}`);
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