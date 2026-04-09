"use strict";
/**
 * Get invoice detail command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const InvoiceDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    invoiceNumber: zod_1.z.string().optional().nullable(),
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    invoiceDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    createdBy: zod_1.z.string().optional().nullable(),
    createdAt: zod_1.z.string().optional().nullable(),
}).passthrough();
function getCommand(invoice) {
    invoice
        .command('get')
        .description('Get invoice by ID')
        .argument('<id>', 'Invoice ID')
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            console.error(`[DEBUG] Calling /api/crm/invoice/getInvoiceById?id=${id}`);
            const response = await client.get(`/api/crm/invoice/getInvoiceById?id=${id}`, {
                params: { trace_id: traceId },
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response).substring(0, 200));
            const validated = InvoiceDetailSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                console.log('Invoice Details:\n');
                console.log(`ID: ${validated.id}`);
                if (validated.invoiceNumber)
                    console.log(`Invoice Number: ${validated.invoiceNumber}`);
                if (validated.contractName)
                    console.log(`Contract: ${validated.contractName}`);
                if (validated.amount)
                    console.log(`Amount: ${validated.amount}`);
                if (validated.invoiceDate)
                    console.log(`Invoice Date: ${validated.invoiceDate}`);
                if (validated.status)
                    console.log(`Status: ${validated.status}`);
                if (validated.remark)
                    console.log(`Remark: ${validated.remark}`);
                if (validated.createdBy)
                    console.log(`Created By: ${validated.createdBy}`);
                if (validated.createdAt)
                    console.log(`Created At: ${validated.createdAt}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            console.error(`[ERROR] Invoice get failed:`);
            console.error(JSON.stringify({
                error: {
                    code: cliError.code,
                    message: cliError.message,
                    hint: cliError.hint,
                    trace_id: traceId,
                },
            }, null, 2));
            process.exit(1);
        }
    });
}
//# sourceMappingURL=get.js.map