"use strict";
/**
 * Contact search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contact_1 = require("../../schemas/resources/contact");
const param_builder_1 = require("../../utils/param-builder");
function searchCommand(contact) {
    contact
        .command('search')
        .description('Search contacts')
        .option('-k, --keyword <keyword>', 'Search keyword')
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build CRM API request body
            const requestBody = (0, param_builder_1.buildPagedRequest)({
                keyword: options.keyword,
                page: parseInt(options.page, 10),
                size: parseInt(options.size, 10),
            });
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/contact/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = contact_1.ContactListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contact.search',
                resource_type: 'contact',
                resource_id: 'N/A',
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
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: globalOpts.fields?.split(',') || [
                        'id',
                        'name',
                        'phone',
                        'email',
                        'customName',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        phone: 'Phone',
                        email: 'Email',
                        customName: 'Customer',
                    },
                });
                console.log(output);
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
//# sourceMappingURL=search.js.map