"use strict";
/**
 * Contract update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contract_1 = require("../../schemas/resources/contract");
const error_codes_1 = require("../../constants/error-codes");
const CONTRACT_UPDATE_ALLOWLIST = [
    'name',
    'amount',
    'signedDate',
    'status',
    'code',
    'customId',
    'customName',
    'ownerId',
    'owner',
    'isSigned',
];
function buildContractUpdateBody(current, options, id) {
    const body = { id };
    for (const field of CONTRACT_UPDATE_ALLOWLIST) {
        if (current[field] !== undefined) {
            body[field] = current[field];
        }
    }
    if (options.name !== undefined)
        body.name = options.name;
    if (options.amount !== undefined)
        body.amount = parseFloat(String(options.amount));
    if (options.signedDate !== undefined)
        body.signedDate = options.signedDate;
    if (options.status !== undefined)
        body.status = parseInt(String(options.status), 10);
    if (options.code !== undefined)
        body.code = options.code;
    return body;
}
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
            const hasAnyField = ['name', 'amount', 'signedDate', 'status', 'code']
                .some((field) => options[field] !== undefined);
            if (!hasAnyField) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --name, --amount, --signed-date, --status, --code');
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.get('/api/crm/contract/getContractById', {
                params: { id },
                traceId,
            });
            const currentData = contract_1.ContractSchema.parse(current);
            const requestBody = buildContractUpdateBody(currentData, options, id);
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
                if (validated.amount !== undefined && validated.amount !== null)
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