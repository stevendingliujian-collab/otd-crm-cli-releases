"use strict";
/**
 * Customer create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const customer_1 = require("../../schemas/resources/customer");
function createCommand(customer) {
    customer
        .command('create')
        .description('Create a new customer')
        .requiredOption('--name <name>', 'Customer name')
        .option('--code <code>', 'Customer code (auto-generated if not provided)')
        .option('--province <province>', 'Province')
        .option('--city <city>', 'City')
        .option('--district <district>', 'District')
        .option('--address <address>', 'Detailed address')
        .option('--industry-code <code>', 'Industry code')
        .option('--industry <industry>', 'Industry name')
        .option('--owner-id <id>', 'Owner ID (UUID)')
        .option('--owner <name>', 'Owner name')
        .option('--primary-business <business>', 'Primary business')
        .option('--website <url>', 'Website URL')
        .option('--registered-capital <amount>', 'Registered capital', parseFloat)
        .option('--is-listed', 'Is listed company')
        .option('--social-insurance-num <num>', 'Social insurance number', parseInt)
        .option('--introduction <intro>', 'Company introduction')
        .option('--short-name <name>', 'Short name')
        .option('--invoice-name <name>', 'Invoice name')
        .option('--taxpayer-id <id>', 'Taxpayer identification number')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const body = {
                name: options.name,
            };
            // Optional fields
            if (options.code)
                body.code = options.code;
            if (options.province)
                body.province = options.province;
            if (options.city)
                body.city = options.city;
            if (options.district)
                body.district = options.district;
            if (options.address)
                body.address = options.address;
            if (options.industryCode)
                body.industryCode = options.industryCode;
            if (options.industry)
                body.industry = options.industry;
            if (options.ownerId)
                body.ownerId = options.ownerId;
            if (options.owner)
                body.owner = options.owner;
            if (options.primaryBusiness)
                body.primaryBusiness = options.primaryBusiness;
            if (options.website)
                body.website = options.website;
            if (options.registeredCapital)
                body.registeredCapital = options.registeredCapital;
            if (options.isListed)
                body.isListed = true;
            if (options.socialInsuranceNum)
                body.socialInsuranceNum = options.socialInsuranceNum;
            if (options.introduction)
                body.introduction = options.introduction;
            if (options.shortName)
                body.shortName = options.shortName;
            if (options.invoiceName)
                body.invoiceName = options.invoiceName;
            if (options.taxpayerId)
                body.taxpayerId = options.taxpayerId;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/custom/create', body, {
                traceId,
            });
            // Validate response
            const validated = customer_1.CustomerSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'customer.create',
                resource_type: 'customer',
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
                formatter_1.formatter.success('✓ Customer created successfully!');
                console.log(`\nCustomer ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                console.log(`Code: ${validated.code || 'N/A'}`);
                console.log(`Owner: ${validated.owner || 'N/A'}`);
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