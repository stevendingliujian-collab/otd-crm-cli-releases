"use strict";
/**
 * Contract create command
 *
 * IMPORTANT: Always send customName alongside customId.
 * The backend does NOT auto-populate names from IDs, and the frontend
 * detail page will render blank if customName is null.
 * If the caller omits --customer-name, this command auto-fetches it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contract_1 = require("../../schemas/resources/contract");
function createCommand(contract) {
    contract
        .command('create')
        .description('Create a new contract')
        .requiredOption('-n, --name <name>', 'Contract name')
        .requiredOption('-c, --customer-id <customerId>', 'Customer ID')
        .requiredOption('-a, --amount <amount>', 'Contract amount')
        .option('--customer-name <name>', 'Customer name (auto-fetched if omitted)')
        .option('--signed-date <signedDate>', 'Signed date (YYYY-MM-DD)')
        .option('--status <status>', 'Contract status (number)')
        .option('--code <code>', 'Contract code')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // ── Auto-resolve customer name if not provided ────────────────────────
            // The backend does NOT derive customName from customId — it must be sent
            // explicitly. A null customName causes the frontend detail page to render blank.
            let customerName = options.customerName;
            if (!customerName) {
                try {
                    if (!globalOpts.json)
                        formatter_1.formatter.info('Fetching customer name...');
                    const customer = await client.get('/api/crm/custom/getCustomById', {
                        params: { id: options.customerId },
                        traceId,
                    });
                    customerName = customer?.name;
                }
                catch {
                    // Non-fatal: proceed without name
                }
                if (!customerName) {
                    formatter_1.formatter.info('Warning: could not resolve customer name — pass --customer-name to avoid this.');
                }
            }
            // Build request body
            const requestBody = {
                name: options.name,
                customId: options.customerId,
                amount: parseFloat(options.amount),
            };
            if (customerName)
                requestBody.customName = customerName;
            if (options.signedDate)
                requestBody.signedDate = options.signedDate;
            if (options.status)
                requestBody.status = parseInt(options.status, 10);
            if (options.code)
                requestBody.code = options.code;
            // Make API request
            const response = await client.post('/api/crm/contract/create', requestBody, {
                traceId,
            });
            // Validate response
            const validated = contract_1.ContractSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contract.create',
                resource_type: 'contract',
                resource_id: validated.id,
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
                formatter_1.formatter.success(`✓ Contract created successfully`);
                console.log(`\nContract ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                if (validated.code)
                    console.log(`Code: ${validated.code}`);
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
//# sourceMappingURL=create.js.map