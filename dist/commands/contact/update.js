"use strict";
/**
 * Contact update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contact_1 = require("../../schemas/resources/contact");
const error_codes_1 = require("../../constants/error-codes");
const CONTACT_UPDATE_ALLOWLIST = [
    'name',
    'phone',
    'email',
    'position',
    'wechat',
    'qq',
    'remark',
    'customId',
    'customName',
    'ownerId',
    'owner',
];
function buildContactUpdateBody(current, options, id) {
    const body = { id };
    for (const field of CONTACT_UPDATE_ALLOWLIST) {
        if (current[field] !== undefined) {
            body[field] = current[field];
        }
    }
    if (options.name !== undefined)
        body.name = options.name;
    if (options.phone !== undefined)
        body.phone = options.phone;
    if (options.email !== undefined)
        body.email = options.email;
    if (options.position !== undefined)
        body.position = options.position;
    if (options.wechat !== undefined)
        body.wechat = options.wechat;
    if (options.qq !== undefined)
        body.qq = options.qq;
    if (options.remark !== undefined)
        body.remark = options.remark;
    return body;
}
function updateCommand(contact) {
    contact
        .command('update')
        .description('Update an existing contact')
        .argument('<id>', 'Contact ID')
        .option('-n, --name <name>', 'Contact name')
        .option('-p, --phone <phone>', 'Phone number')
        .option('-e, --email <email>', 'Email address')
        .option('--position <position>', 'Job position')
        .option('--wechat <wechat>', 'WeChat ID')
        .option('--qq <qq>', 'QQ number')
        .option('--remark <remark>', 'Remark')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const hasAnyField = ['name', 'phone', 'email', 'position', 'wechat', 'qq', 'remark']
                .some((field) => options[field] !== undefined);
            if (!hasAnyField) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --name, --phone, --email, --position, --wechat, --qq, --remark');
            }
            const client = (0, http_client_1.createClient)(profile);
            const current = await client.post('/api/crm/contact/get', { id }, {
                traceId,
            });
            const currentData = contact_1.ContactSchema.parse(current);
            const requestBody = buildContactUpdateBody(currentData, options, id);
            const response = await client.post(`/api/crm/contact/update?id=${id}`, requestBody, {
                traceId,
            });
            // Validate response
            const validated = contact_1.ContactSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contact.update',
                resource_type: 'contact',
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
                formatter_1.formatter.success(`✓ Contact updated successfully`);
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
//# sourceMappingURL=update.js.map