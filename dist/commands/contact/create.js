"use strict";
/**
 * Contact create command
 *
 * IMPORTANT: Always send customName alongside customId.
 * The backend does NOT auto-populate names from IDs. A null customName
 * causes the associated customer to not display correctly on the contact.
 * If the caller omits --customer-name, this command auto-fetches it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contact_1 = require("../../schemas/resources/contact");
function createCommand(contact) {
    contact
        .command('create')
        .description('Create a new contact')
        .requiredOption('-n, --name <name>', 'Contact name')
        .option('-c, --customer-id <customerId>', 'Customer ID')
        .option('--customer-name <name>', 'Customer name (auto-fetched if --customer-id provided and this is omitted)')
        .option('-p, --phone <phone>', 'Phone number')
        .option('-e, --email <email>', 'Email address')
        .option('--position <position>', 'Job position')
        .option('--wechat <wechat>', 'WeChat ID')
        .option('--qq <qq>', 'QQ number')
        .option('--remark <remark>', 'Remark')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // ── Auto-resolve customer name if customerId provided but name omitted ─
            let customerName = options.customerName;
            if (options.customerId && !customerName) {
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
                    // Non-fatal
                }
            }
            // Build request body
            const requestBody = {
                name: options.name,
            };
            if (options.customerId)
                requestBody.customId = options.customerId;
            if (customerName)
                requestBody.customName = customerName;
            if (options.phone)
                requestBody.phone = options.phone;
            if (options.email)
                requestBody.email = options.email;
            if (options.position)
                requestBody.position = options.position;
            if (options.wechat)
                requestBody.wechat = options.wechat;
            if (options.qq)
                requestBody.qq = options.qq;
            if (options.remark)
                requestBody.remark = options.remark;
            // Make API request
            const response = await client.post('/api/crm/contact/create', requestBody, {
                traceId,
            });
            // Validate response
            const validated = contact_1.ContactSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contact.create',
                resource_type: 'contact',
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
                formatter_1.formatter.success(`✓ Contact created successfully`);
                console.log(`\nContact ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                if (validated.phone)
                    console.log(`Phone: ${validated.phone}`);
                if (validated.email)
                    console.log(`Email: ${validated.email}`);
                if (validated.position)
                    console.log(`Position: ${validated.position}`);
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