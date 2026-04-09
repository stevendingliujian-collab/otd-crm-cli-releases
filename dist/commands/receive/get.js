"use strict";
/**
 * Get receive detail command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ReceiveDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contractId: zod_1.z.string().optional().nullable(),
    contractName: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().optional().nullable(),
    receiveDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    createdBy: zod_1.z.string().optional().nullable(),
    createdAt: zod_1.z.string().optional().nullable(),
}).passthrough();
function getCommand(receive) {
    receive
        .command('get')
        .description('Get receive record by ID')
        .argument('<id>', 'Receive record ID')
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            console.error(`[DEBUG] Calling /api/crm/receive/getReceiveById?id=${id}`);
            const response = await client.get(`/api/crm/receive/getReceiveById?id=${id}`, {
                params: { trace_id: traceId },
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response).substring(0, 200));
            const validated = ReceiveDetailSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                console.log('Receive Record Details:\n');
                console.log(`ID: ${validated.id}`);
                if (validated.contractName)
                    console.log(`Contract: ${validated.contractName}`);
                if (validated.amount)
                    console.log(`Amount: ${validated.amount}`);
                if (validated.receiveDate)
                    console.log(`Receive Date: ${validated.receiveDate}`);
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
            console.error(`[ERROR] Receive get failed:`);
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