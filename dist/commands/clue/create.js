"use strict";
/**
 * Clue create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const clue_1 = require("../../schemas/resources/clue");
function createCommand(clue) {
    clue
        .command('create')
        .description('Create a new clue (lead)')
        .requiredOption('--name <name>', 'Clue name')
        .requiredOption('--custom-name <name>', 'Customer name')
        .requiredOption('--telephone <phone>', 'Phone number')
        .requiredOption('--source-id <id>', 'Clue source ID (UUID)')
        .option('--position <position>', 'Position/title')
        .option('--email <email>', 'Email address')
        .option('--wechat <wechat>', 'WeChat ID')
        .option('--website <website>', 'Website URL')
        .option('--fix-phone <phone>', 'Landline phone')
        .option('--department <dept>', 'Department')
        .option('--address <address>', 'Address')
        .option('--remark <remark>', 'Remark/notes')
        .option('--owner-id <id>', 'Owner ID (UUID)')
        .option('--owner <name>', 'Owner name')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const body = {
                name: options.name,
                customName: options.customName,
                telephone: options.telephone,
                clueSourceId: options.sourceId,
            };
            // Optional fields
            if (options.position)
                body.position = options.position;
            if (options.email)
                body.email = options.email;
            if (options.wechat)
                body.weChat = options.wechat;
            if (options.website)
                body.website = options.website;
            if (options.fixPhone)
                body.fixPhone = options.fixPhone;
            if (options.department)
                body.department = options.department;
            if (options.address)
                body.address = options.address;
            if (options.remark)
                body.remark = options.remark;
            if (options.ownerId)
                body.ownerId = options.ownerId;
            if (options.owner)
                body.owner = options.owner;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/clue/create', body, {
                traceId,
            });
            // Validate response
            const validated = clue_1.ClueSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.create',
                resource_type: 'clue',
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
                formatter_1.formatter.success('✓ Clue created successfully!');
                console.log(`\nClue ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                console.log(`Customer: ${options.customName}`);
                console.log(`Phone: ${options.telephone}`);
                console.log(`Owner: ${validated.owner || 'N/A'}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message, hint: cliError.hint }, trace_id: traceId }));
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
//# sourceMappingURL=create.js.map