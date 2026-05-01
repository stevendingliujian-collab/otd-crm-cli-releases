"use strict";
/**
 * Opportunity create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
function createCommand(opportunity) {
    opportunity
        .command('create')
        .description('Create a new opportunity')
        .requiredOption('--name <name>', 'Opportunity name')
        .requiredOption('--customer-id <id>', 'Customer ID (UUID)')
        .requiredOption('--company-id <id>', 'Company ID (UUID)')
        .option('--customer-name <name>', 'Customer name')
        .option('--company-name <name>', 'Company name')
        .option('--owner-id <id>', 'Owner ID (UUID)')
        .option('--owner <name>', 'Owner name')
        .option('--expected-amount <amount>', 'Expected transaction amount', parseFloat)
        .option('--expected-probability <prob>', 'Expected probability (e.g., 80%)')
        .option('--expected-complete-date <date>', 'Expected completion date (ISO format)')
        .option('--business-type-id <id>', 'Business type ID (UUID)')
        .option('--business-process-id <id>', 'Business process/stage ID (UUID)')
        .option('--business-priority-id <id>', 'Business priority ID (UUID)')
        .option('--business-source-id <id>', 'Business source ID (UUID)')
        .option('--description <desc>', 'Opportunity description')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const body = {
                name: options.name,
                customId: options.customerId,
                companyId: options.companyId,
                isAgent: false,
            };
            // Optional fields
            if (options.customerName)
                body.customName = options.customerName;
            if (options.companyName)
                body.companyName = options.companyName;
            if (options.ownerId)
                body.ownerId = options.ownerId;
            if (options.owner)
                body.owner = options.owner;
            if (options.expectedAmount)
                body.expectedTransAmount = options.expectedAmount;
            if (options.expectedProbability)
                body.expectedTransProbability = options.expectedProbability;
            if (options.expectedCompleteDate)
                body.expectedCompleteDate = options.expectedCompleteDate;
            if (options.businessTypeId)
                body.businessTypeId = options.businessTypeId;
            if (options.businessProcessId)
                body.businessProcessId = options.businessProcessId;
            if (options.businessPriorityId)
                body.businessPriorityId = options.businessPriorityId;
            if (options.businessSourceId)
                body.businessSourceId = options.businessSourceId;
            if (options.description)
                body.description = options.description;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/business/create', body, {
                traceId,
            });
            // Validate response
            const validated = opportunity_1.OpportunitySchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.create',
                resource_type: 'opportunity',
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
                formatter_1.formatter.success('✓ Opportunity created successfully!');
                console.log(`\nOpportunity ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
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