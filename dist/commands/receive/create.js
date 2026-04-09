"use strict";
/**
 * Create receive record command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const CreateReceiveResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
}).passthrough();
function createCommand(receive) {
    receive
        .command('create')
        .description('Create a new receive record')
        .requiredOption('--contract <contractId>', 'Contract ID')
        .requiredOption('--amount <amount>', 'Receive amount')
        .requiredOption('--date <date>', 'Receive date (YYYY-MM-DD)')
        .option('--remark <remark>', 'Remark')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const createData = {
                contractId: options.contract,
                amount: parseFloat(options.amount),
                receiveDate: options.date,
                remark: options.remark || '',
            };
            console.error(`[DEBUG] Calling /api/crm/receive/create with data:`, JSON.stringify(createData));
            const response = await client.post('/api/crm/receive/create', createData, {
                traceId,
            });
            console.error(`[DEBUG] Response received:`, JSON.stringify(response));
            const validated = CreateReceiveResponseSchema.parse(response);
            if (globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(validated));
            }
            else {
                console.log('✅ Receive record created successfully');
                console.log(`ID: ${validated.id}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            console.error(`[ERROR] Receive create failed:`);
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
//# sourceMappingURL=create.js.map