"use strict";
/**
 * Get invoice records command
 * Uses Receive/get?id=<receivableId> — returns invoices[] for the receivable item.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const zod_1 = require("zod");
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const InvoiceDetailItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    receiveId: zod_1.z.string().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    invoiceAmount: zod_1.z.number().optional().nullable(),
    invoiceCode: zod_1.z.string().optional().nullable(),
    invoiceType: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    creationTime: zod_1.z.string().optional().nullable(),
    creatorName: zod_1.z.string().optional().nullable(),
}).passthrough();
const ReceiveGetResponseSchema = zod_1.z.object({
    invoices: zod_1.z.array(InvoiceDetailItemSchema).optional().default([]),
}).passthrough();
function getCommand(invoice) {
    invoice
        .command('get <receivableId>')
        .description('Get invoice records for a receivable item')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Show all invoice records for a receivable
  $ crm invoice get 3a207e87-f795-e74a-4135-6fe030c332f9

  # Output as JSON
  $ crm invoice get <receivableId> --json

Notes:
  - <receivableId> is the 应收款项 ID (use 'crm receivable search' to find it)
  - Also shown as "Receivable ID" in 'crm invoice create' output
  - Returns all invoice records (invoices[]) for the given receivable item
`)
        .action(async (receivableId, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const data = await client.post(`/api/crm/Receive/get?id=${receivableId}`, {}, { traceId });
            const parseResult = ReceiveGetResponseSchema.safeParse(data);
            const records = parseResult.success
                ? parseResult.data.invoices
                : (data?.invoices ?? []);
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ receivableId, count: records.length, invoices: records }));
            }
            else {
                if (records.length === 0) {
                    formatter_1.formatter.info(`No invoice records found for receivable: ${receivableId}`);
                }
                else {
                    console.log(`Invoice records for receivable ${receivableId} (${records.length} total):\n`);
                    for (const r of records) {
                        formatter_1.formatter.info(`─── Record ID: ${r.id}`);
                        if (r.invoiceAmount !== undefined && r.invoiceAmount !== null)
                            formatter_1.formatter.info(`    Amount:     ¥${r.invoiceAmount}`);
                        if (r.invoiceDate)
                            formatter_1.formatter.info(`    Date:       ${r.invoiceDate}`);
                        if (r.invoiceCode)
                            formatter_1.formatter.info(`    Invoice No: ${r.invoiceCode}`);
                        if (r.invoiceType)
                            formatter_1.formatter.info(`    Type:       ${r.invoiceType}`);
                        if (r.remark)
                            formatter_1.formatter.info(`    Remark:     ${r.remark}`);
                        if (r.creatorName)
                            formatter_1.formatter.info(`    Creator:    ${r.creatorName}`);
                    }
                }
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