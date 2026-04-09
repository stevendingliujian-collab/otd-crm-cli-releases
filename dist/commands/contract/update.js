"use strict";
/**
 * Contract update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contract_1 = require("../../schemas/resources/contract");
function updateCommand(contract) {
    contract
        .command('update')
        .description('Update an existing contract')
        .argument('<id>', 'Contract ID')
        .option('-n, --name <name>', 'Contract name')
        .option('-a, --amount <amount>', 'Contract amount')
        .option('--signed-date <signedDate>', 'Signed date (YYYY-MM-DD)')
        .option('--status <status>', 'Contract status (number)')
        .option('--code <code>', 'Contract code')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const requestBody = {
                id,
            };
            if (options.name)
                requestBody.name = options.name;
            if (options.amount)
                requestBody.amount = parseFloat(options.amount);
            if (options.signedDate)
                requestBody.signedDate = options.signedDate;
            if (options.status)
                requestBody.status = parseInt(options.status, 10);
            if (options.code)
                requestBody.code = options.code;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post(`/api/crm/contract/update?id=${id}`, requestBody, {
                traceId,
            });
            // Validate response
            const validated = contract_1.ContractSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contract.update',
                resource_type: 'contract',
                resource_id: id,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                formatter_1.formatter.success(`✓ Contract updated successfully`);
                console.log(`\nContract ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                if (validated.code)
                    console.log(`Code: ${validated.code}`);
                if (validated.amount)
                    console.log(`Amount: ${validated.amount}`);
                if (validated.contractStatusName)
                    console.log(`Status: ${validated.contractStatusName}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                        trace_id: traceId,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                }
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=update.js.map